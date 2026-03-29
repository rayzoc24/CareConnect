const Issue = require("../models/Issue");
const Vote = require("../models/Vote");
const { STATUS } = require("../constants/status");
const { normalizeStatus } = require("../utils/issueUtils");

function toDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getRangeStart(range) {
  const now = new Date();
  const key = String(range || "all").toLowerCase();
  if (key === "weekly") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (key === "monthly") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null;
}

function inRange(date, start) {
  if (!date) return false;
  if (!start) return true;
  return date >= start;
}

function extractCompletedAt(issue) {
  const entries = Array.isArray(issue.history) ? issue.history : [];
  const statusComplete = entries
    .filter((entry) => String(entry.event || "").toLowerCase() === "status")
    .find((entry) => /completed/i.test(String(entry.note || "")));

  if (statusComplete) {
    return toDate(statusComplete.createdAt);
  }

  return toDate(issue.updatedAt);
}

function sortByTimestampDesc(items) {
  return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function getVolunteerActivity(req, res) {
  const user = req.session.user;
  const volunteerUid = String(user?.id || "").trim();
  const range = String(req.query.range || "all").toLowerCase();
  const start = getRangeStart(range);

  const [createdIssues, completedIssues, votes] = await Promise.all([
    Issue.find({ createdByUid: volunteerUid }, { _id: 1, title: 1, category: 1, createdAt: 1 }).lean(),
    Issue.find(
      { createdByUid: volunteerUid, status: STATUS.COMPLETED },
      { _id: 1, title: 1, category: 1, status: 1, history: 1, updatedAt: 1 }
    ).lean(),
    Vote.find({ voterUid: volunteerUid }).sort({ createdAt: -1 }).lean()
  ]);

  const votedIssueIds = votes.map((entry) => entry.issueId);
  const votedIssueMap = new Map();
  if (votedIssueIds.length > 0) {
    const votedIssues = await Issue.find({ _id: { $in: votedIssueIds } }, { _id: 1, title: 1, category: 1 }).lean();
    votedIssues.forEach((issue) => {
      votedIssueMap.set(String(issue._id), issue);
    });
  }

  const activities = [];

  createdIssues.forEach((issue) => {
    const timestamp = toDate(issue.createdAt);
    if (!inRange(timestamp, start)) return;
    activities.push({
      type: "issue_created",
      issueId: String(issue._id),
      issueTitle: issue.title,
      category: issue.category,
      timestamp: timestamp.toISOString()
    });
  });

  votes.forEach((entry) => {
    const timestamp = toDate(entry.createdAt);
    if (!inRange(timestamp, start)) return;

    const linkedIssue = votedIssueMap.get(String(entry.issueId));
    activities.push({
      type: "vote_given",
      issueId: linkedIssue ? String(linkedIssue._id) : String(entry.issueId),
      issueTitle: linkedIssue ? linkedIssue.title : "Issue",
      category: linkedIssue ? linkedIssue.category : "",
      timestamp: timestamp.toISOString()
    });
  });

  completedIssues.forEach((issue) => {
    const timestamp = extractCompletedAt(issue);
    if (!inRange(timestamp, start)) return;
    activities.push({
      type: "issue_resolved",
      issueId: String(issue._id),
      issueTitle: issue.title,
      category: issue.category,
      timestamp: timestamp.toISOString()
    });
  });

  const sorted = sortByTimestampDesc(activities);

  res.json({
    role: "volunteer",
    userId: volunteerUid,
    range,
    from: start ? start.toISOString() : null,
    total: sorted.length,
    activities: sorted
  });
}

async function getNgoActivity(req, res) {
  const user = req.session.user;
  const ngoUid = String(user?.id || "").trim();
  const range = String(req.query.range || "all").toLowerCase();
  const start = getRangeStart(range);

  const claimedIssues = await Issue.find(
    { "claimedBy.ngoUid": ngoUid },
    {
      _id: 1,
      title: 1,
      category: 1,
      status: 1,
      claimedBy: 1,
      history: 1,
      updatedAt: 1
    }
  ).lean();

  const activities = [];

  claimedIssues.forEach((issue) => {
    const claimedAt = toDate(issue?.claimedBy?.claimedAt);
    if (inRange(claimedAt, start)) {
      activities.push({
        type: "issue_claimed",
        issueId: String(issue._id),
        issueTitle: issue.title,
        category: issue.category,
        timestamp: claimedAt.toISOString()
      });
    }

    const historyEntries = Array.isArray(issue.history) ? issue.history : [];
    historyEntries
      .filter((entry) => String(entry.event || "").toLowerCase() === "status")
      .forEach((entry) => {
        const statusTs = toDate(entry.createdAt);
        if (!inRange(statusTs, start)) return;

        activities.push({
          type: "status_updated",
          issueId: String(issue._id),
          issueTitle: issue.title,
          category: issue.category,
          note: String(entry.note || ""),
          timestamp: statusTs.toISOString()
        });
      });

    if (normalizeStatus(issue.status) === STATUS.COMPLETED) {
      const completedAt = extractCompletedAt(issue);
      if (inRange(completedAt, start)) {
        activities.push({
          type: "issue_completed",
          issueId: String(issue._id),
          issueTitle: issue.title,
          category: issue.category,
          timestamp: completedAt.toISOString()
        });
      }
    }
  });

  const sorted = sortByTimestampDesc(activities);

  res.json({
    role: "foundation",
    userId: ngoUid,
    range,
    from: start ? start.toISOString() : null,
    total: sorted.length,
    activities: sorted
  });
}

module.exports = {
  getVolunteerActivity,
  getNgoActivity
};