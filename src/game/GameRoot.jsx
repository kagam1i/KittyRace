// GameRoot.jsx - корневой компонент игры, который
// отвечает за переключение между экранами игры

import React from 'react'
import { useSelector } from 'react-redux'
import {MainMenu} from '../components/screens/MainMenu'
import {GameScreen} from '../components/screens/GameScreen'
import {PauseMenu} from '../components/screens/PauseMenu'

export const GameRoot = () => {
    // получение текущего статуса игры из глобального состояния
    const gameStatus = useSelector((state) => state.game.status);   

    // рендеринг соответствующего экрана в зависимости от статуса игры
    if (gameStatus === 'menu') {
        return <MainMenu />;
    }

    if (gameStatus === 'paused') {
        return <PauseMenu />;
    }

    return <GameScreen />;
};


