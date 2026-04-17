'use client'
import { useEffect, useState } from 'react'
import type { Olay } from '@/types/olay'

interface DovizKur { kod: string; alis: string; satis: string }
interface Props { olaylar: Olay[] }

export default function IstatistikBar({ olaylar }: Props) {
  const [kurlar, setKurlar] = useState<DovizKur[]>([])
  const [saat, setSaat] = useState('')
  const [mod, setMod] = useState<'doviz' | 'istatistik'>('doviz')

  useEffect(() => {
    setSaat(new Date().toLocaleTimeString('tr-TR'))
    const interval = setInterval(() => setSaat(new Date().toLocaleTimeString('tr-TR')), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const dovizYukle = () => {
      fetch('/api/doviz')
        .then(r => r.json())
        .then(d => { if (d.kurlar) setKurlar(d.kurlar.slice(0, 6)) })
        .catch(() => {})
    }
    dovizYukle()
    const interval = setInterval(dovizYukle, 300_000)
    return () => clearInterval(interval)
  }, [])

  const kritik = olaylar.filter(o => o.siddet === 'kritik').length
  const yuksek = olaylar.filter(o => o.siddet === 'yuksek').length
  const deprem = olaylar.filter(o => o.kategori === 'DEPREM' || o.kategori === 'DEPREM_ARTCI').length
  const haber = olaylar.filter(o => ['NTV','CNN Türk','Hürriyet','Sabah','TRT Haber','AA','Haberturk','Daily Sabah'].includes(o.kaynak)).length
  const hava = olaylar.filter(o => o.kaynak === 'Open-Meteo').length

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '340px', right: 0, height: '38px',
      background: '#0d1117ee', borderTop: '1px solid #21262d',
      display: 'flex', alignItems: 'center', padding: '0 12px',
      gap: '16px', zIndex: 500, backdropFilter: 'blur(8px)', overflowX: 'auto',
    }}>
      {/* Mod toggle */}
      <button
        onClick={() => setMod(m => m === 'doviz' ? 'istatistik' : 'doviz')}
        style={{
          background: 'none', border: '1px solid #30363d', borderRadius: '5px',
          color: '#555', cursor: 'pointer', fontSize: '10px', padding: '2px 7px',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {mod === 'doviz' ? '📊' : '💱'}
      </button>

      {mod === 'doviz' ? (
        <>
          <span style={{ color: '#00ff88', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            💱 TCMB
          </span>
          {kurlar.length === 0 ? (
            <span style={{ color: '#555', fontSize: '11px' }}>Yükleniyor...</span>
          ) : (
            kurlar.map(k => (
              <div key={k.kod} style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#555', fontSize: '10px' }}>{k.kod}</span>
                <span style={{ color: '#e6edf3', fontSize: '11px', fontWeight: 600 }}>
                  ₺{parseFloat(k.satis).toFixed(4)}
                </span>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <span style={{ color: '#58a6ff', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            📊 ÖZET
          </span>
          <StatChip label="Toplam" deger={olaylar.length} renk="#58a6ff" />
          <StatChip label="🔴 Kritik" deger={kritik} renk="#ff4444" />
          <StatChip label="🟠 Yüksek" deger={yuksek} renk="#ff8800" />
          <div style={{ width: '1px', height: '20px', background: '#21262d', flexShrink: 0 }} />
          <StatChip label="🔴 Deprem" deger={deprem} renk="#FF4444" />
          <StatChip label="📰 Haber" deger={haber} renk="#8b949e" />
          <StatChip label="🌦 Hava" deger={hava} renk="#88CCFF" />
        </>
      )}

      <div style={{ marginLeft: 'auto', color: '#444', fontSize: '10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {saat ? `🕐 ${saat}` : ''}
      </div>
    </div>
  )
}

function StatChip({ label, deger, renk }: { label: string; deger: number; renk: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#555', fontSize: '10px' }}>{label}</span>
      <span style={{ color: renk, fontSize: '11px', fontWeight: 700 }}>{deger}</span>
    </div>
  )
}
