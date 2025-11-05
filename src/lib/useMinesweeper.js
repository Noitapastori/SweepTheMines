import { useCallback, useEffect, useReducer } from 'react'

function createEmptyGrid(rows, cols) {
  const g = []
  for (let r=0;r<rows;r++){
    const row = []
    for (let c=0;c<cols;c++) row.push({ r, c, isMine:false, revealed:false, flag:false, adj:0 })
    g.push(row)
  }
  return g
}

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

const initial = (opts) => ({
  rows: opts.rows||10, cols: opts.cols||10, mines: opts.mines||15,
  grid: createEmptyGrid(opts.rows||10, opts.cols||10),
  generated: false, gameOver:false, flagsPlaced:0, message:'Ready', mineCount: opts.mines||15
})

function reducer(state, action){
  switch(action.type){
    case 'reset': {
      const opts = action.opts || { rows: state.rows, cols: state.cols, mines: state.mines }
      return initial(opts)
    }
    case 'setOptions': {
      const opts = action.opts
      return { ...initial(opts) }
    }
    case 'generate': {
      const { firstR, firstC, rng } = action
      const grid = state.grid.map(row => row.map(c=> ({...c})))
      placeMines(grid, state.mines, firstR, firstC, rng)
      computeAdjacency(grid)
      return { ...state, grid, generated:true }
    }
    case 'reveal': {
      const { r,c } = action
      if (state.gameOver) return state
      const grid = state.grid.map(row => row.map(c=> ({...c})))
      if (!state.generated){ placeMines(grid, state.mines, r,c); computeAdjacency(grid) }
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
    mineCount: state.mineCount
  }
}
