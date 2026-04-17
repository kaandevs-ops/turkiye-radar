'use client'
import { useState, useMemo } from 'react'
import { KATEGORI_ISIM, KATEGORI_RENK } from '@/lib/kaynaklar'
import { useState as useStateAI } from 'react'
import { depremRiskAnaliz, anomaliTespit } from '@/lib/aiIslemler'
import { aiConfigAl } from '@/lib/ai'
import type { DepremAnaliz, Anomali } from '@/lib/aiIslemler'
import type { Olay } from '@/types/olay'

interface Props {
  olaylar: Olay[]
  onKapat: () => void
}

export default function Dashboard({ olaylar, onKapat }: Props) {
  const [aktifSekme, setAktifSekme] = useState<'ozet' | 'kategori' | 'trend' | 'kaynak' | 'aiDeprem' | 'aiAnomali'>('ozet')
  const [depremAnaliz, setDepremAnaliz] = useStateAI<DepremAnaliz | null>(null)
  const [depremYukleniyor, setDepremYukleniyor] = useStateAI(false)
  const [depremHata, setDepremHata] = useStateAI('')

  // Anomali state
  const [dovizAnomali, setDovizAnomali] = useStateAI<Anomali | null>(null)
  const [havaAnomali, setHavaAnomali] = useStateAI<Anomali | null>(null)
  const [anomaliYukleniyor, setAnomaliYukleniyor] = useStateAI(false)
  const [anomaliHata, setAnomaliHata] = useStateAI('')

  const anomaliAnalizYap = async () => {
    if (anomaliYukleniyor) return
    setAnomaliYukleniyor(true)
    setAnomaliHata('')
    try {
      const config = aiConfigAl()

      // Döviz: direkt /api/doviz'den kurlar çek
      const dovizRes = await fetch('/api/doviz')
      const dovizData = await dovizRes.json()
      const kurlar: Array<{kod:string, alis:number, satis:number}> = dovizData.kurlar || []
      const usdKur = kurlar.find(k => k.kod === 'USD')
      const eurKur = kurlar.find(k => k.kod === 'EUR')
      const gbpKur = kurlar.find(k => k.kod === 'GBP')
      const dovizDegerler = [usdKur, eurKur, gbpKur].filter(Boolean).map(k => k!.satis)
      if (dovizDegerler.length >= 2) {
        const d = await anomaliTespit(config, 'doviz', dovizDegerler[0], dovizDegerler.slice(1), 'TL')
        setDovizAnomali(d)
      }

      // Hava kalitesi: /api/havakalitesi'nden çek
      const havaRes = await fetch('/api/havakalitesi')
      const havaData = await havaRes.json()
      const havaOlaylar = havaData.olaylar || []
      const havaDegerler = havaOlaylar
        .slice(0, 10)
        .map((o: any) => parseFloat(o.aciklama?.match(/[0-9.]+/)?.[0] || '0'))
        .filter((v: number) => v > 0)
      if (havaDegerler.length >= 2) {
        const h = await anomaliTespit(config, 'havakalitesi', havaDegerler[0], havaDegerler.slice(1), 'AQI')
        setHavaAnomali(h)
      } else if (dovizDegerler.length < 2) {
        setAnomaliHata('Yeterli veri bulunamadı')
      }
    } catch (err: any) {
      setAnomaliHata(err.message || 'AI hatası')
    } finally {
      setAnomaliYukleniyor(false)
    }
  }


  const depremAnalizYap = async () => {
    if (depremYukleniyor) return
    setDepremYukleniyor(true)
    setDepremHata('')
    try {
      const config = aiConfigAl()
      const sonuc = await depremRiskAnaliz(config, olaylar)
      setDepremAnaliz(sonuc)
    } catch (err: any) {
      setDepremHata(err.message || 'AI hatası')
    } finally {
      setDepremYukleniyor(false)
    }
  }

  const istatistik = useMemo(() => {
    const kritik = olaylar.filter(o => o.siddet === 'kritik').length
    const yuksek = olaylar.filter(o => o.siddet === 'yuksek').length
    const orta = olaylar.filter(o => o.siddet === 'orta').length
    const dusuk = olaylar.filter(o => o.siddet === 'dusuk').length

    // Kategori dağılımı
    const katMap: Record<string, number> = {}
    olaylar.forEach(o => { katMap[o.kategori] = (katMap[o.kategori] || 0) + 1 })
    const kategoriler = Object.entries(katMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)

    // Kaynak dağılımı
    const kaynakMap: Record<string, number> = {}
    olaylar.forEach(o => { kaynakMap[o.kaynak] = (kaynakMap[o.kaynak] || 0) + 1 })
    const kaynaklar = Object.entries(kaynakMap).sort((a, b) => b[1] - a[1]).slice(0, 10)

    // 7 günlük trend
    const trend = Array.from({ length: 7 }, (_, i) => {
      const gun = new Date()
      gun.setDate(gun.getDate() - (6 - i))
      gun.setHours(0, 0, 0, 0)
      const sonGun = new Date(gun); sonGun.setDate(sonGun.getDate() + 1)
      const gunOlaylar = olaylar.filter(o => {
        const t = new Date(o.tarih).getTime()
        return t >= gun.getTime() && t < sonGun.getTime()
      })
      return {
        gun: gun.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
        toplam: gunOlaylar.length,
        kritik: gunOlaylar.filter(o => o.siddet === 'kritik').length,
        yuksek: gunOlaylar.filter(o => o.siddet === 'yuksek').length,
      }
    })

    // Son 1 saatteki olaylar
    const birSaat = Date.now() - 3600000
    const sonBirSaat = olaylar.filter(o => new Date(o.tarih).getTime() > birSaat).length

    return { kritik, yuksek, orta, dusuk, kategoriler, kaynaklar, trend, sonBirSaat }
  }, [olaylar])

  const trendMaks = Math.max(...istatistik.trend.map(t => t.toplam), 1)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#0d1117ee', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onKapat}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(900px, 95vw)', maxHeight: '88vh',
          background: '#0d1117', border: '1px solid #21262d',
          borderRadius: '16px', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #21262d',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <div>
            <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: '15px' }}>Türkiye Radar — Dashboard</div>
            <div style={{ color: '#555', fontSize: '11px' }}>{olaylar.length} olay · Son 7 gün</div>
          </div>
          <button onClick={onKapat} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#555', cursor: 'pointer', fontSize: '20px',
          }}>✕</button>
        </div>

        {/* Sekmeler */}
        <div style={{ display: 'flex', borderBottom: '1px solid #21262d', padding: '0 20px' }}>
          {([
            { id: 'ozet', label: '📈 Özet' },
            { id: 'kategori', label: '🗂 Kategori' },
            { id: 'trend', label: '📅 Trend' },
            { id: 'kaynak', label: '📡 Kaynaklar' },
            { id: 'aiDeprem', label: '🤖 AI Deprem' },
            { id: 'aiAnomali', label: '📡 AI Anomali' },
          ] as const).map(s => (
            <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{
              background: 'none', border: 'none',
              borderBottom: aktifSekme === s.id ? '2px solid #58a6ff' : '2px solid transparent',
              color: aktifSekme === s.id ? '#58a6ff' : '#555',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              padding: '10px 14px', transition: 'all 0.15s',
            }}>{s.label}</button>
          ))}
        </div>

        {/* İçerik */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ÖZET */}
          {aktifSekme === 'ozet' && (
            <div>
              {/* Büyük sayılar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Toplam Olay', deger: olaylar.length, renk: '#58a6ff', icon: '📋' },
                  { label: '🔴 Kritik', deger: istatistik.kritik, renk: '#ff4444', icon: '🚨' },
                  { label: '🟠 Yüksek', deger: istatistik.yuksek, renk: '#ff8800', icon: '⚠️' },
                  { label: 'Son 1 Saat', deger: istatistik.sonBirSaat, renk: '#00cc88', icon: '⏱' },
                ].map(k => (
                  <div key={k.label} style={{
                    background: '#161b22', borderRadius: '12px', padding: '16px',
                    border: `1px solid ${k.renk}22`,
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    <span style={{ fontSize: '20px' }}>{k.icon}</span>
                    <span style={{ color: k.renk, fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>{k.deger}</span>
                    <span style={{ color: '#555', fontSize: '11px' }}>{k.label}</span>
                  </div>
                ))}
              </div>

              {/* Şiddet dağılımı — yatay bar */}
              <div style={{ background: '#161b22', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Şiddet Dağılımı
                </div>
                {[
                  { label: '🔴 Kritik', deger: istatistik.kritik, renk: '#ff4444' },
                  { label: '🟠 Yüksek', deger: istatistik.yuksek, renk: '#ff8800' },
                  { label: '🟡 Orta', deger: istatistik.orta, renk: '#ffcc00' },
                  { label: '🟢 Düşük', deger: istatistik.dusuk, renk: '#00cc88' },
                ].map(s => (
                  <div key={s.label} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#8b949e', fontSize: '11px' }}>{s.label}</span>
                      <span style={{ color: s.renk, fontSize: '11px', fontWeight: 700 }}>{s.deger}</span>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${olaylar.length ? (s.deger / olaylar.length) * 100 : 0}%`,
                        height: '100%', background: s.renk, borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pasta benzeri daire gösterge */}
              <div style={{
                background: '#161b22', borderRadius: '12px', padding: '16px',
                display: 'flex', gap: '16px', alignItems: 'center',
              }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '90px', height: '90px' }}>
                    {(() => {
                      const data = [
                        { d: istatistik.kritik, c: '#ff4444' },
                        { d: istatistik.yuksek, c: '#ff8800' },
                        { d: istatistik.orta, c: '#ffcc00' },
                        { d: istatistik.dusuk, c: '#00cc88' },
                      ]
                      const total = data.reduce((s, x) => s + x.d, 0) || 1
                      let offset = 0
                      return data.map((item, i) => {
                        const pct = (item.d / total) * 100
                        const el = (
                          <circle key={i}
                            cx="18" cy="18" r="15.9"
                            fill="none" stroke={item.c} strokeWidth="3.2"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={-offset}
                          />
                        )
                        offset += pct
                        return el
                      })
                    })()}
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: '#e6edf3', fontSize: '20px', fontWeight: 800, lineHeight: 1 }}>{olaylar.length}</span>
                    <span style={{ color: '#444', fontSize: '8px' }}>toplam</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'Kritik', d: istatistik.kritik, c: '#ff4444' },
                    { label: 'Yüksek', d: istatistik.yuksek, c: '#ff8800' },
                    { label: 'Orta', d: istatistik.orta, c: '#ffcc00' },
                    { label: 'Düşük', d: istatistik.dusuk, c: '#00cc88' },
                  ].map(x => (
                    <div key={x.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: x.c, flexShrink: 0 }} />
                      <span style={{ color: '#8b949e', fontSize: '11px', flex: 1 }}>{x.label}</span>
                      <span style={{ color: x.c, fontSize: '11px', fontWeight: 700 }}>{x.d}</span>
                      <span style={{ color: '#444', fontSize: '10px' }}>
                        %{olaylar.length ? Math.round((x.d / olaylar.length) * 100) : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KATEGORİ */}
          {aktifSekme === 'kategori' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {istatistik.kategoriler.map(([kat, sayi]) => {
                const renk = KATEGORI_RENK[kat] || '#555'
                const maks = istatistik.kategoriler[0]?.[1] || 1
                return (
                  <div key={kat} style={{ background: '#161b22', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{KATEGORI_ISIM[kat]?.split(' ')[0] || '📌'}</span>
                      <span style={{ color: '#e6edf3', fontSize: '12px', flex: 1 }}>
                        {KATEGORI_ISIM[kat]?.split(' ').slice(1).join(' ') || kat}
                      </span>
                      <span style={{ color: renk, fontSize: '14px', fontWeight: 800 }}>{sayi}</span>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '3px', height: '4px' }}>
                      <div style={{
                        width: `${(sayi / maks) * 100}%`, height: '100%',
                        background: renk, borderRadius: '3px', transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* TREND */}
          {aktifSekme === 'trend' && (
            <div>
              <div style={{ background: '#161b22', borderRadius: '12px', padding: '16px' }}>
                <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Son 7 Gün — Günlük Olay Sayısı
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                  {istatistik.trend.map((t, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ color: '#555', fontSize: '9px' }}>{t.toplam}</span>
                      <div style={{
                        width: '100%',
                        height: `${Math.max((t.toplam / trendMaks) * 100, t.toplam > 0 ? 4 : 0)}%`,
                        background: t.kritik > 0 ? '#ff4444' : t.yuksek > 0 ? '#ff8800' : '#58a6ff',
                        borderRadius: '4px 4px 0 0',
                        minHeight: t.toplam > 0 ? '4px' : '0',
                        transition: 'height 0.5s ease',
                        position: 'relative',
                      }}>
                        {t.kritik > 0 && (
                          <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: `${(t.kritik / t.toplam) * 100}%`,
                            background: '#ff2222', borderRadius: '4px 4px 0 0',
                          }} />
                        )}
                      </div>
                      <span style={{ color: '#444', fontSize: '9px', textAlign: 'center', lineHeight: 1.2 }}>{t.gun}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                  {[['#58a6ff', 'Normal'], ['#ff8800', 'Yüksek'], ['#ff4444', 'Kritik içeren']].map(([c, l]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '10px', height: '10px', background: c, borderRadius: '2px' }} />
                      <span style={{ color: '#555', fontSize: '10px' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* KAYNAK */}
          {aktifSekme === 'kaynak' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {istatistik.kaynaklar.map(([kaynak, sayi], i) => {
                const maks = istatistik.kaynaklar[0]?.[1] || 1
                const renkler = ['#58a6ff', '#00cc88', '#ff8800', '#ff4444', '#9b59b6', '#e91e63', '#00bcd4', '#8bc34a', '#ff9800', '#607d8b']
                const renk = renkler[i % renkler.length]
                return (
                  <div key={kaynak} style={{ background: '#161b22', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#e6edf3', fontSize: '12px' }}>{kaynak}</span>
                      <span style={{ color: renk, fontSize: '13px', fontWeight: 700 }}>{sayi}</span>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '3px', height: '4px' }}>
                      <div style={{
                        width: `${(sayi / maks) * 100}%`, height: '100%',
                        background: renk, borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* AI DEPREM ANALİZİ */}
          {aktifSekme === 'aiDeprem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!depremAnaliz && !depremYukleniyor && (
                <button onClick={depremAnalizYap} style={{
                  width: '100%', background: '#161b22',
                  border: '1px solid #30363d', borderRadius: '10px',
                  padding: '14px', color: '#8b949e', fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}>
                  🤖 Deprem Verilerini AI ile Analiz Et
                </button>
              )}
              {depremYukleniyor && (
                <div style={{
                  background: '#161b22', border: '1px solid #30363d',
                  borderRadius: '10px', padding: '20px', textAlign: 'center',
                  color: '#58a6ff', fontSize: '12px',
                }}>
                  ⏳ Deprem verileri analiz ediliyor...
                </div>
              )}
              {depremHata && (
                <div style={{
                  background: '#ff444422', border: '1px solid #ff444444',
                  borderRadius: '10px', padding: '12px',
                  color: '#ff6666', fontSize: '12px',
                }}>
                  ✗ {depremHata}
                </div>
              )}
              {depremAnaliz && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Risk Skoru */}
                  <div style={{ background: '#161b22', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ color: '#8b949e', fontSize: '11px' }}>RİSK SKORU</span>
                      <span style={{
                        color: depremAnaliz.riskSkoru > 70 ? '#ff4444' : depremAnaliz.riskSkoru > 40 ? '#ff8800' : '#00cc88',
                        fontSize: '24px', fontWeight: 700,
                      }}>{depremAnaliz.riskSkoru}<span style={{ fontSize: '13px' }}>/100</span></span>
                    </div>
                    <div style={{ background: '#0d1117', borderRadius: '4px', height: '8px' }}>
                      <div style={{
                        width: `${depremAnaliz.riskSkoru}%`, height: '100%', borderRadius: '4px',
                        background: depremAnaliz.riskSkoru > 70 ? '#ff4444' : depremAnaliz.riskSkoru > 40 ? '#ff8800' : '#00cc88',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                  {/* Detaylar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#161b22', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#8b949e', fontSize: '10px', marginBottom: '4px' }}>YOĞUN BÖLGE</div>
                      <div style={{ color: '#e6edf3', fontSize: '12px', fontWeight: 600 }}>{depremAnaliz.yogunBolge || (depremAnaliz as any).yoğunBolge || '—'}</div>
                    </div>
                    <div style={{ background: '#161b22', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ color: '#8b949e', fontSize: '10px', marginBottom: '4px' }}>TREND</div>
                      <div style={{
                        color: depremAnaliz.trend === 'artiyor' ? '#ff4444' : depremAnaliz.trend === 'azaliyor' ? '#00cc88' : '#ff8800',
                        fontSize: '12px', fontWeight: 600,
                      }}>
                        {depremAnaliz.trend === 'artiyor' ? '↑ Artıyor' : depremAnaliz.trend === 'azaliyor' ? '↓ Azalıyor' : '→ Stabil'}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#161b22', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ color: '#8b949e', fontSize: '10px', marginBottom: '6px' }}>UYARI</div>
                    <div style={{ color: '#e6edf3', fontSize: '12px', lineHeight: '1.5' }}>{depremAnaliz.uyari}</div>
                  </div>
                  <div style={{ background: '#161b22', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ color: '#8b949e', fontSize: '10px', marginBottom: '6px' }}>TAHMİNİ RİSK (24 SAAT)</div>
                    <div style={{ color: '#e6edf3', fontSize: '12px', lineHeight: '1.5' }}>{depremAnaliz.tahminiRisk}</div>
                  </div>
                  <button onClick={() => { setDepremAnaliz(null); setDepremHata('') }} style={{
                    background: 'none', border: '1px solid #30363d', borderRadius: '6px',
                    padding: '6px', color: '#555', fontSize: '11px', cursor: 'pointer',
                  }}>Yenile</button>
                </div>
              )}
            </div>
          )}

          {/* AI ANOMALİ */}
          {aktifSekme === 'aiAnomali' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!dovizAnomali && !havaAnomali && !anomaliYukleniyor && (
                <button onClick={anomaliAnalizYap} style={{
                  width: '100%', background: '#161b22',
                  border: '1px solid #30363d', borderRadius: '10px',
                  padding: '14px', color: '#8b949e', fontSize: '13px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                }}>
                  📡 Döviz & Hava Kalitesi Anomali Tespiti
                </button>
              )}
              {anomaliYukleniyor && (
                <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#58a6ff', fontSize: '12px' }}>
                  ⏳ Anomali analizi yapılıyor...
                </div>
              )}
              {anomaliHata && (
                <div style={{ background: '#ff444422', border: '1px solid #ff444444', borderRadius: '10px', padding: '12px', color: '#ff6666', fontSize: '12px' }}>
                  ✗ {anomaliHata}
                </div>
              )}
              {[
                { label: '💱 Döviz', anomali: dovizAnomali },
                { label: '🌫 Hava Kalitesi', anomali: havaAnomali },
              ].map(({ label, anomali }) => anomali && (
                <div key={label} style={{ background: '#161b22', borderRadius: '10px', padding: '14px', border: `1px solid ${anomali.tespit ? (anomali.siddet === 'yuksek' ? '#ff444444' : '#ff880044') : '#21262d'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#e6edf3', fontSize: '13px', fontWeight: 600 }}>{label}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                      background: anomali.tespit ? (anomali.siddet === 'yuksek' ? '#ff444433' : '#ff880033') : '#00cc8833',
                      color: anomali.tespit ? (anomali.siddet === 'yuksek' ? '#ff6666' : '#ff9933') : '#00cc88',
                    }}>
                      {anomali.tespit ? `⚠ ${anomali.tip}` : '✓ Normal'}
                    </span>
                  </div>
                  <div style={{ color: '#8b949e', fontSize: '12px', lineHeight: '1.5' }}>{anomali.aciklama}</div>
                  <div style={{ marginTop: '6px', color: '#555', fontSize: '11px' }}>
                    Şiddet: <span style={{ color: anomali.siddet === 'yuksek' ? '#ff4444' : anomali.siddet === 'orta' ? '#ff8800' : '#00cc88' }}>{anomali.siddet}</span>
                  </div>
                </div>
              ))}
              {(dovizAnomali || havaAnomali) && (
                <button onClick={() => { setDovizAnomali(null); setHavaAnomali(null); setAnomaliHata('') }} style={{
                  background: 'none', border: '1px solid #30363d', borderRadius: '6px',
                  padding: '6px', color: '#555', fontSize: '11px', cursor: 'pointer',
                }}>Yenile</button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
