import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SocketProvider } from './context/SocketContext'
import { GameProvider, useGame } from './context/GameContext'
import { UIProvider } from './context/UIContext'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LobbyPage   = lazy(() => import('./pages/LobbyPage'))
const GamePage    = lazy(() => import('./pages/GamePage'))

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25 } },
}

const PageFallback = () => (
  <div style={{ minHeight: '100vh', background: '#050912' }} />
)

function Pages() {
  const { page, room } = useGame()

  useEffect(() => {
    if ((page === 'lobby' || page === 'game') && room?.code) {
      window.history.replaceState(null, '', `?code=${room.code}`)
    } else if (page === 'landing') {
      window.history.replaceState(null, '', '/')
    }
  }, [page, room?.code])

  return (
    <Suspense fallback={<PageFallback />}>
      <AnimatePresence mode="wait">
        {page === 'landing' && (
          <motion.div key="landing" {...pageVariants}>
            <LandingPage />
          </motion.div>
        )}
        {page === 'lobby' && (
          <motion.div key="lobby" {...pageVariants}>
            <LobbyPage />
          </motion.div>
        )}
        {page === 'game' && (
          <motion.div key="game" {...pageVariants}>
            <GamePage />
          </motion.div>
        )}
      </AnimatePresence>
    </Suspense>
  )
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <UIProvider>
          <Pages />
        </UIProvider>
      </GameProvider>
    </SocketProvider>
  )
}
