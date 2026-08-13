-- ===========================================================
-- Charsadda Bazaar — Database Schema (Supabase / Postgres)
-- Run this whole file in the Supabase SQL Editor once, on a
-- fresh project. Safe to re-run pieces manually if needed.
-- ===========================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- PROFILES (one row per auth user, holds role) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','vendor','rider','admin')),
  full_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
-- Role + name come from the signup form via user metadata. If a shop was
-- invited to this email address and the new account is a vendor, the shop
-- auto-attaches to them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'customer');

  -- If an admin invited this email as a rider, that takes priority over
  -- whatever role the person picked on the signup form.
  if exists (select 1 from public.pending_rider_invites where lower(email) = lower(new.email)) then
    v_role := 'rider';
    delete from public.pending_rider_invites where lower(email) = lower(new.email);
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  );

  if v_role = 'vendor' then
    update public.shops
    set vendor_id = new.id, pending_vendor_email = null
    where vendor_id is null
      and pending_vendor_email is not null
      and lower(pending_vendor_email) = lower(new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------- SHOPS ----------
-- vendor_id is nullable so an admin can create a shop before a vendor is
-- attached to it (see pending_vendor_email for the invite-by-email flow).
create table if not exists shops (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references profiles(id) on delete cascade,
  pending_vendor_email text,
  name text not null,
  description text,
  category text not null default 'general',
  address text not null default '',
  phone text,
  self_delivery boolean not null default false,
  approved boolean not null default false,
  active boolean not null default true,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  stock_qty integer not null default 0,
  category text not null default 'Other',
  generic_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id),
  shop_id uuid not null references shops(id),
  status text not null default 'pending'
    check (status in ('pending','accepted','preparing','ready','out_for_delivery','delivered','cancelled')),
  payment_method text not null check (payment_method in ('cod','online')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded')),
  delivery_mode text not null check (delivery_mode in ('vendor','platform')),
  delivery_address text not null,
  delivery_phone text not null,
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- ORDER ITEMS ----------
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- ---------- DELIVERIES (platform-fulfilled orders only) ----------
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders(id) on delete cascade,
  rider_id uuid references profiles(id),
  status text not null default 'unassigned'
    check (status in ('unassigned','assigned','picked_up','delivered')),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz
);

-- ---------- PAYMENTS ----------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  provider text not null default 'safepay',
  provider_ref text,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now()
);

-- ---------- RIDER AVAILABILITY ----------
create table if not exists rider_status (
  rider_id uuid primary key references profiles(id) on delete cascade,
  available boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- PENDING RIDER INVITES ----------
-- Admin can invite someone to be a rider by email before they've signed up.
-- When that email signs up, handle_new_user() auto-assigns role = 'rider'
-- and removes the invite (mirrors the shops.pending_vendor_email pattern).
create table if not exists pending_rider_invites (
  email text primary key,
  invited_at timestamptz not null default now()
);

-- ===========================================================
-- ROW LEVEL SECURITY
-- ===========================================================
alter table profiles enable row level security;
alter table shops enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table deliveries enable row level security;
alter table payments enable row level security;
alter table rider_status enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- PROFILES: everyone can read their own row; admin reads all; user updates
-- own row; admin can also update any profile (e.g. to promote a rider).
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on profiles
  for update using (id = auth.uid());
create policy "profiles_update_admin" on profiles
  for update using (public.is_admin());

-- PENDING RIDER INVITES: admin only.
alter table pending_rider_invites enable row level security;
create policy "pending_rider_invites_admin_all" on pending_rider_invites
  for all using (public.is_admin()) with check (public.is_admin());

-- SHOPS: public can see approved+active shops; vendor manages own; admin manages all.
-- Admins can also create a shop without a vendor yet, or insert directly for
-- any vendor (not just their own).
create policy "shops_public_read" on shops
  for select using (approved = true and active = true);
create policy "shops_vendor_read_own" on shops
  for select using (vendor_id = auth.uid() or public.is_admin());
create policy "shops_vendor_insert" on shops
  for insert with check (vendor_id = auth.uid() or public.is_admin());
create policy "shops_vendor_update_own" on shops
  for update using (vendor_id = auth.uid() or public.is_admin());

-- PRODUCTS: public sees active products of approved shops; vendor manages own shop's products.
create policy "products_public_read" on products
  for select using (
    exists (select 1 from shops s where s.id = shop_id and s.approved = true and s.active = true)
    and active = true
  );
create policy "products_vendor_read_own" on products
  for select using (
    exists (select 1 from shops s where s.id = shop_id and (s.vendor_id = auth.uid() or public.is_admin()))
  );
create policy "products_vendor_write" on products
  for insert with check (
    exists (select 1 from shops s where s.id = shop_id and (s.vendor_id = auth.uid() or public.is_admin()))
  );
create policy "products_vendor_update" on products
  for update using (
    exists (select 1 from shops s where s.id = shop_id and (s.vendor_id = auth.uid() or public.is_admin()))
  );
create policy "products_vendor_delete" on products
  for delete using (
    exists (select 1 from shops s where s.id = shop_id and (s.vendor_id = auth.uid() or public.is_admin()))
  );

-- ORDERS: customer sees/creates own; vendor sees/updates own shop's orders; rider sees platform-delivery orders assigned to them; admin sees all.
create policy "orders_customer_read_own" on orders
  for select using (customer_id = auth.uid());
create policy "orders_customer_insert" on orders
  for insert with check (customer_id = auth.uid());
create policy "orders_vendor_read_own_shop" on orders
  for select using (
    exists (select 1 from shops s where s.id = shop_id and s.vendor_id = auth.uid())
  );
create policy "orders_vendor_update_own_shop" on orders
  for update using (
    exists (select 1 from shops s where s.id = shop_id and s.vendor_id = auth.uid())
  );
create policy "orders_rider_read_assigned" on orders
  for select using (
    exists (select 1 from deliveries d where d.order_id = orders.id and d.rider_id = auth.uid())
  );
create policy "orders_admin_all" on orders
  for all using (public.is_admin());

-- ORDER ITEMS: readable by anyone who can read the parent order.
create policy "order_items_read" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and (
      o.customer_id = auth.uid()
      or exists (select 1 from shops s where s.id = o.shop_id and s.vendor_id = auth.uid())
      or exists (select 1 from deliveries d where d.order_id = o.id and d.rider_id = auth.uid())
      or public.is_admin()
    ))
  );
create policy "order_items_insert" on order_items
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- DELIVERIES: rider sees/updates own assignment; vendor sees deliveries for own shop's orders; admin manages all (assign riders).
create policy "deliveries_rider_read_own" on deliveries
  for select using (rider_id = auth.uid());
create policy "deliveries_rider_update_own" on deliveries
  for update using (rider_id = auth.uid());
create policy "deliveries_vendor_read" on deliveries
  for select using (
    exists (select 1 from orders o join shops s on s.id = o.shop_id
      where o.id = order_id and s.vendor_id = auth.uid())
  );
create policy "deliveries_admin_all" on deliveries
  for all using (public.is_admin());
-- Unassigned deliveries are visible to any rider so they can see the open pool.
create policy "deliveries_rider_read_unassigned" on deliveries
  for select using (status = 'unassigned');

-- Riders can claim (update) any unassigned delivery to assign themselves.
create policy "deliveries_rider_claim_unassigned" on deliveries
  for update using (
    status = 'unassigned'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'rider')
  );

-- Riders need to see order details (address/phone/total) for jobs still in
-- the open (unassigned) pool, before they've claimed them.
create policy "orders_rider_read_unassigned_pool" on orders
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'rider')
    and exists (select 1 from deliveries d where d.order_id = orders.id and d.status = 'unassigned')
  );

-- PAYMENTS: customer reads own order's payments; admin reads all; vendor reads own shop's.
create policy "payments_customer_read" on payments
  for select using (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );
create policy "payments_vendor_read" on payments
  for select using (
    exists (select 1 from orders o join shops s on s.id = o.shop_id
      where o.id = order_id and s.vendor_id = auth.uid())
  );
create policy "payments_admin_all" on payments
  for all using (public.is_admin());
create policy "payments_insert_own_order" on payments
  for insert with check (
    exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid())
  );

-- RIDER STATUS: rider manages own row; admin/vendor can read all (to find available riders).
create policy "rider_status_own" on rider_status
  for all using (rider_id = auth.uid());
create policy "rider_status_read_all" on rider_status
  for select using (true);

-- ===========================================================
-- STORAGE: "products" bucket holds product photos (public read).
-- Logged-in vendors/admins can upload, replace, or delete files in it.
-- Created via the Supabase Storage UI + SQL editor (see project setup notes).
-- ===========================================================

-- ===========================================================
-- Make the FIRST account you create an admin manually:
-- update profiles set role = 'admin' where id = '<your-user-uuid>';
-- (Find your uuid in Supabase Dashboard -> Authentication -> Users)
-- ===========================================================


-- ---------- REVIEWS ----------
-- One review per (product, user). Star rating 1-5 with optional comment.
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

alter table reviews enable row level security;

create policy "reviews_select_all" on reviews for select using (true);
create policy "reviews_insert_own" on reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews_update_own" on reviews for update to authenticated using (auth.uid() = user_id);
create policy "reviews_delete_own" on reviews for delete to authenticated using (auth.uid() = user_id);

create index if not exists reviews_product_id_idx on reviews(product_id);


-- ---------- WISHLIST ----------
-- One row per (user, product) saved to wishlist.
create table if not exists wishlist_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (user_id, product_id)
  );

alter table wishlist_items enable row level security;

create policy "wishlist_select_own" on wishlist_items for select to authenticated using (auth.uid() = user_id);
create policy "wishlist_insert_own" on wishlist_items for insert to authenticated with check (auth.uid() = user_id);
create policy "wishlist_delete_own" on wishlist_items for delete to authenticated using (auth.uid() = user_id);

create index if not exists wishlist_items_user_id_idx on wishlist_items(user_id);

-- ---------- DEALS ----------
-- Optional discounted price. When set and lower than price, the product
-- shows a "Deal" badge + strikethrough price across the app.
alter table products add column if not exists sale_price numeric;

-- ---------- ORDER TRACKING CHAT ----------
-- In-app messaging scoped to a single order, between the customer and the
-- rider assigned to deliver it (platform-fulfilled orders only). Keeps
-- personal phone numbers out of the loop for day-to-day "where are you"
-- coordination.
create table if not exists order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  sender_role text not null check (sender_role in ('customer', 'rider')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table order_messages enable row level security;

create index if not exists order_messages_order_id_idx on order_messages (order_id, created_at);

-- Only the order's customer, its assigned rider, or an admin can read/send.
create policy "order_messages_participants_read" on order_messages
  for select using (
    exists (
      select 1 from orders o
      left join deliveries d on d.order_id = o.id
      where o.id = order_messages.order_id
        and (o.customer_id = auth.uid() or d.rider_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_messages_participants_insert" on order_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from orders o
      left join deliveries d on d.order_id = o.id
      where o.id = order_messages.order_id
        and (o.customer_id = auth.uid() or d.rider_id = auth.uid() or public.is_admin())
    )
  );
