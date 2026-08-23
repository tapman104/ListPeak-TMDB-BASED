create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  provider text not null default 'tmdb',
  key_encrypted text not null,
  created_at timestamptz default now()
);

create table watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  media_id integer not null,
  media_type text not null,
  status text not null,
  rating integer,
  progress integer,
  added_at timestamptz,
  updated_at timestamptz,
  title text not null,
  poster_path text,
  year text,
  unique(user_id, media_id, media_type)
);

alter table profiles enable row level security;
alter table api_keys enable row level security;
alter table watchlist enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own keys" on api_keys for all using (auth.uid() = user_id);
create policy "own watchlist" on watchlist for all using (auth.uid() = user_id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
