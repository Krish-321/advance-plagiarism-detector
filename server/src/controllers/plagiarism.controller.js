const { analyzePlagiarism } = require("../services/plagiarism/plagiarism.service");
const { parseFileToText } = require("../services/fileParser.service");
const { compareAllMetrics } = require("../services/plagiarism/similarityMetrics.service");

function validateText(text) {
  if (!text || typeof text !== "string") return "text is required and must be a string";
  if (text.length < 30) return "text must be at least 30 characters";
  if (text.length > 15000) return "text must be 15000 characters or less";
  return "";
}

function normalizeSource(source) {
  return source === "google" ? "google" : "wikipedia";
}

function labelFromScore(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

async function detectPlagiarismFromText(req, res) {
  const { text, source } = req.body || {};
  const error = validateText(text);
  if (error) return res.status(400).json({ error });

  const selectedSource = normalizeSource(source);
  const plagiarism = await analyzePlagiarism(text, { source: selectedSource });
  return res.json({ plagiarism: { ...plagiarism, source: selectedSource } });
}

async function detectPlagiarismFromFile(req, res) {
  try {
    const text = await parseFileToText(req.file);
    const source = normalizeSource(req.body?.source);
    const error = validateText(text);
    if (error) return res.status(400).json({ error });

    const plagiarism = await analyzePlagiarism(text, { source });
    return res.json({ plagiarism: { ...plagiarism, source } });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to parse file" });
  }
}

async function compareUploadedDocuments(req, res) {
  try {
    const originalFile = req.files?.original?.[0];
    const suspectFile = req.files?.suspect?.[0];
    if (!originalFile || !suspectFile) {
      return res
        .status(400)
        .json({ error: "Please upload both files: original and suspect." });
    }

    const originalText = await parseFileToText(originalFile);
    const suspectText = await parseFileToText(suspectFile);
    const originalError = validateText(originalText);
    const suspectError = validateText(suspectText);
    if (originalError || suspectError) {
      return res.status(400).json({ error: originalError || suspectError });
    }

    const metrics = compareAllMetrics(originalText, suspectText);
    const score = Math.round(Math.min(100, metrics.aggregate * 100));

    return res.json({
      comparison: {
        score,
        label: labelFromScore(score),
        metrics: {
          cosine: Math.round(metrics.cosine * 100),
          jaccard: Math.round(metrics.jaccard * 100),
          tfidf: Math.round(metrics.tfidf * 100),
        },
        summary:
          score >= 70
            ? "High overlap between original and suspect documents."
            : score >= 40
              ? "Moderate overlap detected; review both documents manually."
              : "Low overlap between uploaded documents.",
      },
    });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err.message || "Failed to compare uploaded documents" });
  }
}

async function compareTextDocuments(req, res) {
  const { originalText, suspectText } = req.body || {};
  const originalError = validateText(originalText);
  const suspectError = validateText(suspectText);
  if (originalError || suspectError) {
    return res.status(400).json({ error: originalError || suspectError });
  }

  const metrics = compareAllMetrics(originalText, suspectText);
  const score = Math.round(Math.min(100, metrics.aggregate * 100));
  return res.json({
    comparison: {
      score,
      label: labelFromScore(score),
      metrics: {
        cosine: Math.round(metrics.cosine * 100),
        jaccard: Math.round(metrics.jaccard * 100),
        tfidf: Math.round(metrics.tfidf * 100),
      },
      summary:
        score >= 70
          ? "High overlap between original and suspect texts."
          : score >= 40
            ? "Moderate overlap detected; review both texts manually."
            : "Low overlap between provided texts.",
    },
  });
}

module.exports = {
  detectPlagiarismFromText,
  detectPlagiarismFromFile,
  compareUploadedDocuments,
  compareTextDocuments,
};
