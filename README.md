# ReKnee - ACL Recovery Companion

A freemium, AI-powered ACL rehabilitation companion app built with Expo (React Native + TypeScript), Firebase, and Gemini 3.1 Flash-Lite.

## Architecture

**Hybrid Architecture** — The app strictly separates:

- **Deterministic Layer** (`ClinicalEngine.ts`): Hard-coded TypeScript state machine controlling all phase progressions, functional criteria, and DVT triage. The LLM has zero authority over clinical decisions.
- **Generative Layer** (Gemini 3.1 Flash-Lite via Cloud Functions): Conversational UI, semantic data extraction, and empathetic coaching. Acts only as the presentation layer.

## Tech Stack

- **Frontend**: Expo SDK 56, React Native, TypeScript, Expo Router
- **Backend**: Firebase Auth, Firestore, Cloud Functions v2
- **AI**: Google Gemini 3.1 Flash-Lite (structured outputs)
- **Payments**: RevenueCat (freemium — Phase 1-2 free, Phase 3-5 paid)
- **Notifications**: Expo Notifications + FCM v1

## Setup

### 1. Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g eas-cli`
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore, Auth (Google provider), and Cloud Functions enabled
- A Google Cloud project with the Gemini API enabled
- A RevenueCat account (free up to $2,500/mo revenue)

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** > **Sign-in method** > **Google**
3. Enable **Cloud Firestore** (start in production mode)
4. Download `google-services.json` (Android) and place in project root
5. Copy your Web Client ID from Authentication settings

### 3. Configure Secrets

```bash
# Copy environment template
cp .env.example .env

# Set Gemini API key as Firebase secret
firebase functions:secrets:set GEMINI_API_KEY
```

Update these files with your credentials:
- `src/contexts/AuthContext.tsx` — Replace `YOUR_WEB_CLIENT_ID`
- `src/services/PurchaseService.ts` — Replace RevenueCat API keys
- `src/config/constants.ts` — Replace Cloud Function URLs
- `app.json` — Replace `YOUR_EAS_PROJECT_ID`

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 6. Run Locally

```bash
# Install dependencies
npm install

# Start dev server (requires development build, NOT Expo Go)
npx expo start --dev-client
```

> Push notifications do NOT work in Expo Go as of SDK 53+. You must use a development build.

### 7. Create Development Build

```bash
npx eas init  # First time only
eas build -p android --profile development
```

## Play Store Deployment

### Build Production AAB

```bash
eas build -p android --profile production
```

This generates an `.aab` (Android App Bundle) file.

### Google Play Console Checklist

1. **Create app** in [Google Play Console](https://play.google.com/console)
2. **Package name**: `com.reknee.app`
3. **App category**: Health & Fitness
4. **Content rating**: Complete the questionnaire (no violence, no gambling, health-related content)
5. **Privacy policy**: Required — host at your domain (e.g., `https://reknee.app/privacy`)
6. **Data safety form**: Declare:
   - Personal info collected (name, email via Google Sign-In)
   - Health info collected (surgery date, symptoms, exercise logs)
   - Data encrypted in transit (Firebase uses TLS)
   - Data processing via third-party AI (Gemini API)
7. **Medical disclaimer** in app description:
   > "ReKnee is a wellness companion and adherence tracker. It does not provide medical diagnosis, treatment, or replace professional medical advice. Always consult your physician or physiotherapist."
8. **App signing**: Opt into Google Play App Signing (recommended)
9. **Upload AAB** to Internal Testing track first, then promote to Production

### Health & Fitness Policy Compliance

Google Play has specific policies for health apps. ReKnee is positioned as a **wellness companion** (not a medical device) to avoid SaMD classification:
- No diagnostic claims
- No treatment prescriptions
- Positioned as "adherence tracker" supplementing doctor-prescribed rehab
- DVT alerts explicitly say "contact your doctor" (not "you have DVT")

## Project Structure

```
ReKnee/
├── app/                        # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab navigation (Chat, Exercises, Settings)
│   │   ├── index.tsx          # Chat screen (main UI)
│   │   ├── exercises.tsx      # Phase-specific exercise checklist
│   │   └── settings.tsx       # User profile and app settings
│   ├── _layout.tsx            # Root layout with AuthProvider
│   ├── login.tsx              # Google Sign-In screen
│   ├── onboarding.tsx         # Surgery date + graft type form
│   ├── dvt-emergency.tsx      # Full-screen DVT alert (non-dismissible)
│   └── paywall.tsx            # RevenueCat subscription screen
├── src/
│   ├── config/
│   │   ├── constants.ts       # App-wide constants
│   │   └── firebase.ts        # Firebase initialization
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── services/
│   │   ├── ClinicalEngine.ts  # 5-phase state machine (DETERMINISTIC)
│   │   ├── DVTTriageService.ts # DVT red flag detection (DETERMINISTIC)
│   │   ├── ExerciseRegistry.ts # Hard-coded exercise database
│   │   ├── ChatService.ts     # Chat API integration
│   │   ├── NotificationService.ts # Push notification setup
│   │   └── PurchaseService.ts # RevenueCat integration
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── utils/
│       └── useAppColorScheme.ts
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       ├── index.ts           # Cloud Function endpoints
│       ├── systemPrompt.ts    # Gemini system prompt builder
│       └── dvtCheck.ts        # Server-side DVT detection
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
├── firebase.json              # Firebase project config
├── eas.json                   # EAS Build profiles
└── app.json                   # Expo app config
```

## Cost Estimates

| Service | Free Tier | Cost at 500 DAU |
|---------|-----------|-----------------|
| Gemini 3.1 Flash-Lite | N/A | ~$0.50/day ($15/mo) |
| Firebase Firestore | 50K reads/day | Free |
| Firebase Cloud Functions | 2M invocations/mo | Free |
| Firebase Auth | Unlimited | Free |
| Expo Push Notifications | Free | Free |
| RevenueCat | Free up to $2,500/mo rev | Free |

## License

Proprietary. All rights reserved.
