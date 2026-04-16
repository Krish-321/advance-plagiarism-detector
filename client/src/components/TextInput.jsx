import { useState } from "react";

export function TextInput({ onAnalyze, loading }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onAnalyze(value);
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Enter Text</h2>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Paste essay, article, or report text here..."
        rows={12}
      />
      <div className="row">
        <span className="small">Minimum 30 characters</span>
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
