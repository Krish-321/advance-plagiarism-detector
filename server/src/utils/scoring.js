function riskSummary(plagiarismScore, aiScore) {
  if (plagiarismScore >= 70) {
    return "High plagiarism risk: content has strong overlap with known references.";
  }
  if (plagiarismScore >= 40 || aiScore >= 70) {
    return "Moderate risk: review highlighted sections before final submission.";
  }
  return "Low risk: limited overlap and lower AI-generation likelihood signals.";
}

module.exports = { riskSummary };
