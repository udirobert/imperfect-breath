-- Add missing RLS policies
-- The users table has SELECT and UPDATE policies but is missing INSERT and DELETE

-- Users can insert their own profile (required for new user registration)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (auth.uid()::text = id::text);

-- Breathing sessions: add UPDATE and DELETE policies
CREATE POLICY "Users can update own sessions" ON breathing_sessions
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions" ON breathing_sessions
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Pattern ratings: add INSERT, UPDATE, DELETE if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pattern_ratings' AND policyname = 'Users can rate patterns'
  ) THEN
    CREATE POLICY "Users can rate patterns" ON pattern_ratings
      FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;
END $$;
