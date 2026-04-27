import { createContext, useContext, useState, useCallback } from 'react'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [room,          setRoom]          = useState(null)
  const [player,        setPlayer]        = useState(null)
  const [page,          setPage]          = useState('landing')
  const [notifications, setNotifications] = useState([])
  const [gameLocation,  setGameLocation]  = useState(null)   // explorer's secret location
  const [roundResults,  setRoundResults]  = useState(null)   // end-of-round data
  const [gameOver,      setGameOver]      = useState(null)   // final scores

  const pushNotification = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, msg, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3500)
  }, [])

  return (
    <GameContext.Provider value={{
      room, setRoom,
      player, setPlayer,
      page, setPage,
      notifications, pushNotification,
      gameLocation, setGameLocation,
      roundResults,  setRoundResults,
      gameOver,      setGameOver,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  return useContext(GameContext)
}
