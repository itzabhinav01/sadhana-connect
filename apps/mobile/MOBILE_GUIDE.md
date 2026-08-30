# 📱 Sadhana Connect Mobile App – Complete Operations & Deployment Guide

This guide contains **every command and step** you need to run, update, build, and distribute the mobile app without having to search or refer to anything else.

---

## ⚡ Quick Command Cheatsheet

| Task | Command (Run in `apps/mobile`) | Description |
| :--- | :--- | :--- |
| **Push Instant In-App Update** | `npx eas update --auto --message "Your message"` | Updates code on all users' phones without building a new APK |
| **Build New APK for Sharing** | `npx eas-cli build -p android --profile preview` | Generates a shareable APK link & QR code via cloud build |
| **Start Local Development** | `npx expo start` | Starts the Metro bundler to test on Expo Go or an emulator |
| **Run Tests** | `npm test` | Runs the full Jest unit test suite |
| **Check Code Quality / Lint** | `npm run lint` | Runs the Expo linter |

---

## 🚀 1. How to Push Instant Updates (Over-The-Air / OTA)

Whenever you edit code, change screens, fix bugs, update colors, or change Supabase logic, **you do NOT need to rebuild the APK**.

### Step 1: Open terminal in `apps/mobile`
```powershell
cd C:\Users\abhin\Projects\sadhana-connect\apps\mobile
```

### Step 2: Push the update
```powershell
npx eas update --auto --message "Fix devotee sadhana form and text"
```

### What happens next:
1. EAS compiles your JavaScript/TypeScript code and assets, and uploads them to Expo's CDN.
2. When your 50–100 devotees open the app on their phones:
   * The app detects the new update in the background.
   * An alert appears: **"Update Available 🎉: A new update is ready. Would you like to download and restart the app now?"**
   * They tap **"Update Now"**, and the app reloads with the new changes in ~2 seconds.
3. Users can also manually check for updates anytime under **Settings ➔ App Updates ➔ "Check for updates"**.

---

## 📦 2. How to Build & Share a Standalone APK

Use this when:
* You are onboarding a new user who needs to install the app for the first time.
* You added a brand-new native library or changed app icons/permissions.

### Step 1: Run the Preview Build command
In `apps/mobile`:
```powershell
npx eas-cli build -p android --profile preview
```

### Step 2: Get the download link
Once the cloud build finishes (~3–5 minutes), EAS will display a URL and a QR code in the terminal:
```
https://expo.dev/accounts/itzabhinav01s-team/projects/sadhana-connect/builds/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Share with Devotees on WhatsApp
Send the link or QR code to your WhatsApp group:
> *"Hare Krishna Prabhu/Mataji 🙏 Please download and install the Sadhana Connect app from this link: [PASTE_LINK_HERE]"*

### ⚠️ Android Installation Note to Share with Users:
Because the APK is downloaded directly (outside the Play Store), Android will show standard safety prompts:
1. **"File might be harmful"**: Tap **"Download anyway"**.
2. **"Install unknown apps" / "Blocked by Play Protect"**: Tap **"Details"** ➔ **"Install anyway"** (or toggle *"Allow from this source"*).

---

## 🌐 3. Alternative: Sharing as a Progressive Web App (PWA)

If you have users with **iPhones (iOS)** or users who don't want to install an APK:

1. Deploy the web app on Vercel:
   ```powershell
   npm run build
   ```
2. Share the website URL: `https://your-domain.vercel.app`
3. Users open the link on their mobile browser:
   * **Android (Chrome)**: Tap **"Install App"** / **"Add to Home Screen"**.
   * **iPhone (Safari)**: Tap the Share button (square with arrow) ➔ **"Add to Home Screen"**.
4. An app icon appears on their phone and runs in full-screen mode like a native app.

---

## 🏪 4. Future: Publishing to Google Play Store

When you are ready to publish the app officially on the Google Play Store:

### Step 1: Build the Production App Bundle (`.aab`)
In `apps/mobile`:
```powershell
npx eas-cli build -p android --profile production
```

### Step 2: Download & Upload to Play Console
1. Download the generated `.aab` file from your Expo dashboard.
2. Go to [Google Play Console](https://play.google.com/console).
3. Create a new release under **Production** (or **Closed Testing**) and upload the `.aab` file.
4. Fill in the store listing, privacy policy, and submit for review.

---

## 🛠️ 5. Local Development & Testing

### To run the app on your computer/phone during development:
```powershell
cd C:\Users\abhin\Projects\sadhana-connect\apps\mobile
npx expo start
```
* Press **`a`** to open on an Android emulator.
* Scan the QR code with **Expo Go** on your Android device to preview live changes.

### To run the automated tests:
```powershell
cd C:\Users\abhin\Projects\sadhana-connect\apps\mobile
npm test
```

### To run the code linter:
```powershell
cd C:\Users\abhin\Projects\sadhana-connect\apps\mobile
npm run lint
```

---

## 📋 Summary Table: When to use which command?

| Change You Made | Command to Run | Users need to reinstall APK? |
| :--- | :--- | :---: |
| Changing text, titles, spiritual quotes, or translations | `npx eas update --auto` | ❌ **No** |
| Fixing a bug or form validation issue | `npx eas update --auto` | ❌ **No** |
| Changing button colors, themes, dark mode styling | `npx eas update --auto` | ❌ **No** |
| Adding a new page, screen, tab, or chart | `npx eas update --auto` | ❌ **No** |
| Updating Supabase database queries or notifications | `npx eas update --auto` | ❌ **No** |
| Adding a new native hardware library (e.g., Camera, Bluetooth) | `npx eas-cli build -p android --profile preview` | ✅ **Yes** |
| Changing app name, package ID, or app icon | `npx eas-cli build -p android --profile preview` | ✅ **Yes** |