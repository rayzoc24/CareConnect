const Issue = require("../models/Issue");
const Vote = require("../models/Vote");
const { STATUS } = require("../constants/status");
const { normalizeStatus } = require("../utils/issueUtils");

async function getImpact(req, res) {
  const issues = await Issue.find({}).lean();
  const solvedIssues = issues.filter((item) => normalizeStatus(item.status) === STATUS.COMPLETED).length;
  const totalIssues = issues.length;
  const activeNgos = new Set(
    issues
      .filter((item) => item.claimedBy && item.claimedBy.ngoUid)
      .map((item) => item.claimedBy.ngoUid)
  ).size;
  const completionRate = totalIssues ? Math.round((solvedIssues / totalIssues) * 100) : 0;

  res.json({
    totalIssues,
    solvedIssues,
    activeNgos,
    completionRate
  });
}

async function getUserImpact(req, res) {
  try {
    // Get user info from session
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.session.user.id;
    const userRole = req.session.user.role;

    if (userRole === "volunteer") {
      // Volunteer impact metrics
      const createdIssues = await Issue.countDocuments({ createdByUid: userId });
      const resolvedIssues = await Issue.countDocuments({
        createdByUid: userId,
        status: STATUS.COMPLETED
      });
      const votesGiven = await Vote.countDocuments({ voterUid: userId });

      return res.json({
        role: "volunteer",
        totalIssues: createdIssues,
        resolvedIssues: resolvedIssues,
        votesGiven: votesGiven,
        impactScore: resolvedIssues * 10 + votesGiven
      });
    } else if (userRole === "foundation" || userRole === "ngo") {
      // NGO impact metrics
      const claimedIssues = await Issue.countDocuments({
        "claimedBy.ngoUid": userId
      });
      const resolvedIssues = await Issue.countDocuments({
        "claimedBy.ngoUid": userId,
        status: STATUS.COMPLETED
      });
      const impactScore = resolvedIssues * 15; // 15 points per resolved issue

      return res.json({
        role: userRole,
        totalIssues: claimedIssues,
        resolvedIssues: resolvedIssues,
        impactScore: impactScore
      });
    } else {
      return res.status(400).json({ error: "Invalid user role" });
    }
  } catch (error) {
    console.error("Error calculating user impact:", error);
    res.status(500).json({ error: "Failed to calculate user impact" });
  }
}

module.exports = {
  getImpact,
  getUserImpact
};
