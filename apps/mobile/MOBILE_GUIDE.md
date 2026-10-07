# 📱 Sadhana Connect Mobile App – Operations & Deployment Guide

This guide contains **every command and step** you need to set up, build, test, update, and distribute the Sadhana Connect mobile application for your own devotee community.

---

## ⚡ Quick Command Cheatsheet

All commands should be executed from the `apps/mobile` directory:

| Task | Command | Description |
| :--- | :--- | :--- |
| **Link Own Expo Project** | `npx eas init` | One-time setup to connect the app to your own Expo account |
| **Push Instant In-App Update** | `npx eas-cli update --branch preview --message "Your message"` | Updates code on devotees' phones without rebuilding the APK |
| **Build Shareable Android APK** | `npx eas-cli build -p android --profile preview` | Generates a shareable APK link & QR code via cloud build |
| **Start Local Development** | `npx expo start` | Starts Metro bundler to preview in Expo Go or emulator |
| **Run Unit Tests** | `npm test` | Runs the Jest test suite |
| **Check Code Quality / Lint** | `npm run lint` | Runs the Expo linter |

---

## 🛠️ Step 0: First-Time Setup for Your Own Community

If you have forked this repository and want to build the mobile app for your own group:

### 1. Create a Free Expo Account
Go to [expo.dev/signup](https://expo.dev/signup) and create a free account.

### 2. Set Up Environment Variables
Inside `apps/mobile`, create a `.env` file (or copy `.env.example`):
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```
*(Note: If you ran `npm run setup` in the root repository, this file was already generated for you!)*

### 3. Initialize Your EAS Project
Run the following in `apps/mobile`:
```bash
npx eas login
npx eas init
```
This links your repository to your own Expo organization/account and updates the `projectId` and `owner` inside `apps/mobile/app.json`.

### 4. (Optional) Customize App Name & Package ID
In `apps/mobile/app.json`:
- `"name"`: Change `"Sadhana Connect"` to your community's name if desired.
- `"android.package"`: Set a unique package identifier (e.g. `com.yourtemple.sadhana`).
- `"scheme"`: Custom deep link scheme (e.g. `yourtempleapp`).

---

## 🚀 1. How to Push Instant Updates (Over-The-Air / OTA)

Whenever you edit screens, fix bugs, update colors, or improve sadhana metrics, **you do NOT need to rebuild the APK**. Devotees receive the update instantly.

### Step 1: Open terminal in `apps/mobile`
```bash
cd apps/mobile
```

### Step 2: Push the update
```bash
npx eas-cli update --branch preview --message "Added study hours & decimal tracking"
```
*(For production release builds: `npx eas-cli update --branch production --message "Release notes here"`)*

### What happens on devotees' phones:
1. EAS compiles your JavaScript/TypeScript code and uploads the bundle to Expo's global CDN.
2. When devotees open the app:
   - The app detects the update in the background.
   - An alert appears with your release notes: **"Update Available 🎉: A new update is ready. Would you like to download and restart the app now?"**
   - Tapping **"Update Now"** downloads the bundle and restarts the app with the changes in ~2 seconds.
3. Devotees can also manually check for updates anytime under **Settings ➔ App Updates ➔ "Check for updates"**.

---

## 📦 2. How to Build & Share a Standalone Android APK

Use this when:
- Onboarding a new devotee who needs to install the app for the first time.
- Adding native Android dependencies or changing permissions/app icons.

### Step 1: Run the Preview Build command
In `apps/mobile`:
```bash
npx eas-cli build -p android --profile preview
```
EAS builds the APK in the cloud (no local Android SDK or Android Studio installation required).

### Step 2: Get the download link
Once the cloud build finishes (~3–5 minutes), EAS prints a download URL and displays a scannable QR code in your terminal:
```text
https://expo.dev/artifacts/eas/.../sadhana-connect.apk
```

### Step 3: Share with Devotees on WhatsApp / Telegram
Copy the link or QR code and share it with your group:
> *"Hare Krishna Prabhus & Matajis 🙏 Please download and install the Sadhana Connect app from this link: [PASTE_LINK_HERE]"*

### ⚠️ Android Installation Guidance for Users:
Because the APK is downloaded directly (outside the Google Play Store), Android displays standard safety notices:
1. **"File might be harmful"**: Tap **"Download anyway"**.
2. **"Install unknown apps" / "Blocked by Play Protect"**: Tap **"Details"** ➔ **"Install anyway"** (or enable *"Allow from this source"*).

---

## 🔔 3. Push Notifications & Lock-Screen Alerts

Sadhana Connect includes built-in notifications:
- **Lock-Screen Announcements**: When administrators broadcast temple announcements, a high-importance Android notification channel posts an alert directly to the devotee's phone status bar and lock screen.
- **Daily Sadhana Reminders**: Scheduled local reminders prompt devotees to complete and submit their sadhana reports.
- **In-App Notification Center**: Unread badges and a dedicated notifications panel keep users up to date with group news.

---

## 🌐 4. Alternative: Progressive Web App (PWA)

If some members in your community use **iPhones (iOS)** or prefer not to install an APK:

1. Deploy the web app on Vercel as described in the main [README.md](../../README.md).
2. Share the website address: `https://your-community.vercel.app`.
3. Users open the link on their mobile browser:
   - **iPhone (Safari)**: Tap the Share button (square with arrow) ➔ **"Add to Home Screen"**.
   - **Android (Chrome)**: Tap the three dots menu ➔ **"Install App"** / **"Add to Home Screen"**.
4. The app icon appears on their home screen and functions full-screen just like a native app.

---

## 🏪 5. Publishing to Google Play Store (Optional)

When your temple is ready to publish officially on Google Play:

### Step 1: Build the Production App Bundle (`.aab`)
In `apps/mobile`:
```bash
npx eas-cli build -p android --profile production
```

### Step 2: Upload to Google Play Console
1. Download the generated `.aab` file from your Expo dashboard.
2. Open your [Google Play Console](https://play.google.com/console).
3. Create a new release under **Production** or **Closed Testing**, upload the `.aab`, and submit for review.

---

## 🛠️ 6. Local Development & Testing

To test the mobile app on your development computer or phone:

```bash
cd apps/mobile
npx expo start
```
- Press **`a`** to launch on an Android emulator.
- Scan the terminal QR code with the **Expo Go** app on a physical Android device to test live changes.

### Automated Test Suite:
```bash
npm test
```

### Linter:
```bash
npm run lint
```

---

## 📋 Summary: Rebuild APK vs. Instant OTA Update?

| Change Made | Command to Run | Devotees Reinstall APK? |
| :--- | :--- | :---: |
| Changing text, titles, quotes, translations | `npx eas-cli update --branch preview` | ❌ **No** |
| Adding/modifying sadhana metrics (study, rest, japa) | `npx eas-cli update --branch preview` | ❌ **No** |
| Fixing bugs or UI layout | `npx eas-cli update --branch preview` | ❌ **No** |
| Updating Supabase queries or business logic | `npx eas-cli update --branch preview` | ❌ **No** |
| Adding a new native hardware module (Bluetooth, Camera) | `npx eas-cli build -p android --profile preview` | ✅ **Yes** |
| Changing app package ID (`android.package`) or icon | `npx eas-cli build -p android --profile preview` | ✅ **Yes** |