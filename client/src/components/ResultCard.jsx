import Highlighter from "react-highlight-words";

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

export function HighlightedText({ text, matches = [] }) {
  const searchWords = matches.map((m) => m.source || m.sentence || "").filter(Boolean);
  
  if (!searchWords.length) return <p>{text}</p>;
  
  return (
    <Highlighter
      highlightClassName="bg-yellow-300 px-1 rounded"
      searchWords={searchWords}
      textToHighlight={text}
    />
  );
}

export function SourceLinks({ results = [] }) {
  if (!results.length) return null;
  
  return (
    <div className="source-links mt-4">
      <h4 className="font-semibold mb-2">Matched Sources</h4>
      {results.map((item, index) => (
        <div key={index} className="p-4 border rounded mb-3 bg-white">
          <p className="font-semibold text-gray-800">{item.sentence}</p>
          {item.matches && item.matches.map((m, i) => (
            <div key={i} className="text-sm text-gray-600 mt-2">
              <span className="inline-block bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-medium mr-2">
                {m.score}% match
              </span>
              <a 
                href={m.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {m.link?.substring(0, 60)}...
              </a>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SideBySideComparison({ inputText, selectedMatch }) {
  if (!inputText) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="p-4 border rounded bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">Your Text</h3>
        <p className="text-gray-600 whitespace-pre-wrap">{inputText}</p>
      </div>
      
      <div className="p-4 border rounded bg-white shadow-sm">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">Matched Source</h3>
        {selectedMatch ? (
          <div>
            <p className="text-gray-600 whitespace-pre-wrap">{selectedMatch.snippet || selectedMatch}</p>
            {selectedMatch.link && (
              <a 
                href={selectedMatch.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-2 block"
              >
                {selectedMatch.link}
              </a>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic">Select a match to view details</p>
        )}
      </div>
    </div>
  );
}
