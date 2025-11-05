import { useCallback, useEffect, useReducer } from 'react'

// Game state management for Minesweeper
// UX glossary:
// - grid: 2D array of cells (each has: row/col, isMine, revealed, flag, adj)
// - adj: number of adjacent mines; -1 denotes a mine
// - message: high-level status (Ready / Playing / You Win! / Game Over)

// Create a new empty grid of cells (all hidden, no mines yet)
function createEmptyGrid(rows, cols) {
  const g = []
  for (let r=0;r<rows;r++){
    const row = []
    for (let c=0;c<cols;c++) row.push({ r, c, isMine:false, revealed:false, flag:false, adj:0 })
    g.push(row)
  }
  return g
}

// Randomly place mines, avoiding the first revealed cell
function placeMines(grid, mines, firstR, firstC, rng=Math.random) {
  const rows = grid.length, cols = grid[0].length
  let toPlace = mines
  while (toPlace>0){
    const r = Math.floor(rng()*rows)
    const c = Math.floor(rng()*cols)
    if (grid[r][c].isMine) continue
    if (r===firstR && c===firstC) continue
    grid[r][c].isMine = true
    toPlace--
  }
}

// Compute adjacent mine counts for every non-mine cell
function computeAdjacency(grid){
  const rows = grid.length, cols = grid[0].length
  const dirs = [-1,0,1]
  for (let r=0;r<rows;r++){
    for (let c=0;c<cols;c++){
      if (grid[r][c].isMine) { grid[r][c].adj = -1; continue }
      let cnt = 0
      for (let dr of dirs) for (let dc of dirs){ if (dr===0 && dc===0) continue; const nr=r+dr, nc=c+dc; if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc].isMine) cnt++ }
      grid[r][c].adj = cnt
    }
  }
}

// Reveal cells using an iterative flood-fill for zero-adjacent areas
function revealIterative(grid, startR, startC) {
  const rows = grid.length, cols = grid[0].length
  const stack = [grid[startR][startC]]
  while (stack.length){
    const cell = stack.pop()
    if (cell.revealed || cell.flag) continue
    cell.revealed = true
    if (cell.isMine) continue
    if (cell.adj === 0){
      const dirs = [-1,0,1]
      for (let dr of dirs) for (let dc of dirs){ if (dr===0&&dc===0) continue; const nr=cell.r+dr, nc=cell.c+dc; if (nr>=0&&nr<rows&&nc>=0&&nc<cols){ const n=grid[nr][nc]; if (!n.revealed && !n.flag) stack.push(n) } }
    }
  }
}

// Mulberry32 PRNG for deterministic seeds
function mulberry32(seed) {
  let t = seed >>> 0
  return function() {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

// Initial state factory based on options (rows/cols/mines)
const initial = (opts) => {
  const rows = opts.rows||10
  const cols = opts.cols||10
  const mines = opts.mines||15
  const seed = typeof opts.seed === 'number' ? opts.seed : undefined
  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  return {
    rows, cols, mines,
    grid: createEmptyGrid(rows, cols),
    generated: false, gameOver:false, flagsPlaced:0, message:'Ready', mineCount: mines,
    seed, rng
  }
}

// Pure reducer: applies game actions and returns next state
function reducer(state, action){
  switch(action.type){
    case 'reset': {
      // Reset grid and counters to a fresh game with same (or provided) options
      const opts = action.opts || { rows: state.rows, cols: state.cols, mines: state.mines, seed: state.seed }
      return initial(opts)
    }
    case 'setOptions': {
      const opts = action.opts
      return { ...initial(opts) }
    }
    case 'generate': {
      // First reveal triggers mine placement away from the clicked cell
      const { firstR, firstC, rng } = action
      const grid = state.grid.map(row => row.map(c=> ({...c})))
      placeMines(grid, state.mines, firstR, firstC, rng || state.rng)
      computeAdjacency(grid)
      return { ...state, grid, generated:true }
    }
    case 'reveal': {
      // Reveal a cell; flood-fill zero-adjacent areas; update win/lose state
      const { r,c } = action
      if (state.gameOver) return state
      const grid = state.grid.map(row => row.map(c=> ({...c})))
      if (!state.generated){ placeMines(grid, state.mines, r,c, state.rng); computeAdjacency(grid) }
      revealIterative(grid, r, c)
      // check mines hit
      let gameOver=false
      for (let row of grid) for (let cell of row) if (cell.isMine && cell.revealed) gameOver=true
      // check win
      let allRevealed = true
      for (let row of grid) for (let cell of row) if (!cell.isMine && !cell.revealed) { allRevealed=false; break }
      const newState = { ...state, grid, generated:true, gameOver, message: allRevealed ? 'You Win!' : (gameOver ? 'Game Over' : 'Playing') }
      if (allRevealed){ // mark flags on mines
        for (let row of newState.grid) for (let cell of row) if (cell.isMine) cell.flag = true
      }
      return newState
    }
    case 'toggleFlag': {
      // Toggle a flag on a covered cell; update remaining mine count; check win
      const { r,c } = action
      if (state.gameOver) return state
      const grid = state.grid.map(row => row.map(c=> ({...c})))
      const cell = grid[r][c]
      if (cell.revealed) return state
      cell.flag = !cell.flag
      const flagsPlaced = grid.flat().filter(x=>x.flag).length
      const mineCount = state.mines - flagsPlaced
      // check win
      let allRevealed = true
      for (let row of grid) for (let cell2 of row) if (!cell2.isMine && !cell2.revealed) { allRevealed=false; break }
      const message = allRevealed ? 'You Win!' : 'Playing'
      return { ...state, grid, flagsPlaced, mineCount, message, gameOver: allRevealed }
    }
    default: return state
  }
}

export default function useMinesweeper(opts){
  const [state, dispatch] = useReducer(reducer, opts, initial)

  const reveal = useCallback((r,c) => dispatch({ type:'reveal', r,c }), [])
  const toggleFlag = useCallback((r,c) => dispatch({ type:'toggleFlag', r,c }), [])
  const newGame = useCallback(() => dispatch({ type:'reset' }), [])
  const setOptions = useCallback((opts) => dispatch({ type:'setOptions', opts }), [])

  return {
    grid: state.grid,
    revealCell: reveal,
    toggleFlagAt: toggleFlag,
    newGame,
    setOptions,
    rows: state.rows,
    cols: state.cols,
    mines: state.mines,
    message: state.message,
    mineCount: state.mineCount,
    generated: state.generated,
    gameOver: state.gameOver
  }
}
