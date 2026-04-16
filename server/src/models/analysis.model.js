const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    matchedSnippet: { type: String, required: true },
    similarity: { type: Number, required: true },
  },
  { _id: false }
);

const signalSchema = new mongoose.Schema(
  {
    featureName: { type: String, required: true },
    value: { type: Number, required: true },
    impact: { type: Number, required: true },
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    inputText: { type: String, required: true },
    textHash: { type: String, required: true },
    plagiarismScore: { type: Number, required: true },
    plagiarismLabel: { type: String, required: true },
    aiScore: { type: Number, required: true },
    aiLabel: { type: String, required: true },
    matches: { type: [matchSchema], default: [] },
    signals: { type: [signalSchema], default: [] },
  },
  { timestamps: true }
);

const Analysis = mongoose.model("Analysis", analysisSchema);

module.exports = { Analysis };
