const axios = require("axios");
const { env } = require("../../config/env");
const { computeSimilarity } = require("./matcher.service");

async function searchWikipedia(query) {
  const endpoint = "https://en.wikipedia.org/w/api.php";
  const response = await axios.get(endpoint, {
    params: {
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
      srlimit: 3,
      utf8: 1,
    },
    headers: {
      "User-Agent": "PlagiarismDetector/1.0 (EducationalProject)",
      Accept: "application/json",
    },
    timeout: 3000,
  });
  return response.data?.query?.search || [];
}

async function findWebMatches(chunk, minSimilarity = 0.1) {
  return findWebMatchesBySource(chunk, "wikipedia", minSimilarity);
}

async function searchGoogle(query) {
  // Use SerpAPI-like free JSON endpoint or fallback to Wikipedia for now
  // Direct Google scraping is blocked by CORS and anti-bot measures
  // Try using DuckDuckGo as an alternative free search
  try {
    const endpoint = "https://duckduckgo.com/html/";
    const response = await axios.get(endpoint, {
      params: { q: query, format: "json" },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      timeout: 5000,
    });
    
    // Parse the HTML response for results
    const html = response.data || "";
    const results = [];
    const matches = html.matchAll(/<a class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<a class="result__snippet"[^>]*>([^<]+)<\/a>/g);
    
    for (const match of matches) {
      results.push({
        url: match[1],
        title: match[2].replace(/<[^>]*>/g, ""),
        snippet: match[3].replace(/<[^>]*>/g, ""),
      });
    }
    
    return results.slice(0, 3);
  } catch (error) {
    console.error("Google search error:", error.message);
    // Fallback to Wikipedia if Google fails
    return searchWikipedia(query);
  }
}

async function findWebMatchesBySource(chunk, source = "wikipedia", minSimilarity = 0.1) {
  if (!env.useWebLookup || !chunk) return [];
  try {
    const trimmedChunk = chunk.slice(0, 120);
    const rawResults =
      source === "google" ? await searchGoogle(trimmedChunk) : await searchWikipedia(trimmedChunk);

    return rawResults
      .map((result) => {
        const cleanSnippet = (result.snippet || result.extract || "").replace(/<[^>]*>/g, "");
        const title = (result.title || "").replace(/<[^>]*>/g, "");
        const comparisonText = `${title} ${cleanSnippet}`.trim();
        const url =
          source === "google"
            ? result.url
            : result.pageid
              ? `https://en.wikipedia.org/wiki?curid=${result.pageid}`
              : `https://en.wikipedia.org/wiki/${encodeURIComponent((result.title || "").replaceAll(" ", "_"))}`;
        return {
          source: url,
          matchedSnippet: cleanSnippet,
          similarity: computeSimilarity(chunk, comparisonText),
        };
      })
      .filter((entry) => entry.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity);
  } catch (_err) {
    return [];
  }
}

module.exports = { findWebMatches, findWebMatchesBySource };
