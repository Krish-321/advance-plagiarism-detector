const express = require("express");
const multer = require("multer");
const { detectAiFromText, detectAiFromFile } = require("../controllers/ai.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/text", detectAiFromText);
router.post("/file", upload.single("file"), detectAiFromFile);

module.exports = { aiRouter: router };
