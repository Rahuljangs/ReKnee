/**
 * Set to true to run without Firebase/RevenueCat (works in Expo Go).
 * Set to false for production builds with full Firebase backend.
 */
export const DEV_MODE = true;

export const GEMINI_API_KEY = 'AIzaSyBWOChOhQ9hssZnkEH0NWqXf4PullXY5Ko';
export const GEMINI_MODEL = 'gemini-2.5-flash-lite';
export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export const CLOUD_FUNCTION_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5001/reknee-e7381/us-central1'
  : 'https://us-central1-reknee-e7381.cloudfunctions.net';

export const PHASE_NAMES: Record<number, string> = {
  1: 'Protection & Early Motion',
  2: 'Early Strengthening',
  3: 'Progressive Strengthening',
  4: 'Sport-Specific Training',
  5: 'Return to Sport',
};

export const PREMIUM_PHASE_THRESHOLD = 3;

export const SUBSCRIPTION_PRODUCT_ID = 'reknee_premium_monthly';

export const DAILY_CHECKIN_HOUR = 9;

export const APP_VERSION = '1.0.0';
