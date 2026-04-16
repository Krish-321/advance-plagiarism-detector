const { analyzeAiLikelihood } = require("../services/ai/aiDetection.service");
const { parseFileToText } = require("../services/fileParser.service");

function validateText(text) {
  if (!text || typeof text !== "string") return "text is required and must be a string";
  if (text.length < 30) return "text must be at least 30 characters";
  if (text.length > 10000) return "text must be 10000 characters or less";
  return "";
}

async function detectAiFromText(req, res) {
  const { text } = req.body || {};
  const error = validateText(text);
  if (error) return res.status(400).json({ error });

  const aiLikelihood = await analyzeAiLikelihood(text);
  return res.json({
    aiLikelihood: {
      score: aiLikelihood.score,
      label: aiLikelihood.label,
      signals: aiLikelihood.signals,
      providerUsed: aiLikelihood.providerUsed,
    },
  });
}

async function detectAiFromFile(req, res) {
  try {
    const text = await parseFileToText(req.file);
    const error = validateText(text);
    if (error) return res.status(400).json({ error });
    const aiLikelihood = await analyzeAiLikelihood(text);
    return res.json({
      aiLikelihood: {
        score: aiLikelihood.score,
        label: aiLikelihood.label,
        signals: aiLikelihood.signals,
        providerUsed: aiLikelihood.providerUsed,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to parse file" });
  }
}

module.exports = { detectAiFromText, detectAiFromFile };
