const { analyzePlagiarism } = require("../services/plagiarism/plagiarism.service");
const { parseFileToText } = require("../services/fileParser.service");
const PDFDocument = require("pdfkit");
const {
  compareAllMetrics,
  compareSentenceMatches,
} = require("../services/plagiarism/similarityMetrics.service");
const { validateText } = require("../utils/validation");
const { normalizeSource, labelFromScore, buildVerdict } = require("../utils/textProcessing");
const { analyzeWithWeb } = require("../services/analyzer.service");

function buildSentenceComparisonResponse(text1, text2, summaryText) {
  const metrics = compareAllMetrics(text1, text2);
  const sentenceMatches = compareSentenceMatches(text1, text2, 0.7);
  const normalizedMatches = sentenceMatches.map((match) => ({
    sentence: match.sentence,
    similarity: Number(match.similarity.toFixed(2)),
  }));
  const totalSimilarity = normalizedMatches.reduce((total, match) => total + match.similarity, 0);
  const overallSimilarity = Number(
    (normalizedMatches.length ? totalSimilarity / normalizedMatches.length : 0).toFixed(2)
  );
  const score = Math.round(Math.min(100, overallSimilarity));

  return {
    score,
    label: labelFromScore(score),
    summary: {
      cosine: Number((metrics.cosine * 100).toFixed(2)),
      jaccard: Number((metrics.jaccard * 100).toFixed(2)),
      tfidf: Number((metrics.tfidf * 100).toFixed(2)),
    },
    overall_similarity: overallSimilarity,
    matches: normalizedMatches,
    // Kept for backward compatibility with existing frontend consumers.
    matchedSentences: sentenceMatches.map((match) => ({
      sentence1: match.sentence1,
      sentence2: match.sentence2,
      similarity: match.similarity,
    })),
    overallSimilarity,
    verdict: buildVerdict(
      score,
      "High overlap between original and suspect documents.",
      "Moderate overlap detected; review both documents manually.",
      "Low overlap between uploaded documents."
    ),
  };
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

    return res.json({
      comparison: buildSentenceComparisonResponse(
        originalText,
        suspectText,
        null // verdict built internally now
      ),
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

  return res.json({
    comparison: buildSentenceComparisonResponse(
      originalText,
      suspectText,
      null // verdict built internally now
    ),
  });
}

function generatePlagiarismReport(req, res) {
  const { overall_similarity: overallSimilarityRaw, matches } = req.body || {};
  const overallSimilarity = Number(overallSimilarityRaw);
  const safeMatches = Array.isArray(matches) ? matches : [];

  if (!Number.isFinite(overallSimilarity)) {
    return res.status(400).json({ error: "overall_similarity must be a number" });
  }

  const doc = new PDFDocument({ margin: 48 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="plagiarism-report.pdf"');
  doc.pipe(res);

  doc.fontSize(20).text("Plagiarism Report", { align: "center" });
  doc.moveDown(0.8);
  doc
    .fontSize(12)
    .fillColor("#111827")
    .text(`Overall Similarity: ${overallSimilarity.toFixed(2)}%`);
  doc.moveDown(0.8);
  doc.fontSize(14).text("Matched Sentences", { underline: true });
  doc.moveDown(0.5);

  if (!safeMatches.length) {
    doc.fontSize(11).text("No matched sentences above threshold.");
  } else {
    safeMatches.forEach((match, index) => {
      const sentence = String(match?.sentence || "").trim() || "N/A";
      const similarity = Number(match?.similarity);
      const similarityText = Number.isFinite(similarity) ? `${similarity.toFixed(2)}%` : "N/A";
      doc.fontSize(11).fillColor("#111827").text(`${index + 1}. ${sentence}`);
      doc.fontSize(10).fillColor("#475569").text(`Similarity: ${similarityText}`);
      doc.moveDown(0.4);
    });
  }

  doc.end();
  return null;
}

async function checkWebPlagiarism(req, res) {
  try {
    const { text } = req.body || {};
    const error = validateText(text);
    if (error) return res.status(400).json({ error });

    const results = await analyzeWithWeb(text);

    res.json({
      totalMatches: results.length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  detectPlagiarismFromText,
  detectPlagiarismFromFile,
  compareUploadedDocuments,
  compareTextDocuments,
  generatePlagiarismReport,
  checkWebPlagiarism,
};
