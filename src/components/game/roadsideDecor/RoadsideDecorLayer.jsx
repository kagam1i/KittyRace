// src/components/game/roadsideDecor/RoadsideDecorLayer.jsx
// --------------------------------------------------------
// Генерация декораций на обочине:
// - rAF + dt (синхронно с дорогой)
// - вариативный шаг по Y
// - равные шансы типов
// - редкие, но заметные деревья
// - первичное заполнение всей высоты
//
// ✅ Mobile adaptive fix:
// - на мобилках обочина узкая
// - если рисовать спрайты с фиксированным ROADSIDE_DECOR.SCALE,
//   декор начинает вылезать/обрезаться overflow'ом
// - поэтому вычисляем maxScale по shoulderW и передаём в DecorSprite
// --------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { ROADSIDE_DECOR } from "./roadsideDecor.config";
import DecorSprite from "./DecorSprite";

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function pickSmallType() {
  const list = ROADSIDE_DECOR.SMALL_WEIGHTS;
  const sum = list.reduce((a, x) => a + x.weight, 0);
  const r = Math.random() * sum;

  let acc = 0;
  for (const it of list) {
    acc += it.weight;
    if (r <= acc) return it.type;
  }
  return "grass";
}

function pickTreeVariant() {
  const v = ROADSIDE_DECOR.TREE_VARIANTS;
  return v[Math.floor(Math.random() * v.length)];
}

function nextGapY() {
  const base = ROADSIDE_DECOR.GAP_BASE_Y_PX;
  const jitter = ROADSIDE_DECOR.GAP_JITTER_Y_PX;
  const g = base + randBetween(-jitter, jitter);
  return Math.round(clamp(g, base * 0.65, base * 1.35));
}

// Чуть чаще хотим дерево, чем small (spacing всё равно защитит)
function pickCategory() {
  return Math.random() < 0.6 ? "tree" : "small";
}

export default function RoadsideDecorLayer({
  side,
  scrollSpeedPxPerSec,
  shoulderW, // ✅ приходит из TrackShoulders.jsx
}) {
  const hostRef = useRef(null);
  const [hostH, setHostH] = useState(0);
  const [hostW, setHostW] = useState(0);

  const lastTreeYRef = useRef(null);
  const [items, setItems] = useState([]);

  // меряем контейнер (на всякий случай). shoulderW — основной источник ширины.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const measure = () => {
      setHostH(el.clientHeight || 0);
      setHostW(el.clientWidth || 0);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // -------------------------------------------------------
  // ✅ Адаптивный scale по ширине обочины
  // -------------------------------------------------------
  const effectiveShoulderW = useMemo(() => {
    // предпочитаем shoulderW (точнее отражает обочину),
    // но если не пришёл — fallback на реальную ширину контейнера
    return Math.max(1, shoulderW ?? hostW ?? 1);
  }, [shoulderW, hostW]);

  function getMaxScaleForType(type) {
    const decor = ROADSIDE_DECOR.TYPES[type];
    if (!decor) return ROADSIDE_DECOR.SCALE;

    // usable ширина (чуть меньше фактической), чтобы не прилипать к краям
    const usableW = effectiveShoulderW * 0.92;

    // scale чтобы влезло по ширине: decor.w * scale <= usableW
    const fitScale = usableW / decor.w;

    // clamp:
    // - снизу ограничиваем, чтобы не становилось слишком мелко
    // - сверху не превышаем художественный ROADSIDE_DECOR.SCALE
    return clamp(fitScale, 0.75, ROADSIDE_DECOR.SCALE);
  }

  function getXPercentForGroup(group) {
    const ranges = ROADSIDE_DECOR.X_BY_TYPE_PERCENT[group];
    const range = ranges?.[side] ?? ranges?.left;
    return randBetween(range.min, range.max);
  }

  function makeItem({ type, y, group, xPercent }) {
    return {
      id: makeId(),
      type,
      y,
      xPercent: xPercent ?? getXPercentForGroup(group),
      group,
    };
  }

  function canSpawnTreeAtY(y) {
    const lastY = lastTreeYRef.current;
    if (lastY == null) return true;
    return lastTreeYRef.current - y >= ROADSIDE_DECOR.TREE_RULES.MIN_SPACING_PX;
  }

  function pickTypeForSpawnY(y) {
    const cat = pickCategory();

    if (cat === "tree") {
      if (
        Math.random() < ROADSIDE_DECOR.TREE_RULES.CHANCE &&
        canSpawnTreeAtY(y)
      ) {
        const t = pickTreeVariant();
        lastTreeYRef.current = y;
        return { type: t, group: "tree" };
      }
      return { type: pickSmallType(), group: "small" };
    }

    return { type: pickSmallType(), group: "small" };
  }

  // Первичное заполнение всей высоты
  useEffect(() => {
    if (!hostH) return;

    lastTreeYRef.current = null;
    const start = [];

    let y = -ROADSIDE_DECOR.DESPAWN_PADDING_PX;

    while (y < hostH + ROADSIDE_DECOR.DESPAWN_PADDING_PX) {
      if (Math.random() < ROADSIDE_DECOR.SMALL_SPAWN_CHANCE) {
        const { type, group } = pickTypeForSpawnY(y);
        start.push(makeItem({ type, y, group }));

        // "пучок травы" (2 травинки рядом)
        if (
          type === "grass" &&
          Math.random() < ROADSIDE_DECOR.GRASS_CLUMP.CHANCE
        ) {
          const baseX = start[start.length - 1].xPercent;
          const dir = Math.random() < 0.5 ? -1 : 1;
          const r = ROADSIDE_DECOR.X_BY_TYPE_PERCENT.small[side];

          start.push(
            makeItem({
              type: "grass",
              group: "small",
              y: y + randBetween(-10, 10),
              xPercent: clamp(
                baseX + dir * ROADSIDE_DECOR.GRASS_CLUMP.X_OFFSET_PERCENT,
                r.min,
                r.max
              ),
            })
          );
        }
      }

      y += nextGapY();
    }

    setItems(start);
  }, [hostH, side]);

  // Game-loop
  useEffect(() => {
    if (!hostH) return;

    let raf = 0;
    let last = performance.now();

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;
      const dy = scrollSpeedPxPerSec * dt;

      setItems((prev) => {
        const moved = prev.map((it) => ({ ...it, y: it.y + dy }));
        const alive = moved.filter(
          (it) => it.y < hostH + ROADSIDE_DECOR.DESPAWN_PADDING_PX
        );

        const topMost = alive.length
          ? Math.min(...alive.map((it) => it.y))
          : 0;

        const gap = nextGapY();
        if (topMost > -gap && Math.random() < ROADSIDE_DECOR.SMALL_SPAWN_CHANCE) {
          const newY = topMost - gap;
          const { type, group } = pickTypeForSpawnY(newY);
          alive.push(makeItem({ type, y: newY, group }));
        }

        return alive;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hostH, scrollSpeedPxPerSec, side]);

  return (
    <div ref={hostRef} className="absolute inset-0 pointer-events-none">
      {items.map((it) => (
        <DecorSprite
          key={it.id}
          type={it.type}
          xPercent={it.xPercent}
          yPx={it.y}
          // ✅ вот он: scale под ширину обочины
          scale={getMaxScaleForType(it.type)}
        />
      ))}
    </div>
  );
}
