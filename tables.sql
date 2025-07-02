-- ╔════════════════════════════════════════════════════════════════╗
-- ║  YUP.RSVP  –  CORE SCHEMA  (Supabase Auth-backed)  2025-06-01 ║
-- ╚════════════════════════════════════════════════════════════════╝
-- Prereqs: you already enabled Email/Password and Google in
--          Supabase → Auth → Providers.

--------------------------------------------------
-- 0.  Extensions
--------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--------------------------------------------------
-- 1.  USERS  (profile table, 1-to-1 with auth.users)
--------------------------------------------------
create table if not exists public.users (
  id                     uuid primary key default auth.uid()
        references auth.users(id) on delete cascade,

  -- Optional profile fields
  username               text unique,
  display_name           text not null default '',
  email                  text unique,                       -- handy index
  phone_number           text,

  -- Password reset helpers (used only if you roll your own email flow)
  reset_token            text,
  reset_token_expiry     timestamptz,

  profile_image_url      text,

  -- Role / plan flags
  is_admin               boolean not null default false,
  is_pro                 boolean not null default false,
  is_premium             boolean not null default false,

  -- Branding / billing
  brand_theme            text default '{}',
  logo_url               text,
  stripe_customer_id     text,
  stripe_subscription_id text,

  -- Social links
  linkedin_id            text,
  linkedin_access_token  text,
  linkedin_profile_url   text,
  linkedin_connections   text
);

--------------------------------------------------
-- 2.  EVENTS
--------------------------------------------------
create table if not exists public.events (
  id                     bigserial primary key,
  image_url              text,
  title                  text not null,
  date                   text not null,
  start_time             text not null,
  end_time               text not null,
  location               text not null,
  address                text,
  description            text,
  host_id                uuid not null
                              references public.users(id) on delete cascade,
  status                 text not null default 'open',
  created_at             timestamptz not null default now(),
  slug                   text not null unique,

  -- RSVP settings
  allow_guest_rsvp       boolean not null default true,
  allow_plus_one         boolean not null default true,
  max_guests_per_rsvp    integer not null default 1,
  capacity               integer,
  use_custom_rsvp_text   boolean not null default false,
  custom_yup_text        text,
  custom_nope_text       text,
  custom_maybe_text      text,
  rsvp_visibility        text not null default 'public',
  waitlist_enabled       boolean not null default false
);

--------------------------------------------------
-- 3.  INVITATIONS
--------------------------------------------------
create table if not exists public.invitations (
  id         bigserial primary key,
  event_id   bigint not null references public.events(id) on delete cascade,
  user_id    uuid   not null references public.users(id),
  status     text   not null default 'pending',
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

--------------------------------------------------
-- 4.  RESPONSES
--------------------------------------------------
create table if not exists public.responses (
  id            bigserial primary key,
  event_id      bigint not null references public.events(id) on delete cascade,
  user_id       uuid   references public.users(id),
  response_type text   not null check (response_type in ('yup','nope','maybe')),
  created_at    timestamptz not null default now(),
  is_guest      boolean default false,
  guest_name    text,
  guest_email   text,
  guest_count   integer default 0
);

-- Add indexes for fast look-ups
create index if not exists idx_responses_event  on public.responses(event_id);
create index if not exists idx_responses_user   on public.responses(user_id);

--------------------------------------------------
-- 5.  Row-Level Security
--------------------------------------------------
alter table public.users       enable row level security;
alter table public.events      enable row level security;
alter table public.invitations enable row level security;
alter table public.responses   enable row level security;

-- USERS: owner can read/write their own row
create policy "Users: owner access"
  on public.users for all
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- EVENTS: anyone logged-in can read; only host can modify
create policy "Events: read"
  on public.events for select using ( true );

-- Host can insert events (host_id set to auth.uid())
create policy "Events: host insert"
  on public.events for insert
  with check ( host_id = auth.uid() );

-- Host can update their events
create policy "Events: host update"
  on public.events for update
  using  ( host_id = auth.uid() )
  with check ( host_id = auth.uid() );

-- Host can delete their events
create policy "Events: host delete"
  on public.events for delete
  using  ( host_id = auth.uid() );

-- RESPONSES: public read; author (or guest) writes
create policy "Responses: read"
  on public.responses for select using ( true );

create policy "Responses: write-own-insert"
  on public.responses for insert
  with check ( user_id = auth.uid() or is_guest );

create policy "Responses: write-own-update"
  on public.responses for update
  using  ( user_id = auth.uid() or is_guest )
  with check ( user_id = auth.uid() or is_guest );

create policy "Responses: write-own-delete"
  on public.responses for delete
  using  ( user_id = auth.uid() or is_guest );

-- INVITATIONS: host or invitee can read; host manages
create policy "Invitations: read"
  on public.invitations for select
  using ( user_id = auth.uid()
          or exists (select 1 from public.events e
                     where e.id = event_id and e.host_id = auth.uid()) );

-- Host inserts invitation
create policy "Invitations: host insert"
  on public.invitations for insert
  with check ( exists (select 1 from public.events e
                       where e.id = event_id and e.host_id = auth.uid()) );

-- Host updates invitation
create policy "Invitations: host update"
  on public.invitations for update
  using  ( exists (select 1 from public.events e
                   where e.id = event_id and e.host_id = auth.uid()) )
  with check ( exists (select 1 from public.events e
                       where e.id = event_id and e.host_id = auth.uid()) );

-- Host deletes invitation
create policy "Invitations: host delete"
  on public.invitations for delete
  using  ( exists (select 1 from public.events e
                   where e.id = event_id and e.host_id = auth.uid()) );

--------------------------------------------------
-- 6.  Grants
--------------------------------------------------
grant all on all tables    in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

--------------------------------------------------
-- 7.  (Optional) Seed — remove in production
--------------------------------------------------
/*
insert into public.users (id, username, display_name)
values
  (auth.uid(), 'demo', 'Demo User')
on conflict do nothing;
*/