import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUI } from '../context/UIContext'

function useIsMobile() {
  const [m, setM] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    let t
    const fn = () => { clearTimeout(t); t = setTimeout(() => setM(window.innerWidth < 768), 150) }
    window.addEventListener('resize', fn)
    return () => { window.removeEventListener('resize', fn); clearTimeout(t) }
  }, [])
  return m
}
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSend, FiMapPin, FiCheck, FiClock, FiUsers,
  FiAward, FiGlobe, FiEye, FiArrowRight, FiHome,
  FiRefreshCw, FiRotateCcw, FiLogOut, FiVolume2, FiVolumeX,
  FiMessageSquare, FiList,
} from 'react-icons/fi'
import { useSocket } from '../context/SocketContext'
import { useGame } from '../context/GameContext'
import {
  playTick, playUrgentTick, playPinDrop, playScoreReveal, playRoundStart,
  setMuted as setSoundMuted,
} from '../utils/sounds'

const TEAM_COLORS = { red: '#ff4d6d', blue: '#4d9fff' }


// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const styles = {
    success: { bg: 'rgba(0,212,170,0.1)',  border: 'rgba(0,212,170,0.3)', color: '#00d4aa' },
    error:   { bg: 'rgba(255,77,109,0.1)', border: 'rgba(255,77,109,0.3)', color: '#f87171' },
    info:    { bg: 'rgba(14,22,37,0.95)',  border: '#1a2540',              color: '#cbd5e1' },
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

// ─── Load Google Maps script once ────────────────────────────────────────────
function loadGoogleMaps(apiKey, callback) {
  if (window.__gmapsLoaded && window.google) { callback(); return }
  const existing = document.getElementById('gmaps-script')
  if (existing) {
    if (window.__gmapsLoaded) callback()
    else existing.addEventListener('load', callback)
    return
  }
  const script = document.createElement('script')
  script.id    = 'gmaps-script'
  script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
  script.async = true
  script.onload = () => { window.__gmapsLoaded = true; callback() }
  document.head.appendChild(script)
}

// ─── Timer hook ──────────────────────────────────────────────────────────────
function useCountdown(endsAt) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!endsAt) return
    const tick = () => setSecs(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return secs
}

// ─── Street View (3D Panorama) ───────────────────────────────────────────────
function StreetView({ lat, lng, panoId: directPanoId, onLocationConfirmed, onNoStreetView }) {
  const ref             = useRef(null)
  const confirmedRef    = useRef(false)
  const onConfirmedRef  = useRef(onLocationConfirmed)
  const onNoSVRef       = useRef(onNoStreetView)
  const apiKey          = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => { onConfirmedRef.current = onLocationConfirmed }, [onLocationConfirmed])
  useEffect(() => { onNoSVRef.current = onNoStreetView }, [onNoStreetView])

  useEffect(() => {
    confirmedRef.current = false
    if (!apiKey || !ref.current) return
    loadGoogleMaps(apiKey, () => {
      if (!ref.current || !window.google) return

      if (directPanoId) {
        new window.google.maps.StreetViewPanorama(ref.current, {
          pano:             directPanoId,
          addressControl:   false,
          showRoadLabels:   false,
          motionTracking:   false,
          fullscreenControl: false,
          zoomControl:      true,
        })
        return
      }

      const svc = new window.google.maps.StreetViewService()
      svc.getPanorama(
        { location: { lat, lng }, radius: 20000, preference: 'nearest',
          source: window.google.maps.StreetViewSource.OUTDOOR },
        (data, status) => {
          if (!ref.current) return
          if (status === window.google.maps.StreetViewStatus.OK && data?.location) {
            const actualLat = data.location.latLng.lat()
            const actualLng = data.location.latLng.lng()
            const panoId    = data.location.pano
            new window.google.maps.StreetViewPanorama(ref.current, {
              pano:             panoId,
              addressControl:   false,
              showRoadLabels:   false,
              motionTracking:   false,
              fullscreenControl: false,
              zoomControl:      true,
            })
            if (!confirmedRef.current && onConfirmedRef.current) {
              confirmedRef.current = true
              const geocoder = new window.google.maps.Geocoder()
              geocoder.geocode({ location: { lat: actualLat, lng: actualLng } }, (results, gStatus) => {
                let city = '', country = ''
                if (gStatus === 'OK' && results?.length) {
                  const comps = results[0].address_components
                  const get = (...types) => {
                    for (const t of types) {
                      const c = comps.find(x => x.types.includes(t))
                      if (c) return c.long_name
                    }
                    return ''
                  }
                  city    = get('locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1')
                  country = get('country')
                }
                onConfirmedRef.current(actualLat, actualLng, panoId, city, country)
              })
            }
          } else {
            if (onNoSVRef.current) onNoSVRef.current()
          }
        }
      )
    })
  }, [lat, lng, directPanoId, apiKey])

  if (!apiKey) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#080f1e',
        border: '1px solid #1a2540', borderRadius: 16 }}>
        <FiGlobe size={40} style={{ color: '#1e2d45', marginBottom: 16 }} />
        <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
          Add <code style={{ color: '#00d4aa', background: 'rgba(0,212,170,0.1)', padding: '2px 6px', borderRadius: 4 }}>VITE_GOOGLE_MAPS_API_KEY</code> to <code style={{ color: '#94a3b8' }}>client/.env</code>
        </p>
      </div>
    )
  }

  return <div ref={ref} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />
}

// ─── Google 2D Guess Map ──────────────────────────────────────────────────────
function GoogleGuessMap({ guess, onPin, submitted }) {
  const mapRef          = useRef(null)
  const markerRef       = useRef(null)
  const mapInstanceRef  = useRef(null)
  const transitLayerRef = useRef(null)
  const onPinRef        = useRef(onPin)
  const submittedRef    = useRef(submitted)
  const [mapType, setMapType] = useState('roadmap')
  const apiKey          = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => { onPinRef.current = onPin }, [onPin])
  useEffect(() => { submittedRef.current = submitted }, [submitted])

  useEffect(() => {
    if (!apiKey || !mapRef.current) return
    loadGoogleMaps(apiKey, () => {
      if (!mapRef.current || !window.google || mapInstanceRef.current) return
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        minZoom: 2, maxZoom: 18,
      })
      mapInstanceRef.current = map
      const transit = new window.google.maps.TransitLayer()
      transit.setMap(map)
      transitLayerRef.current = transit
      map.addListener('click', e => {
        if (submittedRef.current) return
        onPinRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() })
      })
    })
  }, [apiKey])

  useEffect(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.setMapTypeId(mapType)
  }, [mapType])

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return
    if (guess) {
      if (markerRef.current) {
        markerRef.current.setPosition({ lat: guess.lat, lng: guess.lng })
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: { lat: guess.lat, lng: guess.lng },
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10, fillColor: '#00d4aa', fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 3,
          },
          title: 'Your guess',
        })
      }
    } else if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }, [guess])

  if (!apiKey) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }}>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Add VITE_GOOGLE_MAPS_API_KEY to enable map</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', zIndex: 5 }}>
        {[['roadmap', 'Map'], ['hybrid', 'Satellite']].map(([id, label]) => (
          <button key={id} onClick={() => setMapType(id)}
            style={{ padding: '7px 16px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.03em',
              background: mapType === id ? '#00d4aa' : 'rgba(255,255,255,0.95)',
              color: mapType === id ? '#050912' : '#475569',
              transition: 'background 0.15s, color 0.15s' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Google 2D Results Map ────────────────────────────────────────────────────
function GoogleResultsMap({ location, results }) {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const apiKey         = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !mapRef.current) return
    loadGoogleMaps(apiKey, () => {
      if (!mapRef.current || !window.google || mapInstanceRef.current) return

      const center = { lat: location.lat, lng: location.lng }
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 3,
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        minZoom: 2,
      })
      mapInstanceRef.current = map

      new window.google.maps.Marker({
        position: center, map,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14, fillColor: '#00d4aa', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
        zIndex: 10,
      })

      new window.google.maps.Circle({
        map, center, radius: 300000,
        strokeColor: '#00d4aa', strokeOpacity: 0.3, strokeWeight: 1,
        fillColor: '#00d4aa', fillOpacity: 0.05,
      })

      results.forEach(r => {
        if (!r.guess) return
        const guessPos = { lat: r.guess.lat, lng: r.guess.lng }
        const color    = TEAM_COLORS[r.team] ?? '#94a3b8'

        new window.google.maps.Marker({
          position: guessPos, map,
          title: `${r.playerName}: ${r.distanceKm.toLocaleString()} km — +${r.points.toLocaleString()} pts`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9, fillColor: color, fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 2,
          },
        })

        new window.google.maps.Polyline({
          path: [guessPos, center], map,
          strokeColor: color, strokeOpacity: 0.5, strokeWeight: 2,
          icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0', repeat: '16px',
          }],
        })
      })

      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(center)
      results.forEach(r => { if (r.guess) bounds.extend({ lat: r.guess.lat, lng: r.guess.lng }) })
      if (results.some(r => r.guess)) map.fitBounds(bounds, 60)
    })
  }, [])

  if (!apiKey) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080f1e', border: '1px solid #1a2540', borderRadius: 16 }}>
        <p style={{ color: '#475569', fontSize: 14 }}>Add VITE_GOOGLE_MAPS_API_KEY to enable results map</p>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />
}

// ─── Spectator live-guess map ─────────────────────────────────────────────────
function SpectatorGuessMap({ location, guesses }) {
  const mapRef         = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef     = useRef({})
  const [mapType, setMapType] = useState('roadmap')
  const apiKey         = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.setMapTypeId(mapType)
  }, [mapType])

  useEffect(() => {
    if (!apiKey || !mapRef.current) return
    loadGoogleMaps(apiKey, () => {
      if (!mapRef.current || !window.google || mapInstanceRef.current) return
      const center = { lat: location.lat, lng: location.lng }
      const map = new window.google.maps.Map(mapRef.current, {
        center, zoom: 3,
        mapTypeId: 'roadmap',
        mapTypeControl: false, streetViewControl: false,
        fullscreenControl: false, zoomControl: true, minZoom: 2,
      })
      mapInstanceRef.current = map

      new window.google.maps.Marker({
        position: center, map, title: location.name, zIndex: 10,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14, fillColor: '#00d4aa', fillOpacity: 1,
          strokeColor: '#fff', strokeWeight: 3,
        },
      })
      new window.google.maps.Circle({
        map, center, radius: 300000,
        strokeColor: '#00d4aa', strokeOpacity: 0.25, strokeWeight: 1,
        fillColor: '#00d4aa', fillOpacity: 0.04,
      })
    })
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return
    const map = mapInstanceRef.current
    const center = { lat: location.lat, lng: location.lng }

    Object.entries(guesses).forEach(([pid, g]) => {
      const pos   = { lat: g.lat, lng: g.lng }
      const color = TEAM_COLORS[g.team] ?? '#94a3b8'

      if (markersRef.current[pid]) {
        markersRef.current[pid].marker.setPosition(pos)
        markersRef.current[pid].line.setPath([pos, center])
      } else {
        const marker = new window.google.maps.Marker({
          position: pos, map,
          title: `${g.playerName} (${g.team})`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9, fillColor: color, fillOpacity: 1,
            strokeColor: '#fff', strokeWeight: 2,
          },
        })
        const line = new window.google.maps.Polyline({
          path: [pos, center], map,
          strokeColor: color, strokeOpacity: 0.45, strokeWeight: 2,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '16px' }],
        })
        markersRef.current[pid] = { marker, line }
      }
    })
  }, [guesses, location])

  if (!apiKey) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080f1e', border: '1px solid #1a2540', borderRadius: 16 }}>
        <p style={{ color: '#475569', fontSize: 14 }}>Add VITE_GOOGLE_MAPS_API_KEY to enable map</p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', zIndex: 5 }}>
        {[['roadmap', 'Map'], ['hybrid', 'Satellite']].map(([id, label]) => (
          <button key={id} onClick={() => setMapType(id)}
            style={{ padding: '7px 16px', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.03em',
              background: mapType === id ? '#00d4aa' : 'rgba(255,255,255,0.95)',
              color: mapType === id ? '#050912' : '#475569',
              transition: 'background 0.15s, color 0.15s' }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Shared header bar ───────────────────────────────────────────────────────
function GameHeader({ room, secs, phase, roundResults, onLeave, muted, onToggleMute }) {
  const minutes  = Math.floor(secs / 60)
  const secsStr  = String(secs % 60).padStart(2, '0')
  const urgent   = secs <= 15 && secs > 0
  const phaseLabel = {
    hiding:   'Explorer Hides',
    guessing: 'Agents Guess',
    results:  'Round Results',
    finished: 'Game Over',
  }

  const activeTeam  = roundResults?.currentTeamPlaying ?? room?.currentTeamPlaying
  const subRound    = roundResults?.round ?? room?.round ?? 0
  const teamRound   = Math.ceil(subRound / 2)
  const totalRounds = room?.totalRounds ?? 3
  const teamColor   = TEAM_COLORS[activeTeam] ?? '#00d4aa'
  const teamEmoji   = activeTeam === 'red' ? '🔴' : '🔵'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      background: 'rgba(8,15,30,0.95)', borderBottom: '1px solid #1a2540',
      backdropFilter: 'blur(12px)', flexShrink: 0, flexWrap: 'wrap' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.2)' }}>
          <FiGlobe size={14} style={{ color: '#00d4aa' }} />
        </div>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 12, color: '#fff' }}>
          GEOHIDERS.COM
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: '#1a2540' }} />

      {/* Active team + round */}
      {activeTeam && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
          borderRadius: 8, background: `${teamColor}14`, border: `1px solid ${teamColor}33` }}>
          <span style={{ fontSize: 12 }}>{teamEmoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: teamColor,
            fontFamily: "'Syne',sans-serif" }}>
            {activeTeam.charAt(0).toUpperCase() + activeTeam.slice(1)} Team
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>
            Round {teamRound}/{totalRounds}
          </span>
        </div>
      )}

      {/* Phase */}
      <div style={{ fontSize: 11, color: '#00d4aa', fontFamily: "'JetBrains Mono',monospace",
        background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.15)',
        borderRadius: 8, padding: '4px 10px' }}>
        {phaseLabel[phase] ?? phase}
      </div>

      <div style={{ flex: 1 }} />

      {/* Scores */}
      {['red', 'blue'].map(team => (
        <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          borderRadius: 8,
          background: team === 'red' ? 'rgba(255,77,109,0.07)' : 'rgba(77,159,255,0.07)',
          border: `1px solid ${team === 'red' ? 'rgba(255,77,109,0.2)' : 'rgba(77,159,255,0.2)'}` }}>
          <span style={{ fontSize: 10, color: TEAM_COLORS[team] }}>{team === 'red' ? '🔴' : '🔵'}</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14, color: '#fff' }}>
            {(room?.scores?.[team] ?? 0).toLocaleString()}
          </span>
          <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>pts</span>
        </div>
      ))}

      {/* Timer */}
      {secs > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
          borderRadius: 8, background: urgent ? 'rgba(255,77,109,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${urgent ? 'rgba(255,77,109,0.3)' : '#1a2540'}` }}>
          <FiClock size={12} style={{ color: urgent ? '#f87171' : '#94a3b8' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14,
            color: urgent ? '#f87171' : '#fff' }}>
            {minutes}:{secsStr}
          </span>
        </div>
      )}

      {/* Mute toggle */}
      <button onClick={onToggleMute} title={muted ? 'Unmute sounds' : 'Mute sounds'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 8,
          background: muted ? 'rgba(255,77,109,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${muted ? 'rgba(255,77,109,0.3)' : '#1a2540'}`,
          cursor: 'pointer', color: muted ? '#f87171' : '#94a3b8',
          transition: 'all 0.2s', flexShrink: 0 }}>
        {muted ? <FiVolumeX size={13} /> : <FiVolume2 size={13} />}
      </button>

      {/* Leave */}
      <button onClick={onLeave}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
          borderRadius: 9, background: 'transparent', border: '1px solid #1a2540',
          cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontFamily: "'DM Sans',sans-serif",
          transition: 'all 0.2s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2540' }}>
        <FiLogOut size={12} /> Leave
      </button>
    </div>
  )
}

// ─── Clue + Chat panel ────────────────────────────────────────────────────────
function CluePanel({ clues, isExplorer, clueInput, setClueInput, onSubmitClue, onDone,
                     guessCount, totalAgents, readOnly, chatMessages, onSendChat, myTeam }) {
  const safeClues = Array.isArray(clues) ? clues : []
  const inputRef  = useRef(null)
  const chatEndRef = useRef(null)
  const isMobile  = useIsMobile()
  const [tab, setTab] = useState('clues')
  const [chatInput, setChatInput] = useState('')

  const handleKey = e => { if (e.key === 'Enter' && !readOnly) onSubmitClue() }
  const handleChatKey = e => {
    if (e.key === 'Enter' && chatInput.trim()) sendChat()
  }
  const sendChat = () => {
    if (!chatInput.trim()) return
    onSendChat(chatInput.trim())
    setChatInput('')
  }

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, tab])

  const unreadCount = tab === 'clues' ? (chatMessages?.length ?? 0) : 0

  return (
    <div style={{
      width: isMobile ? '100%' : 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'rgba(8,12,22,0.8)',
      borderLeft: isMobile ? 'none' : '1px solid #1a2540',
      borderTop: isMobile ? '1px solid #1a2540' : 'none',
      height: isMobile ? 'auto' : '100%',
      maxHeight: isMobile ? 220 : 'none',
    }}>

      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a2540', flexShrink: 0 }}>
        {[['clues', <FiList size={11} />, 'Clues'], ['chat', <FiMessageSquare size={11} />, 'Chat']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 8px', border: 'none', cursor: 'pointer', fontSize: 11,
              fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.06em',
              background: tab === id ? 'rgba(0,212,170,0.07)' : 'transparent',
              color: tab === id ? '#00d4aa' : '#475569',
              borderBottom: tab === id ? '2px solid #00d4aa' : '2px solid transparent',
              transition: 'all 0.15s', position: 'relative' }}>
            {icon} {label}
            {id === 'chat' && unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 8, background: '#ff4d6d',
                color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700,
                padding: '1px 5px', lineHeight: 1.4 }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CLUES TAB ── */}
      {tab === 'clues' && (
        <>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid rgba(26,37,64,0.5)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {isExplorer ? 'Drop hints — no coords or country names!' : 'Decode the clues and find the spot.'}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AnimatePresence>
              {safeClues.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', color: '#475569', fontSize: 12, paddingTop: 20 }}>
                  {isExplorer ? 'No clues yet — add your first one!' : 'Waiting for the explorer…'}
                </motion.div>
              )}
              {safeClues.map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.12)',
                    borderRadius: 10, padding: '9px 11px' }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>{c.text}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 3,
                    fontFamily: "'JetBrains Mono',monospace" }}>clue #{i + 1}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {isExplorer && !readOnly && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #1a2540', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 7 }}>
                <input ref={inputRef} value={clueInput} onChange={e => setClueInput(e.target.value)}
                  onKeyDown={handleKey} placeholder="Add a clue…" maxLength={80}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540',
                    borderRadius: 10, padding: '8px 11px', color: '#fff', fontSize: 13, outline: 'none',
                    fontFamily: "'DM Sans',sans-serif" }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,212,170,0.4)'}
                  onBlur={e => e.target.style.borderColor = '#1a2540'} />
                <button onClick={onSubmitClue} disabled={!clueInput.trim()}
                  style={{ width: 34, height: 34, borderRadius: 9, border: 'none',
                    cursor: clueInput.trim() ? 'pointer' : 'not-allowed',
                    background: clueInput.trim() ? '#00d4aa' : '#1a2540',
                    color: clueInput.trim() ? '#050912' : '#334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s' }}>
                  <FiSend size={13} />
                </button>
              </div>
              <button onClick={onDone}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px', borderRadius: 11, border: '1px solid rgba(0,212,170,0.3)',
                  cursor: 'pointer', background: 'rgba(0,212,170,0.07)', color: '#00d4aa',
                  fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 12, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,170,0.07)'}>
                <FiArrowRight size={13} /> Done Exploring
              </button>
            </div>
          )}

          {!isExplorer && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #1a2540', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>Guesses</span>
                <span style={{ fontSize: 13, fontWeight: 700,
                  color: guessCount === totalAgents && totalAgents > 0 ? '#00d4aa' : '#fff' }}>
                  {guessCount}/{totalAgents}
                </span>
              </div>
              {guessCount === totalAgents && totalAgents > 0 && (
                <div style={{ fontSize: 11, color: '#00d4aa', marginTop: 5,
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  All guesses in — tallying…
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── CHAT TAB ── */}
      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(!chatMessages || chatMessages.length === 0) && (
              <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, paddingTop: 20 }}>
                No messages yet — say hi!
              </div>
            )}
            {chatMessages?.map((m, i) => {
              const isMe = m.isMe
              const teamColor = TEAM_COLORS[m.team] ?? '#94a3b8'
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 9, color: teamColor, fontFamily: "'JetBrains Mono',monospace",
                    marginBottom: 2, fontWeight: 700 }}>
                    {m.playerName}
                  </div>
                  <div style={{ maxWidth: '85%', padding: '7px 10px', borderRadius: 10,
                    background: isMe ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isMe ? 'rgba(0,212,170,0.2)' : '#1a2540'}`,
                    fontSize: 12, color: '#e2e8f0', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {m.message}
                  </div>
                </motion.div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid #1a2540',
            display: 'flex', gap: 7, flexShrink: 0 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleChatKey} placeholder="Message team…" maxLength={200}
              style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid #1a2540',
                borderRadius: 10, padding: '8px 11px', color: '#fff', fontSize: 13, outline: 'none',
                fontFamily: "'DM Sans',sans-serif" }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,212,170,0.4)'}
              onBlur={e => e.target.style.borderColor = '#1a2540'} />
            <button onClick={sendChat} disabled={!chatInput.trim()}
              style={{ width: 34, height: 34, borderRadius: 9, border: 'none',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                background: chatInput.trim() ? '#00d4aa' : '#1a2540',
                color: chatInput.trim() ? '#050912' : '#334155',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s' }}>
              <FiSend size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── VIEW: Explorer hiding ────────────────────────────────────────────────────
function ExplorerHiding({ room, location, activeClues, chatMessages, onSendChat }) {
  const { socket } = useSocket()
  const [clue, setClue] = useState('')
  const isMobile = useIsMobile()

  const submitClue = useCallback(() => {
    if (!clue.trim()) return
    socket.emit('submit_clue', { code: room.code, clue: clue.trim() })
    setClue('')
  }, [clue, socket, room.code])

  const done = useCallback(() => {
    socket.emit('explorer_done', { code: room.code })
  }, [socket, room.code])

  const handleLocationConfirmed = useCallback((lat, lng, panoId, city, country) => {
    socket.emit('location_confirmed', { code: room.code, lat, lng, panoId, city, country })
  }, [socket, room.code])

  const handleNoStreetView = useCallback(() => {
    socket.emit('request_new_location', { code: room.code })
  }, [socket, room.code])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0, position: 'relative' }}>
      <div style={{ flex: 1, padding: isMobile ? 8 : 14, minWidth: 0 }}>
        <StreetView lat={location.lat} lng={location.lng}
          onLocationConfirmed={handleLocationConfirmed}
          onNoStreetView={handleNoStreetView} />
      </div>
      <CluePanel
        clues={activeClues} isExplorer
        clueInput={clue} setClueInput={setClue}
        onSubmitClue={submitClue} onDone={done}
        guessCount={0} totalAgents={0}
        chatMessages={chatMessages} onSendChat={onSendChat}
      />
    </div>
  )
}

// ─── VIEW: Agent waiting (hiding phase) ──────────────────────────────────────
function AgentWaiting({ room, activeClues, chatMessages, onSendChat }) {
  const explorer = room.players?.find(p => p.role === 'explorer')
  const isMobile = useIsMobile()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 20, padding: isMobile ? 20 : 40 }}>
        <div style={{ position: 'relative', width: 110, height: 110, display: 'flex',
          alignItems: 'center', justifyContent: 'center' }}>
          {[1, 1.6, 2.2].map((s, i) => (
            <motion.div key={i} style={{ position: 'absolute', width: 72, height: 72,
              borderRadius: '50%', border: '1px solid rgba(0,212,170,0.3)' }}
              animate={{ scale: [s, s + 0.4, s], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }} />
          ))}
          <FiEye size={32} style={{ color: '#00d4aa' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Syne',sans-serif",
            color: '#fff', marginBottom: 7 }}>Explorer is hiding…</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            <span style={{ color: TEAM_COLORS[explorer?.team ?? 'red'] }}>
              {explorer?.name ?? 'Explorer'}
            </span>{' '}is roaming a secret location. Clues will appear here.
          </div>
        </div>
      </div>
      <CluePanel clues={activeClues} isExplorer={false}
        clueInput="" setClueInput={() => {}} onSubmitClue={() => {}} onDone={() => {}}
        guessCount={room.guessCount ?? 0} totalAgents={room.totalAgents ?? 0}
        chatMessages={chatMessages} onSendChat={onSendChat} />
    </div>
  )
}

// ─── VIEW: Agent guessing ─────────────────────────────────────────────────────
function AgentGuessing({ room, activeClues, chatMessages, onSendChat }) {
  const { socket } = useSocket()
  const [guess,     setGuess]     = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const isMobile = useIsMobile()

  const submit = useCallback(() => {
    if (!guess || submitted) return
    socket.emit('submit_guess', { code: room.code, lat: guess.lat, lng: guess.lng }, () => {
      setSubmitted(true)
      playPinDrop()
    })
  }, [guess, submitted, socket, room.code])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? 8 : 14, gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            {submitted
              ? <span style={{ color: '#00d4aa' }}>✓ Guess locked in — waiting for others…</span>
              : 'Click the map to place your guess, then confirm.'}
          </div>
          {!submitted && (
            <button onClick={submit} disabled={!guess}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                borderRadius: 12, border: 'none', cursor: guess ? 'pointer' : 'not-allowed',
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 13,
                background: guess ? '#00d4aa' : '#1a2540',
                color: guess ? '#050912' : '#334155',
                boxShadow: guess ? '0 0 24px rgba(0,212,170,0.3)' : 'none',
                transition: 'all 0.2s' }}>
              <FiMapPin size={13} /> Confirm Guess
            </button>
          )}
        </div>
        <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden',
          opacity: submitted ? 0.5 : 1, transition: 'opacity 0.3s' }}>
          <GoogleGuessMap guess={guess} onPin={!submitted ? setGuess : () => {}} submitted={submitted} />
        </div>
      </div>
      <CluePanel clues={activeClues} isExplorer={false}
        clueInput="" setClueInput={() => {}} onSubmitClue={() => {}} onDone={() => {}}
        guessCount={room.guessCount ?? 0} totalAgents={room.totalAgents ?? 0}
        chatMessages={chatMessages} onSendChat={onSendChat} />
    </div>
  )
}

// ─── VIEW: Explorer waiting (guessing phase) ──────────────────────────────────
function ExplorerWaiting({ room, activeClues, chatMessages, onSendChat }) {
  const guessCount  = room.guessCount  ?? 0
  const totalAgents = room.totalAgents ?? 0
  const isMobile = useIsMobile()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 20, padding: isMobile ? 20 : 40 }}>
        <FiUsers size={38} style={{ color: '#00d4aa' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Syne',sans-serif",
            color: '#fff', marginBottom: 7 }}>Agents are guessing…</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Sit tight while your teammates find you!</div>
        </div>
        <div style={{ width: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>Guesses in</span>
            <span style={{ fontSize: 13, fontWeight: 700,
              color: guessCount === totalAgents && totalAgents > 0 ? '#00d4aa' : '#fff' }}>
              {guessCount}/{totalAgents}
            </span>
          </div>
          <div style={{ height: 5, background: '#1a2540', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div style={{ height: '100%', background: '#00d4aa', borderRadius: 99 }}
              animate={{ width: totalAgents > 0 ? `${(guessCount / totalAgents) * 100}%` : '0%' }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>
      <CluePanel clues={activeClues} isExplorer={false}
        clueInput="" setClueInput={() => {}} onSubmitClue={() => {}} onDone={() => {}}
        guessCount={guessCount} totalAgents={totalAgents}
        chatMessages={chatMessages} onSendChat={onSendChat} />
    </div>
  )
}

// ─── VIEW: Spectator ──────────────────────────────────────────────────────────
function SpectatorView({ room, activeClues, phase, location, spectatorGuesses, chatMessages, onSendChat }) {
  const guessCount  = room.guessCount  ?? 0
  const totalAgents = room.totalAgents ?? 0
  const isMobile    = useIsMobile()
  const playingTeam = room.currentTeamPlaying
  const teamColor   = TEAM_COLORS[playingTeam] ?? '#00d4aa'
  const teamEmoji   = playingTeam === 'red' ? '🔴' : '🔵'
  const explorer    = room.players?.find(p => p.role === 'explorer')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Spectating banner */}
      <div style={{ padding: '9px 20px', borderBottom: '1px solid #1a2540', flexShrink: 0,
        background: `${teamColor}0a`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FiEye size={13} style={{ color: teamColor }} />
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace",
          color: teamColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          SPECTATING
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {teamEmoji} {playingTeam?.charAt(0).toUpperCase()}{playingTeam?.slice(1)} Team is playing
          {phase === 'hiding' && explorer && ` — ${explorer.name} is the explorer`}
        </span>
        {phase === 'guessing' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8',
            fontFamily: "'JetBrains Mono',monospace" }}>
            {guessCount}/{totalAgents} guesses in
          </span>
        )}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0 }}>

        {/* Left panel */}
        <div style={{ flex: 1, padding: isMobile ? 8 : 14, minWidth: 0, position: 'relative' }}>
          {phase === 'hiding' && location ? (
            <StreetView lat={location.lat} lng={location.lng} panoId={location.panoId} />
          ) : phase === 'hiding' && !location ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 14, flexDirection: 'column' }}>
              <motion.div animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <FiGlobe size={32} style={{ color: teamColor }} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Syne',sans-serif",
                  color: '#fff', marginBottom: 5 }}>Waiting for round to start…</div>
              </div>
            </div>
          ) : phase === 'guessing' && location ? (
            <SpectatorGuessMap location={location} guesses={spectatorGuesses} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center' }}>
              <FiUsers size={36} style={{ color: teamColor }} />
            </div>
          )}
        </div>

        {/* Right panel */}
        <CluePanel clues={activeClues} isExplorer={false} readOnly
          clueInput="" setClueInput={() => {}} onSubmitClue={() => {}} onDone={() => {}}
          guessCount={guessCount} totalAgents={totalAgents}
          chatMessages={chatMessages} onSendChat={onSendChat} />
      </div>
    </div>
  )
}

// ─── VIEW: Round results ──────────────────────────────────────────────────────
function RoundResults({ data, room }) {
  const { location, results, scores, round, totalRounds, currentTeamPlaying, phaseEndsAt,
          redTeamRoundsCompleted, blueTeamRoundsCompleted } = data
  const secs      = useCountdown(phaseEndsAt)
  const teamRound = Math.ceil(round / 2)
  const teamColor = TEAM_COLORS[currentTeamPlaying] ?? '#00d4aa'
  const teamEmoji = currentTeamPlaying === 'red' ? '🔴' : '🔵'
  const isMobile  = useIsMobile()

  // Best guesser this round
  const winner = results[0]
  const maxScore = results.reduce((m, r) => Math.max(m, r.points), 0)

  useEffect(() => { playScoreReveal() }, [])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0, gap: 0 }}>
      <div style={{ flex: 1, padding: isMobile ? 8 : 14, minWidth: 0, minHeight: isMobile ? 200 : 0 }}>
        <GoogleResultsMap location={location} results={results} />
      </div>

      <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(8,12,22,0.8)',
        borderLeft: isMobile ? 'none' : '1px solid #1a2540',
        borderTop: isMobile ? '1px solid #1a2540' : 'none',
        overflowY: 'auto', maxHeight: isMobile ? 300 : 'none' }}>

        {/* Location reveal */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #1a2540',
          background: 'linear-gradient(135deg, rgba(0,212,170,0.06), transparent)' }}>
          <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace",
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            📍 The Location Was
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#00d4aa',
            fontFamily: "'Syne',sans-serif", lineHeight: 1.2, marginBottom: 3 }}>{location.name}</div>
          {location.city && location.city !== 'Random Location' && (
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>{location.city}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 11, color: teamColor, fontFamily: "'JetBrains Mono',monospace",
              background: `${teamColor}15`, border: `1px solid ${teamColor}30`,
              borderRadius: 6, padding: '3px 10px' }}>
              {teamEmoji} {currentTeamPlaying?.charAt(0).toUpperCase()}{currentTeamPlaying?.slice(1)} Team
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: "'JetBrains Mono',monospace" }}>
              Round {teamRound}/{totalRounds}
            </div>
          </div>
        </div>

        {/* Round winner badge */}
        {winner && (
          <div style={{ padding: '14px 22px', borderBottom: '1px solid #1a2540',
            background: 'rgba(0,212,170,0.03)' }}>
            <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace",
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              🏅 Closest Guess
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: TEAM_COLORS[winner.team] + '22',
                border: `2px solid ${TEAM_COLORS[winner.team]}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                color: TEAM_COLORS[winner.team] }}>1</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff',
                  fontFamily: "'Syne',sans-serif" }}>{winner.playerName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  {winner.distanceKm.toLocaleString()} km away
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Syne',sans-serif",
                  color: '#00d4aa' }}>+{winner.points.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace" }}>pts</div>
              </div>
            </div>
          </div>
        )}

        {/* All guesses */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540' }}>
          <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace",
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>All Guesses</div>
          {results.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 12 }}>No guesses were submitted.</div>
          )}
          {results.map((r, i) => (
            <motion.div key={r.playerId}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: TEAM_COLORS[r.team] + '18',
                border: `1px solid ${TEAM_COLORS[r.team]}66`,
                fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 10,
                color: TEAM_COLORS[r.team] }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.playerName}</div>
                <div style={{ height: 4, background: '#1a2540', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: maxScore > 0 ? `${(r.points / maxScore) * 100}%` : '0%' }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.5 }}
                    style={{ height: '100%', borderRadius: 99,
                      background: TEAM_COLORS[r.team] ?? '#00d4aa' }} />
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                  {r.distanceKm.toLocaleString()} km
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 900, fontFamily: "'Syne',sans-serif",
                color: '#00d4aa', flexShrink: 0 }}>+{r.points.toLocaleString()}</div>
            </motion.div>
          ))}
        </div>

        {/* Team score progress bars */}
        <div style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono',monospace",
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Scoreboard</div>
          {['red', 'blue'].map(team => {
            const pts    = scores[team] ?? 0
            const maxPts = Math.max(scores.red ?? 0, scores.blue ?? 0, 1)
            const done   = team === 'red' ? redTeamRoundsCompleted : blueTeamRoundsCompleted
            return (
              <div key={team} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: TEAM_COLORS[team], fontWeight: 700 }}>
                    {team === 'red' ? '🔴' : '🔵'} {team.charAt(0).toUpperCase() + team.slice(1)}
                    <span style={{ fontSize: 10, color: '#475569', fontWeight: 400, marginLeft: 6,
                      fontFamily: "'JetBrains Mono',monospace" }}>
                      {done}/{totalRounds} rounds
                    </span>
                  </span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                    color: '#fff' }}>
                    {pts.toLocaleString()}
                  </span>
                </div>
                <div style={{ height: 6, background: '#1a2540', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(pts / maxPts) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 99,
                      background: team === 'red'
                        ? 'linear-gradient(90deg, #ff4d6d, #ff8fa3)'
                        : 'linear-gradient(90deg, #4d9fff, #93c5fd)' }} />
                </div>
              </div>
            )
          })}
          {secs > 0 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: '#475569',
              fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>
              Next in {secs}s…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── VIEW: Game over ──────────────────────────────────────────────────────────
function GameOver({ data, room }) {
  const { scores, players } = data
  const { setPage, setRoom, setPlayer, setGameLocation, setRoundResults, setGameOver } = useGame()
  const { pushNotification } = useUI()
  const { socket } = useSocket()

  const meInfo = room?.players?.find(p => p.id === socket?.id)
  const isHost = meInfo?.isHost

  const winner = scores.red > scores.blue ? 'red'
               : scores.blue > scores.red ? 'blue'
               : null

  const backToHome = () => {
    socket.emit('leave_room', { code: room.code })
    setRoom(null); setPlayer(null); setPage('landing')
    setGameLocation(null); setRoundResults(null); setGameOver(null)
  }

  const rematch = () => {
    socket.emit('rematch', { code: room.code }, res => {
      if (res?.error) pushNotification(res.error, 'error')
    })
  }

  const returnToLobby = () => {
    socket.emit('return_to_lobby', { code: room.code }, res => {
      if (res?.error) pushNotification(res.error, 'error')
    })
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

        <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 68, marginBottom: 20 }}>🏆</motion.div>

        <div style={{ fontSize: 12, color: '#00d4aa', fontFamily: "'JetBrains Mono',monospace",
          textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 7 }}>Game Over</div>

        {winner ? (
          <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Syne',sans-serif",
            color: '#fff', marginBottom: 6 }}>
            <span style={{ color: TEAM_COLORS[winner] }}>
              {winner.charAt(0).toUpperCase() + winner.slice(1)} Team
            </span> Wins!
          </div>
        ) : (
          <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "'Syne',sans-serif",
            color: '#fff', marginBottom: 6 }}>It's a Tie!</div>
        )}

        {/* Scores */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', margin: '20px 0' }}>
          {['red', 'blue'].map(team => (
            <div key={team} style={{ flex: 1, padding: '18px', borderRadius: 18,
              background: team === winner
                ? (team === 'red' ? 'rgba(255,77,109,0.1)' : 'rgba(77,159,255,0.1)')
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${team === winner ? TEAM_COLORS[team] : '#1a2540'}`,
              boxShadow: team === winner ? `0 0 28px ${TEAM_COLORS[team]}33` : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{team === 'red' ? '🔴' : '🔵'}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 26,
                color: TEAM_COLORS[team] }}>
                {(scores[team] ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace",
                textTransform: 'uppercase', marginTop: 3 }}>points</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {isHost && (
            <>
              <button onClick={rematch}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px',
                  borderRadius: 15, border: 'none', cursor: 'pointer',
                  fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                  background: '#00d4aa', color: '#050912',
                  boxShadow: '0 0 36px rgba(0,212,170,0.35)', transition: 'all 0.2s', width: '100%',
                  justifyContent: 'center', maxWidth: 280 }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <FiRefreshCw size={15} /> Rematch
              </button>
              <button onClick={returnToLobby}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 28px',
                  borderRadius: 15, border: '1px solid rgba(0,212,170,0.3)', cursor: 'pointer',
                  fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 14,
                  background: 'rgba(0,212,170,0.08)', color: '#00d4aa', transition: 'all 0.2s',
                  width: '100%', justifyContent: 'center', maxWidth: 280 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,212,170,0.08)'}>
                <FiRotateCcw size={15} /> Return to Lobby
              </button>
            </>
          )}
          {!isHost && (
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace",
              marginBottom: 8 }}>
              Waiting for host to start rematch or return to lobby…
            </div>
          )}
          <button onClick={backToHome}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '11px 24px',
              borderRadius: 14, border: '1px solid #1a2540', cursor: 'pointer',
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13,
              background: 'transparent', color: '#94a3b8', transition: 'all 0.2s',
              width: '100%', justifyContent: 'center', maxWidth: 280 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a2540'; e.currentTarget.style.color = '#94a3b8' }}>
            <FiHome size={14} /> Leave Game
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main GamePage ────────────────────────────────────────────────────────────
export default function GamePage() {
  const { socket } = useSocket()
  const {
    room, setRoom, player,
    gameLocation, setGameLocation,
    roundResults, setRoundResults,
    gameOver, setGameOver,
    setPage, setPlayer,
  } = useGame()
  const { notifications, pushNotification } = useUI()

  const isMobile = useIsMobile()

  const [spectatorGuesses, setSpectatorGuesses] = useState({})
  const [chatMessages, setChatMessages]         = useState([])
  const [muted, setMutedState]                  = useState(false)

  const toggleMute = useCallback(() => {
    const next = !muted
    setMutedState(next)
    setSoundMuted(next)
  }, [muted])

  useEffect(() => {
    if (!socket) return

    const onUpdate           = snap => setRoom(snap)
    const onClue             = ({ clues }) => setRoom(prev => ({ ...prev, clues }))
    const onGuessUpdate      = ({ guessCount, totalAgents }) =>
      setRoom(prev => ({ ...prev, guessCount, totalAgents }))
    const onLocation         = ({ location }) => setGameLocation(location)
    const onResults          = data => { setRoundResults(data); setGameLocation(null) }
    const onGameOver         = data => setGameOver(data)
    const onReturnLobby      = () => {
      setGameOver(null); setRoundResults(null); setGameLocation(null)
      setSpectatorGuesses({})
      setChatMessages([])
      setPage('lobby')
    }
    const onSpectatorGuesses = ({ guesses }) => setSpectatorGuesses(guesses)
    const onJoined           = ({ message }) => pushNotification(message, 'info')
    const onLeft             = ({ message }) => pushNotification(message, 'info')
    const onChatMessage      = (msg) => {
      const isMe = msg.playerId === socket.id
      setChatMessages(prev => [...prev, { ...msg, isMe }])
    }

    socket.on('room_updated',           onUpdate)
    socket.on('clue_added',             onClue)
    socket.on('guess_submitted',        onGuessUpdate)
    socket.on('location_assigned',      onLocation)
    socket.on('round_results',          onResults)
    socket.on('game_over',              onGameOver)
    socket.on('return_to_lobby',        onReturnLobby)
    socket.on('spectator_guess_update', onSpectatorGuesses)
    socket.on('player_joined',          onJoined)
    socket.on('player_left',            onLeft)
    socket.on('team_chat_message',      onChatMessage)

    return () => {
      socket.off('room_updated',           onUpdate)
      socket.off('clue_added',             onClue)
      socket.off('guess_submitted',        onGuessUpdate)
      socket.off('location_assigned',      onLocation)
      socket.off('round_results',          onResults)
      socket.off('game_over',              onGameOver)
      socket.off('return_to_lobby',        onReturnLobby)
      socket.off('spectator_guess_update', onSpectatorGuesses)
      socket.off('player_joined',          onJoined)
      socket.off('player_left',            onLeft)
      socket.off('team_chat_message',      onChatMessage)
    }
  }, [socket, setRoom, setGameLocation, setRoundResults, setGameOver, setPage, pushNotification])

  // Clear results + spectator state when a new round begins, play round start sound
  useEffect(() => {
    if (room?.phase === 'hiding') {
      setRoundResults(null)
      setSpectatorGuesses({})
      playRoundStart()
    }
  }, [room?.phase, setRoundResults])

  const headerSecs = useCountdown(room?.phaseEndsAt ?? 0)

  // Urgent ticks in last 10 seconds of any timed phase
  useEffect(() => {
    const phase = gameOver ? 'finished' : (roundResults ? 'results' : room?.phase)
    if (headerSecs > 0 && headerSecs <= 10 && (phase === 'hiding' || phase === 'guessing')) {
      playUrgentTick()
    }
  }, [headerSecs])

  const leaveGame = useCallback(() => {
    socket.emit('leave_room', { code: room.code })
    setRoom(null); setPlayer(null); setPage('landing')
    setGameLocation(null); setRoundResults(null); setGameOver(null)
  }, [socket, room, setRoom, setPlayer, setPage, setGameLocation, setRoundResults, setGameOver])

  const sendChat = useCallback((message) => {
    if (!room?.code) return
    socket.emit('team_chat', { code: room.code, message })
  }, [socket, room?.code])

  if (!room || !player) return null

  const me          = room.players?.find(p => p.id === player.id)
  const phase       = gameOver ? 'finished' : (roundResults ? 'results' : room.phase)
  const role        = me?.role
  const activeClues = room.clues?.[room.currentTeamPlaying] ?? []

  return (
    <div style={{ width: '100vw', height: '100vh', minHeight: '-webkit-fill-available',
      background: '#050912', display: 'flex',
      flexDirection: 'column', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden', position: 'relative' }}>

      {/* Background grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.03, pointerEvents: 'none' }}>
        <defs>
          <pattern id="gg" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#00d4aa" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gg)" />
      </svg>

      <GameHeader room={room} secs={headerSecs} phase={phase} roundResults={roundResults}
        onLeave={leaveGame} muted={muted} onToggleMute={toggleMute} />

      <AnimatePresence mode="wait">

        {/* Starting / loading */}
        {!phase && (
          <motion.div key="loading" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
              Starting game…
            </div>
          </motion.div>
        )}

        {/* Explorer waiting for location */}
        {phase === 'hiding' && role === 'explorer' && !gameLocation && (
          <motion.div key="explorer-loading" style={{ flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <FiGlobe size={34} style={{ color: '#00d4aa' }} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 900, fontFamily: "'Syne',sans-serif",
                color: '#fff', marginBottom: 5 }}>Receiving your location…</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Your secret spot is being assigned.</div>
            </div>
          </motion.div>
        )}

        {/* Game over */}
        {phase === 'finished' && gameOver && (
          <motion.div key="gameover" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameOver data={gameOver} room={room} />
          </motion.div>
        )}

        {/* Round results */}
        {phase === 'results' && roundResults && (
          <motion.div key={`results-${roundResults.round}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RoundResults data={roundResults} room={room} />
          </motion.div>
        )}

        {/* Explorer hiding */}
        {phase === 'hiding' && role === 'explorer' && gameLocation && (
          <motion.div key="explorer-hiding"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExplorerHiding room={room} location={gameLocation} activeClues={activeClues}
              chatMessages={chatMessages} onSendChat={sendChat} />
          </motion.div>
        )}

        {/* Agent: waiting for explorer (hiding phase) */}
        {phase === 'hiding' && role === 'agent' && (
          <motion.div key="agent-waiting" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AgentWaiting room={room} activeClues={activeClues}
              chatMessages={chatMessages} onSendChat={sendChat} />
          </motion.div>
        )}

        {/* Agent: guessing */}
        {phase === 'guessing' && role === 'agent' && (
          <motion.div key="agent-guessing" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AgentGuessing room={room} activeClues={activeClues}
              chatMessages={chatMessages} onSendChat={sendChat} />
          </motion.div>
        )}

        {/* Explorer: watching agents guess */}
        {phase === 'guessing' && role === 'explorer' && (
          <motion.div key="explorer-waiting" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExplorerWaiting room={room} activeClues={activeClues}
              chatMessages={chatMessages} onSendChat={sendChat} />
          </motion.div>
        )}

        {/* Spectator */}
        {(phase === 'hiding' || phase === 'guessing') && role === 'spectator' && (
          <motion.div key={`spectator-${phase}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SpectatorView
              room={room}
              activeClues={activeClues}
              phase={phase}
              location={gameLocation}
              spectatorGuesses={spectatorGuesses}
              chatMessages={chatMessages}
              onSendChat={sendChat}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* In-game toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex',
        flexDirection: 'column', gap: 9, zIndex: 200 }}>
        <AnimatePresence>
          {notifications.map(n => <Toast key={n.id} msg={n.msg} type={n.type} />)}
        </AnimatePresence>
      </div>
    </div>
  )
}
