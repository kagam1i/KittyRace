// создание "хранилища" для состояния игры в данынй момент(status)

import { createSlice } from '@reduxjs/toolkit';

// начальное состояние игры
const initialState = {
    status: 'menu', // menu|running|paused
    laneIndex: 2, // текущая полоса 0|1|2|3|4
    actionState: 'run', // run|jump|slide
};

// создание слайса для управления состоянием игры
const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        startGame: (state) => {
            state.status = 'running';
        },
        pauseGame: (state) => {
            state.status = 'paused';
        },
        resumeGame: (state) => {
            state.status = 'running';
        },
        goToGameMenu: (state) => {
            state.status = 'menu';
        },
        moveLeft(state) {
            // если мы не в самой левой полосе
            if (state.laneIndex > 0) {
                state.laneIndex -= 1;
            }
        },

        moveRight(state) {
            // если мы не в самой правой полосе
            if (state.laneIndex < 4) {
                state.laneIndex += 1;
            }
        },
        setRun(state) {
            state.actionState = 'run';
        },
        setJump(state) {
            state.actionState = 'jump';
        },
        setSlide(state) {
            state.actionState = 'slide';
        },
    },
});


export const {
    startGame,
    pauseGame,
    resumeGame,
    goToGameMenu,
    moveLeft,
    moveRight,
    setRun,
    setJump,
    setSlide } = gameSlice.actions;

export default gameSlice.reducer;


// reducer - функция, которая принимает текущее состояние
// и действие, и возвращает новое состояние

// action - объект, который описывает изменение состояния

