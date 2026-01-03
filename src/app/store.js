import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../features/game/gameSlice';
import settingsReducer from '../features/settungs/settingsSlice';

// создание глобального хранилища состояния приложения
const store = configureStore({
    reducer: {
        game: gameReducer,
        settings: settingsReducer,
    },
});


export default store;