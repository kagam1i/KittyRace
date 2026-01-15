export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
