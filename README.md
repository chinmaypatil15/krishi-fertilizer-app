# KrishiPlan — Farmer Fertilizer Scheduler (React Native / Expo)

A mobile app for farmers built with **React Native (Expo + TypeScript)** where entering a **crop**, **sowing date**, and **farm area** automatically generates a complete, stage-by-stage fertilizer schedule with bag counts, NPK tracking, cost estimation, local reminders, and `.ics` calendar export.

## Supported Crops (Out of the Box)
- **Wheat** (गेहूँ) — Basal, CRI (Day 21), Tillering (Day 45)
- **Rice / Paddy** (धान) — Basal, Active Tillering (Day 21), Panicle Initiation (Day 45)
- **Maize** (मक्का) — Basal, Knee-High (Day 25), Pre-Tasseling (Day 45)
- **Cotton** (कपास) — Basal, Square Formation (Day 30), Flowering (Day 60), Boll Development (Day 85)
- **Sugarcane** (गन्ना) — Planting Basal, Tillering (Day 45), Grand Growth (Day 90), Earthing-Up (Day 120)
- **Soybean** (सोयाबीन) — Basal + Sulphur, Vegetative Starter (Day 25), Pod Initiation Spray (Day 45)
- **Chickpea / Gram** (चना) — Basal + Sulphur, Branching Boost (Day 30), Flowering & Pod Filling Spray (Day 55)
- **Banana** (केला) — Planting Basal, Early Vegetative (Day 45), Active Canopy (Day 90), Floral Initiation (Day 150), Bunch Filling (Day 210)

## Key Features
- **Automatic Sowing-to-Harvest Timeline**: Enter sowing date to generate exact application dates, growth phase notes, and agronomic tips.
- **Area & Bag Dosage Calculator**: Supports **Acres**, **Hectares**, and **Bigha** (`1 Bigha ≈ 0.619 Acres`) and calculates exact **kg** plus standard bag counts (Urea 45 kg, DAP 50 kg, MOP 50 kg, etc.).
- **NPK & Cost Tracker**: Tracks planned vs. applied Nitrogen (`N`), Phosphorus (`P₂O₅`), and Potassium (`K₂O`), plus spent vs. total estimated cost using editable local bag prices.
- **Mark Applied & Overdue Alerts**: Dashboard highlights overdue and upcoming doses (next 7 days) across all plots.
- **Reminders & Calendar Export**: Schedules local morning alerts via `expo-notifications` and exports RFC 5545 `.ics` calendar files for Google/Apple Calendar.
- **Bilingual UI (English + हिन्दी)**: Instant 1-tap toggle in the app header and Settings.

## Running the App Locally

### 1. Prerequisites
Install **Node.js (LTS 20+)** from https://nodejs.org/ and **Expo Go** on your Android/iOS phone (or an Android/iOS emulator).

### 2. Install Dependencies & Start Expo
```bash
cd krishi-fertilizer-app
npm install
npx expo start
```

- Scan the QR code with **Expo Go** (Android/iOS) to run on your phone.
- Press `a` for Android emulator, `i` for iOS simulator, or `w` to preview in a web browser.
- Run TypeScript typechecking with:
```bash
npm run typecheck
```
