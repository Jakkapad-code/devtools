function normalizeOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin, appUrl, allowedOrigins) {
  const candidate = normalizeOrigin(origin);
  if (!candidate) return false;

  return [appUrl, ...allowedOrigins]
    .map(normalizeOrigin)
    .filter(Boolean)
    .includes(candidate);
}
