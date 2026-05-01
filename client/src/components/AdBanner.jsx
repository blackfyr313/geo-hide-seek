import { useEffect, useRef } from 'react'

export default function AdBanner({ adSlot, adFormat = 'auto', style = {} }) {
  const adRef = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      if (window.adsbygoogle && adRef.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushed.current = true
      }
    } catch (e) {
      // AdSense not loaded yet (dev/localhost) — ignore
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6674114225076107"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  )
}
