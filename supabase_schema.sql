-- Create a table for public profiles linked to auth.users
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create a table for products
create table products (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  price numeric not null,
  description text,
  image_url text,
  user_id uuid references auth.users not null
);

-- Set up RLS for products
alter table products enable row level security;

create policy "Products are viewable by everyone."
  on products for select
  using ( true );

create policy "Authenticated users can create products."
  on products for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own products."
  on products for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own products."
  on products for delete
  using ( auth.uid() = user_id );

-- Set up Storage
-- Use the Supabase dashboard to create a bucket called 'products' and 'avatars'
-- Or assume they exist and set policies here if possible (storage policies are complex in SQL, dashboard is easier for user)
