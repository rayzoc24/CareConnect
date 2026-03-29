const express = require("express");
const {
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
} = require("../controllers/issueController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/trending", getTrendingIssues);
router.get("/", listIssues);
router.get("/:id/recommended-ngos", getRecommendedNgos);
router.post("/", requireRole("volunteer"), createIssue);
router.post("/:id/vote", requireRole("volunteer"), voteIssue);
router.delete("/:id/vote", requireRole("volunteer"), unvoteIssue);
router.post("/:id/claim", requireRole("foundation"), claimIssue);
router.patch("/:id/status", requireRole("foundation"), updateIssueStatus);
router.post("/:id/progress", requireRole("foundation"), addProgress);
router.post("/:id/ratings", requireRole("volunteer"), addRating);

module.exports = router;
