const express = require("express");
const {
  volunteerAuth,
  foundationAuth,
  me,
  logout
} = require("../controllers/authController");

const router = express.Router();

router.post("/volunteer", volunteerAuth);
router.post("/foundation", foundationAuth);
router.get("/me", me);
router.post("/logout", logout);

module.exports = router;
