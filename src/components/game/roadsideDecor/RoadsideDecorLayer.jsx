// --------------------------------------------------------
// Генерация декораций на обочине
// --------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { ROADSIDE_DECOR } from "./roadsideDecor.config";
import DecorSprite from "./DecorSprite";

import {
  clamp,
  nextGapY,
  pickTypeForSpawnY,
  makeItem,
  randBetween,
} from "./roadsideDecor.utils";

export default function RoadsideDecorLayer({
  side,
  scrollSpeedRef,
  status,
  runId,
  shoulderW,
  subscribeWorld,
  worldOffsetRef,
}) {
  const hostRef = useRef(null);
  const [hostH, setHostH] = useState(0);
  const [hostW, setHostW] = useState(0);

  const lastTreeYRef = useRef(null);

  const itemsRef = useRef([]);
  const [, bumpRender] = useState(0);

  // float offset (для логики), transform — по целым px
  const scrollOffsetRef = useRef(0);

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

  const effectiveShoulderW = useMemo(() => {
    return Math.max(1, shoulderW ?? hostW ?? 1);
  }, [shoulderW, hostW]);

  function getMaxScaleForType(type) {
    const decor = ROADSIDE_DECOR.TYPES[type];
    if (!decor) return ROADSIDE_DECOR.SCALE;

    const usableW = effectiveShoulderW * 0.92;
    const fitScale = usableW / decor.w;
    return clamp(fitScale, 0.75, ROADSIDE_DECOR.SCALE);
  }

  useEffect(() => {
    if (!hostH) return;
    if (status !== "running") return;

    lastTreeYRef.current = null;
    const start = [];

    let y = -ROADSIDE_DECOR.DESPAWN_PADDING_PX;

    while (y < hostH + ROADSIDE_DECOR.DESPAWN_PADDING_PX) {
      if (Math.random() < ROADSIDE_DECOR.SMALL_SPAWN_CHANCE) {
        const pick = pickTypeForSpawnY(ROADSIDE_DECOR, y, lastTreeYRef.current);
        lastTreeYRef.current = pick.nextLastTreeY;

        start.push(makeItem(ROADSIDE_DECOR, { type: pick.type, y, group: pick.group, side }));

        if (pick.type === "grass" && Math.random() < ROADSIDE_DECOR.GRASS_CLUMP.CHANCE) {
          const baseX = start[start.length - 1].xPercent;
          const dir = Math.random() < 0.5 ? -1 : 1;
          const r = ROADSIDE_DECOR.X_BY_TYPE_PERCENT.small[side];

          start.push(
            makeItem(ROADSIDE_DECOR, {
              type: "grass",
              group: "small",
              y: y + randBetween(-10, 10),
              side,
              xPercent: clamp(
                baseX + dir * ROADSIDE_DECOR.GRASS_CLUMP.X_OFFSET_PERCENT,
                r.min,
                r.max
              ),
            })
          );
        }
      }

      y += nextGapY(ROADSIDE_DECOR);
    }

    itemsRef.current = start;
    scrollOffsetRef.current = 0;
    if (hostRef.current) hostRef.current.style.transform = "translate3d(0px, 0px, 0px)";
    bumpRender((x) => x + 1);
  }, [hostH, side, runId]);

  useEffect(() => {
    if (!hostH) return;
    if (status !== "running") return;

    if (typeof subscribeWorld === "function") {
      const unsubscribe = subscribeWorld(({ worldOffset, worldOffsetPx }) => {
        scrollOffsetRef.current = typeof worldOffset === "number" ? worldOffset : 0;

        if (hostRef.current) {
          hostRef.current.style.transform = `translate3d(0px, ${worldOffsetPx}px, 0px)`;
        }

        const offset = scrollOffsetRef.current;
        const beforeLen = itemsRef.current.length;

        itemsRef.current = itemsRef.current.filter(
          (it) => it.y + offset < hostH + ROADSIDE_DECOR.DESPAWN_PADDING_PX
        );

        const topMostScreenY = itemsRef.current.length
          ? Math.min(...itemsRef.current.map((it) => it.y + offset))
          : 0;

        const gap = nextGapY(ROADSIDE_DECOR);
        if (topMostScreenY > -gap && Math.random() < ROADSIDE_DECOR.SMALL_SPAWN_CHANCE) {
          const newScreenY = topMostScreenY - gap;
          const baseY = newScreenY - offset;

          const pick = pickTypeForSpawnY(ROADSIDE_DECOR, baseY, lastTreeYRef.current);
          lastTreeYRef.current = pick.nextLastTreeY;

          itemsRef.current.push(
            makeItem(ROADSIDE_DECOR, { type: pick.type, y: baseY, group: pick.group, side })
          );
        }

        if (itemsRef.current.length !== beforeLen) bumpRender((x) => x + 1);
      });

      return unsubscribe;
    }

    // fallback: старое поведение (локальный rAF)
    let raf = 0;
    let last = performance.now();

    const tick = (ts) => {
      const dt = (ts - last) / 1000;
      last = ts;
      const speed = scrollSpeedRef?.current ?? 0;
      const dy = speed * dt;

      scrollOffsetRef.current += dy;

      const rounded = Math.round(scrollOffsetRef.current);
      if (hostRef.current) {
        hostRef.current.style.transform = `translate3d(0px, ${rounded}px, 0px)`;
      }

      const offset = scrollOffsetRef.current;
      const beforeLen = itemsRef.current.length;

      itemsRef.current = itemsRef.current.filter(
        (it) => it.y + offset < hostH + ROADSIDE_DECOR.DESPAWN_PADDING_PX
      );

      const topMostScreenY = itemsRef.current.length
        ? Math.min(...itemsRef.current.map((it) => it.y + offset))
        : 0;

      const gap = nextGapY(ROADSIDE_DECOR);
      if (topMostScreenY > -gap && Math.random() < ROADSIDE_DECOR.SMALL_SPAWN_CHANCE) {
        const newScreenY = topMostScreenY - gap;
        const baseY = newScreenY - offset;

        const pick = pickTypeForSpawnY(ROADSIDE_DECOR, baseY, lastTreeYRef.current);
        lastTreeYRef.current = pick.nextLastTreeY;

        itemsRef.current.push(
          makeItem(ROADSIDE_DECOR, { type: pick.type, y: baseY, group: pick.group, side })
        );
      }

      if (itemsRef.current.length !== beforeLen) bumpRender((x) => x + 1);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hostH, status, scrollSpeedRef, side, subscribeWorld]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 pointer-events-none"
      style={{ willChange: "transform" }}
    >
      {itemsRef.current.map((it) => (
        <DecorSprite
          key={it.id}
          type={it.type}
          xPercent={it.xPercent}
          yPx={it.y}
          scale={getMaxScaleForType(it.type)}
        />
      ))}
    </div>
  );
}
