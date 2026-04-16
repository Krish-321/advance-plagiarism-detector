export function EvidenceList({ title, items, type }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {items?.length ? (
        <ul className="evidence-list">
          {items.map((item, index) => (
            <li key={`${type}-${index}`}>
              {type === "matches" ? (
                <>
                  <strong>{item.source}</strong>
                  <p>{item.matchedSnippet}</p>
                  <small>Similarity: {(item.similarity * 100).toFixed(1)}%</small>
                </>
              ) : (
                <>
                  <strong>{item.featureName}</strong>
                  <small>
                    Value: {Number(item.value).toFixed(3)} | Impact:{" "}
                    {Number(item.impact).toFixed(1)}
                  </small>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="small">No evidence found for this section.</p>
      )}
    </div>
  );
}
