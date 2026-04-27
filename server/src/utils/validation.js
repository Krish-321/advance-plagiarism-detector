/**
 * Shared validation utilities for text input
 */

function validateText(text) {
  if (!text || typeof text !== "string") {
    return "text is required and must be a string";
  }
  if (text.length < 30) {
    return "text must be at least 30 characters";
  }
  if (text.length > 15000) {
    return "text must be 15000 characters or less";
  }
  return "";
}

function validateTextWithLimit(text, maxLength = 15000, minLength = 30) {
  if (!text || typeof text !== "string") {
    return "text is required and must be a string";
  }
  if (text.length < minLength) {
    return `text must be at least ${minLength} characters`;
  }
  if (text.length > maxLength) {
    return `text must be ${maxLength} characters or less`;
  }
  return "";
}

module.exports = {
  validateText,
  validateTextWithLimit,
};