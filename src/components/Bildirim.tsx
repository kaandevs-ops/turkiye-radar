'use client'
import { useEffect, useRef, useState } from 'react'
import { KATEGORI_ISIM } from '@/lib/kaynaklar'
import type { Olay } from '@/types/olay'

interface Props { olaylar: Olay[] }

function sesCal(tip: 'kritik' | 'yuksek') {
  try {
    const ctx = new AudioContext()
    const zamanlar = tip === 'kritik'
      ? [
          { frek: 1200, sure: 0.08, bekleme: 0 },
          { frek: 1200, sure: 0.08, bekleme: 0.12 },
          { frek: 1200, sure: 0.08, bekleme: 0.24 },
          { frek: 880, sure: 0.3, bekleme: 0.4 },
        ]
      : [
          { frek: 660, sure: 0.12, bekleme: 0 },
          { frek: 880, sure: 0.2, bekleme: 0.18 },
        ]

    zamanlar.forEach(({ frek, sure, bekleme }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = tip === 'kritik' ? 'square' : 'sine'
      osc.frequency.setValueAtTime(frek, ctx.currentTime + bekleme)
      gain.gain.setValueAtTime(0, ctx.currentTime + bekleme)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + bekleme + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + bekleme + sure)
      osc.start(ctx.currentTime + bekleme)
      osc.stop(ctx.currentTime + bekleme + sure + 0.05)
    })
  } catch {}
}

export default function Bildirim({ olaylar }: Props) {
  const oncekiRef = useRef<Set<string>>(new Set())
  const [bildirimler, setBildirimler] = useState<Olay[]>([])
  const [sesAcik, setSesAcik] = useState(true)

  useEffect(() => {
    const yeniler = olaylar.filter(o =>
      (o.siddet === 'kritik' || o.siddet === 'yuksek') && !oncekiRef.current.has(o.id)
    )
    olaylar.forEach(o => oncekiRef.current.add(o.id))

    if (yeniler.length > 0) {
      setBildirimler(prev => [...yeniler, ...prev].slice(0, 6))
      if (sesAcik) {
        const enKritik = yeniler.find(o => o.siddet === 'kritik')
        sesCal(enKritik ? 'kritik' : 'yuksek')
      }
    }
  }, [olaylar, sesAcik])

  // Otomatik kapat (10 saniye)
  useEffect(() => {
    if (bildirimler.length === 0) return
    const timer = setTimeout(() => {
      setBildirimler(prev => prev.slice(0, -1))
    }, 10000)
    return () => clearTimeout(timer)
  }, [bildirimler])

  const kapat = (id: string) => setBildirimler(prev => prev.filter(b => b.id !== id))

  return (
    <>
      <button
        onClick={() => setSesAcik(p => !p)}
        title={sesAcik ? 'Sesi Kapat' : 'Sesi Aç'}
        style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 2000,
          background: '#161b22', border: `1px solid ${sesAcik ? '#00ff8844' : '#30363d'}`,
          borderRadius: '8px', color: sesAcik ? '#00ff88' : '#444',
          fontSize: '16px', cursor: 'pointer', padding: '6px 10px',
          boxShadow: sesAcik ? '0 0 12px #00ff8822' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {sesAcik ? '🔔' : '🔕'}
      </button>

      <div style={{
        position: 'fixed', top: '60px', right: '16px',
        zIndex: 1999, display: 'flex', flexDirection: 'column',
        gap: '8px', maxWidth: '310px',
      }}>
        {bildirimler.map((b, i) => {
          const kritik = b.siddet === 'kritik'
          const renk = kritik ? '#ff4444' : '#ff8800'
          const emoji = KATEGORI_ISIM[b.kategori]?.split(' ')[0] || '⚠️'
          return (
            <div
              key={b.id}
              style={{
                background: '#0d1117',
                border: `1px solid ${renk}44`,
                borderLeft: `3px solid ${renk}`,
                borderRadius: '10px',
                padding: '10px 12px',
                boxShadow: `0 4px 20px ${renk}22`,
                animation: 'slideIn 0.25s ease',
                opacity: 1 - i * 0.15,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px' }}>{emoji}</span>
                <span style={{ color: renk, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {kritik ? '🚨 Kritik Uyarı' : '⚠️ Yüksek Öncelik'}
                </span>
                <button
                  onClick={() => kapat(b.id)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}
                >×</button>
              </div>
              <div style={{ color: '#e6edf3', fontSize: '12px', lineHeight: 1.45, fontWeight: 500 }}>
                {b.baslik.length > 90 ? b.baslik.slice(0, 90) + '…' : b.baslik}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ color: '#444', fontSize: '9px' }}>{b.kaynak}</span>
                <span style={{ color: '#444', fontSize: '9px' }}>
                  {Math.floor((Date.now() - new Date(b.tarih).getTime()) / 60000)}dk önce
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px) scale(0.95) }
          to { opacity: 1; transform: translateX(0) scale(1) }
        }
      `}</style>
    </>
  )
}
