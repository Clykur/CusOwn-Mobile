-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('Customer', 'Owner')),
  push_token text,
  platform text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. BUSINESS CATEGORIES
create table public.business_categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  icon_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.business_categories enable row level security;

create policy "Categories are viewable by everyone." on public.business_categories
  for select using (true);

-- 3. BUSINESSES
create table public.businesses (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.business_categories(id) on delete set null,
  name text not null,
  description text,
  address text,
  image_url text,
  rating numeric default 5.0,
  reviews_count integer default 0,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.businesses enable row level security;

create policy "Businesses are viewable by everyone." on public.businesses
  for select using (true);

create policy "Owners can manage their own businesses." on public.businesses
  for all using (owner_id = auth.uid());

-- 4. SERVICES
create table public.services (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric not null,
  duration integer not null, -- in minutes
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.services enable row level security;

create policy "Services are viewable by everyone." on public.services
  for select using (true);

create policy "Owners can manage services for their businesses." on public.services
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = services.business_id
      and businesses.owner_id = auth.uid()
    )
  );

-- 5. SLOTS
create table public.slots (
  id uuid default gen_random_uuid() primary key,
  business_id uuid references public.businesses(id) on delete cascade not null,
  date date not null,
  time time not null,
  is_available boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(business_id, date, time)
);

alter table public.slots enable row level security;

create policy "Slots are viewable by everyone." on public.slots
  for select using (true);

create policy "Owners can manage slots for their businesses." on public.slots
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = slots.business_id
      and businesses.owner_id = auth.uid()
    )
  );

-- 6. BOOKINGS
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  reference text unique not null,
  customer_id uuid references public.profiles(id) on delete cascade not null,
  business_id uuid references public.businesses(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  slot_id uuid references public.slots(id) on delete cascade not null,
  date date not null,
  time time not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bookings enable row level security;

create policy "Users can view their own bookings." on public.bookings
  for select using (auth.uid() = customer_id);

create policy "Owners can view bookings for their businesses." on public.bookings
  for select using (
    exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
      and businesses.owner_id = auth.uid()
    )
  );

create policy "Users can create their own bookings." on public.bookings
  for insert with check (auth.uid() = customer_id);

create policy "Owners can update bookings for their businesses." on public.bookings
  for update using (
    exists (
      select 1 from public.businesses
      where businesses.id = bookings.business_id
      and businesses.owner_id = auth.uid()
    )
  );

-- 7. BUSINESS STATS VIEW (Replaces owner_stats)
create or replace view public.business_stats as
select 
  b.owner_id,
  count(bo.id) as total_bookings,
  count(bo.id) filter (where bo.status = 'pending') as pending_bookings,
  coalesce(sum(bo.price) filter (where bo.status = 'completed'), 0) as revenue
from public.businesses b
left join public.bookings bo on bo.business_id = b.id
group by b.owner_id;

-- 8. FUNCTION: Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'role');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
