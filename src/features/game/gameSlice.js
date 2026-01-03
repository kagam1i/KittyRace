// создание "хранилища" для состояния игры в данынй момент(status)

import { createSlice } from '@reduxjs/toolkit';

// начальное состояние игры
const initialState = {
    status: 'menu', // menu|running|paused
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
    },
});


export const { startGame, pauseGame, resumeGame, goToGameMenu} = gameSlice.actions;

export default gameSlice.reducer;


// reducer - функция, которая принимает текущее состояние
// и действие, и возвращает новое состояние

// action - объект, который описывает изменение состояния

