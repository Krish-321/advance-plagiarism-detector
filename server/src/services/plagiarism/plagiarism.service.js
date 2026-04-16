const { findChunkMatches } = require("./matcher.service");
const { findWebMatchesBySource } = require("./webMatcher.service");

function splitIntoChunks(text) {
  const sentences = (text || "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return sentences;

  const chunks = [];
  for (let i = 0; i < sentences.length; i += 1) {
    const current = sentences[i];
    const next = sentences[i + 1] || "";
    chunks.push(`${current} ${next}`.trim());
  }
  return chunks;
}

function getLabel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

async function analyzePlagiarism(text, options = {}) {
  const source = options.source || "wikipedia";
  const chunks = splitIntoChunks(text);
  const allMatches = [];

  for (const chunk of chunks) {
    const matches = findChunkMatches(chunk);
    const webMatches = await findWebMatchesBySource(chunk, source);
    const merged = [...matches, ...webMatches].sort(
      (a, b) => b.similarity - a.similarity
    );
    if (merged.length > 0) {
      allMatches.push(merged[0]);
    }
  }

  const avgSimilarity =
    allMatches.length > 0
      ? allMatches.reduce((acc, m) => acc + m.similarity, 0) / allMatches.length
      : 0;
  const score = Math.round(Math.min(100, avgSimilarity * 100));

  return {
    score,
    label: getLabel(score),
    matches: allMatches.slice(0, 8),
  };
}

module.exports = { analyzePlagiarism };
