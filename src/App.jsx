import React from 'react'
import GameUI from './components/GameUI'
import BattleScreen from './components/BattleScreen'

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState('inventory'); // 'inventory' or 'battle'

  return (
    <>
      {currentScreen === 'inventory' ? (
        <GameUI onStartBattle={() => setCurrentScreen('battle')} />
      ) : (
        <BattleScreen onBattleEnd={() => setCurrentScreen('inventory')} />
      )}
    </>
  )
}
