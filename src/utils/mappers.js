const { normalizeStatus, getVotePriority } = require("./issueUtils");

function toClientIssue(issue, votedByMe) {
  return {
    id: String(issue._id),
    title: issue.title,
    category: issue.category,
    description: issue.description,
    ngoId: issue.ngoId,
    location: issue.location || { state: "", district: "", area: "" },
    createdByUid: issue.createdByUid,
    createdByName: issue.createdByName,
    hashtags: issue.hashtags || [],
    photoUrl: issue.photoUrl || issue.photoDataUrl || "",
    photoDataUrl: issue.photoUrl || issue.photoDataUrl || "",
    votes: Number(issue.votes || 0),
    votePriority: getVotePriority(issue.votes || 0),
    status: normalizeStatus(issue.status),
    claimedBy: issue.claimedBy || null,
    ai: issue.ai || { autoCategory: issue.category, priority: 30, reasoning: "" },
    ratings: issue.ratings || [],
    averageRating: Number(issue.averageRating || 0),
    history: issue.history || [],
    createdAt: issue.createdAt instanceof Date ? issue.createdAt.toISOString() : String(issue.createdAt || ""),
    updatedAt: issue.updatedAt instanceof Date ? issue.updatedAt.toISOString() : String(issue.updatedAt || ""),
    votedByMe: Boolean(votedByMe)
  };
}

module.exports = {
  toClientIssue
};
