const natural = require("natural");

const tokenizer = new natural.WordTokenizer();

function splitSentences(text) {
  return (text || "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getSentenceLengths(sentences) {
  return sentences.map((s) => tokenizer.tokenize(s).length).filter(Boolean);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values) {
  if (!values.length) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function uniqueTokenRatio(tokens) {
  if (!tokens.length) return 0;
  return new Set(tokens.map((t) => t.toLowerCase())).size / tokens.length;
}

function repeatedBigramRatio(tokens) {
  if (tokens.length < 4) return 0;
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    bigrams.push(`${tokens[i].toLowerCase()} ${tokens[i + 1].toLowerCase()}`);
  }
  const freq = new Map();
  bigrams.forEach((bg) => freq.set(bg, (freq.get(bg) || 0) + 1));
  const repeated = [...freq.values()].filter((c) => c > 1).length;
  return repeated / Math.max(1, freq.size);
}

function topTokenShare(tokens) {
  if (!tokens.length) return 0;
  const freq = new Map();
  tokens.forEach((t) => {
    const key = t.toLowerCase();
    if (/^[a-z0-9]+$/i.test(key)) {
      freq.set(key, (freq.get(key) || 0) + 1);
    }
  });
  const maxCount = Math.max(0, ...freq.values());
  return maxCount / Math.max(1, tokens.length);
}

function topBigramShare(tokens) {
  if (tokens.length < 2) return 0;
  const freq = new Map();
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const a = tokens[i].toLowerCase();
    const b = tokens[i + 1].toLowerCase();
    if (!/^[a-z0-9]+$/i.test(a) || !/^[a-z0-9]+$/i.test(b)) continue;
    const key = `${a} ${b}`;
    freq.set(key, (freq.get(key) || 0) + 1);
  }
  const total = Math.max(1, [...freq.values()].reduce((acc, v) => acc + v, 0));
  const maxCount = Math.max(0, ...freq.values());
  return maxCount / total;
}

function extractLocalFeatures(text) {
  const sentences = splitSentences(text);
  const tokens = tokenizer.tokenize(text || "");
  const lengths = getSentenceLengths(sentences);
  const punctuationCount = ((text || "").match(/[,:;!?]/g) || []).length;
  const lower = (text || "").toLowerCase();
  const transitionMatches =
    lower.match(
      /\b(in conclusion|moreover|furthermore|additionally|overall|therefore|in summary|however)\b/g
    ) || [];
  const firstPersonMatches = lower.match(/\b(i|my|me|we|our|us)\b/g) || [];
  const formalMatches =
    lower.match(
      /\b(rapidly evolving|plays a crucial role|across multiple domains|minimal human intervention|balanced approach|continues to shape the future|structured and systematic)\b/g
    ) || [];

  const burstiness = stdDev(lengths);
  const avgSentenceLength = mean(lengths);
  const lexicalDiversity = uniqueTokenRatio(tokens);
  const repetitionRatio = repeatedBigramRatio(tokens);
  const tokenConcentration = topTokenShare(tokens);
  const bigramConcentration = topBigramShare(tokens);
  const lengthVariation = avgSentenceLength ? burstiness / avgSentenceLength : 0;
  const transitionDensity = tokens.length ? transitionMatches.length / tokens.length : 0;
  const firstPersonDensity = tokens.length ? firstPersonMatches.length / tokens.length : 0;
  const formalPhraseDensity = tokens.length ? formalMatches.length / tokens.length : 0;
  const punctuationDensity = tokens.length
    ? punctuationCount / tokens.length
    : 0;

  return {
    burstiness,
    avgSentenceLength,
    lexicalDiversity,
    repetitionRatio,
    tokenConcentration,
    bigramConcentration,
    lengthVariation,
    transitionDensity,
    firstPersonDensity,
    formalPhraseDensity,
    punctuationDensity,
  };
}

module.exports = { extractLocalFeatures };
