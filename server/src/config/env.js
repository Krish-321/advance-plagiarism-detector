const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "",
  externalAiUrl: process.env.EXTERNAL_AI_URL || "",
  externalAiApiKey: process.env.EXTERNAL_AI_API_KEY || "",
  useExternalAi: process.env.USE_EXTERNAL_AI === "true",
  useWebLookup: process.env.USE_WEB_LOOKUP !== "false",
};

module.exports = { env };
