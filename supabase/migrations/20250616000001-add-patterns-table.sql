/*
  This migration adds a 'patterns' table to store custom breathing patterns.
*/

-- Create the patterns table
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  phases JSONB NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  duration INTEGER NOT NULL,
  creator TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patterns_creator ON patterns (creator);
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns (category);
CREATE INDEX IF NOT EXISTS idx_patterns_difficulty ON patterns (difficulty);
