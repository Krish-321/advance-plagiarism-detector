import { useState } from "react";
import { ResultCard } from "../components/ResultCard";
import { EvidenceList } from "../components/EvidenceList";
import {
  comparePlagiarismFiles,
  comparePlagiarismTexts,
  detectAiFile,
  detectAiText,
  detectPlagiarismFile,
  detectPlagiarismText,
} from "../services/api";

export function Home() {
  const [mode, setMode] = useState("ai");
  const [source, setSource] = useState("wikipedia");
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [suspectFile, setSuspectFile] = useState(null);
  const [originalText, setOriginalText] = useState("");
  const [suspectText, setSuspectText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleRunText(event) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data =
        mode === "ai"
          ? await detectAiText(text)
          : await detectPlagiarismText(text, source);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunFile() {
    if (!file) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data =
        mode === "ai"
          ? await detectAiFile(file)
          : await detectPlagiarismFile(file, source);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompareFiles() {
    if (!originalFile || !suspectFile) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await comparePlagiarismFiles(originalFile, suspectFile);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompareTexts() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await comparePlagiarismTexts(originalText, suspectText);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <section className="hero">
        <h1>AI & Plagiarism Detector</h1>
        <p className="subtitle">
          Run separate checks: AI detection or plagiarism detection.
        </p>
      </section>

      <section className="card modeTabs">
        <button
          type="button"
          className={mode === "ai" ? "tab active" : "tab"}
          onClick={() => setMode("ai")}
        >
          AI Detection
        </button>
        <button
          type="button"
          className={mode === "plagiarism" ? "tab active" : "tab"}
          onClick={() => setMode("plagiarism")}
        >
          Plagiarism Detection
        </button>
      </section>

      {mode === "plagiarism" && (
        <section className="card">
          <h2>Plagiarism Source Option</h2>
          <div className="fileRow">
            <label>
              <input
                type="radio"
                name="source"
                value="wikipedia"
                checked={source === "wikipedia"}
                onChange={() => setSource("wikipedia")}
              />
              Wikipedia
            </label>
            <label>
              <input
                type="radio"
                name="source"
                value="google"
                checked={source === "google"}
                onChange={() => setSource("google")}
              />
              Google
            </label>
          </div>
        </section>
      )}

      <section className="card">
        <h2>{mode === "ai" ? "Check AI from Text" : "Check Plagiarism from Text"}</h2>
        <form onSubmit={handleRunText}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste your text here..."
            rows={10}
          />
          <div className="row">
            <span className="small">Minimum 30 characters</span>
            <button type="submit" disabled={loading}>
              {loading ? "Checking..." : "Run Text Check"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>{mode === "ai" ? "Check AI from File" : "Check Plagiarism from File"}</h2>
        <div className="fileRow">
          <input
            type="file"
            accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <button type="button" onClick={handleRunFile} disabled={loading || !file}>
            Run File Check
          </button>
        </div>
      </section>

      {mode === "plagiarism" && (
        <section className="card">
          <h2>Compare Original vs Suspect Text</h2>
          <div className="grid">
            <div>
              <p className="small">Original Text</p>
              <textarea
                className="compareTextarea"
                rows={7}
                value={originalText}
                onChange={(event) => setOriginalText(event.target.value)}
                placeholder="Paste original text..."
              />
            </div>
            <div>
              <p className="small">Suspect/Copied-like Text</p>
              <textarea
                className="compareTextarea"
                rows={7}
                value={suspectText}
                onChange={(event) => setSuspectText(event.target.value)}
                placeholder="Paste suspect text..."
              />
            </div>
          </div>
          <div className="row">
            <span className="small">Calculates Cosine, Jaccard, and TF-IDF similarities.</span>
            <button
              type="button"
              onClick={handleCompareTexts}
              disabled={loading || !originalText || !suspectText}
            >
              Compare Texts
            </button>
          </div>
        </section>
      )}

      {mode === "plagiarism" && (
        <section className="card">
          <h2>Compare Original vs Suspect Documents</h2>
          <div className="grid">
            <div>
              <p className="small">Upload Original Document</p>
              <input
                type="file"
                accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setOriginalFile(event.target.files?.[0] || null)}
              />
            </div>
            <div>
              <p className="small">Upload Copied-like/Suspect Document</p>
              <input
                type="file"
                accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setSuspectFile(event.target.files?.[0] || null)}
              />
            </div>
          </div>
          <div className="row">
            <span className="small">Checks overlap between two uploaded documents.</span>
            <button
              type="button"
              onClick={handleCompareFiles}
              disabled={loading || !originalFile || !suspectFile}
            >
              Compare Documents
            </button>
          </div>
        </section>
      )}

      {error && <p className="error">{error}</p>}

      {result && (
        <>
          {result.aiLikelihood && (
            <>
              <section className="grid">
                <ResultCard
                  title="AI-Generated Likelihood"
                  score={result.aiLikelihood.score}
                  label={result.aiLikelihood.label}
                />
              </section>
              <section className="grid">
                <EvidenceList
                  title="AI Detection Signals"
                  type="signals"
                  items={result.aiLikelihood.signals}
                />
              </section>
            </>
          )}

          {result.plagiarism && (
            <>
              <section className="grid">
                <ResultCard
                  title={`Plagiarism Risk (${result.plagiarism.source || source})`}
                  score={result.plagiarism.score}
                  label={result.plagiarism.label}
                />
              </section>
              <section className="grid">
                <EvidenceList
                  title="Potential Copied Evidence"
                  type="matches"
                  items={result.plagiarism.matches}
                />
              </section>
            </>
          )}

          {result.comparison && (
            <section className="grid">
              <ResultCard
                title="Document vs Document Similarity"
                score={result.comparison.score}
                label={result.comparison.label}
              />
              <div className="card">
                <h3>Comparison Summary</h3>
                <p>{result.comparison.summary}</p>
                {result.comparison.metrics && (
                  <div className="metricsList">
                    <p>Cosine Similarity: {result.comparison.metrics.cosine}%</p>
                    <p>Jaccard Similarity: {result.comparison.metrics.jaccard}%</p>
                    <p>TF-IDF Similarity: {result.comparison.metrics.tfidf}%</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
