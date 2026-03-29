const express = require("express");
const multer = require("multer");
const { requireRole } = require("../middleware/requireRole");
const { uploadIssueImage } = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post("/issue-image", requireRole("volunteer"), upload.single("image"), uploadIssueImage);

module.exports = router;
