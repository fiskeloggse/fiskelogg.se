create table if not exists teams (
  id serial primary key,
  name text,
  created_at timestamptz not null default now()
);

-- Safe to re-run: no-op if the column already exists.
alter table teams add column if not exists name text;

create table if not exists users (
  id serial primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  team_id integer references teams(id) on delete set null,
  show_bingo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Safe to re-run: no-op if the columns already exist.
alter table users add column if not exists team_id integer references teams(id) on delete set null;
alter table users add column if not exists show_bingo boolean not null default true;
alter table users add column if not exists stats_widgets text[];
alter table users add column if not exists quick_log_fields text[];
alter table users add column if not exists visible_register_columns text[];
alter table users add column if not exists share_card_fields text[];
alter table users add column if not exists gps_default_enabled boolean not null default false;
alter table users add column if not exists gps_mode text;

-- Replaces the old gps_default_enabled boolean with a 4-way choice — "off"
-- keeps its meaning, "true" becomes "position" (the only thing GPS did
-- before). Safe to re-run: only touches rows that haven't been migrated yet.
update users set gps_mode = case when gps_default_enabled then 'position' else 'off' end
  where gps_mode is null;
alter table users alter column gps_mode set default 'off';
alter table users alter column gps_mode set not null;
alter table users drop column if exists gps_default_enabled;

create table if not exists catches (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  species text not null,
  length_cm real,
  weight_kg real,
  lake text,
  location text,
  caught_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Safe to re-run: no-op if the columns already exist.
alter table catches add column if not exists lake text;
alter table catches add column if not exists location text;
alter table catches add column if not exists bait text;
alter table catches add column if not exists deleted_at timestamptz;
alter table catches add column if not exists latitude double precision;
alter table catches add column if not exists longitude double precision;
alter table catches add column if not exists comment text;
alter table catches add column if not exists method text;
alter table catches add column if not exists weather_temp_c real;
alter table catches add column if not exists weather_description text;
alter table catches add column if not exists weather_wind_kmh real;
alter table catches add column if not exists weather_wind_dir_deg real;
alter table catches add column if not exists weather_pressure_hpa real;
alter table catches add column if not exists weather_cloud_pct real;
alter table catches add column if not exists photo_url text;

-- Backfill any existing rows before enforcing NOT NULL (safe to re-run).
update catches set species = 'Okänd art' where species is null;
alter table catches alter column species set not null;

-- Normalize casing (e.g. "gädda" -> "Gädda") so the same species always
-- matches itself in personbästa, filters, and bingo. Safe to re-run.
update catches set species = initcap(species) where species <> initcap(species);

-- Safe to re-run: no-op if the columns are already nullable.
alter table catches alter column length_cm drop not null;
alter table catches alter column weight_kg drop not null;

create index if not exists catches_user_id_idx on catches (user_id);
create index if not exists catches_deleted_at_idx on catches (deleted_at);
create index if not exists users_team_id_idx on users (team_id);

create table if not exists bingo_cards (
  id serial primary key,
  team_id integer references teams(id) on delete cascade,
  species text not null,
  min_cm integer not null,
  max_cm integer not null,
  created_by integer references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Safe to re-run: no-op if the column is already nullable. Bingo cards can
-- now be solo (team_id null, scoped to created_by) or team-wide.
alter table bingo_cards alter column team_id drop not null;

-- Date range a catch must fall within to count for this card. Nullable so
-- existing cards (created before this feature) keep matching unrestricted.
alter table bingo_cards add column if not exists from_date date;
alter table bingo_cards add column if not exists to_date date;

update bingo_cards set species = initcap(species) where species <> initcap(species);

create index if not exists bingo_cards_team_id_idx on bingo_cards (team_id);
create index if not exists bingo_cards_created_by_idx on bingo_cards (created_by);
