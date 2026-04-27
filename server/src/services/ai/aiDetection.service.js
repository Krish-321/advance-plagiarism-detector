function clamp100(value) {
  return Math.max(0, Math.min(100, value));
}

function toWords(text) {
  return (text || "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9']/gi, ""))
    .filter(Boolean);
}

function toSentences(text) {
  return (text || "")
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function sentenceLengthVariation(lengths, average) {
  if (!lengths.length || !average) return 0;
  const variance =
    lengths.reduce((sum, length) => sum + (length - average) ** 2, 0) / lengths.length;
  return Math.sqrt(variance) / average;
}

function detectAI(text) {
  const words = toWords(text);
  const sentences = toSentences(text);
  if (!words.length || !sentences.length) {
    return {
      ai_score: 0,
      label: "Human Written",
      signals: [],
    };
  }

  const uniqueWords = new Set(words);
  const averageSentenceLength = words.length / sentences.length;
  const vocabularyDiversity = uniqueWords.size / words.length;

  const frequencyMap = new Map();
  words.forEach((word) => frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1));
  const repeatedTokenCount = [...frequencyMap.values()]
    .filter((count) => count > 1)
    .reduce((total, count) => total + count - 1, 0);
  const repetitionRatio = repeatedTokenCount / words.length;

  const sentenceWordCounts = sentences.map((sentence) => toWords(sentence).length).filter(Boolean);
  const lengthVariation = sentenceLengthVariation(sentenceWordCounts, averageSentenceLength);

  const consistencyImpact = clamp100((0.38 - lengthVariation) * 160);
  const lowDiversityImpact = clamp100((0.62 - vocabularyDiversity) * 140);
  const repetitionImpact = clamp100(repetitionRatio * 260);
  const longSentenceImpact = clamp100((averageSentenceLength - 16) * 4);

  const aiScore = Math.round(
    clamp100(
      consistencyImpact * 0.35 +
        lowDiversityImpact * 0.35 +
        repetitionImpact * 0.2 +
        longSentenceImpact * 0.1
    )
  );

  return {
    ai_score: aiScore,
    label: aiScore >= 55 ? "AI Generated" : "Human Written",
    signals: [
      { featureName: "avgSentenceLength", value: Number(averageSentenceLength.toFixed(2)) },
      { featureName: "repetitionRatio", value: Number(repetitionRatio.toFixed(3)) },
      { featureName: "vocabularyDiversity", value: Number(vocabularyDiversity.toFixed(3)) },
      { featureName: "lengthVariation", value: Number(lengthVariation.toFixed(3)) },
    ],
  };
}

async function analyzeAiLikelihood(text) {
  const heuristic = detectAI(text);
  return {
    score: heuristic.ai_score,
    label: heuristic.label,
    signals: heuristic.signals,
    providerUsed: "local-heuristic",
    ai_score: heuristic.ai_score,
  };
}

module.exports = { analyzeAiLikelihood, detectAI };
