import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGlobe, FiUsers, FiHash, FiArrowRight, FiX,
  FiLoader, FiLock, FiUnlock, FiChevronRight,
  FiEye, FiTarget, FiAward, FiMap, FiPlay, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi'
import { useSocket } from '../context/SocketContext'
import { useGame } from '../context/GameContext'

/* ─── Data ───────────────────────────────────────────────────────────────── */
const LIVE_LOCATIONS = [
  { city: 'Tokyo',          country: 'Japan',        lat: '35.67° N', lng: '139.65° E', flag: '🇯🇵' },
  { city: 'Paris',          country: 'France',       lat: '48.86° N', lng: '2.35° E',   flag: '🇫🇷' },
  { city: 'Rio de Janeiro', country: 'Brazil',       lat: '22.91° S', lng: '43.17° W',  flag: '🇧🇷' },
  { city: 'Sydney',         country: 'Australia',    lat: '33.87° S', lng: '151.21° E', flag: '🇦🇺' },
  { city: 'Cairo',          country: 'Egypt',        lat: '30.04° N', lng: '31.24° E',  flag: '🇪🇬' },
  { city: 'New York',       country: 'USA',          lat: '40.71° N', lng: '74.01° W',  flag: '🇺🇸' },
  { city: 'Mumbai',         country: 'India',        lat: '19.08° N', lng: '72.88° E',  flag: '🇮🇳' },
  { city: 'Cape Town',      country: 'South Africa', lat: '33.93° S', lng: '18.42° E',  flag: '🇿🇦' },
]

const GLOBE_PINS = [
  { top: '20%', left: '26%', delay: 0,   city: 'Tokyo',    flag: '🇯🇵' },
  { top: '58%', left: '68%', delay: 0.7, city: 'Sydney',   flag: '🇦🇺' },
  { top: '72%', left: '34%', delay: 1.4, city: 'Rio',      flag: '🇧🇷' },
  { top: '28%', left: '64%', delay: 2.1, city: 'Paris',    flag: '🇫🇷' },
  { top: '45%', left: '20%', delay: 1.8, city: 'New York', flag: '🇺🇸' },
]

const ACTIVITY_EVENTS = [
  { msg: '4 players started a game', loc: 'Tokyo, Japan',          flag: '🇯🇵' },
  { msg: 'Team Blue won!',           loc: '312 km off · Paris',    flag: '🏆' },
  { msg: 'New game created',         loc: 'Sydney, Australia',     flag: '🇦🇺' },
  { msg: 'Explorer is hiding…',      loc: 'Cairo, Egypt',          flag: '🇪🇬' },
  { msg: 'Perfect guess! 23 km',     loc: 'New York, USA',         flag: '🎯' },
  { msg: '6 players joined',         loc: 'Mumbai, India',         flag: '🇮🇳' },
  { msg: 'Round 3 of 5 started',     loc: 'Cape Town · 5 rounds',  flag: '🌍' },
  { msg: 'Team Red wins by 88 km',   loc: 'Rio de Janeiro, Brazil', flag: '🇧🇷' },
]

const HERO_CITIES = ['Paris', 'Tokyo', 'Rio de Janeiro', 'Cairo', 'Sydney', 'New York', 'Mumbai']

const SITE_STATS = [
  { value: '10K+',   label: 'Games Played' },
  { value: '195',    label: 'Countries' },
  { value: '1,248',  label: 'Active Now' },
  { value: '847 km', label: 'Avg Guess' },
]

const STEPS = [
  { n: '01', icon: FiEye,    t: 'Explorer Hides',  d: 'One player roams a real Street View location and crafts clever clues.' },
  { n: '02', icon: FiTarget, t: 'Agents Decode',   d: 'Teammates interpret clues and pin their best guess on a world map.' },
  { n: '03', icon: FiAward,  t: 'Distance Scores', d: 'Closest guess wins points. Most points after all rounds wins.' },
]

/* ─── World grid background ─────────────────────────────────────────────── */
function WorldGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00d4aa" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      <div className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,170,0.4), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
      />
    </div>
  )
}

/* ─── Animated globe (right panel) ─────────────────────────────────────── */
function AnimatedGlobe({ stats = {}, recentEvents = [] }) {
  const [liveIdx, setLiveIdx] = useState(0)
  const [activity, setActivity] = useState({ idx: 0, visible: false })
  const allEventsRef = useRef(ACTIVITY_EVENTS)

  // Keep the events ref current so the cycling closure always sees the latest list
  useEffect(() => {
    const realFormatted = recentEvents.map(e => ({ msg: e.msg, loc: e.loc, flag: e.flag }))
    allEventsRef.current = [...realFormatted, ...ACTIVITY_EVENTS].slice(0, 15)
  }, [recentEvents])

  useEffect(() => {
    const id = setInterval(() => setLiveIdx(i => (i + 1) % LIVE_LOCATIONS.length), 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let idx = 0
    const cycle = () => {
      idx = (idx + 1) % allEventsRef.current.length
      setActivity({ idx, visible: true })
      setTimeout(() => setActivity(s => ({ ...s, visible: false })), 2800)
    }
    const initial = setTimeout(cycle, 1800)
    const id = setInterval(cycle, 4500)
    return () => { clearTimeout(initial); clearInterval(id) }
  }, [])

  const live = LIVE_LOCATIONS[liveIdx]
  const events = allEventsRef.current
  const evt = events[activity.idx % events.length]
  const displayActiveGames = (stats.activeGames > 0) ? stats.activeGames.toLocaleString() : '1,248'

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Orbital rings */}
      {[540, 420, 300].map((s, i) => (
        <motion.div key={s} className="absolute rounded-full"
          style={{ width: s, height: s, border: '1px solid rgba(0,212,170,0.08)' }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 35 + i * 12, repeat: Infinity, ease: 'linear' }} />
      ))}
      {/* Ripple pulses */}
      {[0, 1.5, 3].map((delay, i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ border: '1px solid rgba(0,212,170,0.35)' }}
          initial={{ width: 50, height: 50, opacity: 0.7 }}
          animate={{ width: 500, height: 500, opacity: 0 }}
          transition={{ duration: 4.5, repeat: Infinity, delay, ease: 'easeOut' }} />
      ))}
      {/* Globe wireframe */}
      <motion.svg width="300" height="300" viewBox="0 0 200 200" fill="none"
        stroke="#00d4aa" strokeWidth="0.55" style={{ opacity: 0.3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}>
        <circle cx="100" cy="100" r="90"/>
        <ellipse cx="100" cy="100" rx="60" ry="90"/>
        <ellipse cx="100" cy="100" rx="28" ry="90"/>
        <ellipse cx="100" cy="100" rx="90" ry="44"/>
        <ellipse cx="100" cy="100" rx="90" ry="20"/>
        <line x1="10" y1="100" x2="190" y2="100"/>
        <line x1="100" y1="10" x2="100" y2="190"/>
      </motion.svg>
      {/* Globe center */}
      <div className="absolute w-5 h-5 rounded-full"
        style={{ background: '#00d4aa', boxShadow: '0 0 0 10px rgba(0,212,170,0.12), 0 0 50px rgba(0,212,170,0.6)' }} />

      {/* ── LIVE ACTIVITY FEED ── top-center toast */}
      <AnimatePresence>
        {activity.visible && (
          <motion.div key={activity.idx} className="absolute"
            style={{ top: '5%', left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              borderRadius: 12, whiteSpace: 'nowrap',
              background: 'rgba(14,22,37,0.95)', border: '1px solid #1a2540',
              backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <span style={{ fontSize: 16 }}>{evt.flag}</span>
              <div>
                <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{evt.msg}</span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 8,
                  fontFamily: "'JetBrains Mono',monospace" }}>{evt.loc}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* City pins with labels */}
      {GLOBE_PINS.map((p, i) => (
        <motion.div key={i} className="absolute" style={{ top: p.top, left: p.left }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: p.delay + 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(0,212,170,0.7)', border: '1.5px solid #00d4aa' }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: p.delay }} />
            <motion.div
              style={{ background: 'rgba(8,15,30,0.88)', border: '1px solid rgba(0,212,170,0.18)',
                borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap',
                fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#94a3b8',
                backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5 }}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: p.delay + 0.9 }}>
              <span style={{ fontSize: 11 }}>{p.flag}</span>{p.city}
            </motion.div>
          </div>
        </motion.div>
      ))}

      {/* TOP-RIGHT — Active Games */}
      <motion.div className="absolute top-10 right-4 rounded-2xl px-5 py-3"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <p className="text-xs font-mono" style={{ color: '#475569' }}>Active Games</p>
          {stats.activeGames > 0 && (
            <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
          )}
        </div>
        <p className="text-3xl font-black" style={{ fontFamily: "'Syne',sans-serif", color: '#00d4aa' }}>{displayActiveGames}</p>
      </motion.div>

      {/* BOTTOM-LEFT — Countries */}
      <motion.div className="absolute bottom-16 left-4 rounded-2xl px-5 py-3"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)' }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}>
        <p className="text-xs font-mono" style={{ color: '#475569' }}>Countries</p>
        <p className="text-3xl font-black text-white" style={{ fontFamily: "'Syne',sans-serif" }}>195+</p>
      </motion.div>

      {/* TOP-LEFT — Coordinate scanner */}
      <motion.div className="absolute top-4 left-4 rounded-2xl"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)', padding: '12px 16px' }}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Scanning</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={liveIdx}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, lineHeight: 1.9 }}>
            <span style={{ color: '#334155' }}>LAT </span><span style={{ color: '#e2e8f0' }}>{live.lat}</span><br/>
            <span style={{ color: '#334155' }}>LNG </span><span style={{ color: '#e2e8f0' }}>{live.lng}</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* BOTTOM-RIGHT — Live Game cycling card */}
      <motion.div className="absolute bottom-4 right-4 rounded-2xl"
        style={{ background: 'rgba(14,22,37,0.9)', border: '1px solid #1a2540', backdropFilter: 'blur(12px)', padding: '14px 18px', minWidth: 186 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', flexShrink: 0 }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live Game</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={liveIdx}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif",
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 18 }}>{live.flag}</span>{live.city}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{live.country}</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#00d4aa' }}>
              {live.lat} · {live.lng}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ─── Modal wrapper ─────────────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5,9,18,0.88)', backdropFilter: 'blur(16px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="relative w-full mx-6"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520,
          background: 'linear-gradient(160deg, #0e1625 0%, #080f1e 100%)',
          border: '1px solid #1a2540', borderRadius: 28, padding: 44,
          boxShadow: '0 50px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
        <div className="absolute top-0 left-10 right-10 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(0,212,170,0.5),transparent)' }} />
        <button onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: '#475569', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569' }}>
          <FiX size={16} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ─── Styled input ─────────────────────────────────────────────────────── */
function Field({ label, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: focused ? '#00d4aa' : '#334155' }} />}
        <input
          style={{
            width: '100%', background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${focused ? 'rgba(0,212,170,0.4)' : '#1a2540'}`,
            borderRadius: 14, padding: Icon ? '14px 16px 14px 42px' : '14px 18px',
            color: '#fff', fontSize: 14, fontFamily: "'DM Sans',sans-serif",
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </div>
    </div>
  )
}

/* ─── Create Room modal ────────────────────────────────────────────────── */
function CreateModal({ onClose }) {
  const { socket } = useSocket()
  const { setRoom, setPlayer, setPage, pushNotification } = useGame()
  const [name, setName] = useState('')
  const [rounds, setRounds] = useState(5)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ok = name.trim().length >= 2 && !loading

  const handle = () => {
    if (!socket || !ok) return
    setError(''); setLoading(true)
    socket.emit('create_room', { name: name.trim(), isPublic, totalRounds: rounds }, res => {
      setLoading(false)
      if (res.error) return setError(res.error)
      setPlayer({ id: socket.id, name: name.trim() })
      setRoom(res.room); setPage('lobby')
      pushNotification('Room created! Share the code with friends.', 'success')
      onClose()
    })
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <FiUsers size={20} style={{ color: '#00d4aa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 2 }}>Create a Room</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Set up your game and invite friends</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Your Name" icon={FiUsers} placeholder="e.g. MapMaster42"
          value={name} onChange={e => setName(e.target.value)} maxLength={20}
          onKeyDown={e => e.key === 'Enter' && handle()} />

        <div>
          <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 4 }}>
            Rounds per team
          </label>
          <p style={{ fontSize: 11, color: '#334155', marginBottom: 10, fontFamily: "'DM Sans',sans-serif" }}>
            Each team plays this many rounds (both teams play alternately)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[3,5,7,10].map(r => (
              <button key={r} onClick={() => setRounds(r)}
                style={{
                  padding: '12px', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  fontFamily: "'JetBrains Mono',monospace", cursor: 'pointer', transition: 'all 0.15s',
                  border: rounds === r ? '1px solid #00d4aa' : '1px solid #1a2540',
                  background: rounds === r ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.02)',
                  color: rounds === r ? '#00d4aa' : '#475569',
                  boxShadow: rounds === r ? '0 0 20px rgba(0,212,170,0.15)' : 'none',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.025)', border: '1px solid #1a2540', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isPublic ? <FiUnlock size={16} style={{ color: '#00d4aa' }} /> : <FiLock size={16} style={{ color: '#475569' }} />}
            <div>
              <p style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{isPublic ? 'Public Room' : 'Private Room'}</p>
              <p style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{isPublic ? 'Anyone can discover and join' : 'Only joinable via room code'}</p>
            </div>
          </div>
          <button onClick={() => setIsPublic(v => !v)}
            style={{ width: 46, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: isPublic ? '#00d4aa' : '#1e2d45', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transform: isPublic ? 'translateX(24px)' : 'translateX(3px)', transition: 'transform 0.25s' }} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
            borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#f87171' }}>{error}</div>
        )}

        <button onClick={handle} disabled={!ok}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', borderRadius: 16, border: 'none', cursor: ok ? 'pointer' : 'not-allowed',
            fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: '0.02em',
            background: ok ? '#00d4aa' : '#1a2540', color: ok ? '#050912' : '#334155',
            boxShadow: ok ? '0 0 50px rgba(0,212,170,0.35)' : 'none',
            transition: 'all 0.2s', marginTop: 4,
          }}
          onMouseEnter={e => ok && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          {loading ? <FiLoader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FiArrowRight size={18} />}
          {loading ? 'Creating Room…' : 'Create Room'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Join Room modal ──────────────────────────────────────────────────── */
function JoinModal({ onClose, initialCode = '' }) {
  const { socket } = useSocket()
  const { setRoom, setPlayer, setPage, pushNotification } = useGame()
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const ok = name.trim().length >= 2 && code.length >= 4 && !loading

  const handle = () => {
    if (!socket || !ok) return
    setError(''); setLoading(true)
    socket.emit('join_room', { name: name.trim(), code: code.trim().toUpperCase() }, res => {
      setLoading(false)
      if (res.error) return setError(res.error)
      setPlayer({ id: socket.id, name: name.trim() })
      setRoom(res.room); setPage('lobby')
      pushNotification(`Joined room ${res.room.code}!`, 'success')
      onClose()
    })
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', flexShrink: 0 }}>
          <FiHash size={20} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: "'Syne',sans-serif", marginBottom: 2 }}>Join a Room</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Enter the room code from your friend</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Your Name" icon={FiUsers} placeholder="e.g. GlobeHunter"
          value={name} onChange={e => setName(e.target.value)} maxLength={20} />

        <div>
          <label style={{ display: 'block', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 10 }}>
            Room Code
          </label>
          <input
            style={{
              display: 'block', width: '100%', textAlign: 'center',
              fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
              fontSize: 36, letterSpacing: '0.35em', color: '#fff',
              background: 'rgba(255,255,255,0.025)', outline: 'none',
              border: `1px solid ${focused ? 'rgba(0,212,170,0.45)' : '#1a2540'}`,
              borderRadius: 16, padding: '22px 16px', textTransform: 'uppercase',
              transition: 'border-color 0.2s',
            }}
            placeholder="XXXXXX"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />
        </div>

        {error && (
          <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)',
            borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#f87171' }}>{error}</div>
        )}

        <button onClick={handle} disabled={!ok}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '16px', borderRadius: 16, border: 'none', cursor: ok ? 'pointer' : 'not-allowed',
            fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 15,
            background: ok ? '#00d4aa' : '#1a2540', color: ok ? '#050912' : '#334155',
            boxShadow: ok ? '0 0 50px rgba(0,212,170,0.35)' : 'none',
            transition: 'all 0.2s', marginTop: 4,
          }}
          onMouseEnter={e => ok && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
          {loading ? <FiLoader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <FiArrowRight size={18} />}
          {loading ? 'Joining…' : 'Join Room'}
        </button>
      </div>
    </Modal>
  )
}

/* ─── Stats bar ─────────────────────────────────────────────────────────── */
function StatsBar({ activePlayers = 0 }) {
  const stats = [
    { value: '10K+',   label: 'Games Played',  live: false },
    { value: '195',    label: 'Countries',      live: false },
    { value: activePlayers > 0 ? activePlayers.toLocaleString() : '1,248', label: 'Active Now', live: activePlayers > 0 },
    { value: '847 km', label: 'Avg Guess',      live: false },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
      style={{ display: 'flex', background: 'rgba(255,255,255,0.02)',
        border: '1px solid #1a2540', borderRadius: 16, overflow: 'hidden', marginTop: 22 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, padding: '13px 10px', textAlign: 'center',
          borderRight: i < 3 ? '1px solid #1a2540' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#00d4aa',
              fontFamily: "'Syne',sans-serif" }}>{s.value}</span>
            {s.live && (
              <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa', flexShrink: 0 }}
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            )}
          </div>
          <div style={{ fontSize: 9, color: '#475569', fontFamily: "'JetBrains Mono',monospace",
            marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
        </div>
      ))}
    </motion.div>
  )
}

/* ─── Public rooms browser ──────────────────────────────────────────────── */
function PublicRooms({ onQuickJoin }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => {
    setFetchError(false)
    const url = `${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/public-rooms`
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setRooms(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(err => { console.error('[PublicRooms] fetch failed:', err); setFetchError(true); setLoading(false) })
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 8000)
    return () => clearInterval(id)
  }, [])

  const filtered = search.trim()
    ? rooms.filter(r =>
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.hostName?.toLowerCase().includes(search.toLowerCase())
      )
    : rooms

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      style={{ marginTop: 14 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FiMap size={12} style={{ color: '#00d4aa' }} />
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>Open Rooms</span>
          {rooms.length > 0 && (
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#334155',
              background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.15)',
              borderRadius: 99, padding: '1px 7px' }}>{rooms.length}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={load} title="Refresh"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: fetchError ? '#f87171' : '#334155', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = '#00d4aa'}
            onMouseLeave={e => e.currentTarget.style.color = fetchError ? '#f87171' : '#334155'}>
            <FiRefreshCw size={11} />
          </button>
          <motion.div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4aa' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
      </div>

      {/* Search input — only shown when there are rooms */}
      {rooms.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by code or host…"
            style={{
              width: '100%', background: 'rgba(255,255,255,0.025)',
              border: '1px solid #1a2540', borderRadius: 10, padding: '8px 12px 8px 34px',
              color: '#fff', fontSize: 12, fontFamily: "'DM Sans',sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1a2540' }}
          />
          <FiMap size={11} style={{ position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} />
        </div>
      )}

      {loading ? (
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
          borderRadius: 12, fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
          Scanning for rooms…
        </div>
      ) : fetchError ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          padding: '11px 14px', background: 'rgba(255,77,109,0.06)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertCircle size={13} style={{ color: '#f87171', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#f87171' }}>Could not reach server</span>
          </div>
          <button onClick={load}
            style={{ fontSize: 11, color: '#f87171', background: 'none', border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace' " }}>
            Retry
          </button>
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540', borderRadius: 12 }}>
          <FiGlobe size={13} style={{ color: '#1e2d45', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#334155' }}>No public rooms right now — create one!</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
          borderRadius: 12, fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
          No rooms match "{search}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 180, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {filtered.map(r => (
            <div key={r.code}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                background: 'rgba(255,255,255,0.025)', border: '1px solid #1a2540',
                borderRadius: 12, transition: 'border-color 0.2s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,170,0.22)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#1a2540'}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 900,
                fontSize: 13, color: '#00d4aa', letterSpacing: '0.1em', flexShrink: 0 }}>{r.code}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.hostName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{r.playerCount} player{r.playerCount !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#1a2540' }}>·</span>
                  <span style={{ fontSize: 10, color: '#475569' }}>{r.totalRounds} rounds</span>
                </div>
              </div>
              <button onClick={() => onQuickJoin(r.code)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid rgba(0,212,170,0.3)', cursor: 'pointer',
                  background: 'rgba(0,212,170,0.08)', color: '#00d4aa', flexShrink: 0,
                  fontSize: 11, fontFamily: "'Syne',sans-serif", fontWeight: 700, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}>
                <FiPlay size={9} /> Join Room
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ─── How it works — visual cards ──────────────────────────────────────── */
function HowItWorks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
      style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
      {STEPS.map((s, i) => {
        const Icon = s.icon
        return (
          <div key={i}
            style={{ flex: 1, padding: '14px', borderRadius: 16, cursor: 'default',
              background: 'rgba(255,255,255,0.02)', border: '1px solid #1a2540',
              transition: 'border-color 0.2s, background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.22)'; e.currentTarget.style.background = 'rgba(0,212,170,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2540'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.15)', flexShrink: 0 }}>
                <Icon size={13} style={{ color: '#00d4aa' }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#334155' }}>{s.n}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>{s.t}</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6 }}>{s.d}</div>
          </div>
        )
      })}
    </motion.div>
  )
}

/* ─── Landing Page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [modal, setModal] = useState(null)
  const [joinPrefill, setJoinPrefill] = useState('')
  const [cityIdx, setCityIdx] = useState(0)
  const [serverStats, setServerStats] = useState({ activePlayers: 0, activeGames: 0, lobbyRooms: 0 })
  const [recentEvents, setRecentEvents] = useState([])
  const [visitors, setVisitors] = useState(0)
  const { socket, connected } = useSocket()

  // Auto-open join modal when a ?code= param is present in the URL
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) { setJoinPrefill(code.toUpperCase()); setModal('join') }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCityIdx(i => (i + 1) % HERO_CITIES.length), 2500)
    return () => clearInterval(id)
  }, [])

  // Poll server stats and recent events every 10 s
  useEffect(() => {
    const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'
    const load = () => {
      fetch(`${BASE}/stats`)
        .then(r => r.json())
        .then(data => {
          setServerStats(data)
          if (data.visitors > 0) setVisitors(data.visitors)
        })
        .catch(() => {})
      fetch(`${BASE}/recent-events`)
        .then(r => r.json())
        .then(data => setRecentEvents(data))
        .catch(() => {})
    }
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  // Real-time visitor count via socket event (no polling delay)
  useEffect(() => {
    if (!socket) return
    const handle = ({ count }) => setVisitors(count)
    socket.on('visitor_count', handle)
    return () => socket.off('visitor_count', handle)
  }, [socket])

  const openQuickJoin = (code) => { setJoinPrefill(code); setModal('join') }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex',
      background: '#050912', fontFamily: "'DM Sans',sans-serif", position: 'relative' }}>
      <WorldGrid />

      {/* ── LEFT ── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', width: '50%', height: '100%', padding: '28px 52px',
        overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <FiGlobe size={18} style={{ color: '#00d4aa' }} />
            </div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', fontSize: 16 }}>
              GEOHIDERS.COM
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {visitors > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540' }}>
                <FiUsers size={11} style={{ color: '#475569' }} />
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#475569' }}>
                  {visitors.toLocaleString()} online
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99,
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%',
                background: connected ? '#00d4aa' : '#f87171',
                boxShadow: connected ? '0 0 8px #00d4aa' : 'none',
                animation: connected ? 'pulse 2s infinite' : 'none' }} />
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
                color: connected ? '#00d4aa' : '#f87171' }}>
                {connected ? 'Server Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div>
          <motion.div initial="h" animate="v" variants={{ h: {}, v: { transition: { staggerChildren: 0.1 } } }}>
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#00d4aa', background: 'rgba(0,212,170,0.08)',
                border: '1px solid rgba(0,212,170,0.15)', borderRadius: 99, padding: '7px 16px' }}>
                Multiplayer · Real-World · Location Battle
              </span>
            </motion.div>

            <motion.h1 variants={{ h: { opacity: 0, y: 50 }, v: { opacity: 1, y: 0 } }}
              style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, lineHeight: 1.0,
                fontSize: 'clamp(52px, 6vw, 96px)', color: '#fff', letterSpacing: '-2px', marginBottom: 16 }}>
              Geo<span style={{ color: '#00d4aa' }}>Hiders</span>
            </motion.h1>

            <motion.p variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ fontSize: 15, lineHeight: 1.7, color: '#64748b', maxWidth: 400, marginBottom: 10 }}>
              One team hides inside a real Google Street View location.
              The other team decodes clues and pins the exact spot on a world map.
            </motion.p>

            {/* ── Animated city subtitle ── */}
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Can you find</span>
              <AnimatePresence mode="wait">
                <motion.span key={cityIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa',
                    fontFamily: "'JetBrains Mono',monospace" }}>
                  {HERO_CITIES[cityIdx]}?
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={{ h: { opacity: 0, y: 20 }, v: { opacity: 1, y: 0 } }}
              style={{ display: 'flex', gap: 14 }}>
              <button onClick={() => setModal('create')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                  fontWeight: 900, fontSize: 15, background: '#00d4aa', color: '#050912',
                  boxShadow: '0 0 60px rgba(0,212,170,0.4)', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 70px rgba(0,212,170,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 60px rgba(0,212,170,0.4)' }}>
                <FiUsers size={18} /> Create Room <FiChevronRight size={16} />
              </button>

              <button onClick={() => { setJoinPrefill(''); setModal('join') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 18, cursor: 'pointer', fontFamily: "'Syne',sans-serif",
                  fontWeight: 900, fontSize: 15, color: '#fff',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540', transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)'; e.currentTarget.style.background = 'rgba(0,212,170,0.05)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2540'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'none' }}>
                <FiHash size={18} /> Join Room
              </button>
            </motion.div>
          </motion.div>

          {/* ── Stats bar ── */}
          <StatsBar activePlayers={serverStats.activePlayers} />

          {/* ── Public rooms ── */}
          <PublicRooms onQuickJoin={openQuickJoin} />
        </div>

        {/* ── How it works — cards ── */}
        <HowItWorks />
      </div>

      {/* ── RIGHT ── */}
      <div style={{ position: 'relative', zIndex: 10, width: '50%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 24, borderRadius: 28,
          background: 'rgba(14,22,37,0.35)', border: '1px solid rgba(26,37,64,0.7)', backdropFilter: 'blur(6px)' }} />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: 40, display: 'flex', flexDirection: 'column' }}>
          <AnimatedGlobe stats={serverStats} recentEvents={recentEvents} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginTop: 12 }}>
            <p style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              color: 'rgba(71,85,105,0.6)', letterSpacing: '0.12em',
              textTransform: 'lowercase', userSelect: 'none', margin: 0,
            }}>
              crafted by
            </p>
            <motion.span
              style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                fontWeight: 700, letterSpacing: '0.12em', textTransform: 'lowercase',
                color: '#00d4aa', userSelect: 'none', cursor: 'default',
              }}
              animate={{
                textShadow: [
                  '0 0 4px rgba(0,212,170,0.2)',
                  '0 0 16px rgba(0,212,170,1), 0 0 32px rgba(0,212,170,0.5)',
                  '0 0 4px rgba(0,212,170,0.2)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              🔥 blackfyre
            </motion.span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal === 'create' && <CreateModal onClose={() => setModal(null)} />}
        {modal === 'join'   && <JoinModal   onClose={() => setModal(null)} initialCode={joinPrefill} />}
      </AnimatePresence>

    </div>
  )
}
