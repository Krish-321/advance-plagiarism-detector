const natural = require("natural");

const tokenizer = new natural.WordTokenizer();

const referenceCorpus = [
  {
    source: "internal://sample-article-1",
    text: "Artificial intelligence models can generate fluent text at scale. Their outputs may appear consistent and highly structured in style.",
  },
  {
    source: "internal://sample-article-2",
    text: "Academic plagiarism detection often compares overlapping n-grams, semantic similarity, and citation patterns to identify copied content.",
  },
  {
    source: "internal://sample-article-3",
    text: "Machine-written text tends to have low burstiness and stable sentence length unless prompted otherwise.",
  },
];

function tokenize(text) {
  return tokenizer
    .tokenize((text || "").toLowerCase())
    .filter((token) => /^[a-z0-9]+$/i.test(token));
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function computeSimilarity(textA, textB) {
  return jaccardSimilarity(tokenize(textA), tokenize(textB));
}

function findChunkMatches(chunk, minSimilarity = 0.2) {
  const chunkTokens = tokenize(chunk);
  return referenceCorpus
    .map((ref) => {
      const similarity = jaccardSimilarity(chunkTokens, tokenize(ref.text));
      return {
        source: ref.source,
        matchedSnippet: ref.text.slice(0, 180),
        similarity,
      };
    })
    .filter((entry) => entry.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity);
}

module.exports = { findChunkMatches, computeSimilarity };
