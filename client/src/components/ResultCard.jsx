export function ResultCard({ title, score, label }) {
  const tone = score >= 60 ? "high" : score >= 35 ? "medium" : "low";

  return (
    <div className={`card result-card ${tone}`}>
      <h3>{title}</h3>
      <div className="score">{score}%</div>
      <p className="label">{label}</p>
    </div>
  );
}
