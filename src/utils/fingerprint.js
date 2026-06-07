async function hashString(value) {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateFingerprint() {
  let ip = 'unknown';

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (response.ok) {
      const data = await response.json();
      ip = data.ip;
    }
  } catch {
    ip = 'unavailable';
  }

  const browser = navigator.userAgent;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const platform = navigator.platform;

  const raw = [ip, browser, screenInfo, language, timezone, platform].join('|');
  const hash = await hashString(raw);

  return {
    hash,
    ip,
    browser,
    screenInfo,
    language,
    timezone,
    platform,
  };
}
