# Voice Agent Analytics UI

**Live Url:** https://wfg-voice-agent-analytics.refind.studio/

# Tech Stack

- Vite with React (Typescript)
- Tailwind CSS
- Shadcn ui (Base UI)
- Clouflare workers for deployment
- Zustand
- Recharts


## Supabase Postgres Schema
```sql
CREATE TABLE IF NOT EXISTS voice_agent_analytics (
  user_email TEXT PRIMARY KEY,
  call_duration_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  sad_path_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_format CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT call_duration_is_array CHECK (jsonb_typeof(call_duration_data) = 'array'),
  CONSTRAINT sad_path_is_array CHECK (jsonb_typeof(sad_path_data) = 'array')
);
```

## Supabase RLS Policy
```sql
-- Enable RLS
alter table public.voice_agent_analytics enable row level security;

-- Read
create policy voice_agent_analytics_select
  on public.voice_agent_analytics
  for select
  to anon
  using (true);

-- Insert
create policy voice_agent_analytics_insert
  on public.voice_agent_analytics
  for insert
  to anon
  with check (true);

-- Update
create policy voice_agent_analytics_update
  on public.voice_agent_analytics
  for update
  to anon
  using (true)
  with check (true);
```
