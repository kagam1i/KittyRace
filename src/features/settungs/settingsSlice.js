// здесь будут храниться настройки игры, такие как звук и музыка
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    soundEnabled: true,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: { 
        toggleSound(state) {
            state.soundEnabled = !state.soundEnabled;
        }   
    },
});


export const { toggleSound } = settingsSlice.actions;

export default settingsSlice.reducer;