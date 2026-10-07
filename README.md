# 🌸 Sadhana Connect

An open-source, turnkey spiritual sadhana tracking and mentorship platform for ISKCON devotee communities, temples, youth forums, and spiritual groups worldwide.

Available across **Web (Responsive PWA)** and **Mobile (Android APK & Over-The-Air Updates)**.

---

## 🌟 Vision & Architecture

Sadhana Connect replaces manual, unstructured WhatsApp messages and spreadsheets with a structured, inspiring spiritual dashboard. It is engineered with a **devotee ➔ mentor ➔ super admin** hierarchy that fosters spiritual accountability and association.

### 🛡️ 100% Free, Private, and Self-Hosted
There is no central "Sadhana Connect" server collecting community data. **Every group runs its own independent instance**, powered entirely by:
- **Free Supabase tier**: PostgreSQL database, authentication, row-level security (RLS), and Edge Functions.
- **Free Vercel tier**: High-speed global edge hosting for the web app.
- **Free Expo / EAS tier**: Cloud building and Over-The-Air (OTA) updates for the mobile app.

Your community's devotees, mentors, and reports remain 100% private to your group. Nobody else ever has access to your data.

---

## ✨ Features

- **📿 Daily Japa Tracking**: Track target vs. completed rounds (including before-8-AM counts).
- **📖 Scripture Reading**: Log minutes spent reading Srila Prabhupada's books and verses.
- **🎧 Hearing & Lectures**: Track classes, seminars, and kirtan hearing hours.
- **🎓 Study Hours with Decimal Support**: Designed for students and working professionals to record study/work hours with quick-fill buttons (1h, 2h, 3h, 4h) and precise decimal entry (e.g. 2.5 hours).
- **⏱️ Sleep & Rest Tracking**: Record rest hours with decimal support (e.g. 6.5 hours).
- **🌅 Morning Program & Attendance**: Mangala Aarti, Guru Puja, Tulasi Aarti, and Srimad Bhagavatam class attendance.
- **💬 One-Tap WhatsApp Reports**: Generates beautifully formatted sadhana summaries ready to share with your mentor on WhatsApp. Recipients can be set per devotee profile or chosen via a contact picker.
- **👥 Mentorship System**: Mentors view daily reports, completion rates, streaks, and attendance summaries for their assigned group of devotees.
- **👑 Clutter-Free Super Admin Console**: Multi-tier management to create groups, assign mentors, adjust roles, and broadcast announcements.
- **🔔 Announcements & Push Notifications**: Administrators can push announcements with high-importance alerts delivered directly to devotees' phone lock screens.
- **📱 Native Mobile Experience**: Built with Expo / React Native featuring instant Over-The-Air (OTA) updates without needing users to reinstall the APK.

---

## 🏗️ Repository Structure

```text
sadhana-connect/
├── apps/
│   └── mobile/              # Expo / React Native Android mobile app
├── packages/
│   ├── sadhana/             # Shared business logic, models, validators, formatting
│   └── ...
├── src/                     # React 19 + TypeScript + Vite + Tailwind CSS Web App
├── supabase/
│   ├── functions/           # Admin Edge Functions (secure role management)
│   └── migrations/          # Complete PostgreSQL schema & RLS policies
├── scripts/
│   └── setup.mjs            # Interactive guided setup CLI
└── .github/workflows/       # Automated Supabase keep-alive ping workflow
```

---

## 🚀 Quickstart: Deploying for Your Community

Deploying your own instance takes approximately 15–20 minutes. Follow these steps in order:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher) and npm.
- [Git](https://git-scm.com/).
- A free account on [Supabase](https://supabase.com).
- A free account on [Vercel](https://vercel.com) (for hosting the web application).
- *(Optional for Mobile App)* A free account on [Expo](https://expo.dev).

---

### 2. Fork & Clone

1. Fork this repository to your own GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/sadhana-connect.git
   cd sadhana-connect
   npm install
   ```

---

### 3. Create Your Supabase Project

1. Log into [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Choose your organization, assign a project name, select a nearby database region, and set a strong database password.
3. Once provisioning completes, navigate to **Project Settings ➔ API**.
4. Note down:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **Project Ref** (the short subdomain from the Project URL, e.g. `xyzcompany`)
   - **anon / public key**
   - **service_role / secret key** *(Click 'Reveal' – keep this safe and private)*

---

### 4. Deploy the Web App on Vercel

1. Log into [vercel.com](https://vercel.com) and click **Add New ➔ Project**.
2. Import your GitHub fork of `sadhana-connect`.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon / public key
4. Click **Deploy**. Vercel will build and assign you a production URL (e.g. `https://your-temple.vercel.app`).

---

### 5. Run the Guided Setup CLI

Run the interactive setup tool from your terminal:

```bash
npm run setup
```

The tool will prompt for your Supabase credentials and your deployed Vercel URL, then automatically:
- Creates your local `.env` and `apps/mobile/.env`.
- Logs into your Supabase CLI and links your remote project.
- Executes all database schema migrations in `supabase/migrations/`.
- Configures authentication site URLs and redirect URLs.
- Deploys the `admin-account-actions` Edge Function and sets its secure environment secrets.

*(Prefer running each command manually? See the [Manual CLI Setup](#-manual-cli-setup) section below).*

---

### 6. Register Your Account & Become Super Admin

1. Open your live Vercel URL in your browser and click **Register**.
2. Sign up with your personal email address. New accounts start as a standard devotee.
3. Promote your account to **Super Admin** by executing this command in your terminal:
   ```bash
   npx supabase db query --linked "update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL@EXAMPLE.COM');"
   ```
4. Refresh the web app. You now have full access to the **Admin & Super Admin Console**! All subsequent mentors and admins can be promoted directly inside the app UI.

---

## 📱 Setting Up the Mobile App (`apps/mobile`)

The mobile app is an Android-first React Native app powered by Expo. You can build a standalone shareable APK and push instant Over-The-Air updates without needing devotees to reinstall the APK.

### 1. Configure the Mobile Environment
Navigate to the mobile directory:
```bash
cd apps/mobile
```
Ensure `apps/mobile/.env` exists with your Supabase credentials (generated automatically if you ran `npm run setup`, or create it from `.env.example`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```

### 2. Connect to Your Own Expo Account
Run:
```bash
npx eas login
npx eas init
```
This automatically links the mobile app to your own Expo account and updates `projectId` and `owner` in `apps/mobile/app.json`.

*(Optional: In `apps/mobile/app.json`, you can customize `"name"`, `"android.package"`, and icons to match your temple or community branding).*

### 3. Build Your Shareable Android APK
Run:
```bash
npx eas-cli build -p android --profile preview
```
EAS builds the APK in the cloud. Once complete, it provides a download link and QR code. You can share this link with devotees via WhatsApp or Telegram for direct installation.

### 4. Push Over-The-Air (OTA) Updates
Whenever you change UI, fix bugs, or adjust questions, you **do not** need to rebuild the APK. Devotees receive the update silently or with an in-app prompt:
```bash
npx eas-cli update --branch preview --message "Added study hours & decimal precision"
```

For more detailed mobile workflows, see the **[Mobile Operations & Deployment Guide](apps/mobile/MOBILE_GUIDE.md)**.

---

## 🔄 Free-Tier Supabase Keep-Alive Ping

Free-tier Supabase projects enter a paused state after 7 consecutive days without database queries. To keep your database permanently active, this repository includes an automated GitHub Actions keep-alive workflow (`.github/workflows/supabase-keep-alive.yml`) that pings your Supabase project API every 3 days.

### How to Enable:
1. In your GitHub repository fork, go to **Settings ➔ Secrets and variables ➔ Actions**.
2. Click **New repository secret** and add:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon / publishable key
3. In the **Actions** tab of your repo, select **Supabase Keep-Alive Ping** and click **Run workflow** to verify.

---

## 🎨 Customization for Your Community

- **WhatsApp Sharing Recipient**: Devotees can enter their mentor's WhatsApp number in their **Profile** or choose from their contacts when sharing. To set a community-wide default number, update `WHATSAPP_RECIPIENT_NUMBER` in `packages/sadhana/src/whatsapp-recipient.ts` (e.g. `'919876543210'`).
- **Web App Branding**: Edit `<title>` in `index.html` and the branding manifest in `vite.config.ts`.
- **Mobile Branding & Icons**: Replace the icons in `apps/mobile/assets/` (`icon.png`, `adaptive-icon.png`) and update `"name"` in `apps/mobile/app.json`.

---

## ⚙️ Manual CLI Setup

If you prefer executing backend setup commands step-by-step instead of running `npm run setup`:

```bash
# 1. Login and link your Supabase project
npx supabase login
npx supabase link --project-ref <your-project-ref>

# 2. Apply all database migrations
npx supabase db push

# 3. Configure authentication redirect URLs
npx supabase config push

# 4. Deploy the admin Edge Function
npx supabase functions deploy admin-account-actions

# 5. Set required secrets for the Edge Function
npx supabase secrets set SERVICE_ROLE_SECRET_KEY=<your-secret-key>
npx supabase secrets set APP_ORIGIN=https://your-temple.vercel.app
npx supabase secrets set ALLOWED_ORIGINS=https://your-temple.vercel.app
```

> [!IMPORTANT]
> - `SERVICE_ROLE_SECRET_KEY` must use your project's **`secret`** key from **Project Settings ➔ API** (not `anon`).
> - `APP_ORIGIN` and `ALLOWED_ORIGINS` must match your exact deployed Vercel domain with `https://` and no trailing slash.

---

## ❓ Troubleshooting

- **Admin actions (disabling users, password resets) show "Something went wrong"**:
  Verify that `APP_ORIGIN` and `ALLOWED_ORIGINS` secrets in Supabase match your exact deployed Vercel URL.
- **Migration fails on `cron.schedule(...)`**:
  Enable the `pg_cron` extension in your Supabase Dashboard under **Database ➔ Extensions**, then re-run `npx supabase db push`.
- **Database paused due to inactivity**:
  Visit your Supabase Dashboard and click **Restore project**. Enable the GitHub Action Keep-Alive Ping to avoid future pauses.
- **Android APK installation warnings**:
  Because direct APK downloads bypass the Play Store, devotees should tap **"Download anyway"** and **"Install anyway"** (Google Play Protect verification).

---

## 🤝 Contributing & License

Contributions, improvements, and feature suggestions are welcome! Please open an issue or pull request.

This project is licensed under the **[MIT License](LICENSE)**. You are free to use, fork, modify, and host Sadhana Connect for your spiritual community.
