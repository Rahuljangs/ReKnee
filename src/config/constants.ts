export const LLM_API_KEY = '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';
export const LLM_MODEL = 'meta/llama-3.3-70b-instruct';
export const LLM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

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
