export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickWeighted(list) {
  const safe = Array.isArray(list) ? list : [];
  if (safe.length === 0) return null;

  const sum = safe.reduce((s, x) => s + (x?.w ?? 0), 0);
  if (sum <= 0) return safe[0]?.type ?? null;

  let r = Math.random() * sum;
  for (const x of safe) {
    r -= x.w;
    if (r <= 0) return x.type;
  }
  return safe[0].type;
}

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeTypeId(rawTypeId) {
  if (rawTypeId == null) return rawTypeId;

  const s = String(rawTypeId);
  const low = s.toLowerCase();

  if (low.includes("sidestep")) return "sidestep";
  if (low.includes("side-step")) return "sidestep";
  if (low.includes("side_step")) return "sidestep";
  if (low === "sidestep") return "sidestep";

  if (low === "sidestepobstacle" || low === "sidestepl") return "sidestep";
  if (s === "sideStep") return "sidestep";

  return rawTypeId;
}
