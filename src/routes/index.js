const express = require("express");
const authRoutes = require("./authRoutes");
const ngoRoutes = require("./ngoRoutes");
const issueRoutes = require("./issueRoutes");
const donationRoutes = require("./donationRoutes");
const impactRoutes = require("./impactRoutes");
const uploadRoutes = require("./uploadRoutes");
const activityRoutes = require("./activityRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/ngos", ngoRoutes);
router.use("/issues", issueRoutes);
router.use("/donations", donationRoutes);
router.use("/impact", impactRoutes);
router.use("/uploads", uploadRoutes);
router.use("/activity", activityRoutes);
router.use("/leaderboard", leaderboardRoutes);

module.exports = router;
