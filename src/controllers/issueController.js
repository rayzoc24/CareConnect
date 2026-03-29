const Issue = require("../models/Issue");
const Vote = require("../models/Vote");
const Ngo = require("../models/Ngo");
const { STATUS } = require("../constants/status");
const { toClientIssue } = require("../utils/mappers");
const { scoreNgoForIssue, DEMO_SCORING_WEIGHTS } = require("../utils/ngoMatching");
const {
  normalizeTag,
  normalizeStatus,
  normalizeLocation,
  computeAiSignals,
  pushHistory,
  averageRating,
  scoreIssue,
  getVotePriority,
  getVotePriorityRank
} = require("../utils/issueUtils");

function sortIssues(items, sortBy, sortOrder) {
  const direction = String(sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
  const key = String(sortBy || "priority").toLowerCase();

  const list = [...items];
  list.sort((a, b) => {
    if (key === "votes") {
      const delta = Number(a.votes || 0) - Number(b.votes || 0);
      if (delta !== 0) return delta * direction;
    } else if (key === "newest") {
      const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (delta !== 0) return -delta;
    } else if (key === "oldest") {
      const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (delta !== 0) return delta;
    } else {
      const rankA = getVotePriorityRank(getVotePriority(a.votes));
      const rankB = getVotePriorityRank(getVotePriority(b.votes));
      const rankDelta = rankA - rankB;
      if (rankDelta !== 0) return rankDelta * direction;

      const voteDelta = Number(a.votes || 0) - Number(b.votes || 0);
      if (voteDelta !== 0) return voteDelta * direction;
    }

    const scoreDelta = scoreIssue(a) - scoreIssue(b);
    if (scoreDelta !== 0) return scoreDelta * direction;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return list;
}

async function listIssues(req, res) {
  const voterUid = req.session.user && req.session.user.role === "volunteer"
    ? String(req.session.user.id || "").trim()
    : "";

  const category = String(req.query.category || "").trim();
  const statusParam = String(req.query.status || "").trim();
  const state = String(req.query.state || "").trim();
  const district = String(req.query.district || "").trim();
  const area = String(req.query.area || "").trim();

  const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
  const requestedLimit = Number.parseInt(String(req.query.limit || "10"), 10) || 10;
  const limit = Math.min(Math.max(1, requestedLimit), 100);
  const sortBy = String(req.query.sortBy || "priority").trim().toLowerCase() || "priority";
  const sortOrder = String(req.query.sortOrder || "desc").trim().toLowerCase() || "desc";

  const filters = {};
  if (category) {
    filters.category = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  }
  if (statusParam) {
    filters.status = normalizeStatus(statusParam);
  }
  if (state) {
    filters["location.state"] = new RegExp(`^${state.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  }
  if (district) {
    filters["location.district"] = new RegExp(`^${district.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  }
  if (area) {
    filters["location.area"] = new RegExp(`^${area.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  }

  const issues = await Issue.find(filters).lean();
  const total = issues.length;
  const skip = (page - 1) * limit;

  const sorted = sortIssues(issues, sortBy, sortOrder);
  const pageItems = sorted.slice(skip, skip + limit);

  const voteMap = new Set();
  if (voterUid && pageItems.length > 0) {
    const ids = pageItems.map((issue) => issue._id);
    const voted = await Vote.find({ voterUid, issueId: { $in: ids } }).select("issueId").lean();
    voted.forEach((entry) => voteMap.add(String(entry.issueId)));
  }

  const out = pageItems.map((issue) => {
    issue.status = normalizeStatus(issue.status);
    return toClientIssue(issue, voteMap.has(String(issue._id)));
  });

  res.json({
    issues: out,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    },
    filtersApplied: {
      category: category || null,
      status: statusParam ? normalizeStatus(statusParam) : null,
      state: state || null,
      district: district || null,
      area: area || null
    },
    sortingApplied: {
      sortBy,
      sortOrder
    }
  });
}

async function createIssue(req, res) {
  const sessionUser = req.session.user;
  const title = String(req.body.title || "").trim();
  const category = String(req.body.category || "").trim();
  const description = String(req.body.description || "").trim();
  const ngoId = String(req.body.ngoId || "").trim();
  const createdByUid = String(sessionUser.id || "").trim();
  const createdByName = String(sessionUser.name || "Volunteer").trim();

  if (!title || !category || !description || !ngoId || !createdByUid) {
    res.status(400).json({ error: "Missing required issue fields." });
    return;
  }

  const hashtags = (Array.isArray(req.body.hashtags) ? req.body.hashtags : [])
    .map(normalizeTag)
    .filter(Boolean)
    .slice(0, 10);

  const issue = new Issue({
    title,
    category,
    description,
    ngoId,
    location: normalizeLocation(req.body.location),
    createdByUid,
    createdByName,
    hashtags,
    photoUrl: String(req.body.photoUrl || req.body.photoDataUrl || ""),
    votes: 0,
    status: STATUS.PENDING,
    claimedBy: {
      ngoUid: "",
      ngoName: "",
      claimedAt: ""
    },
    ai: computeAiSignals({
      title,
      category,
      description,
      hashtags
    }),
    ratings: [],
    averageRating: 0,
    history: []
  });

  pushHistory(issue, "created", createdByName, "Issue submitted by volunteer");
  await issue.save();

  res.status(201).json({ issue: toClientIssue(issue, false) });
}

async function getRecommendedNgos(req, res) {
  const issue = await Issue.findById(req.params.id).lean();
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  const requestedLimit = Number.parseInt(String(req.query.limit || "5"), 10) || 5;
  const limit = Math.min(Math.max(1, requestedLimit), 25);

  const ngos = await Ngo.find({}).lean();

  const recommendations = ngos
    .map((ngo) => {
      const scored = scoreNgoForIssue(issue, ngo);
      return {
        ...scored,
        ngo: {
          id: String(ngo._id),
          name: ngo.name,
          type: ngo.type,
          focusCategories: Array.isArray(ngo.focusCategories) ? ngo.focusCategories : [],
          coverage: ngo.coverage || { states: [], districts: [], areas: [] },
          volunteersCount: Number(ngo.volunteersCount || 0),
          website: ngo.website || ""
        }
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  res.json({
    issue: {
      id: String(issue._id),
      title: issue.title,
      category: issue.category,
      location: issue.location || { state: "", district: "", area: "" }
    },
    scoringModel: {
      summary: "Simple weighted score out of 110: category + location + capacity",
      weights: DEMO_SCORING_WEIGHTS
    },
    totalNgosEvaluated: ngos.length,
    limit,
    recommendations
  });
}

async function voteIssue(req, res) {
  const voterUid = String(req.session.user.id || "").trim();
  if (!voterUid) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  try {
    await Vote.create({ issueId: issue._id, voterUid });
  } catch (error) {
    if (error && error.code === 11000) {
      res.status(409).json({ error: "You already voted for this issue." });
      return;
    }
    throw error;
  }

  issue.votes = Number(issue.votes || 0) + 1;
  issue.ai = issue.ai || computeAiSignals(issue);
  issue.ai.priority = Math.min(100, Number(issue.ai.priority || 30) + 2);
  pushHistory(issue, "vote", voterUid, "Issue received one community vote");
  await issue.save();

  res.json({ issue: toClientIssue(issue, true) });
}

async function unvoteIssue(req, res) {
  const voterUid = String(req.session.user.id || "").trim();
  if (!voterUid) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  const deleted = await Vote.findOneAndDelete({ issueId: issue._id, voterUid });
  if (!deleted) {
    res.status(404).json({ error: "Vote not found for this user." });
    return;
  }

  issue.votes = Math.max(0, Number(issue.votes || 0) - 1);
  issue.ai = issue.ai || computeAiSignals(issue);
  issue.ai.priority = Math.max(10, Number(issue.ai.priority || 30) - 2);
  pushHistory(issue, "devote", voterUid, "Volunteer removed their vote");
  await issue.save();

  res.json({ issue: toClientIssue(issue, false) });
}

async function claimIssue(req, res) {
  const ngoUid = String(req.session.user.id || "").trim();
  const ngoName = String(req.session.user.name || req.session.user.orgName || "Foundation").trim();

  if (!ngoUid || !ngoName) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  if (issue.claimedBy && issue.claimedBy.ngoUid && issue.claimedBy.ngoUid !== ngoUid) {
    res.status(409).json({ error: "Issue is already claimed by another NGO." });
    return;
  }

  issue.claimedBy = {
    ngoUid,
    ngoName,
    claimedAt: new Date().toISOString()
  };

  if (normalizeStatus(issue.status) === STATUS.PENDING) {
    issue.status = STATUS.PLANNED;
  }

  pushHistory(issue, "claimed", ngoName, "Issue claimed and moved to planned");
  await issue.save();

  res.json({ issue: toClientIssue(issue, false) });
}

async function updateIssueStatus(req, res) {
  const status = normalizeStatus(req.body.status);
  const ngoUid = String(req.session.user.id || "").trim();
  const actorName = String(req.session.user.name || req.session.user.orgName || "Foundation").trim();

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  if (!issue.claimedBy || !issue.claimedBy.ngoUid) {
    res.status(409).json({ error: "Issue must be claimed before status updates." });
    return;
  }

  if (issue.claimedBy.ngoUid !== ngoUid) {
    res.status(403).json({ error: "Only the claiming NGO can update this issue." });
    return;
  }

  issue.status = status;
  pushHistory(issue, "status", actorName, `Status changed to ${status}`);
  await issue.save();

  res.json({ issue: toClientIssue(issue, false) });
}

async function addProgress(req, res) {
  const ngoUid = String(req.session.user.id || "").trim();
  const actorName = String(req.session.user.name || req.session.user.orgName || "Foundation").trim();
  const note = String(req.body.note || "").trim();

  if (!note) {
    res.status(400).json({ error: "Progress note is required." });
    return;
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  if (!issue.claimedBy || !issue.claimedBy.ngoUid) {
    res.status(409).json({ error: "Issue must be claimed before progress updates." });
    return;
  }

  if (issue.claimedBy.ngoUid !== ngoUid) {
    res.status(403).json({ error: "Only the claiming NGO can post progress updates." });
    return;
  }

  pushHistory(issue, "progress", actorName, note);
  await issue.save();

  res.json({ issue: toClientIssue(issue, false) });
}

async function addRating(req, res) {
  const volunteerUid = String(req.session.user.id || "").trim();
  const volunteerName = String(req.session.user.name || "Volunteer").trim();
  const stars = Number(req.body.stars || 0);
  const feedback = String(req.body.feedback || "").trim();

  if (!volunteerUid) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  if (stars < 1 || stars > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5." });
    return;
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: "Issue not found." });
    return;
  }

  if (normalizeStatus(issue.status) !== STATUS.COMPLETED) {
    res.status(409).json({ error: "Ratings can be submitted only after completion." });
    return;
  }

  if ((issue.ratings || []).some((item) => item.volunteerUid === volunteerUid)) {
    res.status(409).json({ error: "You already rated this issue." });
    return;
  }

  issue.ratings.push({
    volunteerUid,
    volunteerName,
    stars,
    feedback,
    createdAt: new Date().toISOString()
  });
  issue.averageRating = averageRating(issue.ratings);
  pushHistory(issue, "rating", volunteerName, `Submitted ${stars}-star feedback`);
  await issue.save();

  res.json({ issue: toClientIssue(issue, false) });
}

async function getTrendingIssues(req, res) {
  try {
    const limit = Math.min(Number.parseInt(String(req.query.limit || "10"), 10) || 10, 100);

    const trending = await Issue.find()
      .sort({ votes: -1, createdAt: -1 })
      .limit(limit)
      .select("title category location votes ai status createdAt")
      .lean();

    const response = trending.map((issue) => ({
      id: String(issue._id),
      title: issue.title,
      category: issue.category,
      location: {
        state: issue.location?.state || "",
        district: issue.location?.district || "",
        area: issue.location?.area || ""
      },
      votes: issue.votes || 0,
      priority: issue.ai?.priority || 30,
      status: normalizeStatus(issue.status),
      createdAt: issue.createdAt
    }));

    res.json({
      trending: response,
      total: response.length,
      limit
    });
  } catch (error) {
    console.error("Error fetching trending issues:", error);
    res.status(500).json({ error: "Failed to fetch trending issues." });
  }
}

module.exports = {
  listIssues,
  createIssue,
  getRecommendedNgos,
  voteIssue,
  unvoteIssue,
  claimIssue,
  updateIssueStatus,
  addProgress,
  addRating,
  getTrendingIssues
};
