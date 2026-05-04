import { useEffect, useState, useRef, useCallback } from 'react'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCopy, FiCheck, FiShield, FiLogOut,
  FiRefreshCw, FiPlay, FiClock, FiUsers, FiGlobe, FiEye,
  FiShuffle, FiSettings,
} from 'react-icons/fi'
import { useSocket } from '../context/SocketContext'
import { useGame } from '../context/GameContext'
import { useUI } from '../context/UIContext'

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
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2,
              fontFamily: "'JetBrains Mono',monospace" }}>No role assigned</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          {/* Switch team (only yourself) */}
          {isMe && (
            <button onClick={onSwitch} title="Switch team"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540',
                borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#94a3b8',
                transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#475569' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2540' }}>
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
          fontSize: 10, color: '#64748b' }}>
          {players.length}/5
        </span>
      </div>

      {/* Role summary chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
          borderRadius: 7, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          border: explorerCount === 1 ? '1px solid rgba(245,158,11,0.4)' : '1px solid #1a2540',
          background: explorerCount === 1 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
          color: explorerCount === 1 ? '#f59e0b' : (noExplorer ? '#ef4444' : '#64748b') }}>
          🔭 {explorerCount} Explorer{explorerCount !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px',
          borderRadius: 7, fontSize: 10, fontFamily: "'JetBrains Mono',monospace",
          border: '1px solid #1a2540', background: 'rgba(255,255,255,0.02)', color: '#94a3b8' }}>
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
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '28px 0' }}>
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

/* ─── Location Showcase (random worldwide Street View) ───────────────── */

// Same weighted zones as server — high Street View coverage areas
const SV_ZONES = [
  [ 25,  49, -124,  -67, 35], [ 44,  60, -130,  -58,  8], [ 15,  30, -117,  -87,  5],
  [ 35,  60,  -11,   25, 28], [ 50,  58,  -10,    2,  4], [ 55,  71,    5,   32,  5],
  [ 41,  56,   14,   40,  5], [ 30,  46,  128,  145, 12], [ 34,  38,  126,  130,  4],
  [-40, -10,  112,  153, 10], [-47, -34,  166,  178,  3], [-35,   5,  -73,  -35,  8],
  [-55, -22,  -73,  -53,  4], [ -5,  12,  -80,  -60,  3], [  8,  30,   68,   90,  7],
  [  1,  22,   98,  140,  6], [ 22,  42,  108,  125,  5], [ 50,  65,   30,  100,  5],
  [-35, -20,   16,   35,  4], [-12,  12,   30,   45,  3], [  4,  15,  -18,   15,  2],
  [ 20,  38,   32,   62,  3], [ 22,  26,  114,  122,  3],
]

function pickRandomCoords() {
  const total = SV_ZONES.reduce((s, z) => s + z[4], 0)
  let r = Math.random() * total, zone = SV_ZONES[0]
  for (const z of SV_ZONES) { r -= z[4]; if (r <= 0) { zone = z; break } }
  return { lat: zone[0] + Math.random() * (zone[1] - zone[0]), lng: zone[2] + Math.random() * (zone[3] - zone[2]) }
}

function codeToFlag(code) {
  if (!code || code.length !== 2) return '🌍'
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}

function loadGoogleMapsForLobby(apiKey, callback) {
  if (window.__gmapsLoaded && window.google) { callback(); return }
  const existing = document.getElementById('gmaps-script')
  if (existing) { if (window.__gmapsLoaded) callback(); else existing.addEventListener('load', callback); return }
  const script = document.createElement('script')
  script.id = 'gmaps-script'
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
  script.async = true
  script.onload = () => { window.__gmapsLoaded = true; callback() }
  document.head.appendChild(script)
}

// Mounts a random Street View panorama, skipping already-seen panoIds
function ShowcaseStreetView({ usedPanoIds, onFound }) {
  const ref        = useRef(null)
  const onFoundRef = useRef(onFound)
  const apiKey     = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  useEffect(() => { onFoundRef.current = onFound }, [onFound])

  useEffect(() => {
    if (!apiKey || !ref.current) return
    let cancelled = false
    let attempts  = 0

    function tryLoad() {
      if (cancelled || attempts >= 10 || !ref.current || !window.google) return
      attempts++
      const coords = pickRandomCoords()
      const svc = new window.google.maps.StreetViewService()
      svc.getPanorama(
        { location: coords, radius: 60000, source: window.google.maps.StreetViewSource.OUTDOOR },
        (data, status) => {
          if (cancelled || !ref.current) return
          if (status !== 'OK' || !data?.location) { tryLoad(); return }
          const panoId = data.location.pano
          if (usedPanoIds.has(panoId)) { tryLoad(); return }
          usedPanoIds.add(panoId)
          const lat = data.location.latLng.lat()
          const lng = data.location.latLng.lng()
          new window.google.maps.StreetViewPanorama(ref.current, {
            pano: panoId,
            pov: { heading: Math.random() * 360, pitch: 0 },
            addressControl: false, showRoadLabels: false,
            motionTracking: false, fullscreenControl: false,
            zoomControl: false, linksControl: false,
          })
          onFoundRef.current?.(lat, lng)
        }
      )
    }

    loadGoogleMapsForLobby(apiKey, () => { if (!cancelled && ref.current) tryLoad() })
    return () => { cancelled = true }
  }, [apiKey, usedPanoIds])

  if (!apiKey) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080f1e' }}>
      <FiGlobe size={26} style={{ color: '#1e2d45' }} />
    </div>
  )
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

function LobbyShowcase() {
  const [slotKey, setSlotKey]     = useState(0)
  const [fading, setFading]       = useState(false)
  const [locInfo, setLocInfo]     = useState(null)
  const usedPanoIds               = useRef(new Set())
  const isMobile                  = useIsMobile()

  // Auto-advance every 10 s
  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => { setSlotKey(k => k + 1); setLocInfo(null); setFading(false) }, 420)
    }, 10000)
    return () => clearInterval(t)
  }, [])

  // Reverse-geocode discovered lat/lng to get place name + flag
  const handleFound = useCallback((lat, lng) => {
    if (!window.google) return
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.length) return
      const comps = results[0].address_components
      const get   = (...types) => {
        for (const t of types) {
          const c = comps.find(x => x.types.includes(t))
          if (c) return c.long_name
        }
        return ''
      }
      const city    = get('locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1')
      const country = get('country')
      const code    = comps.find(x => x.types.includes('country'))?.short_name ?? ''
      setLocInfo({ city, country, flag: codeToFlag(code) })
    })
  }, [])

  return (
    <div style={{ width: '100%', position: 'relative', borderRadius: 18,
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 14, flexShrink: 0, height: isMobile ? 190 : 230,
      opacity: fading ? 0 : 1, transition: 'opacity 0.42s ease' }}>

      {/* key remounts the component → picks a new random pano */}
      <ShowcaseStreetView key={slotKey} usedPanoIds={usedPanoIds.current} onFound={handleFound} />

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(5,9,18,0.94) 0%, rgba(5,9,18,0.25) 42%, transparent 65%)' }} />

      {/* Location info */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 14px 10px', pointerEvents: 'none' }}>
        {locInfo ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900,
              fontSize: isMobile ? 15 : 17, color: '#fff', lineHeight: 1.1 }}>
              {locInfo.flag} {locInfo.city || locInfo.country}
            </div>
            {locInfo.city && locInfo.country && (
              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: '0.05em', marginTop: 2 }}>
                {locInfo.country}
              </div>
            )}
          </motion.div>
        ) : (
          <div style={{ fontSize: 10, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
            Locating…
          </div>
        )}
      </div>

      {/* Explore hint */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(6px)',
          borderRadius: 20, padding: '4px 12px', fontSize: 10,
          color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono',monospace",
          whiteSpace: 'nowrap' }}>
          drag to explore · changes every 10s
        </div>
      </div>
    </div>
  )
}

/* ─── Room Settings ──────────────────────────────────────────────────── */
function SettingPills({ label, options, value, onChange, disabled }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#64748b',
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = opt.value === value
          return (
            <button key={opt.value} onClick={() => !disabled && onChange(opt.value)}
              style={{ padding: '4px 11px', borderRadius: 7, border: 'none', cursor: disabled ? 'default' : 'pointer',
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10, transition: 'all 0.15s',
                background: active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#00d4aa' : '#475569',
                outline: active ? '1px solid rgba(0,212,170,0.35)' : '1px solid #1a2540',
                opacity: disabled && !active ? 0.5 : 1 }}>
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function RoomSettings({ settings, isHost, onUpdateSettings }) {
  if (!settings) return null
  const HIDE_OPTIONS   = [30, 60, 90, 120].map(s => ({ value: s, label: `${s}s` }))
  const GUESS_OPTIONS  = [30, 45, 60, 90].map(s => ({ value: s, label: `${s}s` }))
  const REGION_OPTIONS = [
    { value: 'all',      label: '🌍 World' },
    { value: 'americas', label: '🌎 Americas' },
    { value: 'europe',   label: '🌍 Europe' },
    { value: 'asia',     label: '🌏 Asia' },
    { value: 'africa',   label: '🌍 Africa' },
    { value: 'oceania',  label: '🇦🇺 Oceania' },
  ]

  return (
    <div style={{ padding: '14px 18px', borderRadius: 14, width: '100%', maxWidth: 440,
      background: 'rgba(14,22,37,0.7)', border: '1px solid #1a2540', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <FiSettings size={12} style={{ color: '#00d4aa' }} />
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.1em' }}>Room Settings</span>
        {!isHost && (
          <span style={{ marginLeft: 'auto', fontSize: 9, color: '#475569',
            fontFamily: "'JetBrains Mono',monospace" }}>Host only</span>
        )}
      </div>
      <SettingPills label="Hide time" options={HIDE_OPTIONS}
        value={settings.hidingSecs} disabled={!isHost}
        onChange={v => onUpdateSettings({ hidingSecs: v })} />
      <SettingPills label="Guess time" options={GUESS_OPTIONS}
        value={settings.guessSecs} disabled={!isHost}
        onChange={v => onUpdateSettings({ guessSecs: v })} />
      <SettingPills label="Region" options={REGION_OPTIONS}
        value={settings.region} disabled={!isHost}
        onChange={v => onUpdateSettings({ region: v })} />
    </div>
  )
}

/* ─── Lobby Page ──────────────────────────────────────────────────────── */
export default function LobbyPage() {
  const isMobile = useIsMobile()
  const { socket } = useSocket()
  const { room, setRoom, player, setPage, setPlayer, setGameLocation } = useGame()
  const { notifications, pushNotification } = useUI()

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
  const updateSettings = (patch) => {
    socket.emit('update_settings', { code: room.code, settings: patch }, res => {
      if (res?.error) pushNotification(res.error, 'error')
    })
  }

  return (
    <div style={{ width: '100vw', minHeight: '100vh', height: isMobile ? 'auto' : '100vh',
      background: '#050912', display: 'flex',
      flexDirection: 'column', fontFamily: "'DM Sans',sans-serif",
      overflow: isMobile ? 'auto' : 'hidden', position: 'relative' }}>

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
          gap: isMobile ? 8 : 16, padding: isMobile ? '12px 14px' : '16px 32px',
          borderBottom: '1px solid #1a2540',
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
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: '#64748b',
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
            fontSize: 12, color: '#94a3b8' }}>
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
            cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontFamily: 'inherit',
            transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2540' }}>
          <FiLogOut size={13} /> Leave
        </button>
      </motion.div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        minHeight: 0, position: 'relative', zIndex: 10,
        overflowY: isMobile ? 'visible' : 'hidden' }}>

        {/* LEFT — Red team */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{ width: isMobile ? '100%' : 310, display: 'flex', flexDirection: 'column',
            padding: isMobile ? '14px 14px 0' : 20,
            borderRight: isMobile ? 'none' : '1px solid #1a2540',
            borderBottom: isMobile ? '1px solid #1a2540' : 'none',
            background: 'rgba(10,14,26,0.4)', flexShrink: 0,
            maxHeight: isMobile ? 340 : 'none', overflowY: isMobile ? 'auto' : 'visible' }}>
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
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            padding: isMobile ? '16px 14px' : '28px 36px' }}>

          {/* Location showcase — interactive Street View of iconic places */}
          <LobbyShowcase />

          {/* Room settings */}
          <RoomSettings settings={room.settings} isHost={isHost} onUpdateSettings={updateSettings} />

          {/* How-to-play hint */}
          <div style={{ marginBottom: 14, padding: '12px 20px', borderRadius: 14,
            background: 'rgba(14,22,37,0.7)', border: '1px solid #1a2540',
            maxWidth: 440, width: '100%' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace",
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              How to play
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#94a3b8' }}>
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
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{startHint}</div>
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
          style={{ width: isMobile ? '100%' : 310, display: 'flex', flexDirection: 'column',
            padding: isMobile ? '14px 14px 0' : 20,
            borderLeft: isMobile ? 'none' : '1px solid #1a2540',
            borderTop: isMobile ? '1px solid #1a2540' : 'none',
            background: 'rgba(10,14,26,0.4)', flexShrink: 0,
            maxHeight: isMobile ? 340 : 'none', overflowY: isMobile ? 'auto' : 'visible' }}>
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
