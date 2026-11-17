# 📱 KrishiPlan Android APK निर्मिती मार्गदर्शक (Build Guide)

या अ‍ॅपची मोबाईलवर इन्स्टॉल करण्यासाठी **APK फाईल** तयार करण्याचे २ सोपे मार्ग उपलब्ध आहेत.

---

## पर्याय १: EAS Cloud Build (सर्वात सोपा आणि शिफारस केलेला मार्ग) 🚀

या पद्धतीमध्ये तुमच्या संगणकावर Android Studio किंवा Java ची गरज नसते. Expo च्या क्लाऊड सर्व्हरवर थेट इन्स्टॉल होणारी `.apk` फाईल तयार होते.

### कृती (Steps):

1. **नवीन टर्मिनल उघडा** (PowerShell / Command Prompt):
   ```powershell
   cd C:\Users\Admin\.gemini\antigravity\scratch\krishi-fertilizer-app
   ```

2. **EAS CLI इन्स्टॉल करा**:
   ```powershell
   npm install -g eas-cli
   ```

3. **Expo खात्यात लॉगिन करा** (खाते नसल्यास [expo.dev](https://expo.dev) वर मोफत तयार करा):
   ```powershell
   npx eas login
   ```

4. **APK बिल्ड सुरू करा**:
   ```powershell
   npx eas build -p android --profile preview
   ```
   *(किंवा `npm run build:apk`)*

5. **डाऊनलोड करा**:
   - बिल्ड पूर्ण झाल्यावर (~५ ते ७ मिनिटांत) टर्मिनलमध्ये **डायरेक्ट डाऊनलोड लिंक** आणि **QR Code** दिसेल.
   - मोबाईलच्या कॅमेऱ्याने QR Code स्कॅन करून थेट मोबाईलमध्ये `KrishiPlan.apk` डाऊनलोड व इन्स्टॉल करू शकता!

---

## पर्याय २: स्थानिक संगणकावर बिल्ड (Local Gradle Build) 💻

स्थानिक Android प्रोजेक्ट आधीच तयार केला आहे (`android/` फोल्डरमध्ये).

### आवश्यक बाबी:
1. **Java JDK 17** (किंवा 21) इन्स्टॉल असणे आवश्यक आहे.
2. **Android SDK / Android Studio** इन्स्टॉल असणे आवश्यक आहे.

### कृती:
```powershell
cd C:\Users\Admin\.gemini\antigravity\scratch\krishi-fertilizer-app\android
.\gradlew.bat assembleDebug
```

बिल्ड झाल्यावर APK फाईल या ठिकाणी तयार होईल:
📁 `android\app\build\outputs\apk\debug\app-debug.apk`

ही फाईल USB केबल किंवा WhatsApp ने मोबाईलवर पाठवून थेट इन्स्टॉल करता येते.

---

## पर्याय ३: त्वरित मोबाईलवर वापरणे (Expo Go - कोणतीही बिल्ड न करता) ⚡

जर लगेच अ‍ॅप मोबाईलवर चालवून पाहायचे असेल:
1. मोबाईलमध्ये Play Store वरून **Expo Go** अ‍ॅप डाउनलोड करा.
2. संगणकावर टर्मिनलमध्ये कमांड चालवा:
   ```powershell
   cd C:\Users\Admin\.gemini\antigravity\scratch\krishi-fertilizer-app
   npx expo start
   ```
3. स्क्रीनवर दिसणारा QR Code **Expo Go** ने स्कॅन करा — संपूर्ण अ‍ॅप मोबाईलवर सुरू होईल!
