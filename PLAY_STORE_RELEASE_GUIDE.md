# AspirantX: Focus Galaxy — Play Store Release Guide 🚀

## 📦 What's Inside This Release Package:
1. **Google Play Production Bundle (`.aab`):**
   - Path: `RELEASE_ARTIFACTS/app-release.aab` (Signed with `aspirantx-release-key.keystore`)
   - Size: ~18.5 MB
   - Ready for Google Play Console Internal / Production Track.

2. **Direct Phone Install (`.apk`):**
   - Path: `RELEASE_ARTIFACTS/aspirantx.apk`
   - Ready for direct sideloading and instant physical phone testing without Play Store wait.

3. **Compliant Privacy Policy:**
   - Path: `RELEASE_ARTIFACTS/privacy.html` (also at `public/privacy.html`)
   - URL once deployed: `https://your-domain.com/privacy` or hosted on Vercel/GitHub Pages.

4. **Complete Source Code:**
   - 3D Procedural Planet & Living Constellation Map (`Three.js`)
   - Web Audio Synthesizer (`cosmicAudio.ts`)
   - Screen WakeLock & Haptics (`useFocusPeripherals.ts`)
   - 1-Click 1080x1920 Cosmic Story Card Generator (`ShareCosmicCard.tsx`)
   - Internal QA & Stress Test Harness (`/debug-galaxy`)

---

## 🛠️ Google Play Console Upload Checklist:

### Step 1: Create App
- **App Name:** `AspirantX: Focus Galaxy` (or your preferred title)
- **Default Language:** English (United States) / English (India)
- **App or Game:** App
- **Free or Paid:** Free

### Step 2: Set Up Privacy Policy
- In Google Play Console -> **Policy and Programs** -> **App Content** -> **Privacy Policy**
- Enter the URL where `privacy.html` is hosted (e.g., `https://aspirantx.vercel.app/privacy` or `https://aspirantx.vercel.app/privacy.html`).

### Step 3: Data Safety Form
- **Does your app collect data?** Yes (Email/User ID for Supabase authentication and cloud sync).
- **Is user data shared with third parties?** No.
- **Is data encrypted in transit?** Yes (all network traffic uses TLS/HTTPS).
- **Can users request account deletion?** Yes.

### Step 4: Target Audience & Content Rating
- Target Age: 13+ (Students / Aspirants)
- Complete the standard IARC rating questionnaire (No violence, gambling, or offensive material).

### Step 5: Upload the .AAB (Internal Testing First)
1. Go to **Testing** -> **Internal Testing**.
2. Click **Create new release**.
3. Drag & drop `RELEASE_ARTIFACTS/app-release.aab`.
4. Enter release notes (e.g. `Initial release of AspirantX Focus Galaxy: 3D procedural focus planets, cosmic audio synth, and study streak tracking.`).
5. Save and rollout release.
6. Copy the tester join link and install immediately on your device!

---

## 🔑 Keystore Signing Details (Stored in Safe Keeping)
- **Keystore File:** `android/app/aspirantx-release-key.keystore`
- **Key Alias:** `aspirantx`
- **Keystore Password:** `aspirantx2026`
- **Key Password:** `aspirantx2026`
- **Signature Scheme:** v1 + v2 (full Play Integrity compliant)
