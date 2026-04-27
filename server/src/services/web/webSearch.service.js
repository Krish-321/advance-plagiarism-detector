const axios = require("axios");

/**
 * Search for a sentence on the web using DuckDuckGo API
 * @param {string} sentence - The sentence to search for
 * @returns {Promise<Array>} Array of related topics/results
 */
async function searchSentence(sentence) {
  try {
    const query = encodeURIComponent(sentence);
    const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1`;

    const res = await axios.get(url);
    return res.data.RelatedTopics || [];
  } catch (err) {
    console.error("Web search error:", err.message);
    return [];
  }
}

module.exports = { searchSentence };