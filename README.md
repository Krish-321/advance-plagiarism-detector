# Plagiarism + AI Text Detector (MERN)

This project is a full-stack MERN application that analyzes text and returns:

- Plagiarism risk score with matching evidence snippets
- AI-generated likelihood score with explainable feature signals

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (optional for local start)

## Quick Start

1. Install dependencies:
   - `npm install --prefix client`
   - `npm install --prefix server`
2. Configure environment:
   - Copy `client/.env.example` to `client/.env`
   - Copy `server/.env.example` to `server/.env`
3. Run backend:
   - `npm run server:dev`
4. Run frontend:
   - `npm run client:dev`

## API

- `POST /api/analyze`
  - Request: `{ "text": "..." }`
  - Response includes:
    - `plagiarism` -> score, label, matches
    - `aiLikelihood` -> score, label, signals
    - `overall` -> risk summary

## How Detection Works

### Plagiarism detection

- Splits input into sentence chunks.
- Compares chunks against a reference corpus using token-overlap similarity.
- Aggregates similarity into a final risk score.

### AI-generated text detection

- Extracts local writing features (burstiness, lexical diversity, repetition, punctuation density).
- Computes a weighted local score.
- Optionally blends with an external provider score if enabled in env.

## Tests

- Backend test: `npm run server:test`
- Frontend test: `npm run client:test`

## Calibration

Use `server/data/calibration-samples.json` to tune thresholds and expand labeled examples.
