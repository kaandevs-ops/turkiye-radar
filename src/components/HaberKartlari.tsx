'use client'
import { useState, useRef } from 'react'
import { KATEGORI_RENK, KATEGORI_ISIM } from '@/lib/kaynaklar'
import { useState as useAIState } from 'react'
import { haberOzetle } from '@/lib/aiIslemler'
import { aiConfigAl } from '@/lib/ai'
import type { HaberAnaliz } from '@/lib/aiIslemler'
import type { Olay } from '@/types/olay'

interface Props {
  olaylar: Olay[]
  onOlaySecil: (olay: Olay) => void
}

export default function HaberKartlari({ olaylar, onOlaySecil }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [analizMap, setAnalizMap] = useAIState<Record<string, HaberAnaliz | 'yukleniyor'>>({})

  const haberAnalizEt = async (e: React.MouseEvent, olay: Olay) => {
    e.stopPropagation()
    if (analizMap[olay.id]) return
    setAnalizMap(prev => ({ ...prev, [olay.id]: 'yukleniyor' }))
    try {
      const config = aiConfigAl()
      const analiz = await haberOzetle(config, olay)
      setAnalizMap(prev => ({ ...prev, [olay.id]: analiz }))
    } catch {
      setAnalizMap(prev => { const n = { ...prev }; delete n[olay.id]; return n })
    }
  }
  const scrollRef = useRef<HTMLDivElement>(null)

  const haberler = olaylar.filter(o => o.kaynak !== 'USGS').slice(0, 20)
  if (haberler.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: '38px', left: '340px', right: 0,
      height: '160px', background: 'linear-gradient(to top, #0d1117 60%, #0d111700)',
      borderTop: '1px solid #21262d', zIndex: 400,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#58a6ff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>📰 Son Haberler</span>
        <span style={{ color: '#444', fontSize: '10px' }}>{haberler.length} haber</span>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: '10px', padding: '8px 16px 10px', overflowX: 'auto', scrollbarWidth: 'none', alignItems: 'stretch' }}>
        {haberler.map((olay) => {
          const renk = KATEGORI_RENK[olay.kategori] || '#808080'
          const isHovered = hoveredId === olay.id
          const resim = (olay as any).resim
          const gecenSure = () => {
            const diff = Date.now() - new Date(olay.tarih).getTime()
            const dk = Math.floor(diff / 60000)
            return dk < 60 ? `${dk}dk` : `${Math.floor(dk / 60)}sa`
          }
          return (
            <div
              key={olay.id}
              onClick={() => { onOlaySecil(olay); if (olay.url) window.open(olay.url, '_blank', 'noopener') }}
              onMouseEnter={() => setHoveredId(olay.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                flexShrink: 0, width: resim ? '200px' : '180px', height: '110px',
                borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                border: `1px solid ${isHovered ? renk : '#21262d'}`,
                background: '#161b22', position: 'relative',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? `0 4px 16px ${renk}33` : 'none',
              }}
            >
              {resim && (
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resim})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: resim ? 'linear-gradient(to top, #161b22 50%, transparent)' : 'none' }} />
              <div style={{ position: 'absolute', inset: 0, padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {/* AI Özet butonu */}
                {isHovered && !analizMap[olay.id] && (
                  <button
                    onClick={(e) => haberAnalizEt(e, olay)}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: '#58a6ff22', border: '1px solid #58a6ff55',
                      borderRadius: '4px', padding: '2px 6px',
                      color: '#58a6ff', fontSize: '9px', cursor: 'pointer', zIndex: 10,
                    }}
                  >🤖 Özet</button>
                )}
                {analizMap[olay.id] === 'yukleniyor' && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', color: '#58a6ff', fontSize: '9px' }}>⏳</div>
                )}
                {analizMap[olay.id] && analizMap[olay.id] !== 'yukleniyor' && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: '#0d1117ee', borderRadius: '10px',
                    padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
                    overflowY: 'auto',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#58a6ff', fontSize: '9px', fontWeight: 700 }}>🤖 AI ÖZET</span>
                      <button onClick={(e) => { e.stopPropagation(); setAnalizMap(p => { const n={...p}; delete n[olay.id]; return n }) }}
                        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                    </div>
                    <div style={{ color: '#e6edf3', fontSize: '10px', lineHeight: '1.4' }}>
                      {(analizMap[olay.id] as HaberAnaliz).ozet}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span style={{ color: '#ff8800', fontSize: '9px' }}>⭐ {(analizMap[olay.id] as HaberAnaliz).onemSkoru}/10</span>
                      {(analizMap[olay.id] as HaberAnaliz).anahtarKelimeler?.slice(0,2).map(k => (
                        <span key={k} style={{ background: '#21262d', color: '#8b949e', fontSize: '8px', padding: '1px 4px', borderRadius: '3px' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: `${renk}33`, color: renk, fontWeight: 700 }}>
                    {KATEGORI_ISIM[olay.kategori]?.split(' ').slice(1).join(' ') || olay.kategori}
                  </span>
                  <span style={{ color: '#444', fontSize: '9px', marginLeft: 'auto' }}>{gecenSure()}</span>
                </div>
                <div style={{ color: '#e6edf3', fontSize: '11px', fontWeight: 600, lineHeight: '1.35', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {olay.baslik}
                </div>
                <div style={{ color: '#555', fontSize: '9px', marginTop: '3px' }}>{olay.kaynak}</div>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
