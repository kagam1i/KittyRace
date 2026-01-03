import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../features/game/gameSlice';

// создание глобального хранилища состояния приложения
const store = configureStore({
    reducer: {
        game: gameReducer,
    },
});


export default store;