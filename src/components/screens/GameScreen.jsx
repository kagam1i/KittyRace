import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";

import { TrackRoad } from "../game/TrackRoad";
import { TrackShoulder } from "../game/TrackShoulders";

import ObstacleLayer from "../game/obstacles/ObstacleLayer";
import FishLayer from "../game/pickups/FishLayer";

import { pauseGame } from "../../features/game/gameSlice";
import { SHOULDER_STRIP_PERCENT } from "../../config/trackRoad";

import { useSquareFieldSize } from "./gameScreen/useSquareFieldSize";
import { useGameControls } from "./gameScreen/useGameControls";
import { useWorldScrollSpeed } from "./gameScreen/useWorldScrollSpeed";
import { useWorldSnapshot } from "./gameScreen/useWorldSnapshot";

import GameHud from "./gameScreen/GameHud";
import PlayerActor from "./gameScreen/PlayerActor";

export function GameScreen() {
  const dispatch = useDispatch();

  const laneIndex = useSelector((s) => s.game.laneIndex);
  const actionState = useSelector((s) => s.game.actionState);
  const selectedCatId = useSelector((s) => s.game.selectedCatId);

  const status = useSelector((s) => s.game.status);
  const runId = useSelector((s) => s.game.runId);

  // Единая скорость мира (px/sec)
  const { scrollSpeedRef, updateSpeed } = useWorldScrollSpeed(status, runId);

  // ✅ Единый snapshot мира (float + rounded px) + единый rAF
  const { worldOffsetRef, subscribe } = useWorldSnapshot(
    status,
    runId,
    scrollSpeedRef,
    updateSpeed
  );

  const { fieldRef, fieldPx } = useSquareFieldSize();
  useGameControls(fieldRef);

  useEffect(() => {
    if (status === "running") fieldRef.current?.focus?.();
  }, [status, fieldRef]);

  const obstaclesGetterRef = useRef(() => []);
  const fishGetterRef = useRef(() => []);

  const roadW = Math.floor(fieldPx * (1 - (SHOULDER_STRIP_PERCENT * 2) / 100));

  return (
    <div className="min-h-[100svh] bg-bg grid place-items-center p-3 sm:p-6">
      <div className="relative w-full" style={{ width: "min(640px, 96vw, calc(100svh - 160px))" }}>
        <GameHud onMenuClick={() => dispatch(pauseGame())} />

        <div
          ref={fieldRef}
          tabIndex={0}
          onPointerDown={() => fieldRef.current?.focus?.()}
          className="relative w-full aspect-square rounded-none bg-bg border border-border shadow-soft overflow-hidden outline-none"
          style={{ touchAction: "none" }}
        >
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `${SHOULDER_STRIP_PERCENT}% ${100 - SHOULDER_STRIP_PERCENT * 2
                }% ${SHOULDER_STRIP_PERCENT}%`,
            }}
          >
            {/* Левая обочина */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && (
                <TrackShoulder
                  fieldPx={fieldPx}
                  side="left"
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  subscribeWorld={subscribe}
                />
              )}
            </div>

            {/* Центр */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && (
                <TrackRoad
                  fieldPx={roadW}
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  subscribeWorld={subscribe}
                />
              )}

              {fieldPx > 0 && (
                <ObstacleLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  runId={runId}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  subscribeWorld={subscribe}
                  getFish={() => fishGetterRef.current()}
                  setObstacleSnapshotGetter={(getterFactory) => {
                    const getSnapshot = typeof getterFactory === "function" ? getterFactory() : null;
                    obstaclesGetterRef.current = typeof getSnapshot === "function" ? getSnapshot : () => [];
                  }}
                />
              )}

              {fieldPx > 0 && (
                <FishLayer
                  fieldW={roadW}
                  fieldH={fieldPx}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  subscribeWorld={subscribe}
                  getObstacles={() => obstaclesGetterRef.current()}
                  setFishSnapshotGetter={(getterFactory) => {
                    const getSnapshot = typeof getterFactory === "function" ? getterFactory() : null;
                    fishGetterRef.current = typeof getSnapshot === "function" ? getSnapshot : () => [];
                  }}
                />
              )}

              {fieldPx > 0 && roadW > 0 && (
                <PlayerActor
                  laneIndex={laneIndex}
                  actionState={actionState}
                  selectedCatId={selectedCatId}
                  fieldW={roadW}
                  subscribeWorld={subscribe}
                />
              )}
            </div>

            {/* Правая обочина */}
            <div className="relative overflow-hidden">
              {fieldPx > 0 && (
                <TrackShoulder
                  fieldPx={fieldPx}
                  side="right"
                  status={status}
                  scrollSpeedRef={scrollSpeedRef}
                  worldOffsetRef={worldOffsetRef}
                  subscribeWorld={subscribe}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
