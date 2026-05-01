import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCopy, FiCheck, FiShield, FiLogOut,
  FiRefreshCw, FiPlay, FiClock, FiUsers, FiGlobe, FiEye,
  FiShuffle
} from 'react-icons/fi'
import { useSocket } from '../context/SocketContext'
import { useGame } from '../context/GameContext'

const TEAM_COLORS = { red: '#ff4d6d', blue: '#4d9fff' }

/* ─── Copy button ─────────────────────────────────────────────────────── */
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,212,170,0.06)',
        border: '1px solid rgba(0,212,170,0.2)', borderRadius: 16, padding: '10px 18px',
        cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,212,170,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,170,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,212,170,0.2)' }}>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 20,
        color: '#00d4aa', letterSpacing: '0.28em' }}>{value}</span>
      <span style={{ color: copied ? '#00d4aa' : '#475569', transition: 'color 0.2s' }}>
        {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
      </span>
    </button>
  )
}

/* ─── Role selector pill ──────────────────────────────────────────────── */
function RolePill({ role, active, onClick, disabled }) {
  const isExplorer = role === 'explorer'
  const icon       = isExplorer ? '🔭' : '🕵️'
  const label      = isExplorer ? 'Explorer' : 'Agent'
  const color      = isExplorer ? '#f59e0b' : '#00d4aa'

  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        borderRadius: 8, fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
        border: active ? `1px solid ${color}` : '1px solid #1a2540',
        background: active ? `${color}18` : 'rgba(255,255,255,0.02)',
        color: active ? color : '#334155',
        opacity: disabled ? 0.45 : 1,
      }}>
      <span style={{ fontSize: 12 }}>{icon}</span> {label}
    </button>
  )
}

/* ─── Player card ─────────────────────────────────────────────────────── */
function PlayerCard({ p, currentPlayerId, isHostViewing, onSwitch, onSetRole, teamExplorerCount }) {
  const isMe     = p.id === currentPlayerId
  const isRed    = p.team === 'red'
  const accent   = TEAM_COLORS[p.team]
  const accentBg = isRed ? 'rgba(255,77,109,0.07)' : 'rgba(77,159,255,0.07)'
  const accentBorder = isRed ? 'rgba(255,77,109,0.22)' : 'rgba(77,159,255,0.22)'

  // Explorer pill is disabled if this player is not already explorer AND team already has one
  const explorerDisabled = p.role !== 'explorer' && teamExplorerCount >= 1

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ borderRadius: 13, padding: '11px 12px', background: accentBg,
        border: `1px solid ${accentBorder}`, marginBottom: 7 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif",
          fontWeight: 900, fontSize: 14, flexShrink: 0,
          background: isRed ? 'rgba(255,77,109,0.2)' : 'rgba(77,159,255,0.2)',
          color: accent }}>
          {p.name[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.name}
            </span>
            {isMe && (
              <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                color: '#00d4aa', background: 'rgba(0,212,170,0.1)',
                border: '1px solid rgba(0,212,170,0.2)', borderRadius: 4, padding: '2px 5px' }}>
                YOU
              </span>
            )}
            {p.isHost && <FiShield size={11} style={{ color: '#fbbf24', flexShrink: 0 }} title="Host" />}
          </div>

          {/* Role badge (visible to everyone) */}
          {p.role ? (
            <div style={{ fontSize: 10, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>{p.role === 'explorer' ? '🔭' : '🕵️'}</span>
              <span style={{
                color: p.role === 'explorer' ? '#f59e0b' : '#00d4aa',
                fontFamily: "'JetBrains Mono',monospace",
              }}>
                {p.role === 'explorer' ? 'Explorer' : 'Agent'}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#334155', marginTop: 2,
              fontFamily: "'JetBrains Mono',monospace" }}>No role assigned</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          {/* Switch team (only yourself) */}
          {isMe && (
            <button onClick={onSwitch} title="Switch team"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540',
                borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#475569',
                transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#334155' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#1a2540' }}>
              <FiRefreshCw size={11} />
            </button>
          )}
          {/* Ready dot */}
          <div style={{ width: 9, height: 9, borderRadius: '50%', transition: 'all 0.3s',
            background: p.isReady ? '#00d4aa' : '#1e2d45',
            boxShadow: p.isReady ? '0 0 8px rgba(0,212,170,0.7)' : 'none' }}
            title={p.isReady ? 'Ready' : 'Not ready'} />
        </div>
      </div>

      {/* Role selector — shown on every card, only host can click */}
      <div style={{ marginTop: 9, display: 'flex', gap: 7 }}>
        <RolePill role="explorer" active={p.role === 'explorer'}
          disabled={!isHostViewing || explorerDisabled}
          onClick={isHostViewing ? () => onSetRole(p.id, 'explorer') : undefined} />
        <RolePill role="agent" active={p.role === 'agent'}
          disabled={!isHostViewing}
          onClick={isHostViewing ? () => onSetRole(p.id, 'agent') : undefined} />
      </div>
    </motion.div>
  )
}

/* ─── Team column ─────────────────────────────────────────────────────── */
function TeamColumn({ teamName, players, currentPlayerId, isHostViewing, onSwitch, onSetRole }) {
  const isRed      = teamName === 'red'
  const accent     = TEAM_COLORS[teamName]
  const borderColor = isRed ? 'rgba(255,77,109,0.18)' : 'rgba(77,159,255,0.18)'
  const label      = isRed ? '🔴 Red Team' : '🔵 Blue Team'

  const explorerCount = players.filter(p => p.role === 'explorer').length
  const agentCount    = players.filter(p => p.role === 'agent').length
  const noExplorer    = explorerCount === 0
  const tooManyExplorers = explorerCount > 1

  return (
    <div style={{ flex: 1, borderRadius: 20, border: `1px solid ${borderColor}`,
      background: 'rgba(14,22,37,0.5)', padding: 18, display: 'flex',
      flexDirection: 'column', minHeight: 0 }}>

      {/* Team header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <FiUsers size={13} style={{ color: accent }} />
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: accent }}>
          {label}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10, color: '#334155' }}>
          {players.length}/5
        </span>
      </div>

      {/* Role summary chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
          borderRadius: 7, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          border: explorerCount === 1 ? '1px solid rgba(245,158,11,0.4)' : '1px solid #1a2540',
          background: explorerCount === 1 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
          color: explorerCount === 1 ? '#f59e0b' : (noExplorer ? '#ef4444' : '#334155') }}>
          🔭 {explorerCount} Explorer{explorerCount !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
          borderRadius: 7, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          border: '1px solid #1a2540', background: 'rgba(255,255,255,0.02)', color: '#475569' }}>
          🕵️ {agentCount} Agent{agentCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Warning */}
      {noExplorer && players.length > 0 && (
        <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 8, padding: '5px 9px',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 7, fontFamily: "'JetBrains Mono',monospace" }}>
          ⚠ No explorer selected — one required
        </div>
      )}
      {tooManyExplorers && (
        <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 8, padding: '5px 9px',
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 7, fontFamily: "'JetBrains Mono',monospace" }}>
          ⚠ Only 1 explorer allowed per team
        </div>
      )}

      {/* Players */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {players.map(p => (
            <PlayerCard key={p.id} p={p}
              currentPlayerId={currentPlayerId}
              isHostViewing={isHostViewing}
              onSwitch={onSwitch}
              onSetRole={onSetRole}
              teamExplorerCount={explorerCount}
            />
          ))}
        </AnimatePresence>
        {players.length === 0 && (
          <div style={{ textAlign: 'center', color: '#1e2d45', fontSize: 12, padding: '28px 0' }}>
            Waiting for players…
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Toast ───────────────────────────────────────────────────────────── */
function Toast({ msg, type }) {
  const styles = {
    success: { bg: 'rgba(0,212,170,0.1)',   border: 'rgba(0,212,170,0.3)', color: '#00d4aa' },
    error:   { bg: 'rgba(255,77,109,0.1)',  border: 'rgba(255,77,109,0.3)', color: '#f87171' },
    info:    { bg: 'rgba(14,22,37,0.95)',   border: '#1a2540',              color: '#cbd5e1' },
  }[type] ?? { bg: 'rgba(14,22,37,0.95)', border: '#1a2540', color: '#cbd5e1' }

  return (
    <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
      style={{ padding: '11px 18px', borderRadius: 12, fontSize: 13,
        fontFamily: "'DM Sans',sans-serif", background: styles.bg,
        border: `1px solid ${styles.border}`, color: styles.color,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', maxWidth: 300 }}>
      {msg}
    </motion.div>
  )
}

/* ─── Decorative globe ───────────────────────────────────────────────── */
function LobbyGlobe() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {[300, 220, 140].map((s, i) => (
        <motion.div key={s} style={{ position: 'absolute', width: s, height: s,
          borderRadius: '50%', border: '1px solid rgba(0,212,170,0.07)' }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 30 + i * 15, repeat: Infinity, ease: 'linear' }} />
      ))}
      {[0, 1.8, 3.6].map((delay, i) => (
        <motion.div key={i} style={{ position: 'absolute', borderRadius: '50%',
          border: '1px solid rgba(0,212,170,0.25)' }}
          initial={{ width: 30, height: 30, opacity: 0.7 }}
          animate={{ width: 320, height: 320, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeOut' }} />
      ))}
      <motion.svg width="170" height="170" viewBox="0 0 200 200" fill="none"
        stroke="#00d4aa" strokeWidth="0.6" style={{ opacity: 0.2 }}
        animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}>
        <circle cx="100" cy="100" r="90"/>
        <ellipse cx="100" cy="100" rx="55" ry="90"/>
        <ellipse cx="100" cy="100" rx="90" ry="40"/>
        <line x1="10" y1="100" x2="190" y2="100"/>
        <line x1="100" y1="10" x2="100" y2="190"/>
      </motion.svg>
      <div style={{ position: 'absolute', width: 13, height: 13, borderRadius: '50%',
        background: '#00d4aa',
        boxShadow: '0 0 0 7px rgba(0,212,170,0.12), 0 0 36px rgba(0,212,170,0.6)' }} />
    </div>
  )
}

/* ─── Lobby Page ──────────────────────────────────────────────────────── */
export default function LobbyPage() {
  const { socket } = useSocket()
  const { room, setRoom, player, setPage, setPlayer, notifications, pushNotification, setGameLocation } = useGame()

  useEffect(() => {
    if (!socket) return
    const onUpdate   = snap => setRoom(snap)
    const onJoined   = ({ message }) => pushNotification(message, 'info')
    const onLeft     = ({ message }) => pushNotification(message, 'info')
    const onLocation = ({ location }) => setGameLocation(location)

    socket.on('room_updated',      onUpdate)
    socket.on('player_joined',     onJoined)
    socket.on('player_left',       onLeft)
    socket.on('location_assigned', onLocation)

    return () => {
      socket.off('room_updated',      onUpdate)
      socket.off('player_joined',     onJoined)
      socket.off('player_left',       onLeft)
      socket.off('location_assigned', onLocation)
    }
  }, [socket, setRoom, setGameLocation, pushNotification])

  // Navigate to game when room starts playing
  useEffect(() => {
    if (room?.status === 'playing') setPage('game')
  }, [room?.status, setPage])

  if (!room || !player) return null

  const allPlayers  = room.players || []
  const redPlayers  = allPlayers.filter(p => p.team === 'red')
  const bluePlayers = allPlayers.filter(p => p.team === 'blue')
  const me          = allPlayers.find(p => p.id === player.id)
  const isHost      = me?.isHost
  const isReady     = me?.isReady

  const redExplorerCount  = redPlayers.filter(p => p.role === 'explorer').length
  const blueExplorerCount = bluePlayers.filter(p => p.role === 'explorer').length
  const allReady          = allPlayers.every(p => p.isReady)
  const hasEnoughPlayers  = redPlayers.length >= 2 && bluePlayers.length >= 2
  const rolesValid        = redExplorerCount === 1 && blueExplorerCount === 1

  const canStart = hasEnoughPlayers && allReady && rolesValid

  const startHint = !hasEnoughPlayers
    ? `Need ≥2 per team (🔴 ${redPlayers.length} · 🔵 ${bluePlayers.length})`
    : !rolesValid
    ? `Each team needs exactly 1 explorer (🔴 ${redExplorerCount} · 🔵 ${blueExplorerCount})`
    : !allReady
    ? 'Waiting for all players to mark ready…'
    : null

  const toggleReady = () => socket.emit('toggle_ready', { code: room.code })
  const switchTeam  = () => socket.emit('switch_team',  { code: room.code })
  const leave = () => {
    socket.emit('leave_room', { code: room.code })
    setRoom(null); setPlayer(null); setPage('landing')
  }
  const setRole = (targetPlayerId, role) => {
    socket.emit('set_role', { code: room.code, playerId: targetPlayerId, role }, res => {
      if (res?.error) pushNotification(res.error, 'error')
    })
  }
  const autoBalance = () => {
    socket.emit('auto_balance', { code: room.code }, res => {
      if (res?.error) pushNotification(res.error, 'error')
      else pushNotification('Roles auto-assigned!', 'success')
    })
  }
  const startGame = () => {
    socket.emit('start_game', { code: room.code }, res => {
      if (res?.error) pushNotification(res.error, 'error')
    })
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050912', display: 'flex',
      flexDirection: 'column', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden',
      position: 'relative' }}>

      {/* Grid bg */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.04, pointerEvents: 'none' }}>
        <defs>
          <pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00d4aa" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center',
          gap: 16, padding: '16px 32px', borderBottom: '1px solid #1a2540',
          background: 'rgba(14,22,37,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0,
          flexWrap: 'wrap' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
            <FiGlobe size={15} style={{ color: '#00d4aa' }} />
          </div>
          <div>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#334155',
              textTransform: 'uppercase', letterSpacing: '0.15em' }}>Game Lobby</div>
            <div style={{ fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 900,
              color: '#fff', lineHeight: 1.2 }}>GeoHiders.com</div>
          </div>
        </div>

        <div style={{ width: 1, height: 32, background: '#1a2540' }} />

        {/* Room code */}
        <CopyButton value={room.code} />

        {/* Meta chips */}
        {[
          { icon: FiClock, label: `${room.totalRounds} Rounds/team` },
          { icon: FiUsers, label: `${allPlayers.length} Players` },
          { icon: FiEye,   label: room.isPublic ? 'Public' : 'Private' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
            borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid #1a2540',
            fontSize: 12, color: '#475569' }}>
            <Icon size={12} style={{ color: '#00d4aa' }} /> {label}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        {/* Auto balance (host only) */}
        {isHost && (
          <button onClick={autoBalance}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
              borderRadius: 11, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
              background: 'rgba(245,158,11,0.07)', fontSize: 12, color: '#f59e0b',
              fontFamily: "'Syne',sans-serif", fontWeight: 700, transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.07)'}
            title="Randomly assign 1 explorer per team">
            <FiShuffle size={13} /> Auto Balance
          </button>
        )}

        {/* Leave */}
        <button onClick={leave}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            borderRadius: 11, background: 'transparent', border: '1px solid #1a2540',
            cursor: 'pointer', fontSize: 12, color: '#475569', fontFamily: 'inherit',
            transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#1a2540' }}>
          <FiLogOut size={13} /> Leave
        </button>
      </motion.div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative', zIndex: 10 }}>

        {/* LEFT — Red team */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ width: 310, display: 'flex', flexDirection: 'column', padding: 20,
            borderRight: '1px solid #1a2540', background: 'rgba(10,14,26,0.4)', flexShrink: 0 }}>
          <TeamColumn teamName="red" players={redPlayers}
            currentPlayerId={player.id}
            isHostViewing={isHost}
            onSwitch={switchTeam}
            onSetRole={setRole} />
        </motion.div>

        {/* CENTER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', padding: '28px 36px' }}>

          {/* Globe */}
          <div style={{ flex: 1, width: '100%', maxWidth: 420 }}>
            <LobbyGlobe />
          </div>

          {/* How-to-play hint */}
          <div style={{ marginBottom: 14, padding: '12px 20px', borderRadius: 14,
            background: 'rgba(14,22,37,0.7)', border: '1px solid #1a2540',
            maxWidth: 440, width: '100%' }}>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: "'JetBrains Mono',monospace",
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              How to play
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#475569' }}>
              <div>🔭 <strong style={{ color: '#f59e0b' }}>Explorer</strong> — sees Street View, drops clues</div>
              <div>🕵️ <strong style={{ color: '#00d4aa' }}>Agents</strong> — decode clues, pin guess on map</div>
              <div>🔴 Red plays first, then 🔵 Blue spectates — teams alternate each round</div>
            </div>
          </div>

          {/* Status hint */}
          {startHint && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderRadius: 14, background: 'rgba(14,22,37,0.8)', border: '1px solid #1a2540',
                marginBottom: 14, maxWidth: 440, width: '100%' }}>
              <span style={{ fontSize: 18 }}>⏳</span>
              <div style={{ fontSize: 12, color: '#475569' }}>{startHint}</div>
            </motion.div>
          )}

          {/* Non-host: all ready message */}
          {!isHost && canStart && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 12, color: '#00d4aa', marginBottom: 14,
                fontFamily: "'JetBrains Mono',monospace",
                display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00d4aa',
                boxShadow: '0 0 8px #00d4aa' }} />
              All ready — waiting for host to start…
            </motion.div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 460 }}>
            {/* Ready toggle */}
            <button onClick={toggleReady}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 9, padding: '14px', borderRadius: 17, cursor: 'pointer',
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, transition: 'all 0.25s',
                border: isReady ? '2px solid #00d4aa' : '2px solid #1a2540',
                background: isReady ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)',
                color: isReady ? '#00d4aa' : '#475569',
                boxShadow: isReady ? '0 0 28px rgba(0,212,170,0.2)' : 'none' }}>
              {isReady ? '✓ Ready!' : 'Mark Ready'}
            </button>

            {/* Start (host only) */}
            {isHost && (
              <button onClick={canStart ? startGame : undefined} disabled={!canStart}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 9, padding: '14px', borderRadius: 17, border: 'none',
                  fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, transition: 'all 0.25s',
                  cursor: canStart ? 'pointer' : 'not-allowed',
                  background: canStart ? '#00d4aa' : '#1a2540',
                  color: canStart ? '#050912' : '#334155',
                  boxShadow: canStart ? '0 0 44px rgba(0,212,170,0.4)' : 'none' }}
                onMouseEnter={e => canStart && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                <FiPlay size={16} />
                {canStart ? 'Start Game' : 'Not Ready'}
              </button>
            )}
          </div>
        </motion.div>

        {/* RIGHT — Blue team */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ width: 310, display: 'flex', flexDirection: 'column', padding: 20,
            borderLeft: '1px solid #1a2540', background: 'rgba(10,14,26,0.4)', flexShrink: 0 }}>
          <TeamColumn teamName="blue" players={bluePlayers}
            currentPlayerId={player.id}
            isHostViewing={isHost}
            onSwitch={switchTeam}
            onSetRole={setRole} />
        </motion.div>
      </div>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex',
        flexDirection: 'column', gap: 9, zIndex: 100 }}>
        <AnimatePresence>
          {notifications.map(n => <Toast key={n.id} msg={n.msg} type={n.type} />)}
        </AnimatePresence>
      </div>
    </div>
  )
}
