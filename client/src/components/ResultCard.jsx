export function ResultCard({ title, score, label, metrics }) {
  const tone = score >= 60 ? "high" : score >= 35 ? "medium" : "low";

  return (
    <div className={`card result-card ${tone}`}>
      <h3>{title}</h3>
      <div className="score">{score}%</div>
      <p className="label">{label}</p>
      {metrics && (
        <div className="metrics-detail">
          <div className="metric-item">
            <span className="metric-label">Cosine:</span>
            <span className="metric-value">{metrics.cosine || 0}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Jaccard:</span>
            <span className="metric-value">{metrics.jaccard || 0}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">TF-IDF:</span>
            <span className="metric-value">{metrics.tfidf || 0}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
