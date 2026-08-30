# Sadhana Connect

A web and mobile app for ISKCON devotee communities to record, monitor, and
analyze daily spiritual sadhana — replacing manually submitted WhatsApp
sadhana reports with a proper devotee → mentor → super admin system.

This repo is **self-hosted**: there is no shared "Sadhana Connect" server.
Each devotee group runs its own copy, backed by its own free Supabase
project and its own free Vercel deployment. Nobody else's data ever touches
your instance, and you don't touch anyone else's.

---

## ⚠️ Before you make your deployment public

Three things you must do — not optional — before real devotees use your
instance:

1. **Change the WhatsApp recipient number.** It is currently hardcoded to
   the original developer's own number in
   `packages/sadhana/src/whatsapp-recipient.ts`. If you skip this, every
   "Share to WhatsApp" button in your deployment will send devotees' sadhana
   reports to a stranger's phone. See [Customize](#customize-for-your-group)
   below.
2. **Create your own Supabase project and your own Vercel project.** Never
   reuse someone else's project credentials — you're standing up your own
   independent instance, with your own database, your own users, and your
   own admin.
3. **Pick a license** if you intend to keep this public and want to make
   clear what others may do with your fork (this repo doesn't ship one by
   default).

---

## What's inside

- **Web app** (`src/`) — React + TypeScript + Vite + Tailwind + shadcn/ui,
  deployed as a PWA to Vercel.
- **Mobile app** (`apps/mobile/`) — Expo / React Native, Android-first. See [Mobile App & OTA Updates Guide](apps/mobile/MOBILE_GUIDE.md) for full commands on instant updates, building APKs, and distribution.
- **Shared logic** (`packages/*`) — domain models, validation, and
  data-fetching hooks used by both the web and mobile apps.
- **Backend** — Supabase (Postgres + Auth + Storage + Edge Functions), with
  every table protected by Row Level Security and every admin-only
  destructive action gated through a dedicated Edge Function.

You do **not** need to touch most of this to get your own instance running —
the steps below only need the Supabase and Vercel dashboards, a terminal,
and about 20–30 minutes. A guided script (`npm run setup`) does the fiddly
backend wiring for you — see [Setup](#setup) below.

**On privacy and isolation:** this is not a shared service anyone signs up
for — it's software you deploy for yourself. Every group's database, hosting
account, URL, and API keys live entirely inside that group's own Supabase
and Vercel accounts, which only that group's admin can see. Nobody else —
not other devotee groups, not this repo's maintainer — ever has access to
them. The one thing every deployment shares is the *code*, same as any
open-source project.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later, and npm (comes with Node)
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for hosting the web app)
- [Git](https://git-scm.com/)
- No prior Supabase/React experience required — just follow the steps in
  order

---

## Setup

### 1. Get the code

```bash
git clone https://github.com/<your-username>/<your-fork>.git
cd sadhana-connect
npm install
```

### 2. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New
   project**.
2. Pick any name/region and a strong database password (save it somewhere —
   you likely won't need it again, but keep it safe).
3. Wait for the project to finish provisioning (a couple of minutes).
4. In the project's dashboard, go to **Project Settings → API**. Keep this
   tab open — you'll copy four things from it in step 4: the project ref
   (from the dashboard's URL), the Project URL, the anon/publishable key,
   and the secret API key.

### 3. Create your Vercel project

1. Push your fork to your own GitHub account.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
3. Before the first deploy, add two **Environment Variables** (you'll get
   these exact values in the next step — it's fine to come back and fill
   these in after step 4 if you'd rather):
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy. Vercel gives you a URL like `https://your-group.vercel.app` —
   that's your app's real address, used throughout the next step.

### 4. Run the guided setup

```bash
npm run setup
```

This asks for the four values from step 2 and your Vercel URL from step 3,
then does everything else on your own machine, against your own project
only: applies the database schema, configures Supabase Auth's redirect
URLs, deploys the admin Edge Function, and sets its secrets. At the end it
offers to promote your account to Super Admin too (see step 5).

It will open a browser tab once, to log the Supabase CLI into *your own*
Supabase account — nothing is sent to anyone else. If any step fails, fix
whatever it reports and just run `npm run setup` again; it's safe to repeat.

Prefer to see and run each underlying command yourself instead of trusting
a script? See [Manual setup](#manual-setup-what-the-script-does) below —
it's the exact same commands, spelled out.

### 5. Register your account and become Super Admin

Open your Vercel URL (or run `npm run dev` for local testing), click
**Register**, and create your own account — it comes in as an ordinary
`devotee` at first, since every fresh instance starts with zero admins by
design.

If you answered "yes" during `npm run setup`, it already promoted you.
Otherwise, run this once (shown again at the end of the setup script's
output too):

```bash
npx supabase db query --linked "update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');"
```

Refresh the app — you now have the full Super Admin panel: create temple
groups, promote other users to mentor/admin, assign devotees to mentors,
etc. Every admin after you can be promoted from inside the app itself —
this step is only ever needed once, for your own first account.

You're live. Share the URL with your devotee group — anyone can register,
and you (as Super Admin) assign them a mentor and role from the Admin panel.

---

## Manual setup (what the script does)

`npm run setup` is just a thin wrapper around the Supabase CLI — nothing it
does is hidden. If you'd rather run each step yourself (or the script fails
partway and you want to finish by hand), here's the equivalent, in order:

```bash
# Log in and point the CLI at your project
npx supabase login
npx supabase link --project-ref <your-project-ref>

# Apply every file in supabase/migrations/, in order
npx supabase db push
```

No terminal at all? Open your project's **SQL Editor** in the Supabase
Dashboard instead and paste-and-run each file in `supabase/migrations/` in
filename order (`0001_...`, `0002_...`, etc.) — same result, just manual.
If a migration fails on a `cron.schedule(...)` line, enable the `pg_cron`
extension under **Database → Extensions** first, then re-run.

```bash
# Auth redirect URLs — or set Site URL / Redirect URLs by hand under
# Authentication → URL Configuration in the dashboard
# (edit supabase/config.toml's site_url / additional_redirect_urls first)
npx supabase config push

# The admin Edge Function and its secrets
npx supabase functions deploy admin-account-actions
npx supabase secrets set SERVICE_ROLE_SECRET_KEY=<your-project's-secret-api-key>
npx supabase secrets set APP_ORIGIN=https://your-group.vercel.app
npx supabase secrets set ALLOWED_ORIGINS=https://your-group.vercel.app
```

Get `SERVICE_ROLE_SECRET_KEY`'s value from **Project Settings → API → API
Keys** — use the **`secret`** key (not `anon`/`publishable`). Do **not** name
this secret `SUPABASE_SERVICE_ROLE_KEY` — Supabase's CLI reserves that
prefix, and if your project has legacy API keys disabled (the default for
new projects), that name silently holds an incompatible legacy value that
gets rejected.

> **`APP_ORIGIN`/`ALLOWED_ORIGINS` not exactly matching your real deployed
> URL is the single most common thing to get wrong** — every admin action
> (disable account, delete account, password recovery link) will silently
> fail with a generic "Something went wrong" message and no visible reason
> if they don't match. See [Troubleshooting](#troubleshooting).

```bash
cp .env.example .env
# then edit .env:
#   VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
#   VITE_SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
```

---

## Customize for your group

- **WhatsApp number** (required — see the warning at the top):
  `packages/sadhana/src/whatsapp-recipient.ts` — replace
  `WHATSAPP_RECIPIENT_NUMBER` with the number your group actually wants
  sadhana reports shared to, in international format with no `+` or spaces
  (e.g. `919876543210`).
- **App name/branding** (optional): the page title and PWA name are set in
  `index.html` (`<title>`) and `vite.config.ts` (the `VitePWA` manifest
  block) — both currently say "Sadhana Connect."

## Uf supabse gets paused due to inactivity for 7 days
If a free-tier Supabase project goes inactive for 7 days, Supabase automatically **pauses** it (the compute/database is suspended, but nothing is deleted — your schema, data, and all settings are preserved).

To restart it:
1. Log into the Supabase Dashboard and open the paused project — it'll show a **"Paused"** status with a **"Restore project"** (or similar) button.
2. Click it and wait a few minutes while Supabase spins the database back up.
3. Once it's back to "Active," the app should work exactly as before — no changes needed to your `.env`, API keys, or Edge Function secrets, since the project ref and all credentials stay the same across a pause/restore cycle.

A couple of things worth knowing:
- If a paused project stays paused for a long stretch without being restored (on the order of a few months), Supabase can eventually delete it entirely — so don't let a paused project sit untouched indefinitely.
- To avoid this happening at all, you'd either upgrade off the free tier (paid plans don't auto-pause), or keep the project "active" by having something hit it periodically (e.g., a scheduled request every few days) so it never crosses the 7-day inactivity threshold.
---

## Mobile app (optional, more advanced)

The Android app in `apps/mobile/` shares all its business logic with the web
app via `packages/*`, and talks to the same Supabase project — just point
its own `.env` (`cp apps/mobile/.env.example apps/mobile/.env`, same two
Supabase values) at your project. Building it into an installable APK
requires Android Studio and the Android SDK; if that's more than your group
needs, the web app alone is a fully installable PWA (Add to Home Screen)
and covers every feature.

---

## Troubleshooting

**Admin actions (disable/delete account, password recovery link) fail with
"Something went wrong"** — almost always `ALLOWED_ORIGINS`/`APP_ORIGIN`
don't exactly match your deployed URL. Re-run `npm run setup` (or the
`supabase secrets set` commands in [Manual setup](#manual-setup-what-the-script-does))
with the correct URL. No trailing slash, and `https://`, not `http://`.

**A migration fails on `cron.schedule(...)`** — enable the `pg_cron`
extension: **Database → Extensions** in your Supabase Dashboard, then re-run
`npm run setup` (or `npx supabase db push`).

**Password reset emails never arrive** — check **Authentication → URL
Configuration** in your Supabase Dashboard has your real deployed URL (step 4
pushes this for you, but it's worth double-checking after a URL change), and
check Supabase's free-tier email sending limits if you expect high volume
(consider configuring a custom SMTP provider under **Authentication →
Email** for a larger group).

---

## Architecture, for contributors

This project follows Clean Architecture (domain / application /
infrastructure / presentation layers) and a strict phase-by-phase
development process — see `CLAUDE.md` for the full set of conventions if
you're extending the app rather than just deploying it.
