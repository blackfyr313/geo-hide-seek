import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SocketProvider } from "./context/SocketContext";
import { GameProvider, useGame } from "./context/GameContext";
import LandingPage from "./pages/LandingPage";
import LobbyPage   from "./pages/LobbyPage";
import GamePage    from "./pages/GamePage";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

function Pages() {
  const { page, room } = useGame();

  // Keep the URL in sync so the room code is always shareable
  useEffect(() => {
    if ((page === 'lobby' || page === 'game') && room?.code) {
      window.history.replaceState(null, '', `?code=${room.code}`)
    } else if (page === 'landing') {
      window.history.replaceState(null, '', '/')
    }
  }, [page, room?.code])

  return (
    <AnimatePresence mode="wait">
      {page === "landing" && (
        <motion.div key="landing" {...pageVariants}>
          <LandingPage />
        </motion.div>
      )}
      {page === "lobby" && (
        <motion.div key="lobby" {...pageVariants}>
          <LobbyPage />
        </motion.div>
      )}
      {page === "game" && (
        <motion.div key="game" {...pageVariants}>
          <GamePage />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Pages />
      </GameProvider>
    </SocketProvider>
  );
}
