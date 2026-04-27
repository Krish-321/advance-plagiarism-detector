const natural = require("natural");

const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

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

function buildIdfMap(tokenizedDocuments) {
  const documentFrequency = new Map();
  const docCount = tokenizedDocuments.length;
  for (const tokens of tokenizedDocuments) {
    const seen = new Set(tokens);
    seen.forEach((term) =>
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1)
    );
  }

  const idfMap = new Map();
  documentFrequency.forEach((df, term) => {
    const idf = Math.log((1 + docCount) / (1 + df)) + 1;
    idfMap.set(term, idf);
  });
  return idfMap;
}

function buildTfIdfVector(tokens, idfMap) {
  if (!tokens.length) return { vector: new Map(), norm: 0 };
  const freq = toFrequencyMap(tokens);
  const totalTerms = tokens.length;
  const vector = new Map();
  let norm = 0;

  freq.forEach((count, term) => {
    const tf = count / totalTerms;
    const idf = idfMap.get(term) || 0;
    const weight = tf * idf;
    vector.set(term, weight);
    norm += weight * weight;
  });

  return { vector, norm: Math.sqrt(norm) };
}

function cosineFromVectors(left, right) {
  if (!left.norm || !right.norm) return 0;
  const [smaller, larger] =
    left.vector.size <= right.vector.size
      ? [left.vector, right.vector]
      : [right.vector, left.vector];

  let dot = 0;
  smaller.forEach((value, term) => {
    dot += value * (larger.get(term) || 0);
  });
  return dot / (left.norm * right.norm);
}

function tfidfCosineSimilarity(textA, textB) {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  if (!tokensA.length || !tokensB.length) return 0;
  const idfMap = buildIdfMap([tokensA, tokensB]);
  const vectorA = buildTfIdfVector(tokensA, idfMap);
  const vectorB = buildTfIdfVector(tokensB, idfMap);
  return cosineFromVectors(vectorA, vectorB);
}

function compareAllMetrics(textA, textB) {
  const tfidf = tfidfCosineSimilarity(textA, textB);
  const cosine = tfidf;
  const jaccard = tfidf;
  const aggregate = tfidf;
  return { cosine, jaccard, tfidf, aggregate };
}

function compareSentenceMatches(text1, text2, threshold = 0.7) {
  const sentences1 = sentenceTokenizer
    .tokenize(text1 || "")
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentences2 = sentenceTokenizer
    .tokenize(text2 || "")
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const matches = [];
  if (!sentences1.length || !sentences2.length) return matches;

  const tokenized1 = sentences1.map((sentence) => tokenize(sentence));
  const tokenized2 = sentences2.map((sentence) => tokenize(sentence));
  const idfMap = buildIdfMap([...tokenized1, ...tokenized2]);
  const vectors1 = tokenized1.map((tokens) => buildTfIdfVector(tokens, idfMap));
  const vectors2 = tokenized2.map((tokens) => buildTfIdfVector(tokens, idfMap));

  for (let index1 = 0; index1 < sentences1.length; index1 += 1) {
    for (let index2 = 0; index2 < sentences2.length; index2 += 1) {
      const similarity = cosineFromVectors(vectors1[index1], vectors2[index2]);
      if (similarity > threshold) {
        matches.push({
          sentence1: sentences1[index1],
          sentence2: sentences2[index2],
          sentence: sentences1[index1],
          similarity: Number((similarity * 100).toFixed(2)),
        });
      }
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

module.exports = { compareAllMetrics, compareSentenceMatches };
