const { STATUS, LEGACY_STATUS_MAP } = require("../constants/status");

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[String(status || "").toLowerCase()] || STATUS.PENDING;
}

function normalizeLocation(location) {
  return {
    state: String(location?.state || "").trim(),
    district: String(location?.district || "").trim(),
    area: String(location?.area || "").trim()
  };
}

function computeAiSignals(payload) {
  const category = String(payload.category || "General").trim() || "General";
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const hashtags = Array.isArray(payload.hashtags) ? payload.hashtags : [];
  const normalizedTags = hashtags.map(normalizeTag).filter(Boolean);

  const combined = `${title} ${description} ${normalizedTags.join(" ")}`.toLowerCase();

  let autoCategory = category;
  if (/water|flood|drain|sanitation/.test(combined)) autoCategory = "Environment";
  if (/school|student|tuition|education/.test(combined)) autoCategory = "Education";
  if (/clinic|hospital|medicine|health|ambulance/.test(combined)) autoCategory = "Healthcare";
  if (/food|hunger|ration/.test(combined)) autoCategory = "Food";
  if (/road|streetlight|bridge|sewer|infrastructure/.test(combined)) autoCategory = "Infrastructure";
  if (/unsafe|crime|violence|night/.test(combined)) autoCategory = "Safety";

  let priority = 30 + normalizedTags.length * 5;
  if (/urgent|critical|emergency|unsafe|danger/.test(combined)) priority += 35;
  if (/school|children|elderly|hospital/.test(combined)) priority += 15;
  priority = Math.max(10, Math.min(100, priority));

  const bucket = priority >= 75 ? "High" : priority >= 45 ? "Medium" : "Low";
  const reasoning = `AI tagged this as ${autoCategory} with ${bucket} priority based on issue keywords and context signals.`;

  return {
    autoCategory,
    priority,
    reasoning
  };
}

function pushHistory(issue, event, actor, note) {
  issue.history.push({
    event: String(event || "update"),
    actor: String(actor || "system"),
    note: String(note || ""),
    createdAt: new Date().toISOString()
  });
}

function averageRating(ratings) {
  if (!Array.isArray(ratings) || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, item) => acc + Number(item.stars || 0), 0);
  return Number((sum / ratings.length).toFixed(2));
}

function scoreIssue(issue) {
  const hashtagsCount = (issue.hashtags || []).length;
  const votesCount = Number(issue.votes || 0);
  const priority = Number(issue.ai?.priority || 0);
  return priority * 1.5 + hashtagsCount * 4 + votesCount * 2;
}

function getVotePriority(votes) {
  const count = Number(votes || 0);
  if (count >= 20) return "critical";
  if (count >= 10) return "high";
  if (count >= 5) return "medium";
  return "low";
}

function getVotePriorityRank(priority) {
  const key = String(priority || "").toLowerCase();
  if (key === "critical") return 4;
  if (key === "high") return 3;
  if (key === "medium") return 2;
  return 1;
}

module.exports = {
  normalizeTag,
  normalizeStatus,
  normalizeLocation,
  computeAiSignals,
  pushHistory,
  averageRating,
  scoreIssue,
  getVotePriority,
  getVotePriorityRank
};
