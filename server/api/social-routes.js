const express = require("express");
const router = express.Router();

// Mock data for social feed
const mockFeed = [
  {
    id: "1",
    content: "Just completed a great breathing session!",
    author: {
      address: "0x1234...5678",
      username: "zenmaster",
      name: "Zen Master",
      avatar: "https://i.pravatar.cc/150?u=zenmaster",
    },
    stats: {
      reactions: 10,
      comments: 2,
      mirrors: 1,
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    content: "Feeling so relaxed after my evening wind-down.",
    author: {
      address: "0xabcd...efgh",
      username: "breather",
      name: "Deep Breather",
      avatar: "https://i.pravatar.cc/150?u=breather",
    },
    stats: {
      reactions: 5,
      comments: 0,
      mirrors: 0,
    },
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
];

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

router.post("/timeline", (req, res) => {
  res.json({ items: mockFeed });
});

router.get("/patterns/trending", (req, res) => {
  res.json(mockTrending);
});

router.post("/react", (req, res) => {
  res.json({ success: true });
});

router.post("/follow", (req, res) => {
  res.json({ success: true });
});

router.post("/share", (req, res) => {
  res.json({
    success: true,
    postHash: `0x${[...Array(64)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("")}`,
  });
});

module.exports = router;
