const express = require("express");
const { requireRole } = require("../middleware/requireRole");
const { getVolunteerActivity, getNgoActivity } = require("../controllers/activityController");

const router = express.Router();

router.get("/volunteer", requireRole("volunteer"), getVolunteerActivity);
router.get("/ngo", requireRole("foundation"), getNgoActivity);

module.exports = router;