const express = require("express");
const multer = require("multer");
const {
  detectPlagiarismFromText,
  detectPlagiarismFromFile,
  compareUploadedDocuments,
  compareTextDocuments,
} = require("../controllers/plagiarism.controller");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post("/text", detectPlagiarismFromText);
router.post("/file", upload.single("file"), detectPlagiarismFromFile);
router.post("/compare-text", compareTextDocuments);
router.post(
  "/compare-files",
  upload.fields([
    { name: "original", maxCount: 1 },
    { name: "suspect", maxCount: 1 },
  ]),
  compareUploadedDocuments
);

module.exports = { plagiarismRouter: router };
