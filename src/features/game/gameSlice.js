import { createSlice } from "@reduxjs/toolkit";

// начальное состояние игры
const initialState = {
  status: "menu", // menu|running|paused|gameover
  laneIndex: 2, // текущая полоса 0|1|2|3|4
  actionState: "run", // run|jump|slide
  selectedCatId: "milo", // milo|bruno|luna
  fishCount: 0, // количество собранных рыбок
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

      // Сброс счётчика
      state.fishCount = 0;

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
      state.status = "gameover";
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
      const amount = action.payload ?? 1;
      state.fishCount += amount;
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
} = gameSlice.actions;

export default gameSlice.reducer;
