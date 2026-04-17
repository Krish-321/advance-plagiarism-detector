const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://advance-plagiarism-detector.onrender.com/api";

export async function analyzeText(text) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to analyze text");
  }

  return data;
}

async function parseResponse(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

export async function detectAiText(text) {
  const response = await fetch(`${API_BASE_URL}/ai/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseResponse(response, "Failed to detect AI from text");
}

export async function detectAiFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/ai/file`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response, "Failed to detect AI from file");
}

export async function detectPlagiarismText(text, source) {
  const response = await fetch(`${API_BASE_URL}/plagiarism/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source }),
  });
  return parseResponse(response, "Failed to detect plagiarism from text");
}

export async function detectPlagiarismFile(file, source) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source", source);
  const response = await fetch(`${API_BASE_URL}/plagiarism/file`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response, "Failed to detect plagiarism from file");
}

export async function comparePlagiarismFiles(originalFile, suspectFile) {
  const formData = new FormData();
  formData.append("original", originalFile);
  formData.append("suspect", suspectFile);
  const response = await fetch(`${API_BASE_URL}/plagiarism/compare-files`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response, "Failed to compare uploaded files");
}

export async function comparePlagiarismTexts(originalText, suspectText) {
  const response = await fetch(`${API_BASE_URL}/plagiarism/compare-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalText, suspectText }),
  });
  return parseResponse(response, "Failed to compare text documents");
}

export async function analyzeFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/analyze/file`, {
    method: "POST",
    body: formData,
  });
  return parseResponse(response, "Failed to analyze file");
}

export async function getHistory() {
  const response = await fetch(`${API_BASE_URL}/analyze/history`);
  return parseResponse(response, "Failed to fetch history");
}

export function getReportDownloadUrl(id) {
  return `${API_BASE_URL}/analyze/report/${id}`;
}
