import { createSlice } from "@reduxjs/toolkit";

// начальное состояние игры
const initialState = {
  status: "menu", // menu|running|paused|gameover
  laneIndex: 2, // текущая полоса 0|1|2|3|4
  actionState: "run", // run|jump|slide
  selectedCatId: "milo", // milo|bruno|luna

  fishCount: 0, // количество собранных рыбок за ТЕКУЩИЙ забег
  lastRunFish: 0, // сколько рыб было собрано в прошлом забеге (для GameOver)

  // === ШАГ B =====================================================
  walletFish: 0, // общий банк накопленных рыбок (между забегами)
  unlockedCats: ["milo"], // разблокированные коты

  runId: 0, // идентификатор забега (меняется только на start/restart)
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    startGame: (state) => {
      // Новый забег
      state.status = "running";

      // Сброс персонажа в стартовое состояние
      state.laneIndex = 2;
      state.actionState = "run";

      // Сброс счётчиков
      state.fishCount = 0;
      state.lastRunFish = 0;

      state.runId += 1;
    },

    pauseGame: (state) => {
      state.status = "paused";
    },

    resumeGame: (state) => {
      state.status = "running";
    },

    goToGameMenu: (state) => {
      state.status = "menu";
    },

    gameOver(state) {
      // защита от повторных вызовов (коллизия может срабатывать каждый кадр)
      if (state.status === "gameover") return;

      state.status = "gameover";

      // При проигрыше сохраняем результат забега для экрана GameOver
      state.lastRunFish = state.fishCount;

      // При проигрыше переносим рыбы из забега в общий банк
      if (state.fishCount > 0) {
        state.walletFish += state.fishCount;
        state.fishCount = 0;
      }
    },

    moveLeft(state) {
      if (state.laneIndex > 0) state.laneIndex -= 1;
    },

    moveRight(state) {
      if (state.laneIndex < 4) state.laneIndex += 1;
    },

    setRun(state) {
      state.actionState = "run";
    },

    setJump(state) {
      state.actionState = "jump";
    },

    setSlide(state) {
      state.actionState = "slide";
    },

    selectCat(state, action) {
      state.selectedCatId = action.payload;
    },

    addFish(state, action) {
      // Добавление рыбок ВО ВРЕМЯ ЗАБЕГА
      const amount = action.payload ?? 1;
      state.fishCount += amount;
    },

    // === ШАГ B ===================================================
    buyCat(state, action) {
      const { catId, cost } = action.payload;

      if (!catId) return;
      if (state.unlockedCats.includes(catId)) return;

      if (state.walletFish >= cost) {
        state.walletFish -= cost;
        state.unlockedCats.push(catId);
      }
    },

    // === ШАГ B.2 (Persist) ======================================
    // Мягко применяем сохранённые значения, не ломая остальной state
    applyPersist(state, action) {
      const p = action.payload || {};

      if (typeof p.walletFish === "number") state.walletFish = p.walletFish;
      if (Array.isArray(p.unlockedCats)) state.unlockedCats = p.unlockedCats;
      if (typeof p.selectedCatId === "string")
        state.selectedCatId = p.selectedCatId;
    },
  },
});

export const {
  startGame,
  pauseGame,
  resumeGame,
  goToGameMenu,
  gameOver,
  moveLeft,
  moveRight,
  setRun,
  setJump,
  setSlide,
  selectCat,
  addFish,
  buyCat,
  applyPersist, // ← для store.js
} = gameSlice.actions;

export default gameSlice.reducer;
