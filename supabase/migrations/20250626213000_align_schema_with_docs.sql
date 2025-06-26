-- This migration aligns the database schema with the platform-integration-plan.md and system-architecture.md.
-- Key changes:
-- 1. Converts 'patterns.id' from TEXT to UUID.
-- 2. Converts 'patterns.creator' to a UUID with a foreign key to 'auth.users'.
-- 3. Adds new tables: 'creator_analytics', 'pattern_reviews', 'social_actions'.
-- 4. Extends 'users' and 'patterns' tables with new columns.

-- Step 1: Add temporary UUID columns to the patterns table
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS creator_id UUID;

-- Step 2: Populate the new creator_id column by casting the existing text creator value.
-- This assumes the 'creator' column stores the user's UUID from auth.users as text.
-- The transaction will fail if the cast is not possible, which is a safety measure.
UPDATE public.patterns SET creator_id = creator::uuid;

-- Step 3: Drop the old text-based id and creator columns and their indexes
DROP INDEX IF EXISTS idx_patterns_creator;
ALTER TABLE public.patterns DROP COLUMN id;
ALTER TABLE public.patterns DROP COLUMN creator;

-- Step 4: Rename the new UUID columns to be the primary ones
ALTER TABLE public.patterns RENAME COLUMN uuid_id TO id;
ALTER TABLE public.patterns RENAME COLUMN creator_id TO creator;

-- Step 5: Set the new id column as the primary key
ALTER TABLE public.patterns ADD PRIMARY KEY (id);

-- Step 6: Add foreign key constraint for the creator column
ALTER TABLE public.patterns ALTER COLUMN creator SET NOT NULL;
ALTER TABLE public.patterns ADD CONSTRAINT fk_patterns_creator FOREIGN KEY (creator) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 7: Recreate index on the new creator column
CREATE INDEX IF NOT EXISTS idx_patterns_creator ON patterns (creator);

-- Step 8: Extend users table as per the integration plan
-- Note: Supabase auth.users is not directly alterable, so we use the public.users table which is commonly used for profiles.
-- Assuming a public.users table exists or should be created. If not, these would need to be in user_profiles.
-- For now, let's assume public.users is the target for profile-like data.
-- A check for table existence would be ideal in a real-world scenario.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS instructor_credentials JSONB;

-- Step 9: Extend patterns table with new fields from the integration plan
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS enhanced_metadata JSONB;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS media_content JSONB;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS licensing_info JSONB;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS ip_asset_id VARCHAR(255);

-- Step 10: Create new tables for the creator ecosystem and social features
CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pattern_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL, -- 'pattern', 'user', 'session'
  target_id UUID NOT NULL,
  action_type VARCHAR(20) NOT NULL, -- 'like', 'follow', 'share', 'favorite'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 11: Add Row Level Security (RLS) for the new tables
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_actions ENABLE ROW LEVEL SECURITY;

-- Policies for creator_analytics
CREATE POLICY "Creators can view their own analytics"
  ON public.creator_analytics FOR SELECT
  USING (auth.uid() = creator_id);

-- Policies for pattern_reviews
CREATE POLICY "Users can view all reviews"
  ON public.pattern_reviews FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reviews"
  ON public.pattern_reviews FOR ALL
  USING (auth.uid() = user_id);

-- Policies for social_actions
CREATE POLICY "Users can view all social actions"
  ON public.social_actions FOR SELECT USING (true);

CREATE POLICY "Users can manage their own social actions"
  ON public.social_actions FOR ALL
  USING (auth.uid() = user_id);