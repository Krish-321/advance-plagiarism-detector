const crypto = require("crypto");
const natural = require("natural");

const sentenceTokenizer = new natural.SentenceTokenizer();

/**
 * Text normalization utilities
 */

function normalizeSource(source) {
  return source === "google" ? "google" : "wikipedia";
}

/**
 * Generate label based on score thresholds
 */
function labelFromScore(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

/**
 * Hash text using SHA-256
 */
function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Build verdict message based on similarity score
 */
function buildVerdict(score, highMsg, mediumMsg, lowMsg) {
  if (score >= 70) return highMsg;
  if (score >= 40) return mediumMsg;
  return lowMsg;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text) {
  return sentenceTokenizer
    .tokenize(text || "")
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

module.exports = {
  normalizeSource,
  labelFromScore,
  hashText,
  buildVerdict,
  splitIntoSentences,
};