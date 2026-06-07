export function parseLotIdFromScan(text) {
  const trimmed = text.trim();

  const urlMatch = trimmed.match(/\/validate\/([a-f0-9-]+)/i);
  if (urlMatch) return urlMatch[1];

  const uuidMatch = trimmed.match(
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
  );
  if (uuidMatch) return trimmed;

  return null;
}
