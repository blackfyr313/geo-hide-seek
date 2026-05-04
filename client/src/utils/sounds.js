let ctx = null
let muted = false

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(val) { muted = val }
export function isMuted()     { return muted }

function beep(freq, type, gainVal, duration, delay = 0) {
  if (muted) return
  try {
    const ac  = getCtx()
    const osc = ac.createOscillator()
    const gn  = ac.createGain()
    osc.connect(gn)
    gn.connect(ac.destination)
    osc.type      = type
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay)
    gn.gain.setValueAtTime(gainVal, ac.currentTime + delay)
    gn.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + duration)
    osc.start(ac.currentTime + delay)
    osc.stop(ac.currentTime + delay + duration + 0.01)
  } catch (_) {}
}

export function playTick() {
  beep(880, 'sine', 0.15, 0.08)
}

export function playUrgentTick() {
  beep(1200, 'square', 0.12, 0.06)
  beep(900,  'square', 0.08, 0.06, 0.08)
}

export function playPinDrop() {
  beep(440, 'sine',  0.25, 0.12)
  beep(660, 'sine',  0.20, 0.10, 0.08)
  beep(880, 'sine',  0.15, 0.20, 0.15)
}

export function playScoreReveal() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => beep(f, 'sine', 0.18, 0.18, i * 0.1))
}

export function playRoundStart() {
  beep(440, 'sine', 0.2, 0.15)
  beep(660, 'sine', 0.2, 0.15, 0.18)
}
