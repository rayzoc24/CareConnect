const express = require("express");
const { listNgos } = require("../controllers/ngoController");

const router = express.Router();

router.get("/", listNgos);

module.exports = router;
