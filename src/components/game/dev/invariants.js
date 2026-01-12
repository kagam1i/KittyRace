function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Ограничитель для DEV-логов: чтобы не спамило каждый кадр.
 */
export function makeDevLimiter({ minIntervalMs = 700, maxCount = 25 } = {}) {
  let last = 0;
  let count = 0;

  return (fn) => {
    if (!import.meta.env.DEV) return;

    const t = nowMs();
    if (t - last < minIntervalMs) return;
    if (count >= maxCount) return;

    last = t;
    count += 1;
    fn();
  };
}

/**
 * Инвариант: picked-рыба не должна жить дольше popDurationMs (+ небольшой допуск).
 */
export function assertPickedLifetime({ fish, nowMs: t, slackMs = 34, report }) {
  if (!import.meta.env.DEV) return;
  if (!fish?.picked) return;

  const alive = t - (fish.pickedAtMs || 0);
  const limit = (fish.popDurationMs || 0) + slackMs;

  if (alive > limit) {
    report?.({
      type: "picked_lifetime_violation",
      id: fish.id,
      aliveMs: Math.round(alive),
      popDurationMs: Math.round(fish.popDurationMs || 0),
      lane: fish.lane,
    });
  }
}
