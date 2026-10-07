# 🌸 Sadhana Connect

An open-source, turnkey spiritual sadhana tracking and mentorship platform for ISKCON devotee communities, temples, youth forums, and spiritual groups worldwide.

Available across **Web (Responsive PWA)** and **Mobile (Android APK & Over-The-Air Updates)**.

---

> [!TIP]
> ### 🔰 Never deployed an app before? Don't worry!
> **You do NOT need programming knowledge to run Sadhana Connect for your community.** 
> You only need to sign up for three free services (GitHub, Supabase, and Vercel — no credit card needed) and follow the simple, step-by-step instructions below. If you can copy-and-paste text, you can launch this app!

---

## 🌟 Vision & Overview

Sadhana Connect replaces manual, unstructured WhatsApp messages and spreadsheets with a structured, inspiring spiritual dashboard. It is engineered with a **devotee ➔ mentor ➔ super admin** hierarchy that fosters spiritual accountability and loving association.

### 🛡️ 100% Free, Private, and Self-Hosted
There is no central "Sadhana Connect" company collecting your community's data. **Every temple or group runs their own independent instance**, powered entirely by:
- **🗄️ Supabase (Free Tier)**: Secure cloud database that stores devotees' accounts and sadhana records.
- **🌐 Vercel (Free Tier)**: High-speed cloud hosting that provides your live web address (e.g. `https://your-temple.vercel.app`).
- **📱 Expo / EAS (Free Tier)**: Cloud service that automatically compiles and builds the Android APK file for phones.

Your community's devotees, mentors, and reports remain 100% private to your group.

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
- **📱 Native Mobile Experience**: Fast, native feel with Over-The-Air (OTA) updates and offline-tolerant architecture.

---

## 🚀 Beginner-Friendly Setup Guide (15–20 Minutes)

Follow these 6 steps to launch your community's Sadhana Connect:

### Step 1: Install 2 Free Tools on Your Computer
If you do not have these installed already:
1. **Node.js**: Go to [nodejs.org](https://nodejs.org) and download the **LTS** version. Install it (just click *Next* on all default prompts).
2. **Git**: Go to [git-scm.com](https://git-scm.com) and download Git. Install it with default settings.

*(To open your computer's terminal: on **Windows**, press the Windows key and search for **PowerShell**; on **Mac**, press `Command + Space` and search for **Terminal**).*

---

### Step 2: Create Your 3 Free Cloud Accounts
All three services have generous free tiers with **zero cost and no credit card required**:
1. **GitHub**: [github.com/signup](https://github.com/signup) (holds the code)
2. **Supabase**: [supabase.com](https://supabase.com) (stores your database)
3. **Vercel**: [vercel.com/signup](https://vercel.com/signup) (hosts your website — sign in with your GitHub account)

---

### Step 3: Fork and Clone the Code

1. At the top-right of this GitHub page, click the **Fork** button ➔ Click **Create fork**. (This creates a personal copy of the project in your GitHub account).
2. Open your terminal (PowerShell or Terminal) and run:
   ```bash
   git clone https://github.com/<YOUR-GITHUB-USERNAME>/sadhana-connect.git
   cd sadhana-connect
   npm install
   ```

---

### Step 4: Create Your Supabase Database

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Give your project a name (e.g. `Vrindavan-Sadhana`) and set a strong database password (store this somewhere safe).
3. Wait 1–2 minutes while Supabase sets up your database.
4. In the left menu of Supabase, click **Project Settings** (the gear icon ⚙️ at the bottom) ➔ **API**.
5. Keep this page open. You will need:
   - **Project URL** (looks like `https://xyzabcdefg.supabase.co`)
   - **Project Ref** (the short letters inside your URL, e.g. `xyzabcdefg`)
   - **anon / public key** (long text string)
   - **service_role / secret key** (click *Reveal* — keep this private!)

---

### Step 5: Deploy the Web App on Vercel

1. Open [vercel.com/new](https://vercel.com/new).
2. Under "Import Git Repository", find your forked `sadhana-connect` repository and click **Import**.
3. Expand the **Environment Variables** section and add two variables:
   - Name: `VITE_SUPABASE_URL` | Value: *(Paste your Supabase Project URL from Step 4)*
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY` | Value: *(Paste your anon / public key from Step 4)*
4. Click **Deploy**.
5. In 1–2 minutes, Vercel will give you a live website link (e.g. `https://your-temple.vercel.app`). Copy this link!

---

### Step 6: Run the One-Time Setup Wizard

Back in your terminal, run:

```bash
npm run setup
```

This interactive wizard will ask you for:
- Your Supabase Project Ref
- Your Supabase Project URL
- Your Supabase anon key
- Your Supabase service_role secret key
- Your live Vercel URL (from Step 5)

The script handles all the database tables, security policies, and admin functions automatically.

---

### Step 7: Create Your Account & Become Super Admin

1. Open your live website link in your browser and click **Register**.
2. Sign up with your personal email and name.
3. Once registered, make yourself **Super Admin** using either of these two methods:

#### 👉 Method A: Point-and-Click inside Supabase (Easiest, No Code):
1. In your [Supabase Dashboard](https://supabase.com/dashboard), click **Table Editor** on the left menu.
2. Select the **`profiles`** table.
3. Find your row (your name/email).
4. Double-click the **`role`** column (which says `devotee`) and change it to **`super_admin`**.
5. Hit Enter to save.

#### 👉 Method B: Using your Terminal:
Run this single command in your terminal:
```bash
npx supabase db query --linked "update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'YOUR_EMAIL@EXAMPLE.COM');"
```

Now, refresh your website! You will see the **Admin Console** where you can create temple groups, assign mentors, broadcast announcements, and monitor sadhana.

---

## 📱 Mobile App Setup & Building Android APK (`apps/mobile`)

Sadhana Connect includes a high-performance Android mobile app.

### How to Build Your Group's Android APK:
1. Create a free account at [expo.dev](https://expo.dev).
2. In your terminal, go to the mobile folder:
   ```bash
   cd apps/mobile
   ```
3. Connect your app to your Expo account:
   ```bash
   npx eas login
   npx eas init
   ```
   *(Select your Expo username when prompted — this links the project to your account).*
4. Build the shareable Android APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   EAS will build the APK in the cloud (takes ~3–5 minutes). Once finished, it provides a download link and QR code!
5. Share the download link on your community's WhatsApp group.

### Instant Updates (No need for devotees to download a new APK):
Whenever you change text, colors, or fix bugs:
```bash
npx eas-cli update --branch preview --message "Updated announcement"
```
Devotees' apps will automatically update when opened!

For complete mobile details, see the **[Mobile Operations & Deployment Guide](apps/mobile/MOBILE_GUIDE.md)**.

---

## 🔄 Free Database Keep-Alive (Prevent Inactivity Sleep)

Free-tier Supabase databases automatically pause if no queries occur for 7 consecutive days. To prevent this, this repository includes an automated GitHub Action (`.github/workflows/supabase-keep-alive.yml`) that pings your database every 3 days.

### To Enable:
1. In your GitHub repository fork, go to **Settings ➔ Secrets and variables ➔ Actions**.
2. Click **New repository secret** and add:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon / public key
3. In the **Actions** tab of your repo, click **Supabase Keep-Alive Ping ➔ Run workflow** to test it. That's it!

---

## 🎨 Customizing for Your Temple

- **WhatsApp Share Number**: Devotees can set their mentor's WhatsApp number inside their **Profile** or choose from their phone contacts when sharing. To set a group default, edit `WHATSAPP_RECIPIENT_NUMBER` in `packages/sadhana/src/whatsapp-recipient.ts`.
- **App Name & Titles**: Edit the name in `index.html` (web) and `apps/mobile/app.json` (mobile).
- **Logos & Icons**: Replace the icons in `apps/mobile/assets/` and `public/`.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Is this 100% free forever?</b></summary>
Yes. Supabase, Vercel, and Expo EAS all provide robust free tiers that easily support communities of hundreds of active devotees without paying anything.
</details>

<details>
<summary><b>Can other temples or developers see our devotees' reports?</b></summary>
No. Because you deploy to your own Supabase database and your own Vercel account, your data is 100% isolated and visible only to you and your authorized mentors.
</details>

<details>
<summary><b>Can iPhone (iOS) users use this?</b></summary>
Yes! The web app is a full Progressive Web App (PWA). Devotees with iPhones can open your Vercel link in Safari, tap the Share icon, and select <b>"Add to Home Screen"</b>. It installs and functions like a native mobile app.
</details>

<details>
<summary><b>What if devotees see a "Blocked by Play Protect" warning when installing the APK?</b></summary>
Because the APK is downloaded directly from your community link (instead of Google Play Store), Android displays a standard security prompt. Devotees simply tap <b>"Details" ➔ "Install anyway"</b>.
</details>

---

## 🤝 Contributing & License

Contributions, translations, and suggestions from all devotee communities are warmly welcome!

Licensed under the **[MIT License](LICENSE)** — free to fork, customize, and share.
