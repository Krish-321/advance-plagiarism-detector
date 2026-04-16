const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { analyzeRouter } = require("./routes/analyze.routes");
const { aiRouter } = require("./routes/ai.routes");
const { plagiarismRouter } = require("./routes/plagiarism.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "200kb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 20,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/analyze", analyzeRouter);
app.use("/api/ai", aiRouter);
app.use("/api/plagiarism", plagiarismRouter);

module.exports = { app };
