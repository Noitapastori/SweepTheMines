import React from 'react'
import useMinesweeper from './lib/useMinesweeper'

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
  const cells = React.useMemo(() => grid.flat(), [grid])

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

  const handleClick = React.useCallback((e) => {
    const target = e.target.closest('.cell')
    if (!target) return
    const r = parseInt(target.dataset.row)
    const c = parseInt(target.dataset.col)
    onReveal(r, c)
  }, [onReveal])

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
  const { grid, revealCell, toggleFlagAt, newGame, rows, cols, mines, message, mineCount } = useMinesweeper({ rows:10, cols:10, mines:10 })
  const [score, setScore] = React.useState(0)

  // Reset score when starting new game
  const handleNewGame = React.useCallback(() => {
    setScore(0)
    newGame()
  }, [newGame])

  // Add keyboard shortcut for new game
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

  // Simple Web Audio click sound: lightweight, no asset files required.
  // We create a shared AudioContext and play a short oscillator envelope on reveal.
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

  // Wrap the reveal handler so we play sound then reveal. This ensures both
  // mouse and keyboard reveals trigger the audio.
  const handleReveal = React.useCallback((r, c) => {
    try {
      const cell = grid[r][c]
      if (cell.isMine) {
        playMineSound()
      } else {
        playClickSound()
        // Increment score and trigger animation
        setScore(s => s + 1)
        const scoreEl = document.getElementById('score')
        if (scoreEl) {
          scoreEl.classList.add('score-changed')
        }
      }
    } catch (e) { /* ignore audio errors */ }
    revealCell(r, c)
  }, [revealCell, grid])

  return (
    <div className="panel md3-surface md3-elevation-2">
      <h1 className="app-title">Sweep The Mines</h1>
      <div id="controls">
        <button id="resetBtn" className="md3-button md3-button--filled" onClick={handleNewGame}>
          <span className="state-layer" />
          New Game
        </button>
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
      </div>
    </div>
  )
}
