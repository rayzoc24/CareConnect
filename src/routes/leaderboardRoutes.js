const express = require("express");
const { getVolunteerLeaderboard, getNgoLeaderboard } = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/volunteers", getVolunteerLeaderboard);
router.get("/ngos", getNgoLeaderboard);

module.exports = router;
