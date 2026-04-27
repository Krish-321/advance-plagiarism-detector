const { analyzeAiLikelihood } = require("../services/ai/aiDetection.service");
const { classifyWithExternalProvider } = require("../services/ai/providerFallback.service");
const { parseFileToText } = require("../services/fileParser.service");

function validateText(text) {
  if (!text || typeof text !== "string") return "text is required and must be a string";
  if (text.length < 30) return "text must be at least 30 characters";
  if (text.length > 10000) return "text must be 10000 characters or less";
  return "";
}

async function detectAiFromText(req, res) {
  const { text, provider = "local" } = req.body || {};
  const error = validateText(text);
  if (error) return res.status(400).json({ error });

  let aiLikelihood;
  let providerUsed = "local-heuristic";

  // Use external provider if specified
  if (provider === "gemini" || provider === "chatgpt") {
    const externalResult = await classifyWithExternalProvider(text);
    if (externalResult) {
      aiLikelihood = {
        score: externalResult.score,
        label: externalResult.score >= 55 ? "AI Generated" : "Human Written",
        signals: [],
        providerUsed: provider,
      };
      providerUsed = provider;
    }
  }

  // Fall back to local heuristic if no external result
  if (!aiLikelihood) {
    aiLikelihood = await analyzeAiLikelihood(text);
    providerUsed = aiLikelihood.providerUsed || "local-heuristic";
  }

  return res.json({
    aiLikelihood: {
      score: aiLikelihood.score,
      label: aiLikelihood.label,
      ai_score: aiLikelihood.ai_score || aiLikelihood.score,
      signals: aiLikelihood.signals,
      providerUsed: providerUsed,
    },
    ai_detection: {
      ai_score: aiLikelihood.ai_score || aiLikelihood.score,
      label: aiLikelihood.label,
    },
  });
}

async function detectAiFromFile(req, res) {
  try {
    const text = await parseFileToText(req.file);
    const error = validateText(text);
    if (error) return res.status(400).json({ error });

    const { provider = "local" } = req.body || {};
    let aiLikelihood;
    let providerUsed = "local-heuristic";

    if (provider === "gemini" || provider === "chatgpt") {
      const externalResult = await classifyWithExternalProvider(text);
      if (externalResult) {
        aiLikelihood = {
          score: externalResult.score,
          label: externalResult.score >= 55 ? "AI Generated" : "Human Written",
          signals: [],
          providerUsed: provider,
        };
        providerUsed = provider;
      }
    }

    if (!aiLikelihood) {
      aiLikelihood = await analyzeAiLikelihood(text);
      providerUsed = aiLikelihood.providerUsed || "local-heuristic";
    }

    return res.json({
      aiLikelihood: {
        score: aiLikelihood.score,
        label: aiLikelihood.label,
        ai_score: aiLikelihood.ai_score || aiLikelihood.score,
        signals: aiLikelihood.signals,
        providerUsed: providerUsed,
      },
      ai_detection: {
        ai_score: aiLikelihood.ai_score || aiLikelihood.score,
        label: aiLikelihood.label,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to parse file" });
  }
}

module.exports = { detectAiFromText, detectAiFromFile };
