/**
 * BattleScreen Component - Turn-based RPG battle system
 */

import React from 'react'

const imgCharacterImage = "http://localhost:3845/assets/e33f8caae19f896241f2898247eda6a24565c669.png";
const imgEquipmentSlot = "http://localhost:3845/assets/69467539b3c72783dfaba86b652c7cbbcfd95916.png";
const imgEquipmentSlot1 = "http://localhost:3845/assets/f508fec2b6fd01dc338001ba9460fd0f9f0705d2.png";
const imgHealthPotion = "http://localhost:3845/assets/507cdddc6f87f55cf36dcfa919b1ad01af10179b.png";
const imgManaPotion = "http://localhost:3845/assets/05a73396406976801a80277ac355c6f6da3ba3d9.png";
const imgEnemy = "http://localhost:3845/assets/d495e46f79d16dc2ab82f994d68d04c6ec07e5f6.png";

const PLAYER_STATS = {
  maxHP: 100,
  maxMP: 50,
  strength: 15,
  dexterity: 10,
  vitality: 12,
  magic: 8,
};

const ENEMY_STATS = {
  maxHP: 80,
  maxMP: 30,
  strength: 12,
  dexterity: 8,
  vitality: 10,
  magic: 6,
};

export default function BattleScreen() {
  const [playerHP, setPlayerHP] = React.useState(PLAYER_STATS.maxHP);
  const [playerMP, setPlayerMP] = React.useState(PLAYER_STATS.maxMP);
  const [enemyHP, setEnemyHP] = React.useState(ENEMY_STATS.maxHP);
  const [enemyMP, setEnemyMP] = React.useState(ENEMY_STATS.maxMP);
  
  const [potions, setPotions] = React.useState({
    health: 5,
    mana: 5,
  });

  const [battleLog, setBattleLog] = React.useState(['Battle started!']);
  const [isPlayerTurn, setIsPlayerTurn] = React.useState(true);
  const [battleOver, setBattleOver] = React.useState(false);
  const [winner, setWinner] = React.useState(null);

  const addLog = (message) => {
    setBattleLog(prev => [...prev, message]);
  };

  const playerAttack = () => {
    if (!isPlayerTurn || battleOver) return;

    const damage = Math.floor(PLAYER_STATS.strength * 0.8 + Math.random() * 10);
    const newEnemyHP = Math.max(0, enemyHP - damage);
    setEnemyHP(newEnemyHP);
    addLog(`Player attacks for ${damage} damage!`);

    if (newEnemyHP <= 0) {
      setBattleOver(true);
      setWinner('player');
      addLog('Victory! Enemy defeated!');
      return;
    }

    setIsPlayerTurn(false);
  };

  const playerUseHealthPotion = () => {
    if (!isPlayerTurn || battleOver || potions.health === 0) return;

    const healed = Math.min(50, PLAYER_STATS.maxHP - playerHP);
    setPlayerHP(playerHP + healed);
    setPotions(prev => ({ ...prev, health: prev.health - 1 }));
    addLog(`Player used Health Potion and recovered ${healed} HP!`);

    setIsPlayerTurn(false);
  };

  const playerUseManaPot = () => {
    if (!isPlayerTurn || battleOver || potions.mana === 0) return;

    const restored = Math.min(30, PLAYER_STATS.maxMP - playerMP);
    setPlayerMP(playerMP + restored);
    setPotions(prev => ({ ...prev, mana: prev.mana - 1 }));
    addLog(`Player used Mana Potion and restored ${restored} MP!`);

    setIsPlayerTurn(false);
  };

  const playerDefend = () => {
    if (!isPlayerTurn || battleOver) return;

    addLog('Player takes a defensive stance!');
    setIsPlayerTurn(false);
  };

  // Enemy AI turn
  React.useEffect(() => {
    if (!isPlayerTurn && !battleOver) {
      const timer = setTimeout(() => {
        const action = Math.random();
        
        if (action < 0.6) {
          // Enemy attacks
          const damage = Math.floor(ENEMY_STATS.strength * 0.7 + Math.random() * 8);
          const newPlayerHP = Math.max(0, playerHP - damage);
          setPlayerHP(newPlayerHP);
          addLog(`Enemy attacks for ${damage} damage!`);

          if (newPlayerHP <= 0) {
            setBattleOver(true);
            setWinner('enemy');
            addLog('Defeat! You were defeated!');
            return;
          }
        } else if (action < 0.8 && enemyMP >= 20) {
          // Enemy uses magic
          const damage = Math.floor(ENEMY_STATS.magic * 1.5 + Math.random() * 5);
          const newPlayerHP = Math.max(0, playerHP - damage);
          setPlayerHP(newPlayerHP);
          setEnemyMP(prev => prev - 20);
          addLog(`Enemy casts a spell for ${damage} damage!`);

          if (newPlayerHP <= 0) {
            setBattleOver(true);
            setWinner('enemy');
            addLog('Defeat! You were defeated!');
            return;
          }
        } else {
          // Enemy defends
          addLog('Enemy takes a defensive stance!');
        }

        setIsPlayerTurn(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, battleOver, playerHP, enemyMP]);

  const playerHPPercent = (playerHP / PLAYER_STATS.maxHP) * 100;
  const playerMPPercent = (playerMP / PLAYER_STATS.maxMP) * 100;
  const enemyHPPercent = (enemyHP / ENEMY_STATS.maxHP) * 100;

  return (
    <div className="battle-screen">
      <div className="battle-arena">
        {/* Player Side */}
        <div className="battle-participant player">
          <div className="character-image" style={{backgroundImage: `url(${imgCharacterImage})`}} />
          <div className="stats-display">
            <div className="stat-display hp-display">
              <div className="stat-value">{Math.ceil(playerHP)} / {PLAYER_STATS.maxHP}</div>
            </div>
            <div className="stat-display mp-display">
              <div className="stat-value">{Math.ceil(playerMP)} / {PLAYER_STATS.maxMP}</div>
            </div>
          </div>
        </div>

        {/* Enemy Side */}
        <div className="battle-participant enemy">
          <div className="character-image enemy-image" style={{backgroundImage: `url(${imgEnemy})`}} />
          <div className="enemy-hp-box">
            <div className="stat-value enemy-hp">{Math.ceil(enemyHP)} / {ENEMY_STATS.maxHP}</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button 
          className="action-btn attack-btn"
          onClick={playerAttack}
          disabled={!isPlayerTurn || battleOver}
        >
          Attack
        </button>
        <button 
          className="action-btn defend-btn"
          onClick={playerDefend}
          disabled={!isPlayerTurn || battleOver}
        >
          Defend
        </button>
        <div className="potions-row">
          <button 
            className="potion-slot health-potion"
            onClick={playerUseHealthPotion}
            disabled={!isPlayerTurn || battleOver || potions.health === 0}
            style={{backgroundImage: `url(${imgHealthPotion})`}}
          >
            <div className="potion-quantity">{potions.health}</div>
          </button>
          <button 
            className="potion-slot mana-potion"
            onClick={playerUseManaPot}
            disabled={!isPlayerTurn || battleOver || potions.mana === 0}
            style={{backgroundImage: `url(${imgManaPotion})`}}
          >
            <div className="potion-quantity">{potions.mana}</div>
          </button>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="turn-indicator">
        {battleOver ? (
          <span>{winner === 'player' ? '🎉 VICTORY!' : '💀 DEFEAT!'}</span>
        ) : (
          <span>{isPlayerTurn ? "Your Turn" : "Enemy's Turn..."}</span>
        )}
      </div>

      {/* Battle Over Screen */}
      {battleOver && (
        <div className="battle-over-overlay">
          <div className="battle-over-modal">
            <h2 className="battle-result-title">
              {winner === 'player' ? '🎉 VICTORY!' : '💀 DEFEAT!'}
            </h2>
            <p className="battle-result-text">
              {winner === 'player' ? 'You defeated the enemy!' : 'You were defeated...'}
            </p>
            <button className="action-btn" onClick={() => window.location.reload()}>
              Return to Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
