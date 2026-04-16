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
  const endpoint = "https://www.google.com/search";
  const response = await axios.get(endpoint, {
    params: { q: query, num: 3, hl: "en" },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
    timeout: 4000,
  });
  const html = response.data || "";
  const matches = [...html.matchAll(/<a href="\/url\?q=([^"&]+)[^"]*".*?<h3[^>]*>(.*?)<\/h3>/g)];
  return matches.slice(0, 3).map((entry) => ({
    url: decodeURIComponent(entry[1]),
    title: entry[2].replace(/<[^>]*>/g, ""),
    snippet: entry[2].replace(/<[^>]*>/g, ""),
  }));
}

async function findWebMatchesBySource(chunk, source = "wikipedia", minSimilarity = 0.1) {
  if (!env.useWebLookup || !chunk) return [];
  try {
    const trimmedChunk = chunk.slice(0, 120);
    const rawResults =
      source === "google" ? await searchGoogle(trimmedChunk) : await searchWikipedia(trimmedChunk);

    return rawResults
      .map((result) => {
        const cleanSnippet = (result.snippet || "").replace(/<[^>]*>/g, "");
        const title = (result.title || "").replace(/<[^>]*>/g, "");
        const comparisonText = `${title} ${cleanSnippet}`.trim();
        const url =
          source === "google"
            ? result.url
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
