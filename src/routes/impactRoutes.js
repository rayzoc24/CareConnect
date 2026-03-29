const express = require("express");
const { getImpact, getUserImpact } = require("../controllers/impactController");

const router = express.Router();

// More specific route first
router.get("/me", getUserImpact);
// Less specific route last
router.get("/", getImpact);

module.exports = router;
