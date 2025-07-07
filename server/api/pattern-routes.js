const express = require("express");
const router = express.Router();

// Mock data for trending patterns
const mockTrending = [
  {
    name: "Box Breathing",
    usageCount: 120,
    avgScore: 92,
    trend: "up",
  },
  {
    name: "4-7-8 Relaxation",
    usageCount: 95,
    avgScore: 95,
    trend: "stable",
  },
  {
    name: "Wim Hof Method",
    usageCount: 80,
    avgScore: 88,
    trend: "down",
  },
];

router.get("/trending", (req, res) => {
  res.json(mockTrending);
});

module.exports = router;
