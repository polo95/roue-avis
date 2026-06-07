import config from '../config';

const VALIDATE_AUTH_KEY = 'roue-avis-validate-auth';
const AUTH_DURATION_MS = 24 * 60 * 60 * 1000;

export function isValidateAuthenticated() {
  try {
    const raw = localStorage.getItem(VALIDATE_AUTH_KEY);
    if (!raw) return false;

    const { expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(VALIDATE_AUTH_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function setValidateAuthenticated() {
  localStorage.setItem(
    VALIDATE_AUTH_KEY,
    JSON.stringify({ expiresAt: Date.now() + AUTH_DURATION_MS })
  );
}

export function checkMerchantPassword(password) {
  return password === config.dashboardPassword;
}
