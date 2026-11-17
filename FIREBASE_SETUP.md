# 🌾 Google Firebase Phone Authentication Guide

This application is equipped with **Google Firebase Phone Authentication** for instant, secure mobile OTP verification.

---

## 🚀 How It Works

1. **Instant Testing / Development Mode**:
   - Out of the box, the app comes with Firebase test mode enabled.
   - You can test with any Indian phone number or use the **Quick Demo Number** (`9876543210` -> Code `4826` / `1234`).
   - Generates simulated SMS push banners with 1-tap auto-fill.

2. **Connecting to Your Live Google Firebase Project (For Real SMS Delivery)**:

### Step 1: Create a Firebase Project
1. Open [Google Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (e.g. name it `KrishiPlan`).

### Step 2: Enable Phone Authentication
1. In Firebase Console, go to **Build** -> **Authentication**.
2. Click the **Sign-in method** tab.
3. Under "Sign-in providers", select **Phone** and toggle **Enable**.

### Step 3: Add Free Test Phone Numbers (Recommended for Google Play / App Store & Testing)
1. In the same **Phone** provider settings, expand **Phone numbers for testing (optional)**.
2. Add your testing phone numbers:
   - Phone: `+91 9876543210`  |  Test verification code: `4826`
   - Phone: `+91 9999999999`  |  Test verification code: `123456`
   *(These numbers authenticate instantly with valid Firebase credentials without consuming SMS quotas).*

### Step 4: Get Your Firebase Web / API Keys
1. Click the **Gear icon (Project Settings)** in the top-left menu.
2. Scroll down to **Your apps** -> Click the **Web (</>) icon**.
3. Register app (e.g. `Krishi App`) -> You will see `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789...:web:abc..."
   };
   ```

### Step 5: Paste Your Keys in the App
Open `src/config/firebase.ts` and replace the placeholder values with your keys:
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};
```

Once saved, the app will automatically switch to **Live Firebase Cloud SMS** delivery!
