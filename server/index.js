import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import aiAnalysisHandler from "./api/ai-analysis.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:8080",
      "http://localhost:3000",
      "http://localhost:4556",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// AI Analysis API endpoint
app.post("/api/ai-analysis", (req, res) => {
  // Skip authentication for local development
  if (!process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY === "your_google_ai_api_key_here") {
    console.warn("WARNING: AI API keys not properly set. Using fallback response for local development.");
    return res.status(200).json({
      success: true,
      provider: req.body.provider || "google",
      analysisType: req.body.analysisType || "session",
      result: {
        overallScore: 75,
        suggestions: [
          "Continue practicing regularly",
          "Focus on consistency",
          "Try longer sessions",
        ],
        nextSteps: [
          "Practice daily",
          "Explore new patterns",
          "Track your progress",
        ],
        encouragement: "Great session! Keep up the good work with your breathing practice."
      },
    });
  }
  
  // Use the actual AI analysis handler
  return aiAnalysisHandler(req, res);
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../dist");
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Analysis API: http://localhost:${PORT}/api/ai-analysis`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Remove the export since we're not importing this file elsewhere
// export default app;

export default app;
