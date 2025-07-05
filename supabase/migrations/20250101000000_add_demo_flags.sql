-- Add demo flags to distinguish real vs demo content
-- This migration adds is_demo boolean flags to users and breathing_patterns tables

-- Add is_demo flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Add is_demo flag to breathing_patterns table  
ALTER TABLE breathing_patterns ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Add is_demo flag to breathing_sessions table
ALTER TABLE breathing_sessions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_is_demo ON users(is_demo);
CREATE INDEX IF NOT EXISTS idx_patterns_is_demo ON breathing_patterns(is_demo);
CREATE INDEX IF NOT EXISTS idx_sessions_is_demo ON breathing_sessions(is_demo);

-- Update existing demo data (if any exists)
-- This will need to be customized based on your existing data
UPDATE users SET is_demo = TRUE WHERE email LIKE '%demo%' OR email LIKE '%test%';
UPDATE breathing_patterns SET is_demo = TRUE WHERE creator_id IN (
  SELECT id FROM users WHERE is_demo = TRUE
);

-- Add comments for documentation
COMMENT ON COLUMN users.is_demo IS 'Flag to identify demo/test users vs real users';
COMMENT ON COLUMN breathing_patterns.is_demo IS 'Flag to identify demo patterns vs real user-created patterns';
COMMENT ON COLUMN breathing_sessions.is_demo IS 'Flag to identify demo sessions vs real user sessions';
