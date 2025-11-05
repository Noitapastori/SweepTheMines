import React from 'react'
import useMinesweeper from './lib/useMinesweeper'

// Presentational cell component
// UX: Each cell visual state (revealed, mine, flag) is expressed via CSS classes
// that map to the MD3 tokens in styles. Props are primitive for reliable memoization.
const Cell = React.memo(function Cell({ r, c, revealed, flag, isMine, adj }) {
  const classes = ['cell']
  if (revealed) classes.push('revealed')
  if (flag) classes.push('flag')
  if (isMine && revealed) classes.push('mine')
  return (
    <div
      role="gridcell"
      tabIndex={0}
      className={classes.join(' ')}
      data-row={r}
      data-col={c}
      aria-label={`Row ${r+1} Column ${c+1}: ${revealed ? (isMine ? 'mine' : (adj === 0 ? 'opened, no adjacent mines' : `opened, ${adj} adjacent mines`)) : (flag ? 'covered, flagged' : 'covered')}`}
    >
      {revealed ? (isMine ? '💣' : (adj > 0 ? adj : '')) : (flag ? '🚩' : '')}
    </div>
  )
})

function Board({ grid, onReveal, onFlag, cols }) {
  // Flatten 2D grid for rendering; re-computes only when grid changes
  const cells = React.useMemo(() => grid.flat(), [grid])

  // Keyboard: arrows move focus; Enter/Space reveal; F toggles flag
  const handleKeyDown = React.useCallback((e) => {
    const focused = document.activeElement
    if (!focused || !focused.dataset.row || !focused.dataset.col) return

    const currentRow = parseInt(focused.dataset.row)
    const currentCol = parseInt(focused.dataset.col)
    let nextElement = null

    switch (e.key) {
      case 'ArrowUp':
        if (currentRow > 0) {
          nextElement = document.querySelector(`[data-row="${currentRow - 1}"][data-col="${currentCol}"]`)
        }
        break
      case 'ArrowDown':
        if (currentRow < grid.length - 1) {
          nextElement = document.querySelector(`[data-row="${currentRow + 1}"][data-col="${currentCol}"]`)
        }
        break
      case 'ArrowLeft':
        if (currentCol > 0) {
          nextElement = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol - 1}"]`)
        }
        break
      case 'ArrowRight':
        if (currentCol < cols - 1) {
          nextElement = document.querySelector(`[data-row="${currentRow}"][data-col="${currentCol + 1}"]`)
        }
        break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        onReveal(currentRow, currentCol)
        break
      }
      default: {
        if (e.key && e.key.toLowerCase() === 'f') {
          e.preventDefault()
          onFlag(currentRow, currentCol)
        }
      }
    }

    if (nextElement) {
      e.preventDefault()
      nextElement.focus()
    }
  }, [grid.length, cols, onReveal, onFlag])

  // Click to reveal (event delegation on board)
  const handleClick = React.useCallback((e) => {
    const target = e.target.closest('.cell')
    if (!target) return
    const r = parseInt(target.dataset.row)
    const c = parseInt(target.dataset.col)
    onReveal(r, c)
  }, [onReveal])

  // Right-click to flag
  const handleContextMenu = React.useCallback((e) => {
    const target = e.target.closest('.cell')
    if (!target) return
    e.preventDefault()
    const r = parseInt(target.dataset.row)
    const c = parseInt(target.dataset.col)
    onFlag(r, c)
  }, [onFlag])

  return (
    <div 
      id="board" 
      role="grid" 
      aria-rowcount={grid.length} 
      aria-colcount={cols} 
      style={{ ['--cols']: cols }}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {cells.map(cell => (
        <Cell
          key={`${cell.r}-${cell.c}`}
          r={cell.r}
          c={cell.c}
          revealed={cell.revealed}
          flag={cell.flag}
          isMine={cell.isMine}
          adj={cell.adj}
        />
      ))}
    </div>
  )
}

export default function App() {
  const { grid, revealCell, toggleFlagAt, newGame, setOptions, rows, cols, mines, message, mineCount, generated, gameOver } = useMinesweeper({ rows:10, cols:10, mines:10 })
  const [score, setScore] = React.useState(0)

  // Difficulty selection state for UI highlighting
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('Custom')

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = React.useState(true)

  // Timer
  const [startTime, setStartTime] = React.useState(null)
  const [elapsedMs, setElapsedMs] = React.useState(0)

  // Refs for effects
  const panelRef = React.useRef(null)
  const confettiRef = React.useRef(null)

  // Best time persistence per difficulty key
  const difficultyKey = `${rows}x${cols}-${mines}`
  const [bestMs, setBestMs] = React.useState(() => {
    const v = localStorage.getItem(`best-${difficultyKey}`)
    return v ? parseInt(v) : null
  })

  React.useEffect(() => {
    // Update best key when difficulty changes
    const v = localStorage.getItem(`best-${difficultyKey}`)
    setBestMs(v ? parseInt(v) : null)
  }, [difficultyKey])

  // Reset score when starting new game
  const handleNewGame = React.useCallback(() => {
    setScore(0)
    setElapsedMs(0)
    setStartTime(null)
    newGame()
  }, [newGame])

  // Add keyboard shortcut for new game (R)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Only trigger if 'R' is pressed without modifier keys
        handleNewGame()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewGame])

  // Lightweight Web Audio feedback: short tones give immediate response to actions
  const audioCtxRef = React.useRef(null)
  function ensureAudio() {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      try {
        audioCtxRef.current = new AudioContext()
      } catch (e) {
        // AudioContext may be blocked in some environments — fail silently
        audioCtxRef.current = null
      }
    }
    return audioCtxRef.current
  }

  function playClickSound() {
    if (!soundEnabled) return
    const ctx = ensureAudio()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      // resume on user gesture — reveal is a gesture so this should succeed
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, now)
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.12, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(now)
    o.stop(now + 0.13)
  }

  function playMineSound() {
    if (!soundEnabled) return
    const ctx = ensureAudio()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime
    // Oscillator 1: low boom
    const o1 = ctx.createOscillator()
    const g1 = ctx.createGain()
    o1.type = 'sine'
    o1.frequency.setValueAtTime(150, now)
    o1.frequency.exponentialRampToValueAtTime(40, now + 0.3)
    g1.gain.setValueAtTime(0, now)
    g1.gain.linearRampToValueAtTime(0.5, now + 0.1)
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    o1.connect(g1)
    g1.connect(ctx.destination)
    o1.start(now)
    o1.stop(now + 0.5)
    
    // Oscillator 2: higher crackle
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'sawtooth'
    o2.frequency.setValueAtTime(1200, now)
    o2.frequency.linearRampToValueAtTime(600, now + 0.2)
    g2.gain.setValueAtTime(0, now)
    g2.gain.linearRampToValueAtTime(0.15, now + 0.05)
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    o2.connect(g2)
    g2.connect(ctx.destination)
    o2.start(now)
    o2.stop(now + 0.3)
  }

  // Play audio + animate score on safe reveal, boom on mine; then update state
  const handleReveal = React.useCallback((r, c) => {
    try {
      const cell = grid[r][c]
      if (cell.isMine) {
        playMineSound()
        // Shake the panel briefly
        const el = document.querySelector('.panel')
        if (el) {
          el.classList.add('shake')
          setTimeout(() => el.classList.remove('shake'), 320)
        }
      } else {
        playClickSound()
        // Increment score and trigger animation
        setScore(s => s + 1)
        const scoreEl = document.getElementById('score')
        if (scoreEl) {
          scoreEl.classList.add('score-changed')
        }
        // Start timer on first safe reveal
        if (!generated && !startTime) {
          setStartTime(performance.now())
        }
      }
    } catch (e) { /* ignore audio errors */ }
    revealCell(r, c)
  }, [revealCell, grid, generated, startTime])

  // Timer ticking while playing
  React.useEffect(() => {
    if (message === 'Playing' && startTime) {
      const id = setInterval(() => setElapsedMs(performance.now() - startTime), 100)
      return () => clearInterval(id)
    }
  }, [message, startTime])

  // On win: stop timer, store best time, and launch confetti
  React.useEffect(() => {
    if (message === 'You Win!') {
      if (startTime) setElapsedMs(prev => performance.now() - startTime)
      const finalMs = startTime ? performance.now() - startTime : elapsedMs
      const prevBest = bestMs ?? Infinity
      if (finalMs < prevBest) {
        localStorage.setItem(`best-${difficultyKey}`, String(finalMs))
        setBestMs(finalMs)
      }
      launchConfetti()
    }
  }, [message])

  function launchConfetti() {
    const container = document.createElement('div')
    container.className = 'confetti-container'
    document.body.appendChild(container)
    const colors = ['#F44336','#E91E63','#9C27B0','#3F51B5','#03A9F4','#4CAF50','#FFC107']
    for (let i=0;i<80;i++){
      const piece = document.createElement('div')
      piece.className = 'confetti-piece'
      const left = Math.random() * 100
      piece.style.left = left + 'vw'
      piece.style.background = colors[i % colors.length]
      piece.style.animationDuration = (900 + Math.random()*700) + 'ms'
      container.appendChild(piece)
    }
    setTimeout(() => container.remove(), 1800)
  }

  // Difficulty presets
  const setDifficulty = (r,c,m,label) => {
    setElapsedMs(0); setStartTime(null); setScore(0)
    setSelectedDifficulty(label)
    setOptions({ rows:r, cols:c, mines:m })
  }

  const elapsedSec = (elapsedMs/1000).toFixed(1)
  const bestSec = bestMs != null ? (bestMs/1000).toFixed(1) : null

  return (
    <div className="panel md3-surface md3-elevation-2" ref={panelRef}>
      <h1 className="app-title">Sweep The Mines</h1>
      <div id="controls">
        <button id="resetBtn" className="md3-button md3-button--filled" onClick={handleNewGame}>
          <span className="state-layer" />
          New Game
        </button>
        <button className={`md3-button md3-button--filled ${selectedDifficulty==='Easy'?'is-selected':''}`} onClick={() => setDifficulty(9,9,10,'Easy')} aria-pressed={selectedDifficulty==='Easy'}>
          <span className="state-layer" />
          Easy
        </button>
        <button className={`md3-button md3-button--filled ${selectedDifficulty==='Medium'?'is-selected':''}`} onClick={() => setDifficulty(16,16,40,'Medium')} aria-pressed={selectedDifficulty==='Medium'}>
          <span className="state-layer" />
          Medium
        </button>
        <button className={`md3-button md3-button--filled ${selectedDifficulty==='Hard'?'is-selected':''}`} onClick={() => setDifficulty(16,30,99,'Hard')} aria-pressed={selectedDifficulty==='Hard'}>
          <span className="state-layer" />
          Hard
        </button>
        <label className="md3-switch" aria-label="Sound">
          <input type="checkbox" checked={soundEnabled} onChange={() => setSoundEnabled(s => !s)} role="switch" aria-checked={soundEnabled} />
          <span className="track"><span className="thumb"></span></span>
          <span className="switch-text">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </label>
      </div>

      <Board grid={grid} onReveal={handleReveal} onFlag={toggleFlagAt} cols={cols} />

      <div className="status">
        <span 
          id="score" 
          ref={(el) => {
            if (el) {
              el.addEventListener('animationend', () => el.classList.remove('score-changed'))
            }
          }}
          className={score > 0 ? 'score-changed' : ''} 
          aria-live="polite"
        >
          Score: {score}
        </span>
        <span id="message" aria-live="polite">{message}</span>
        <span id="mineCount" aria-live="polite">Mines: {mineCount}</span>
        <span aria-live="polite">Time: {elapsedSec}s{bestSec ? ` (best ${bestSec}s)` : ''}</span>
      </div>
    </div>
  )
}
