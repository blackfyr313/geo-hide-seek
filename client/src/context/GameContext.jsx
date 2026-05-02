import { createContext, useContext, useState } from 'react'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [room,         setRoom]         = useState(null)
  const [player,       setPlayer]       = useState(null)
  const [page,         setPage]         = useState('landing')
  const [gameLocation, setGameLocation] = useState(null)
  const [roundResults, setRoundResults] = useState(null)
  const [gameOver,     setGameOver]     = useState(null)

  return (
    <GameContext.Provider value={{
      room,         setRoom,
      player,       setPlayer,
      page,         setPage,
      gameLocation, setGameLocation,
      roundResults, setRoundResults,
      gameOver,     setGameOver,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
