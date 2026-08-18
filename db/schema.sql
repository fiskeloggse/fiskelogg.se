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
  species text,
  length_cm real not null,
  weight_kg real not null,
  caught_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists catches_user_id_idx on catches (user_id);
