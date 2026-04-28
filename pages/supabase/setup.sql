-- Run this in Supabase SQL Editor to set up your database
-- Go to: SQL Editor → New Query → paste this → Run

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insights table
CREATE TABLE insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_insights_user_id ON insights(user_id);

-- Enable Row Level Security (so users only see their own data)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Security policies
CREATE POLICY "Users see own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users see own insights"
  ON insights FOR ALL
  USING (auth.uid() = user_id);

-- ─── Job Fairs ───────────────────────────────────────────────────────────────

CREATE TABLE job_fairs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT        NOT NULL,
  description   TEXT,
  location_name TEXT        NOT NULL,
  address       TEXT,
  latitude      NUMERIC(10, 7) NOT NULL,
  longitude     NUMERIC(10, 7) NOT NULL,
  event_date    TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  organizer     TEXT,
  website       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_fairs_event_date ON job_fairs(event_date);

-- Job fairs are public events — anyone authenticated can read them
ALTER TABLE job_fairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job fairs are publicly readable"
  ON job_fairs FOR SELECT
  USING (true);

-- ─── Seed data (sample job fairs for testing) ────────────────────────────────
-- Remove or replace with real data before going live.

INSERT INTO job_fairs (title, description, location_name, address, latitude, longitude, event_date, organizer, website) VALUES
  (
    'Tech Careers Expo 2026',
    'Meet top tech companies hiring software engineers, data scientists, and designers. 200+ employers.',
    'Moscone Center',
    '747 Howard St, San Francisco, CA 94103',
    37.7845, -122.4000,
    NOW() + INTERVAL '12 days',
    'TechHire SF',
    'https://example.com/tech-careers-expo'
  ),
  (
    'National Jobs Fair — NYC',
    'All industries welcome. Hundreds of open roles across finance, tech, healthcare, and more.',
    'Jacob K. Javits Convention Center',
    '429 11th Ave, New York, NY 10001',
    40.7574, -74.0021,
    NOW() + INTERVAL '18 days',
    'NationalHire',
    'https://example.com/nyc-jobs-fair'
  ),
  (
    'Healthcare Careers Day',
    'Connect with hospitals, clinics, and health-tech startups actively hiring.',
    'Chicago Marriott Downtown',
    '540 N Michigan Ave, Chicago, IL 60611',
    41.8916, -87.6247,
    NOW() + INTERVAL '25 days',
    'HealthJobs USA',
    NULL
  );
