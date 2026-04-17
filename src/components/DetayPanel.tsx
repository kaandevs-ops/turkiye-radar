'use client'
import { useEffect, useState, useRef } from 'react'
import { KATEGORI_ISIM, KATEGORI_RENK } from '@/lib/kaynaklar'
import { haberOzetle } from '@/lib/aiIslemler'
import { aiConfigAl } from '@/lib/ai'
import type { HaberAnaliz } from '@/lib/aiIslemler'
import type { Olay } from '@/types/olay'

interface Props {
  olay: Olay | null
  onKapat: () => void
}

interface ChatMesaj {
  rol: 'user' | 'assistant'
  icerik: string
}

export default function DetayPanel({ olay, onKapat }: Props) {
  const [gorunum, setGorunum] = useState(false)
  const [kopyalandi, setKopyalandi] = useState(false)
  const [aiOzet, setAiOzet] = useState<HaberAnaliz | null>(null)
  const [aiYukleniyor, setAiYukleniyor] = useState(false)
  const [aiHata, setAiHata] = useState('')
  const [sekme, setSekme] = useState<'detay' | 'chat'>('detay')

  // Chat state
  const [chatMesajlar, setChatMesajlar] = useState<ChatMesaj[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatYukleniyor, setChatYukleniyor] = useState(false)
  const chatSonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (olay) {
      setTimeout(() => setGorunum(true), 10)
      setAiOzet(null)
      setAiHata('')
      setChatMesajlar([])
      setChatInput('')
      setSekme('detay')
    } else {
      setGorunum(false)
    }
  }, [olay])

  useEffect(() => {
    if (chatSonRef.current) {
      chatSonRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMesajlar])

  const aiOzetle = async () => {
    if (!olay || aiYukleniyor) return
    setAiYukleniyor(true)
    setAiHata('')
    try {
      const config = aiConfigAl()
      const sonuc = await haberOzetle(config, olay)
      setAiOzet(sonuc)
    } catch (err: any) {
      setAiHata(err.message || 'AI hatası')
    } finally {
      setAiYukleniyor(false)
    }
  }

  const chatGonder = async () => {
    if (!olay || !chatInput.trim() || chatYukleniyor) return
    const soru = chatInput.trim()
    setChatInput('')
    const yeniMesaj: ChatMesaj = { rol: 'user', icerik: soru }
    setChatMesajlar(prev => [...prev, yeniMesaj])
    setChatYukleniyor(true)

    try {
      const config = aiConfigAl()

      // Haber bağlamını system prompt olarak hazırla
      const buyukluk = (olay as any).buyukluk
      const derinlik = (olay as any).derinlik
      const haberBaglami = `
Şu anda aşağıdaki haber/olay hakkında konuşuyorsunuz:

Başlık: ${olay.baslik}
Kategori: ${KATEGORI_ISIM[olay.kategori] || olay.kategori}
Kaynak: ${olay.kaynak}
Tarih: ${new Date(olay.tarih).toLocaleString('tr-TR')}
Şiddet: ${olay.siddet}
Konum: ${olay.il ? olay.il + (olay.ilce ? ' / ' + olay.ilce : '') : `${olay.koordinat[1].toFixed(3)}°N, ${olay.koordinat[0].toFixed(3)}°E`}
${olay.aciklama ? 'Açıklama: ' + olay.aciklama : ''}
${buyukluk ? 'Deprem Büyüklüğü: M' + buyukluk : ''}
${derinlik ? 'Deprem Derinliği: ' + derinlik + ' km' : ''}
${olay.url ? 'Kaynak URL: ' + olay.url : ''}

Bu haber bağlamında kullanıcının sorularını yanıtla. Türkçe konuş. Kısa ve net ol. Bilinmeyen konularda tahmin yürütme, bilmiyorum de.
`.trim()

      // Önceki konuşma geçmişini de gönder (max son 10 mesaj)
      const gecmis = chatMesajlar.slice(-10).map(m => ({
        role: m.rol,
        content: m.icerik,
      }))

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          system: haberBaglami,
          messages: [...gecmis, { role: 'user', content: soru }],
        }),
      })

      const data = await res.json()
      if (data.hata) throw new Error(data.hata)

      setChatMesajlar(prev => [...prev, { rol: 'assistant', icerik: data.content || '' }])
    } catch (err: any) {
      setChatMesajlar(prev => [...prev, { rol: 'assistant', icerik: `⚠️ Hata: ${err.message || 'AI yanıt veremedi'}` }])
    } finally {
      setChatYukleniyor(false)
    }
  }

  const kopyala = () => {
    if (!olay) return
    const metin = `${olay.baslik}\n${olay.kaynak} · ${new Date(olay.tarih).toLocaleString('tr-TR')}${olay.url ? '\n' + olay.url : ''}`
    navigator.clipboard.writeText(metin).then(() => {
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    })
  }

  if (!olay) return null

  const renk = KATEGORI_RENK[olay.kategori] || '#808080'
  const resim = (olay as any).resim
  const buyukluk = (olay as any).buyukluk
  const derinlik = (olay as any).derinlik
  const siddetRenk = { kritik: '#ff4444', yuksek: '#ff8800', orta: '#ffcc00', dusuk: '#44cc88' }[olay.siddet]
  const siddetYazi = { kritik: '🔴 KRİTİK', yuksek: '🟠 YÜKSEK', orta: '🟡 ORTA', dusuk: '🟢 DÜŞÜK' }[olay.siddet]
  const tarih = new Date(olay.tarih)
  const gecenSure = () => {
    const diff = Date.now() - tarih.getTime()
    const dk = Math.floor(diff / 60000)
    if (dk < 60) return `${dk} dakika önce`
    if (dk < 1440) return `${Math.floor(dk / 60)} saat önce`
    return `${Math.floor(dk / 1440)} gün önce`
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '220px',
        right: '20px',
        width: '340px',
        background: '#0d1117',
        border: `1px solid ${renk}55`,
        borderRadius: '14px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 30px ${renk}18`,
        zIndex: 1000,
        overflow: 'hidden',
        opacity: gorunum ? 1 : 0,
        transform: gorunum ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '75vh',
      }}
    >
      {/* Header (resimli veya düz) */}
      {resim ? (
        <div style={{ position: 'relative', height: '120px', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={resim}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, #0d1117 20%, ${renk}22 100%)` }} />
          <button onClick={onKapat} style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#0d1117aa', border: 'none', color: '#aaa',
            cursor: 'pointer', fontSize: '16px', borderRadius: '50%',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: `${renk}cc`, color: '#fff', fontWeight: 700 }}>
              {KATEGORI_ISIM[olay.kategori] || olay.kategori}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: `linear-gradient(135deg, ${renk}33, ${renk}11)`,
          padding: '12px 16px',
          borderBottom: `1px solid ${renk}33`,
          display: 'flex', alignItems: 'center', gap: '8px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '18px' }}>{KATEGORI_ISIM[olay.kategori]?.split(' ')[0] || '📌'}</span>
          <span style={{ color: renk, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {KATEGORI_ISIM[olay.kategori]?.split(' ').slice(1).join(' ') || olay.kategori}
          </span>
          <button onClick={onKapat} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#555', cursor: 'pointer', fontSize: '18px', lineHeight: '1',
          }}>✕</button>
        </div>
      )}

      {/* Sekme Seçici */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #21262d',
        flexShrink: 0,
        background: '#0d1117',
      }}>
        <button
          onClick={() => setSekme('detay')}
          style={{
            flex: 1, padding: '9px', background: 'none', border: 'none',
            borderBottom: `2px solid ${sekme === 'detay' ? renk : 'transparent'}`,
            color: sekme === 'detay' ? '#e6edf3' : '#555',
            fontSize: '11px', fontWeight: sekme === 'detay' ? 700 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          📋 Detay
        </button>
        <button
          onClick={() => setSekme('chat')}
          style={{
            flex: 1, padding: '9px', background: 'none', border: 'none',
            borderBottom: `2px solid ${sekme === 'chat' ? '#58a6ff' : 'transparent'}`,
            color: sekme === 'chat' ? '#e6edf3' : '#555',
            fontSize: '11px', fontWeight: sekme === 'chat' ? 700 : 400,
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          🤖 AI Sohbet
          {chatMesajlar.length > 0 && (
            <span style={{
              background: '#58a6ff33', border: '1px solid #58a6ff44',
              borderRadius: '8px', padding: '0px 5px',
              color: '#58a6ff', fontSize: '9px', fontWeight: 700,
            }}>
              {Math.floor(chatMesajlar.length / 2)}
            </span>
          )}
        </button>
      </div>

      {/* DETAY SEKMESİ */}
      {sekme === 'detay' && (
        <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
          <h3 style={{ color: '#e6edf3', fontSize: '13px', fontWeight: 700, margin: '0 0 8px 0', lineHeight: '1.45' }}>
            {olay.baslik}
          </h3>
          {olay.aciklama && (
            <p style={{ color: '#8b949e', fontSize: '12px', lineHeight: '1.6', margin: '0 0 12px 0' }}>
              {olay.aciklama}
            </p>
          )}
          <div style={{
            background: '#161b22', borderRadius: '8px',
            padding: '10px 12px', marginBottom: '12px',
            display: 'flex', flexDirection: 'column', gap: '7px',
          }}>
            <InfoRow label="⚡ Şiddet" deger={<span style={{ color: siddetRenk, fontWeight: 700, fontSize: '11px' }}>{siddetYazi}</span>} />
            <InfoRow label="📡 Kaynak" deger={olay.kaynak} />
            <InfoRow label="🕐 Zaman" deger={gecenSure()} />
            <InfoRow label="📅 Tarih" deger={tarih.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            <InfoRow label="📍 Konum" deger={`${olay.koordinat[1].toFixed(3)}°N, ${olay.koordinat[0].toFixed(3)}°E`} />
            {buyukluk && <InfoRow label="📊 Büyüklük" deger={<span style={{ color: '#ff6666', fontWeight: 700 }}>M{buyukluk}</span>} />}
            {derinlik && <InfoRow label="⬇️ Derinlik" deger={`${derinlik} km`} />}
          </div>

          {/* AI Özet */}
          <div style={{ marginBottom: '12px' }}>
            {!aiOzet && !aiYukleniyor && (
              <button onClick={aiOzetle} style={{
                width: '100%', background: '#161b22',
                border: '1px solid #30363d', borderRadius: '8px',
                padding: '9px', color: '#8b949e', fontSize: '12px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}>
                🤖 AI ile Özetle
              </button>
            )}
            {aiYukleniyor && (
              <div style={{
                background: '#161b22', border: '1px solid #30363d',
                borderRadius: '8px', padding: '10px 12px',
                color: '#58a6ff', fontSize: '11px', textAlign: 'center',
              }}>
                ⏳ Analiz ediliyor...
              </div>
            )}
            {aiHata && (
              <div style={{
                background: '#ff444422', border: '1px solid #ff444444',
                borderRadius: '8px', padding: '8px 12px',
                color: '#ff6666', fontSize: '11px',
              }}>
                ✗ {aiHata}
              </div>
            )}
            {aiOzet && (
              <div style={{
                background: '#161b22', border: '1px solid #58a6ff33',
                borderRadius: '8px', padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px' }}>🤖</span>
                  <span style={{ color: '#58a6ff', fontSize: '11px', fontWeight: 700 }}>AI Analizi</span>
                  <div style={{
                    marginLeft: 'auto', background: '#58a6ff22',
                    border: '1px solid #58a6ff44', borderRadius: '4px',
                    padding: '1px 6px', color: '#58a6ff', fontSize: '10px', fontWeight: 700,
                  }}>
                    Önem: {aiOzet.onemSkoru}/10
                  </div>
                </div>
                <p style={{ color: '#8b949e', fontSize: '11px', lineHeight: '1.6', margin: 0 }}>
                  {aiOzet.ozet}
                </p>
                {aiOzet.anahtarKelimeler.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {aiOzet.anahtarKelimeler.map(k => (
                      <span key={k} style={{
                        background: '#58a6ff11', border: '1px solid #58a6ff33',
                        borderRadius: '4px', padding: '1px 6px',
                        color: '#58a6ff', fontSize: '10px',
                      }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {olay.url && (
              <a href={olay.url} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: '9px', borderRadius: '8px',
                background: `${renk}22`, color: renk,
                textAlign: 'center', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none', border: `1px solid ${renk}44`,
              }}>
                🔗 Habere Git
              </a>
            )}
            <button onClick={kopyala} title="Panoya Kopyala" style={{
              padding: '9px 12px', borderRadius: '8px',
              background: kopyalandi ? '#00cc8822' : '#161b22',
              color: kopyalandi ? '#00cc88' : '#555',
              border: kopyalandi ? '1px solid #00cc8844' : '1px solid #21262d',
              cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s',
            }}>
              {kopyalandi ? '✓' : '📋'}
            </button>
            <button onClick={onKapat} style={{
              flex: olay.url ? 0 : 1, padding: '9px 14px', borderRadius: '8px',
              background: '#161b22', color: '#555', border: '1px solid #21262d',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            }}>
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* CHAT SEKMESİ */}
      {sekme === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Haber bağlam çipi */}
          <div style={{
            margin: '8px 12px 0',
            padding: '7px 10px',
            background: `${renk}11`,
            border: `1px solid ${renk}33`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'flex-start', gap: '6px',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '10px', marginTop: '1px' }}>📎</span>
            <div>
              <div style={{ color: renk, fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>BAĞLAM: AKTİF HABER</div>
              <div style={{ color: '#8b949e', fontSize: '10px', lineHeight: '1.35' }}>
                {olay.baslik.length > 70 ? olay.baslik.slice(0, 70) + '…' : olay.baslik}
              </div>
            </div>
          </div>

          {/* Mesaj listesi */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            minHeight: '180px',
          }}>
            {chatMesajlar.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤖</div>
                <div style={{ color: '#444', fontSize: '11px', lineHeight: '1.6' }}>
                  Bu haber hakkında soru sor.<br />
                  <span style={{ color: '#333', fontSize: '10px' }}>
                    Örn: "Bu nasıl oldu?", "Etkilenen bölgeler?"
                  </span>
                </div>
                {/* Hızlı sorular */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '12px' }}>
                  {['Bu olayın önemi nedir?', 'Hangi bölgeler etkilendi?', 'Ne yapılmalı?'].map(soru => (
                    <button
                      key={soru}
                      onClick={() => { setChatInput(soru); }}
                      style={{
                        background: '#161b22', border: '1px solid #21262d',
                        borderRadius: '6px', padding: '6px 10px',
                        color: '#555', fontSize: '10px', cursor: 'pointer',
                        textAlign: 'left', transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = '#58a6ff55'; (e.target as HTMLButtonElement).style.color = '#8b949e' }}
                      onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = '#21262d'; (e.target as HTMLButtonElement).style.color = '#555' }}
                    >
                      💬 {soru}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMesajlar.map((mesaj, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: mesaj.rol === 'user' ? 'row-reverse' : 'row',
                  gap: '6px',
                  alignItems: 'flex-end',
                }}
              >
                {mesaj.rol === 'assistant' && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#58a6ff22', border: '1px solid #58a6ff33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', flexShrink: 0,
                  }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '8px 10px',
                  borderRadius: mesaj.rol === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: mesaj.rol === 'user' ? `${renk}22` : '#161b22',
                  border: `1px solid ${mesaj.rol === 'user' ? renk + '44' : '#21262d'}`,
                  color: '#e6edf3',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {mesaj.icerik}
                </div>
              </div>
            ))}
            {chatYukleniyor && (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#58a6ff22', border: '1px solid #58a6ff33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', flexShrink: 0,
                }}>🤖</div>
                <div style={{
                  padding: '8px 12px', borderRadius: '10px 10px 10px 2px',
                  background: '#161b22', border: '1px solid #21262d',
                }}>
                  <span style={{ color: '#58a6ff', fontSize: '14px', letterSpacing: '2px' }}>
                    <span style={{ animation: 'dot1 1s infinite' }}>·</span>
                    <span style={{ animation: 'dot2 1s infinite' }}>·</span>
                    <span style={{ animation: 'dot3 1s infinite' }}>·</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatSonRef} />
          </div>

          {/* Input alanı */}
          <div style={{
            padding: '8px 12px 10px',
            borderTop: '1px solid #21262d',
            display: 'flex', gap: '6px',
            flexShrink: 0,
          }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatGonder() } }}
              placeholder="Bu haber hakkında sor..."
              disabled={chatYukleniyor}
              style={{
                flex: 1, background: '#161b22', border: '1px solid #30363d',
                borderRadius: '8px', padding: '8px 10px',
                color: '#e6edf3', fontSize: '11px', outline: 'none',
                resize: 'none',
                opacity: chatYukleniyor ? 0.5 : 1,
              }}
            />
            <button
              onClick={chatGonder}
              disabled={!chatInput.trim() || chatYukleniyor}
              style={{
                background: chatInput.trim() && !chatYukleniyor ? '#58a6ff' : '#161b22',
                border: `1px solid ${chatInput.trim() && !chatYukleniyor ? '#58a6ff' : '#30363d'}`,
                borderRadius: '8px', padding: '8px 12px',
                color: chatInput.trim() && !chatYukleniyor ? '#fff' : '#444',
                fontSize: '13px', cursor: chatInput.trim() && !chatYukleniyor ? 'pointer' : 'default',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dot1 { 0%, 100% { opacity: 0.2 } 20% { opacity: 1 } }
        @keyframes dot2 { 0%, 100% { opacity: 0.2 } 40% { opacity: 1 } }
        @keyframes dot3 { 0%, 100% { opacity: 0.2 } 60% { opacity: 1 } }
      `}</style>
    </div>
  )
}

function InfoRow({ label, deger }: { label: string; deger: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#444', fontSize: '11px' }}>{label}</span>
      <span style={{ color: '#8b949e', fontSize: '11px' }}>{deger}</span>
    </div>
  )
}