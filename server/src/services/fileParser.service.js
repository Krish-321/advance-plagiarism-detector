const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

async function parseFileToText(file) {
  if (!file) return "";
  const mime = file.mimetype || "";

  if (mime.includes("text/plain")) {
    return file.buffer.toString("utf8");
  }

  if (
    mime.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }

  if (mime.includes("application/pdf")) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text || "";
  }

  throw new Error("Unsupported file type. Please upload TXT, PDF, or DOCX.");
}

module.exports = { parseFileToText };
