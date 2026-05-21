-- ─────────────────────────────────────────────────────────────────────────────
-- Streaming Agentic Task Runner — Supabase Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── jobs (replaces BullMQ + Redis) ─────────────────────────────────────────
-- The worker polls this table every 2 seconds and claims pending jobs atomically
create table jobs (
  id         bigint generated always as identity primary key,
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal       text not null,
  status     text not null default 'pending',  -- pending | running | done | failed
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on jobs (status, created_at asc);

-- Atomically claim one pending job — prevents two workers grabbing the same job
create or replace function claim_next_job()
returns setof jobs
language plpgsql
as $$
begin
  return query
    update jobs
    set status = 'running', updated_at = now()
    where id = (
      select id from jobs
      where status = 'pending'
      order by created_at asc
      limit 1
      for update skip locked
    )
    returning *;
end;
$$;

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal         text not null,
  status       text not null default 'queued',  -- queued | running | done | error
  output       text,
  error        text,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ─── subtasks ────────────────────────────────────────────────────────────────
create table subtasks (
  id          text primary key,          -- "{taskId}-{subtaskId}"
  task_id     uuid not null references tasks(id) on delete cascade,
  label       text not null,
  tool        text not null,
  depends_on  int[] not null default '{}',
  status      text not null default 'pending',   -- pending | running | done | error
  summary     text,
  created_at  timestamptz not null default now()
);

-- ─── task_events ─────────────────────────────────────────────────────────────
-- Append-only log. Supabase Realtime streams inserts to the SSE route.
create table task_events (
  id         bigint generated always as identity primary key,
  task_id    uuid not null references tasks(id) on delete cascade,
  type       text not null,    -- planner:done | subtask:start | token | task:done | …
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ─── task_files ──────────────────────────────────────────────────────────────
create table task_files (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  filename   text not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index on tasks (user_id, created_at desc);
create index on subtasks (task_id);
create index on task_events (task_id, created_at asc);
create index on task_files (task_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table tasks       enable row level security;
alter table subtasks    enable row level security;
alter table task_events enable row level security;
alter table task_files  enable row level security;

-- Users can only see their own data
create policy "users see own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "users see own subtasks"
  on subtasks for select using (
    task_id in (select id from tasks where user_id = auth.uid())
  );

create policy "users see own events"
  on task_events for select using (
    task_id in (select id from tasks where user_id = auth.uid())
  );

create policy "users see own files"
  on task_files for select using (
    task_id in (select id from tasks where user_id = auth.uid())
  );

-- ─── Realtime ────────────────────────────────────────────────────────────────
-- Enable Realtime on task_events so the SSE route gets live pushes
alter publication supabase_realtime add table task_events;
