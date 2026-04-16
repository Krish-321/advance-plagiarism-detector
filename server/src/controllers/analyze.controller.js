const crypto = require("crypto");
const mongoose = require("mongoose");
const { analyzePlagiarism } = require("../services/plagiarism/plagiarism.service");
const { analyzeAiLikelihood } = require("../services/ai/aiDetection.service");
const { riskSummary } = require("../utils/scoring");
const { Analysis } = require("../models/analysis.model");
const { parseFileToText } = require("../services/fileParser.service");
const { pushAnalysis, getMemoryHistory } = require("../services/analysisStore.service");

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function validateText(text) {
  if (!text || typeof text !== "string") {
    return "text is required and must be a string";
  }
  if (text.length < 30) {
    return "text must be at least 30 characters";
  }
  if (text.length > 10000) {
    return "text must be 10000 characters or less";
  }
  return "";
}

async function runAnalysis(text) {
  const plagiarism = await analyzePlagiarism(text);
  const aiLikelihood = await analyzeAiLikelihood(text);

  const response = {
    plagiarism,
    aiLikelihood: {
      score: aiLikelihood.score,
      label: aiLikelihood.label,
      signals: aiLikelihood.signals,
      providerUsed: aiLikelihood.providerUsed,
    },
    overall: {
      riskSummary: riskSummary(plagiarism.score, aiLikelihood.score),
    },
  };

  const payload = {
    inputText: text,
    textHash: hashText(text),
    plagiarismScore: plagiarism.score,
    plagiarismLabel: plagiarism.label,
    aiScore: aiLikelihood.score,
    aiLabel: aiLikelihood.label,
    matches: plagiarism.matches,
    signals: aiLikelihood.signals,
    createdAt: new Date().toISOString(),
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const created = await Analysis.create(payload);
      payload.id = created._id.toString();
    }
  } catch (_err) {
    // Database persistence is optional for local startup and tests.
  }

  if (!payload.id) {
    payload.id = payload.textHash.slice(0, 16);
  }
  pushAnalysis(payload);

  return response;
}

async function analyzeText(req, res) {
  const { text } = req.body || {};
  const error = validateText(text);
  if (error) {
    return res.status(400).json({ error });
  }
  const response = await runAnalysis(text);
  return res.status(200).json(response);
}

async function analyzeFile(req, res) {
  try {
    const text = await parseFileToText(req.file);
    const error = validateText(text);
    if (error) {
      return res.status(400).json({ error });
    }
    const response = await runAnalysis(text);
    return res.status(200).json(response);
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to parse file" });
  }
}

async function getHistory(_req, res) {
  if (mongoose.connection.readyState === 1) {
    const records = await Analysis.find().sort({ createdAt: -1 }).limit(20).lean();
    return res.json(
      records.map((item) => ({
        id: item._id.toString(),
        plagiarismScore: item.plagiarismScore,
        aiScore: item.aiScore,
        plagiarismLabel: item.plagiarismLabel,
        aiLabel: item.aiLabel,
        createdAt: item.createdAt,
      }))
    );
  }

  const memory = getMemoryHistory().map((item) => ({
    id: item.id,
    plagiarismScore: item.plagiarismScore,
    aiScore: item.aiScore,
    plagiarismLabel: item.plagiarismLabel,
    aiLabel: item.aiLabel,
    createdAt: item.createdAt,
  }));
  return res.json(memory);
}

async function downloadReport(req, res) {
  const { id } = req.params;
  let record = null;
  if (mongoose.connection.readyState === 1) {
    const dbRecord = await Analysis.findById(id).lean();
    if (dbRecord) {
      record = {
        id: dbRecord._id.toString(),
        plagiarismScore: dbRecord.plagiarismScore,
        plagiarismLabel: dbRecord.plagiarismLabel,
        aiScore: dbRecord.aiScore,
        aiLabel: dbRecord.aiLabel,
        createdAt: dbRecord.createdAt,
      };
    }
  }
  if (!record) {
    record = getMemoryHistory().find((entry) => entry.id === id);
  }
  if (!record) {
    return res.status(404).json({ error: "Report not found" });
  }

  const lines = [
    "Plagiarism + AI Detection Report",
    `Report ID: ${record.id}`,
    `Date: ${record.createdAt}`,
    "",
    `Plagiarism Score: ${record.plagiarismScore}% (${record.plagiarismLabel})`,
    `AI Likelihood Score: ${record.aiScore}% (${record.aiLabel})`,
  ];
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="analysis-${record.id}.txt"`);
  return res.send(lines.join("\n"));
}

module.exports = { analyzeText, analyzeFile, getHistory, downloadReport };
