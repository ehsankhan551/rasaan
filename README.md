# Rasaan

A local multi-vendor marketplace — shops list products, customers order (cash
on delivery or online), and orders are delivered either by the shop itself or
by platform riders. Launching first in Charsadda & Harichand, built so the
same app can be switched on in any new city just by onboarding shops and
riders there — no rebrand needed.

The name "Rasaan" (رسان) is Persian/Urdu for "one who delivers/conveys" — the
same root used in words like "letter-rasān" (postman).

Built with Next.js 15 + Supabase (Postgres, Auth) + Tailwind CSS. Everything
below can be hosted for free.

## What's included

- **Customer storefront** — browse shops (`/shops`), view products, add to
  cart, checkout with COD or online payment, view order history
  (`/account/orders`).
- **Vendor dashboard** (`/vendor`) — create/edit shop profile (pending admin
  approval), manage products (add/edit stock/hide/delete), manage incoming
  orders (accept → preparing → ready → out for delivery → delivered).
- **Rider dashboard** (`/rider`) — go online/offline, see the open pool of
  unassigned deliveries, accept one, then mark picked up / delivered
  (`/rider/deliveries`).
- **Admin panel** (`/admin`) — approve or deactivate shops, view all orders,
  see registered riders and manually assign a rider to a delivery if no one
  claims it.
- **Auth** for 4 roles (customer, vendor, rider, admin) via Supabase Auth,
  enforced both by middleware (route protection) and by Postgres Row Level
  Security (so the rules hold even if someone calls the API directly).

## 1. Create your free Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account +
   new project.
2. In the Supabase dashboard, open **SQL Editor**, paste the entire contents
   of `supabase/schema.sql` from this project, and run it. This creates all
   tables, security policies, and a trigger that auto-creates a profile row
   whenever someone signs up.
3. Go to **Project Settings → API** and copy the **Project URL** and
   **anon public** key.

## 2. Configure the app

1. Copy `.env.local.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   with the values from step 1.

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 3. Make yourself an admin

1. Sign up normally through the app (any role is fine for the account you'll
   promote).
2. In Supabase dashboard → **Authentication → Users**, copy your user's
   UUID.
3. In **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin' where id = '<your-user-uuid>';
   ```
4. Log out and back in — you'll now be able to visit `/admin`.

## 4. Try the full flow

1. **Sign up a vendor** account → go to `/vendor/shop` → fill in shop
   details → save (shop starts unapproved).
2. **As admin** → `/admin/vendors` → approve the shop.
3. **As the vendor** → `/vendor/products` → add a few products.
4. **Sign up a customer** account → `/shops` → the shop now appears → add
   products to cart → `/checkout` → choose COD or online, and rider delivery
   or shop's own delivery → place order.
5. **As the vendor** → `/vendor/orders` → walk the order through
   accepted → preparing → ready → out for delivery.
6. **Sign up a rider** account → `/rider` → go online → accept the open
   delivery → `/rider/deliveries` → mark picked up, then delivered.
7. **As admin** → `/admin/orders` and `/admin/riders` to see everything
   platform-wide, and to manually assign a rider if no one claims a job.

## Payments: COD today, online payment ready for a real gateway

- **Cash on delivery** works today with no setup — it's free and instant.
- **Online payment** currently runs in *TEST/SIMULATE mode*: the order is
  automatically marked "paid" so you can build and demo the full flow
  without a merchant account.
- When you're ready to accept real online payments, sign up with
  [Safepay](https://getsafepay.com) (supports cards, JazzCash, EasyPaisa —
  good fit for Pakistan) or another gateway of your choice, add your API
  keys to `.env.local`, and replace the logic in `src/lib/payments/index.ts`
  (`chargeOnline`) with a real API call, following the comments in that
  file. Do this yourself when you have a registered business — I can't sign
  up for a merchant account on your behalf.

## Deploying for free

1. Push this project to a GitHub repo (same way we did for Pa Hawa —
   create a repo on github.com, upload these files).
2. Go to [vercel.com](https://vercel.com), sign up free, "Import Project"
   from your GitHub repo.
3. In Vercel's project settings → **Environment Variables**, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same
   values as your `.env.local`).
4. Deploy. Vercel's free tier and Supabase's free tier are both enough to
   run this for a handful of shops and normal local traffic.

## Expanding to a new city

Nothing in the code is tied to Charsadda/Harichand — the brand, database,
and app are all city-agnostic by design. To open a new city, just onboard
shops and riders there; nothing to rename or rebuild. (If you eventually
want to filter what customers see by city, that would mean adding a `city`
column to `shops` and `profiles` and filtering the `/shops` query — not
needed for the current single-city launch.)

## Notes on today's scope

- Vendor onboarding is admin-approved (not open self-registration) — matches
  starting small with shops you onboard personally. You can open up public
  vendor signup later; the signup form already supports it, it's just gated
  by the `approved` flag before a shop goes public.
- Riders have their own login and dashboard, not just an admin-assigned
  tool — admin assignment is only a fallback for unclaimed jobs.
- Delivery fee is a flat placeholder (Rs 100) in `src/app/checkout/actions.ts`
  — replace with real logic (by distance/shop) whenever you're ready.
