const express = require("express");
const { listDonations, createDonation } = require("../controllers/donationController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", listDonations);
router.post("/", requireRole("volunteer"), createDonation);

module.exports = router;
