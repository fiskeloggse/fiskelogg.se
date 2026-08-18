create table if not exists teams (
  id serial primary key,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  team_id integer references teams(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Safe to re-run: no-op if the column already exists.
alter table users add column if not exists team_id integer references teams(id) on delete set null;

create table if not exists catches (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  species text not null,
  length_cm real,
  weight_kg real,
  caught_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Backfill any existing rows before enforcing NOT NULL (safe to re-run).
update catches set species = 'Okänd art' where species is null;
alter table catches alter column species set not null;

-- Safe to re-run: no-op if the columns are already nullable.
alter table catches alter column length_cm drop not null;
alter table catches alter column weight_kg drop not null;

create index if not exists catches_user_id_idx on catches (user_id);
create index if not exists users_team_id_idx on users (team_id);
