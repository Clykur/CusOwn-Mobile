create table if not exists public.reviews (
  id uuid not null default gen_random_uuid (),
  booking_id uuid not null,
  business_id uuid not null,
  user_id uuid null,
  rating integer not null,
  comment text null,
  is_hidden boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint reviews_pkey primary key (id),
  constraint uq_reviews_booking_id unique (booking_id),
  constraint fk_reviews_booking foreign KEY (booking_id) references bookings (id) on delete CASCADE,
  constraint reviews_business_id_fkey foreign KEY (business_id) references businesses (id) on delete CASCADE,
  constraint reviews_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_reviews_business_created on public.reviews using btree (business_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_reviews_business_id on public.reviews using btree (business_id) TABLESPACE pg_default;

create index IF not exists idx_reviews_user_id on public.reviews using btree (user_id) TABLESPACE pg_default
where
  (user_id is not null);

create index IF not exists idx_reviews_is_hidden on public.reviews using btree (is_hidden) TABLESPACE pg_default
where
  (is_hidden = false);
