-- ============================================================
-- RHYTHM CONTROL — Schema inicial de Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";


-- ── TABLA: releases ──────────────────────────────────────────
-- Fuente: Discogs Marketplace. SKU Shopify = discogs_listing_id
create table if not exists releases (
  id                   uuid primary key default gen_random_uuid(),
  discogs_listing_id   bigint unique not null,
  discogs_release_id   bigint not null,
  title                text not null,
  artists              text[] not null default '{}',
  labels               text[] not null default '{}',
  catno                text not null default '',
  genres               text[] not null default '{}',
  styles               text[] not null default '{}',
  format               text not null default '',
  year                 integer,
  country              text not null default '',
  condition            text not null,
  sleeve_condition     text not null default '',
  price                numeric(10,2) not null,
  currency             text not null default 'EUR',
  cover_image          text not null default '',
  thumb                text not null default '',
  -- Datos extendidos (Supabase)
  bpm                  integer,
  key                  text,
  key_camelot          text,
  spotify_id           text,
  spotify_preview_url  text,
  youtube_id           text,
  comments             text,
  -- Shopify
  shopify_product_id   text,
  shopify_variant_id   text,
  -- Estado
  status               text not null default 'active'
                         check (status in ('active', 'sold', 'reserved', 'hidden')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);


-- ── TABLA: events ────────────────────────────────────────────
create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  venue        text not null,
  city         text not null,
  country      text not null default 'ES',
  date         date not null,
  start_time   time not null,
  end_time     time,
  type         text not null default 'dj_set'
                 check (type in ('dj_set', 'live', 'release_party', 'in_store', 'other')),
  flyer_url    text,
  ticket_url   text,
  lineup       text[] not null default '{}',
  description  text,
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now()
);


-- ── TABLA: labels ────────────────────────────────────────────
create table if not exists labels (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text unique not null,
  logo_url          text,
  description       text,
  discogs_label_id  bigint,
  bandcamp_url      text,
  instagram_url     text,
  is_own_label      boolean not null default false,
  created_at        timestamptz not null default now()
);


-- ── TABLA: profiles ──────────────────────────────────────────
-- Extiende auth.users de Supabase
create table if not exists profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  username          text unique,
  avatar_url        text,
  city              text,
  country           text,
  discogs_username  text,
  instagram_handle  text,
  created_at        timestamptz not null default now()
);


-- ── TABLA: wantlist ──────────────────────────────────────────
create table if not exists wantlist (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(id) on delete cascade,
  discogs_release_id   bigint not null,
  title                text not null,
  artists              text[] not null default '{}',
  cover_image          text not null default '',
  added_at             timestamptz not null default now(),
  notified             boolean not null default false,
  unique (user_id, discogs_release_id)
);


-- ── TABLA: track_requests ────────────────────────────────────
create table if not exists track_requests (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references profiles(id) on delete cascade,
  title                text not null,
  artist               text not null,
  discogs_release_id   bigint,
  votes                integer not null default 0,
  status               text not null default 'open'
                         check (status in ('open', 'found', 'ordered', 'available', 'closed')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);


-- ── TABLA: request_votes ─────────────────────────────────────
create table if not exists request_votes (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references track_requests(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (request_id, user_id)
);


-- ── TABLA: sync_jobs ─────────────────────────────────────────
create table if not exists sync_jobs (
  id                uuid primary key default gen_random_uuid(),
  type              text not null,
  status            text not null default 'pending'
                      check (status in ('pending', 'running', 'completed', 'failed')),
  items_processed   integer not null default 0,
  items_total       integer not null default 0,
  error             text,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz
);


-- ── TRIGGER: updated_at ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger releases_updated_at
  before update on releases
  for each row execute function update_updated_at();

create trigger track_requests_updated_at
  before update on track_requests
  for each row execute function update_updated_at();


-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table releases       enable row level security;
alter table events         enable row level security;
alter table labels         enable row level security;
alter table profiles       enable row level security;
alter table wantlist       enable row level security;
alter table track_requests enable row level security;
alter table request_votes  enable row level security;
alter table sync_jobs      enable row level security;

-- Catálogo: lectura pública solo de activos
create policy "releases_public_read"
  on releases for select using (status = 'active');

-- Eventos y sellos: lectura pública
create policy "events_public_read"  on events         for select using (true);
create policy "labels_public_read"  on labels         for select using (true);

-- Perfiles: el propio usuario
create policy "profiles_own_read"   on profiles for select using (auth.uid() = id);
create policy "profiles_own_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on profiles for update using (auth.uid() = id);

-- Wantlist: el propio usuario
create policy "wantlist_own" on wantlist for all using (auth.uid() = user_id);

-- Requests: lectura pública, escritura propia
create policy "requests_public_read"  on track_requests for select using (true);
create policy "requests_own_insert"   on track_requests for insert with check (auth.uid() = user_id);
create policy "requests_own_update"   on track_requests for update using (auth.uid() = user_id);

-- Votos: lectura pública, escritura propia
create policy "votes_public_read"   on request_votes for select using (true);
create policy "votes_own_insert"    on request_votes for insert with check (auth.uid() = user_id);
create policy "votes_own_delete"    on request_votes for delete using (auth.uid() = user_id);

-- sync_jobs: sin policy → solo accesible via service_role (admin client)


-- ── ÍNDICES ──────────────────────────────────────────────────
create index if not exists releases_status_idx   on releases(status);
create index if not exists releases_genres_idx   on releases using gin(genres);
create index if not exists releases_styles_idx   on releases using gin(styles);
create index if not exists releases_artists_idx  on releases using gin(artists);
create index if not exists releases_listing_idx  on releases(discogs_listing_id);
create index if not exists releases_release_idx  on releases(discogs_release_id);
create index if not exists events_date_idx       on events(date);
create index if not exists wantlist_user_idx     on wantlist(user_id);
create index if not exists wantlist_release_idx  on wantlist(discogs_release_id);
