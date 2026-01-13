import { useEffect } from "react";
import { useSelector } from "react-redux";
import { audioManager } from "./audioManager";

// SoundGate
// - Single place that binds Redux state -> audioManager
// - Also performs one-time audio unlock on the first user gesture

export function SoundGate({ children }) {
  const soundEnabled = useSelector((s) => s.settings.soundEnabled);
  const gameStatus = useSelector((s) => s.game.status);

  // Apply mute state
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Start/stop menu music based on screen
  useEffect(() => {
    if (!soundEnabled) return;

    if (gameStatus === "menu") {
      audioManager.playMenuMusic();
    } else {
      audioManager.stopMenuMusic();
    }
  }, [gameStatus, soundEnabled]);

  // One-time unlock on first user gesture (for autoplay policy)
  useEffect(() => {
    function unlockOnce() {
      audioManager.unlock();

      // If we are already in menu and sound is enabled - try to start music now
      if (soundEnabled && gameStatus === "menu") {
        audioManager.playMenuMusic();
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
