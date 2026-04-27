import { useState } from "react";
import { ResultCard } from "../components/ResultCard";
import { EvidenceList } from "../components/EvidenceList";
import { jsPDF } from "jspdf";
import {
  comparePlagiarismFiles,
  comparePlagiarismTexts,
  detectAiFile,
  detectAiText,
  detectPlagiarismFile,
  detectPlagiarismText,
} from "../services/api";

function getMatchTone(similarityValue) {
  const similarity = Number(similarityValue) || 0;
  if (similarity > 70) return "high";
  if (similarity >= 40) return "medium";
  return "low";
}

export function Home() {
  const [mode, setMode] = useState("ai");
  const [source, setSource] = useState("wikipedia");
  const [aiProvider, setAiProvider] = useState("local");
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
          ? await detectAiText(text, aiProvider)
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
          ? await detectAiFile(file, aiProvider)
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

  async function handleDownloadReport() {
    if (!result?.comparison) return;
    setError("");
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text("Plagiarism Detection Report", pageWidth / 2, 20, { align: "center" });
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: "center" });
      
      let yPos = 45;
      
      // Overall Similarity
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Overall Similarity", 20, yPos);
      yPos += 10;
      
      const overallSim = Number(result.comparison.overall_similarity || 0);
      doc.setFontSize(24);
      doc.setTextColor(overallSim > 70 ? 220 : overallSim > 40 ? 245 : 22, 38, 22);
      doc.text(`${overallSim}%`, 20, yPos);
      yPos += 15;
      
      // Similarity Metrics
      if (result.comparison.summary) {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Similarity Metrics", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(51, 65, 85);
        doc.text(`Cosine Similarity: ${result.comparison.summary.cosine || 0}%`, 25, yPos);
        yPos += 8;
        doc.text(`Jaccard Similarity: ${result.comparison.summary.jaccard || 0}%`, 25, yPos);
        yPos += 8;
        doc.text(`TF-IDF Similarity: ${result.comparison.summary.tfidf || 0}%`, 25, yPos);
        yPos += 15;
      }
      
      // Matches
      if (result.comparison.matches && result.comparison.matches.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Detected Matches", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        result.comparison.matches.slice(0, 5).forEach((match, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setTextColor(71, 85, 105);
          doc.text(`${index + 1}. Similarity: ${Math.round((match.similarity || 0) * 100)}%`, 25, yPos);
          yPos += 6;
          const snippet = (match.matchedSnippet || match.text || "").substring(0, 80);
          doc.setTextColor(100, 116, 139);
          doc.text(`   "${snippet}..."`, 25, yPos);
          yPos += 10;
        });
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Generated by AI & Plagiarism Detector", pageWidth / 2, 290, { align: "center" });
      
      // Save
      doc.save("plagiarism-report.pdf");
    } catch (err) {
      setError(err.message || "Failed to generate report");
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

      {mode === "ai" && (
        <section className="card">
          <h2>AI Detection Provider</h2>
          <div className="fileRow">
            <label>
              <input
                type="radio"
                name="aiProvider"
                value="local"
                checked={aiProvider === "local"}
                onChange={() => setAiProvider("local")}
              />
              Local Heuristic
            </label>
            <label>
              <input
                type="radio"
                name="aiProvider"
                value="gemini"
                checked={aiProvider === "gemini"}
                onChange={() => setAiProvider("gemini")}
              />
              Gemini
            </label>
            <label>
              <input
                type="radio"
                name="aiProvider"
                value="chatgpt"
                checked={aiProvider === "chatgpt"}
                onChange={() => setAiProvider("chatgpt")}
              />
              ChatGPT
            </label>
          </div>
        </section>
      )}

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
                metrics={result.comparison.summary}
              />
              <div className="card">
                <h3>Comparison Summary</h3>
                <p>{result.comparison.verdict || "Sentence-level plagiarism report."}</p>
                {result.comparison.summary && (
                  <div className="metricsList">
                    <p>Cosine Similarity: {result.comparison.summary.cosine}%</p>
                    <p>Jaccard Similarity: {result.comparison.summary.jaccard}%</p>
                    <p>TF-IDF Similarity: {result.comparison.summary.tfidf}%</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {result.comparison && (
            <section className="card">
              <h3>Overall Similarity: {Number(result.comparison.overall_similarity || 0)}%</h3>
              <p className="small">
                Sentence-wise matches: red (&gt;70%), yellow (40-70%), green (&lt;40%).
              </p>
              <div className="row reportRow">
                <span className="small">Download this analysis as a PDF report.</span>
                <button type="button" onClick={handleDownloadReport}>
                  Download Report
                </button>
              </div>
              <div className="sentenceMatches">
                {(result.comparison.matches || []).length === 0 ? (
                  <p className="small">No sentence matches above threshold.</p>
                ) : (
                  result.comparison.matches.map((item, index) => {
                    const similarity = Number(item.similarity) || 0;
                    const tone = getMatchTone(similarity);
                    return (
                      <div key={`${item.sentence}-${index}`} className={`matchCard ${tone}`}>
                        <p className="matchSentence">{item.sentence}</p>
                        <strong className="matchPercent">{similarity.toFixed(2)}% match</strong>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
