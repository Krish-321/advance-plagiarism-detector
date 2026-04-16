const { extractLocalFeatures } = require("./featureExtractor.service");
const { classifyWithExternalProvider } = require("./providerFallback.service");

function clamp100(value) {
  return Math.max(0, Math.min(100, value));
}

function labelFor(score) {
  if (score >= 50) return "likely-ai";
  if (score >= 30) return "mixed";
  return "likely-human";
}

function scoreFromFeatures(features) {
  const signals = [];
  let score = 0;

  const lowBurstinessImpact = clamp100((12 - features.burstiness) * 3);
  const lowDiversityImpact = clamp100((0.45 - features.lexicalDiversity) * 160);
  const repetitionImpact = clamp100(features.repetitionRatio * 180);
  const punctuationImpact = clamp100((0.03 - features.punctuationDensity) * 250);
  const lowVariationImpact = clamp100((0.45 - features.lengthVariation) * 130);
  const transitionImpact = clamp100(features.transitionDensity * 1400);
  const lowFirstPersonImpact = clamp100((0.015 - features.firstPersonDensity) * 2200);
  const tokenConcentrationImpact = clamp100((features.tokenConcentration - 0.028) * 3500);
  const bigramConcentrationImpact = clamp100((features.bigramConcentration - 0.012) * 4200);
  const formalPhraseImpact = clamp100(features.formalPhraseDensity * 7000);

  signals.push(
    {
      featureName: "burstiness",
      value: features.burstiness,
      impact: lowBurstinessImpact,
    },
    {
      featureName: "lexicalDiversity",
      value: features.lexicalDiversity,
      impact: lowDiversityImpact,
    },
    {
      featureName: "repetitionRatio",
      value: features.repetitionRatio,
      impact: repetitionImpact,
    },
    {
      featureName: "punctuationDensity",
      value: features.punctuationDensity,
      impact: punctuationImpact,
    },
    {
      featureName: "lengthVariation",
      value: features.lengthVariation,
      impact: lowVariationImpact,
    },
    {
      featureName: "transitionDensity",
      value: features.transitionDensity,
      impact: transitionImpact,
    },
    {
      featureName: "firstPersonDensity",
      value: features.firstPersonDensity,
      impact: lowFirstPersonImpact,
    },
    {
      featureName: "tokenConcentration",
      value: features.tokenConcentration,
      impact: tokenConcentrationImpact,
    },
    {
      featureName: "bigramConcentration",
      value: features.bigramConcentration,
      impact: bigramConcentrationImpact,
    },
    {
      featureName: "formalPhraseDensity",
      value: features.formalPhraseDensity,
      impact: formalPhraseImpact,
    }
  );

  const weightedScore =
    lowBurstinessImpact * 0.2 +
    lowDiversityImpact * 0.08 +
    repetitionImpact * 0.12 +
    punctuationImpact * 0.06 +
    lowVariationImpact * 0.14 +
    transitionImpact * 0.12 +
    lowFirstPersonImpact * 0.08 +
    tokenConcentrationImpact * 0.1 +
    bigramConcentrationImpact * 0.08 +
    formalPhraseImpact * 0.1;

  // Boost score for very uniform, impersonal, template-style text blocks.
  const patternBoost =
    (features.lengthVariation < 0.2 ? 15 : 0) +
    (features.firstPersonDensity < 0.004 ? 10 : 0) +
    (features.transitionDensity > 0.015 ? 10 : 0) +
    (features.formalPhraseDensity > 0.02 ? 12 : 0);

  score = weightedScore + patternBoost;

  return { localScore: Math.round(clamp100(score)), signals };
}

async function analyzeAiLikelihood(text) {
  const features = extractLocalFeatures(text);
  const { localScore, signals } = scoreFromFeatures(features);
  const externalResult = await classifyWithExternalProvider(text);

  const score = externalResult
    ? Math.round(localScore * 0.65 + externalResult.score * 0.35)
    : localScore;

  return {
    score,
    label: labelFor(score),
    signals,
    providerUsed: externalResult?.provider || "local",
  };
}

module.exports = { analyzeAiLikelihood };
