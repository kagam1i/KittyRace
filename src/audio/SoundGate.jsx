import { useEffect } from "react";
import { useSelector } from "react-redux";
import { audioManager } from "./audioManager";

// SoundGate
// - Single place that binds Redux state -> audioManager
// - Also performs one-time audio unlock on the first user gesture

const MENU_MUSIC_VOL = 0.05;
const GAME_MUSIC_VOL = 0.05;

export function SoundGate({ children }) {
  const soundEnabled = useSelector((s) => s.settings.soundEnabled);
  const gameStatus = useSelector((s) => s.game.status);

  // Apply mute state
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Background music:
  // - Menu: normal volume
  // - Game: same track, but quieter + looped
  // - Game over: stop
  useEffect(() => {
    if (!soundEnabled) return;

    if (gameStatus === "menu") {
      audioManager.playMenuMusic({ volume: MENU_MUSIC_VOL });
      return;
    }

    if (gameStatus === "running" || gameStatus === "paused") {
      audioManager.playGameMusic({ volume: GAME_MUSIC_VOL });
      return;
    }

    // gameover (и любые прочие экраны вне забега) — музыка не играет
    audioManager.stopGameMusic();
  }, [gameStatus, soundEnabled]);

  // One-time unlock on first user gesture (for autoplay policy)
  useEffect(() => {
    function unlockOnce() {
      audioManager.unlock();

      // Если мы уже в меню и звук включён — стартуем музыку СРАЗУ с нужной громкостью
      if (soundEnabled && gameStatus === "menu") {
        audioManager.playMenuMusic({ volume: MENU_MUSIC_VOL });
      }

      // Если пользователь сделал первый жест уже во время забега/паузы — тоже применим нужную громкость
      if (soundEnabled && (gameStatus === "running" || gameStatus === "paused")) {
        audioManager.playGameMusic({ volume: GAME_MUSIC_VOL });
      }

      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    }

    window.addEventListener("pointerdown", unlockOnce, { once: true });
    window.addEventListener("keydown", unlockOnce, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockOnce);
      window.removeEventListener("keydown", unlockOnce);
    };
  }, [soundEnabled, gameStatus]);

  return children;
}
