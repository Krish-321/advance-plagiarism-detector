const { splitIntoSentences } = require("../utils/textProcessing");
const { compareAllMetrics } = require("./plagiarism/similarityMetrics.service");
const { searchSentence } = require("./web/webSearch.service");

/**
 * Compare two sentences and return similarity score (0-100)
 */
function compareSentences(s1, s2) {
  const metrics = compareAllMetrics(s1, s2);
  return Math.round(metrics.cosine * 100);
}

/**
 * Analyze two documents and find matching sentences above threshold
 * @param {string} text1 - First document text
 * @param {string} text2 - Second document text
 * @param {number} threshold - Similarity threshold (default 70)
 * @returns {Promise<Array>} Array of matches with source, match, and score
 */
async function analyzeDocument(text1, text2, threshold = 70) {
  const sentences1 = splitIntoSentences(text1);
  const sentences2 = splitIntoSentences(text2);

  const matches = [];

  for (const s1 of sentences1) {
    for (const s2 of sentences2) {
      const score = compareSentences(s1, s2);

      if (score > threshold) {
        matches.push({
          source: s1,
          match: s2,
          score,
        });
      }
    }
  }

  return matches;
}

/**
 * Analyze text against web sources using DuckDuckGo search
 * @param {string} text - Text to analyze
 * @param {number} threshold - Similarity threshold (default 60)
 * @returns {Promise<Array>} Array of sentences with matching web sources
 */
async function analyzeWithWeb(text, threshold = 60) {
  const sentences = splitIntoSentences(text);
  const results = [];

  for (const sentence of sentences) {
    const webResults = await searchSentence(sentence);

    const matchedSources = [];

    for (const item of webResults.slice(0, 5)) {
      if (!item.Text) continue;

      const score = compareSentences(sentence, item.Text);

      if (score > threshold) {
        matchedSources.push({
          snippet: item.Text,
          link: item.FirstURL,
          score,
        });
      }
    }

    if (matchedSources.length > 0) {
      results.push({
        sentence,
        matches: matchedSources,
      });
    }
  }

  return results;
}

module.exports = { analyzeDocument, compareSentences, analyzeWithWeb };