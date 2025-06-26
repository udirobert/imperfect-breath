
-- Create a table for user sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  breath_hold_time INT NOT NULL,
  restlessness_score INT NOT NULL,
  session_duration INT NOT NULL,
  pattern_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comment on the columns for clarity
COMMENT ON COLUMN public.sessions.breath_hold_time IS 'Max breath hold time in seconds';
COMMENT ON COLUMN public.sessions.restlessness_score IS 'Restlessness score from 0-100';
COMMENT ON COLUMN public.sessions.session_duration IS 'Total duration of the session in seconds';
COMMENT ON COLUMN public.sessions.pattern_name IS 'Name of the breathing pattern used';

-- Add Row Level Security (RLS) to the sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a policy that allows users to create their own sessions
CREATE POLICY "Users can create their own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON public.sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a policy that allows users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON public.sessions
  FOR DELETE
  USING (auth.uid() = user_id);
