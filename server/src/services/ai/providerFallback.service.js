const axios = require("axios");
const { env } = require("../../config/env");

async function classifyWithExternalProvider(text) {
  if (!env.useExternalAi || !env.externalAiUrl) {
    return null;
  }

  try {
    const response = await axios.post(
      env.externalAiUrl,
      { text },
      {
        headers: env.externalAiApiKey
          ? { Authorization: `Bearer ${env.externalAiApiKey}` }
          : {},
        timeout: 6000,
      }
    );

    if (typeof response.data?.score === "number") {
      return {
        score: Math.min(100, Math.max(0, response.data.score)),
        provider: "external",
      };
    }
    return null;
  } catch (_error) {
    return null;
  }
}

module.exports = { classifyWithExternalProvider };
