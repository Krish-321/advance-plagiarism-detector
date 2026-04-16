const express = require("express");
const multer = require("multer");
const {
  analyzeText,
  analyzeFile,
  getHistory,
  downloadReport,
} = require("../controllers/analyze.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/", analyzeText);
router.post("/file", upload.single("file"), analyzeFile);
router.get("/history", getHistory);
router.get("/report/:id", downloadReport);

module.exports = { analyzeRouter: router };
