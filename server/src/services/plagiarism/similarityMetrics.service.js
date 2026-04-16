const natural = require("natural");

const tokenizer = new natural.WordTokenizer();

function tokenize(text) {
  return tokenizer
    .tokenize((text || "").toLowerCase())
    .filter((token) => /^[a-z0-9]+$/i.test(token));
}

function toFrequencyMap(tokens) {
  const map = new Map();
  tokens.forEach((token) => map.set(token, (map.get(token) || 0) + 1));
  return map;
}

function cosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;

  const freqA = toFrequencyMap(tokensA);
  const freqB = toFrequencyMap(tokensB);
  const vocabulary = new Set([...freqA.keys(), ...freqB.keys()]);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  vocabulary.forEach((term) => {
    const a = freqA.get(term) || 0;
    const b = freqB.get(term) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccardSimilarity(textA, textB) {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));
  if (!setA.size || !setB.size) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

function tfidfCosineSimilarity(textA, textB) {
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(textA || "");
  tfidf.addDocument(textB || "");

  const termsA = tfidf.listTerms(0);
  const termsB = tfidf.listTerms(1);
  const mapA = new Map(termsA.map((entry) => [entry.term, entry.tfidf]));
  const mapB = new Map(termsB.map((entry) => [entry.term, entry.tfidf]));
  const vocabulary = new Set([...mapA.keys(), ...mapB.keys()]);
  if (!vocabulary.size) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  vocabulary.forEach((term) => {
    const a = mapA.get(term) || 0;
    const b = mapB.get(term) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function compareAllMetrics(textA, textB) {
  const cosine = cosineSimilarity(textA, textB);
  const jaccard = jaccardSimilarity(textA, textB);
  const tfidf = tfidfCosineSimilarity(textA, textB);
  const aggregate = (cosine + jaccard + tfidf) / 3;
  return { cosine, jaccard, tfidf, aggregate };
}

module.exports = { compareAllMetrics };
