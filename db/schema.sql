create table if not exists users (
  id serial primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists catches (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  species text not null,
  length_cm real not null,
  weight_kg real,
  caught_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Backfill any existing rows before enforcing NOT NULL (safe to re-run).
update catches set species = 'Okänd art' where species is null;
alter table catches alter column species set not null;

-- Safe to re-run: no-op if the column is already nullable.
alter table catches alter column weight_kg drop not null;

create index if not exists catches_user_id_idx on catches (user_id);
