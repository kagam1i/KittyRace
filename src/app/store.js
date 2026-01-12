import { configureStore } from "@reduxjs/toolkit";
import gameReducer, { applyPersist } from "../features/game/gameSlice";
import settingsReducer from "../features/settings/settingsSlice";

const PERSIST_KEY = "kittyrace_persist_v1";

// Загружаем только то, что нужно сохранить между сессиями
function loadPersistedGame() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);

    return {
      walletFish:
        typeof data?.game?.walletFish === "number" ? data.game.walletFish : 0,

      unlockedCats: Array.isArray(data?.game?.unlockedCats)
        ? data.game.unlockedCats
        : ["milo"],

      selectedCatId:
        typeof data?.game?.selectedCatId === "string"
          ? data.game.selectedCatId
          : "milo",
    };
  } catch {
    return null;
  }
}

export const store = configureStore({
  reducer: {
    game: gameReducer,
    settings: settingsReducer,
  },
});

// ✅ Мягкая гидратация после создания store (не ломает initialState)
const persistedGame = loadPersistedGame();
if (persistedGame) {
  store.dispatch(applyPersist(persistedGame));
}

// Persist (throttled)
let saveTimer = null;

store.subscribe(() => {
  if (saveTimer) return;

  saveTimer = setTimeout(() => {
    saveTimer = null;

    try {
      const s = store.getState();

      const payload = {
        game: {
          walletFish: s.game.walletFish,
          unlockedCats: s.game.unlockedCats,
          selectedCatId: s.game.selectedCatId,
        },
      };

      localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));
    } catch {
      // молча игнорируем (quota exceeded и т.д.)
    }
  }, 200);
});

export default store;
