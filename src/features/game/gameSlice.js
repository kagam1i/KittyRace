import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  status: "menu",
  laneIndex: 2,
  actionState: "run",
  actionUntilMs: 0,
  selectedCatId: "milo",

  fishCount: 0,
  lastRunFish: 0,

  walletFish: 0,
  unlockedCats: ["milo"],

  hudFloatText: "",
  hudFloatSeq: 0,

  brunoSecondChanceUsed: false,
  brunoSecondChanceFxSeq: 0,

  runId: 0,

  lunaSenseFxSeq: 0,
  lunaSenseCooldownUntil: 0,

  walletFloatText: "",
  walletFloatSeq: 0,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    startGame: (state) => {
      state.status = "running";

      state.laneIndex = 2;
      state.actionState = "run";

      state.fishCount = 0;
      state.lastRunFish = 0;

      state.hudFloatText = "";
      state.hudFloatSeq = 0;

      state.brunoSecondChanceUsed = false;
      state.brunoSecondChanceFxSeq = 0;

      state.lunaSenseFxSeq = 0;
      state.lunaSenseCooldownUntil = 0;

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
      if (state.status === "gameover") return;

      state.status = "gameover";

      state.lastRunFish = state.fishCount;

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
      state.actionUntilMs = 0;
    },

    setJump(state, action) {
      state.actionState = "jump";
      state.actionUntilMs = action.payload?.untilMs ?? 0;
    },

    setSlide(state, action) {
      state.actionState = "slide";
      state.actionUntilMs = action.payload?.untilMs ?? 0;
    },

    selectCat(state, action) {
      state.selectedCatId = action.payload;
    },

    addFish(state, action) {
      const amount = action.payload ?? 1;
      state.fishCount += amount;
    },

    addWalletFish(state, action) {
      const amount = action.payload ?? 0;
      state.walletFish = Math.max(0, state.walletFish + amount);
    },

    buyCat(state, action) {
      const { catId, cost } = action.payload || {};
      if (!catId) return;
      if (state.unlockedCats.includes(catId)) return;

      const price = cost ?? 0;
      if (state.walletFish >= price) {
        state.walletFish -= price;
        state.unlockedCats.push(catId);

        if (price > 0) {
          state.walletFloatText = `-${price}`;
          state.walletFloatSeq += 1;
        }
      }
    },

    applyPersist(state, action) {
      const p = action.payload || {};
      if (typeof p.walletFish === "number") state.walletFish = p.walletFish;
      if (Array.isArray(p.unlockedCats)) state.unlockedCats = p.unlockedCats;
      if (typeof p.selectedCatId === "string") state.selectedCatId = p.selectedCatId;
    },

    markBrunoSecondChanceUsed(state) {
      state.brunoSecondChanceUsed = true;
      state.brunoSecondChanceFxSeq += 1;
    },

    applyRunFishPenalty(state, action) {
      const amount = action.payload?.amount ?? 0;
      if (amount <= 0) return; 

      state.fishCount = Math.max(0, state.fishCount - amount);

      state.hudFloatText = `-${amount}`;
      state.hudFloatSeq += 1;
    },

    triggerLunaSense(state, action) {
      const now = action?.payload?.now ?? Date.now();
      const COOLDOWN_MS = 2500;

      if (now < (state.lunaSenseCooldownUntil ?? 0)) return;

      state.lunaSenseFxSeq += 1;
      state.lunaSenseCooldownUntil = now + COOLDOWN_MS;
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
  addWalletFish,
  buyCat,
  applyPersist,
  markBrunoSecondChanceUsed,
  applyRunFishPenalty,
  triggerLunaSense,
} = gameSlice.actions;

export const tryGameOver = ({ obstacleTypeId }) => (dispatch, getState) => {
  const s = getState().game;

  if (s.status === "gameover") return false;

  const isBruno = s.selectedCatId === "bruno";

  const canSecondChance =
    isBruno &&
    !s.brunoSecondChanceUsed &&
    (obstacleTypeId === "jump" ||
      obstacleTypeId === "slide" ||
      obstacleTypeId === "sidestep");

  if (canSecondChance) {
    const current = s.fishCount ?? 0;
    const penalty = Math.floor(current * 0.2);

    if (penalty > 0) {
      dispatch(applyRunFishPenalty({ amount: penalty }));
    }

    dispatch(markBrunoSecondChanceUsed());
    return false;
  }

  dispatch(gameOver());
  return true;
};

export default gameSlice.reducer;
