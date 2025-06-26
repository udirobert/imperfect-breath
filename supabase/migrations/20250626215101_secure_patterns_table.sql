-- Enable Row Level Security on the patterns table
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all patterns
CREATE POLICY "Allow public read access to all patterns"
  ON public.patterns
  FOR SELECT
  USING (true);

-- Allow users to create patterns
CREATE POLICY "Allow users to create their own patterns"
  ON public.patterns
  FOR INSERT
  WITH CHECK (auth.uid() = creator::uuid);

-- Allow users to update their own patterns
CREATE POLICY "Allow users to update their own patterns"
  ON public.patterns
  FOR UPDATE
  USING (auth.uid() = creator::uuid);

-- Allow users to delete their own patterns
CREATE POLICY "Allow users to delete their own patterns"
  ON public.patterns
  FOR DELETE
  USING (auth.uid() = creator::uuid);