'use client'
import { useState, useEffect, useMemo } from 'react'
import { KATEGORI_ISIM, KATEGORI_RENK } from '@/lib/kaynaklar'
import { kisiselSirala, ilgiKategorileri, profilSifirla } from '@/lib/kullanici'
import type { KullaniciProfil } from '@/lib/kullanici'
import type { Olay } from '@/types/olay'
import type { Filtreler } from '@/app/page'
import dynamic from 'next/dynamic'
const AIAyarlar = dynamic(() => import('./AIAyarlar'), { ssr: false })

interface Props {
  olaylar: Olay[]
  tumOlaylar: Olay[]
  seciliOlay: Olay | null
  onOlaySecil: (olay: Olay) => void
  yukleniyor: boolean
  filtreler: Filtreler
  onFiltreDegis: (f: Filtreler) => void
  saniyeKalan: number
  sonYenileme: Date | null
  onYenile: () => void
  kullaniciProfil: KullaniciProfil
}

const SIDDET_GRUPLAR = [
  { key: 'kritik', label: '🔴 Kritik', renk: '#ff4444' },
  { key: 'yuksek', label: '🟠 Yüksek', renk: '#ff8800' },
  { key: 'orta',   label: '🟡 Orta',   renk: '#ffcc00' },
  { key: 'dusuk',  label: '🟢 Düşük',  renk: '#00cc88' },
]

const KATEGORI_GRUPLAR = [
  { label: '🌍 Doğal Afet', kategoriler: ['DEPREM','DEPREM_ARTCI','YANGIN','ORMAN_YANGINI','SEL','TAŞKIN','KAR_FIRTINASI','HORTUM','HEYELAN','TSUNAMI','DOLU','SICAK_HAVA','DON','SIS'] },
  { label: '🚨 Güvenlik',   kategoriler: ['GUVENLIK','ASKER','SINIR','TEROR','OPERASYON','PROTESTO','GOSTERI','TUTUKLAMA','KURTARMA','KACAKCILIK','UYUSTURUCU'] },
  { label: '🚗 Ulaşım',     kategoriler: ['TRAFIK_KAZA','YOL_KAPALI','HAVA_ULASIM','DENIZ_ULASIM','TREN_KAZA','METRO','KOPRU'] },
  { label: '⚡ Altyapı',    kategoriler: ['ELEKTRIK_KESINTI','DOGALGAZ_KESINTI','SU_KESINTI','INTERNET_KESINTI','BINA_COKME','INSAAT_KAZA','MADEN_KAZA','ALTYAPI'] },
  { label: '💵 Ekonomi',    kategoriler: ['DOVIZ','FAIZ','BORSA','ENFLASYON','GREV','IFLAS','IHRACAT','DOGALGAZ_FIYAT'] },
  { label: '🏥 Sağlık',     kategoriler: ['SALGIN','HASTANE','ZEHIRLENME','GIDA_ZEHIRLENMESI','SAGLIK_BAKANLIGI'] },
  { label: '🏛️ Siyaset',    kategoriler: ['SIYASET','MECLIS','SECIM','MAHKEME','YOLSUZLUK','AFAD_UYARI'] },
  { label: '📌 Diğer',      kategoriler: ['EGITIM','SPOR','KULTUR','DIN','GOCMEN','SIBER_SALDIRI','TEKNOLOJI','DIGER'] },
]

type Sekme = 'tum' | 'senin'

export default function Sidebar({ olaylar, tumOlaylar, seciliOlay, onOlaySecil, yukleniyor, filtreler, onFiltreDegis, saniyeKalan, sonYenileme, onYenile, kullaniciProfil }: Props) {
  const [sonGuncelleme, setSonGuncelleme] = useState('')
  const [filtreAcik, setFiltreAcik] = useState(false)
  const [aiAyarlarAcik, setAiAyarlarAcik] = useState(false)
  const [aktifSekme, setAktifSekme] = useState<Sekme>('tum')

  useEffect(() => {
    setSonGuncelleme(new Date().toLocaleTimeString('tr-TR'))
  }, [tumOlaylar])

  function toggleSiddet(s: string) {
    const yeni = filtreler.siddetler.includes(s)
      ? filtreler.siddetler.filter(x => x !== s)
      : [...filtreler.siddetler, s]
    onFiltreDegis({ ...filtreler, siddetler: yeni })
  }

  function toggleKategoriGrup(kategoriler: string[]) {
    const hepsiSecili = kategoriler.every(k => filtreler.kategoriler.includes(k))
    let yeni: string[]
    if (hepsiSecili) {
      yeni = filtreler.kategoriler.filter(k => !kategoriler.includes(k))
    } else {
      yeni = [...new Set([...filtreler.kategoriler, ...kategoriler])]
    }
    onFiltreDegis({ ...filtreler, kategoriler: yeni })
  }

  function filtreTemizle() {
    onFiltreDegis({ arama: '', siddetler: [], kategoriler: [] })
  }

  const aktifFiltreSayisi = filtreler.siddetler.length + (filtreler.kategoriler.length > 0 ? 1 : 0) + (filtreler.arama ? 1 : 0)

  // Kişiselleştirilmiş liste
  const kisiselOlaylar = useMemo(() => {
    return kisiselSirala(olaylar, kullaniciProfil)
  }, [olaylar, kullaniciProfil])

  const ilgiKatlar = useMemo(() => ilgiKategorileri(kullaniciProfil, 3), [kullaniciProfil])
  const yeterliVeri = kullaniciProfil.toplamTiklama >= 3

  const gosterilecekOlaylar = aktifSekme === 'senin' ? kisiselOlaylar : olaylar

  return (
    <div style={{
      width: '340px', minWidth: '340px', height: '100vh',
      background: '#0d1117', borderRight: '1px solid #21262d',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Başlık */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #21262d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🇹🇷</span>
          <div>
            <h1 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: 0 }}>Türkiye Radar</h1>
            <p style={{ color: '#555', fontSize: '10px', margin: 0 }}>Canlı İzleme Paneli</p>
          </div>
          <button
            onClick={() => setAiAyarlarAcik(true)}
            title="AI Ayarları"
            style={{
              marginLeft: 'auto',
              background: 'none', border: '1px solid #30363d',
              borderRadius: '6px', padding: '4px 8px',
              color: '#555', cursor: 'pointer', fontSize: '13px',
              transition: 'all 0.15s',
            }}
          >🤖</button>
          {yukleniyor && (
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff88', flexShrink: 0 }} />
          )}
        </div>

        {/* İstatistikler */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '10px' }}>
          {[
            { label: 'Toplam', sayi: tumOlaylar.length, renk: '#58a6ff' },
            { label: 'Kritik', renk: '#ff4444', sayi: tumOlaylar.filter(o => o.siddet === 'kritik').length },
            { label: 'Deprem', renk: '#ff8800', sayi: tumOlaylar.filter(o => o.kategori === 'DEPREM' || o.kategori === 'DEPREM_ARTCI').length },
          ].map(({ label, sayi, renk }) => (
            <div key={label} style={{ background: '#161b22', borderRadius: '8px', padding: '7px', textAlign: 'center', border: `1px solid ${renk}33` }}>
              <div style={{ color: renk, fontSize: '18px', fontWeight: 700 }}>{sayi}</div>
              <div style={{ color: '#555', fontSize: '10px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Arama + Filtre Butonu */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #21262d', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Ara..."
          value={filtreler.arama}
          onChange={e => onFiltreDegis({ ...filtreler, arama: e.target.value })}
          style={{
            flex: 1, background: '#161b22', border: '1px solid #30363d',
            borderRadius: '6px', padding: '6px 10px', color: '#e6edf3',
            fontSize: '12px', outline: 'none',
          }}
        />
        <button
          onClick={() => setFiltreAcik(p => !p)}
          style={{
            background: aktifFiltreSayisi > 0 ? '#58a6ff22' : '#161b22',
            border: `1px solid ${aktifFiltreSayisi > 0 ? '#58a6ff' : '#30363d'}`,
            borderRadius: '6px', padding: '6px 10px', color: aktifFiltreSayisi > 0 ? '#58a6ff' : '#888',
            fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          🔽 Filtre{aktifFiltreSayisi > 0 ? ` (${aktifFiltreSayisi})` : ''}
        </button>
      </div>

      {/* Filtre Paneli */}
      {filtreAcik && (
        <div style={{ borderBottom: '1px solid #21262d', background: '#0d1117', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Şiddet */}
          <div>
            <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Şiddet</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {SIDDET_GRUPLAR.map(s => {
                const secili = filtreler.siddetler.includes(s.key)
                return (
                  <button key={s.key} onClick={() => toggleSiddet(s.key)} style={{
                    background: secili ? `${s.renk}22` : '#161b22',
                    border: `1px solid ${secili ? s.renk : '#30363d'}`,
                    borderRadius: '5px', padding: '3px 8px', color: secili ? s.renk : '#666',
                    fontSize: '11px', cursor: 'pointer',
                  }}>
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Kategori Grupları */}
          <div>
            <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kategori</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {KATEGORI_GRUPLAR.map(g => {
                const hepsiSecili = g.kategoriler.every(k => filtreler.kategoriler.includes(k))
                const bazıSecili = g.kategoriler.some(k => filtreler.kategoriler.includes(k))
                return (
                  <button key={g.label} onClick={() => toggleKategoriGrup(g.kategoriler)} style={{
                    background: hepsiSecili ? '#58a6ff22' : bazıSecili ? '#58a6ff11' : '#161b22',
                    border: `1px solid ${hepsiSecili ? '#58a6ff' : bazıSecili ? '#58a6ff66' : '#30363d'}`,
                    borderRadius: '5px', padding: '3px 8px',
                    color: hepsiSecili ? '#58a6ff' : bazıSecili ? '#58a6ffaa' : '#666',
                    fontSize: '11px', cursor: 'pointer',
                  }}>
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Temizle */}
          {aktifFiltreSayisi > 0 && (
            <button onClick={filtreTemizle} style={{
              background: 'none', border: '1px solid #30363d', borderRadius: '5px',
              padding: '4px 10px', color: '#ff4444', fontSize: '11px', cursor: 'pointer', alignSelf: 'flex-start',
            }}>
              ✕ Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Filtre sonuç bilgisi */}
      {aktifFiltreSayisi > 0 && (
        <div style={{ padding: '5px 12px', background: '#161b22', borderBottom: '1px solid #21262d' }}>
          <span style={{ color: '#58a6ff', fontSize: '10px' }}>
            {olaylar.length} / {tumOlaylar.length} olay gösteriliyor
          </span>
        </div>
      )}

      {/* Sekme Seçici */}
      <div style={{ display: 'flex', borderBottom: '1px solid #21262d', padding: '0 12px' }}>
        <button
          onClick={() => setAktifSekme('tum')}
          style={{
            flex: 1, background: 'none', border: 'none',
            borderBottom: aktifSekme === 'tum' ? '2px solid #58a6ff' : '2px solid transparent',
            color: aktifSekme === 'tum' ? '#58a6ff' : '#555',
            cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            padding: '8px 0', transition: 'all 0.15s',
          }}
        >
          📋 Tümü
        </button>
        <button
          onClick={() => setAktifSekme('senin')}
          style={{
            flex: 1, background: 'none', border: 'none',
            borderBottom: aktifSekme === 'senin' ? '2px solid #a78bfa' : '2px solid transparent',
            color: aktifSekme === 'senin' ? '#a78bfa' : '#555',
            cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            padding: '8px 0', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
          }}
        >
          ✨ Senin İçin
          {yeterliVeri && (
            <span style={{ background: '#a78bfa22', border: '1px solid #a78bfa44', borderRadius: '8px', padding: '0px 4px', fontSize: '9px', color: '#a78bfa' }}>
              {kullaniciProfil.toplamTiklama}
            </span>
          )}
        </button>
      </div>

      {/* "Senin İçin" sekme açıklaması */}
      {aktifSekme === 'senin' && (
        <div style={{ padding: '8px 12px', background: '#161b22', borderBottom: '1px solid #21262d' }}>
          {yeterliVeri ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: '#a78bfa', fontSize: '10px', fontWeight: 600 }}>
                İlgi alanlarına göre sıralanıyor
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {ilgiKatlar.map(k => (
                  <span key={k} style={{
                    background: '#a78bfa11', border: '1px solid #a78bfa33',
                    borderRadius: '4px', padding: '1px 6px',
                    color: '#a78bfa', fontSize: '9px',
                  }}>
                    {KATEGORI_ISIM[k as keyof typeof KATEGORI_ISIM] || k}
                  </span>
                ))}
              </div>
              <button
                onClick={() => { profilSifirla(); window.location.reload() }}
                style={{ background: 'none', border: 'none', color: '#444', fontSize: '9px', cursor: 'pointer', alignSelf: 'flex-end', padding: 0 }}
              >
                profili sıfırla
              </button>
            </div>
          ) : (
            <div style={{ color: '#555', fontSize: '10px', lineHeight: '1.5' }}>
              Haberlere tıkladıkça ilgi alanların öğrenilir ve liste sana özel sıralanır.
              <span style={{ color: '#a78bfa' }}> ({kullaniciProfil.toplamTiklama}/3 tıklama)</span>
            </div>
          )}
        </div>
      )}

      {/* Olay Listesi */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {yukleniyor && tumOlaylar.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
            Veriler yükleniyor...
          </div>
        ) : gosterilecekOlaylar.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
            Sonuç bulunamadı
          </div>
        ) : (
          gosterilecekOlaylar.map((olay) => {
            const renk = KATEGORI_RENK[olay.kategori] || '#808080'
            const secili = seciliOlay?.id === olay.id
            const siddetRenk = { kritik: '#ff4444', yuksek: '#ff8800', orta: '#ffcc00', dusuk: '#00cc88' }[olay.siddet]
            // İlgi kategorisindeyse rozet göster
            const ilgiRozet = aktifSekme === 'senin' && yeterliVeri && ilgiKatlar.includes(olay.kategori)
            return (
              <div
                key={olay.id}
                onClick={() => onOlaySecil(olay)}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #161b22',
                  cursor: 'pointer',
                  background: secili ? '#161b22' : 'transparent',
                  borderLeft: secili ? `3px solid ${renk}` : ilgiRozet ? '3px solid #a78bfa44' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: renk, marginTop: '5px', flexShrink: 0,
                    boxShadow: `0 0 5px ${renk}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#e6edf3', fontSize: '12px', fontWeight: 500, lineHeight: '1.35',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {olay.baslik}
                    </div>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: `${renk}22`, color: renk, fontWeight: 600 }}>
                        {KATEGORI_ISIM[olay.kategori] || olay.kategori}
                      </span>
                      {ilgiRozet && (
                        <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '4px', background: '#a78bfa22', color: '#a78bfa', fontWeight: 600 }}>
                          ✨ ilgin var
                        </span>
                      )}
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: siddetRenk, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ color: '#555', fontSize: '9px' }}>{olay.kaynak}</span>
                      <span style={{ color: '#444', fontSize: '9px', marginLeft: 'auto' }}>
                        {new Date(olay.tarih).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Alt bilgi */}
      <div style={{ padding: '6px 14px', borderTop: '1px solid #21262d', color: '#444', fontSize: '9px', textAlign: 'center' }}>
        {sonGuncelleme && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span style={{ color: '#444', fontSize: '9px' }}>
              {tumOlaylar.length} olay · {sonGuncelleme}
            </span>
            <button onClick={onYenile} disabled={yukleniyor} title="Şimdi Yenile" style={{
              background: 'none', border: 'none', cursor: yukleniyor ? 'default' : 'pointer',
              padding: '0 2px', lineHeight: 1, fontSize: '11px',
              color: yukleniyor ? '#333' : '#58a6ff', opacity: yukleniyor ? 0.5 : 1,
            }}>
              {yukleniyor ? '⏳' : '🔄'}
            </button>
            <span style={{
              fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
              background: saniyeKalan < 20 ? '#ff444422' : '#21262d',
              color: saniyeKalan < 20 ? '#ff4444' : '#444',
            }}>
              {saniyeKalan}s
            </span>
          </div>
        )}
      </div>

      <AktiviteGrafik olaylar={tumOlaylar} />
      {aiAyarlarAcik && <AIAyarlar onKapat={() => setAiAyarlarAcik(false)} />}
    </div>
  )
}

export function AktiviteGrafik({ olaylar }: { olaylar: Olay[] }) {
  const simdi = Date.now()
  const saatler = Array.from({ length: 24 }, (_, i) => {
    const baslangic = simdi - (23 - i) * 3600000
    const bitis = baslangic + 3600000
    const grup = olaylar.filter(o => {
      const t = new Date(o.tarih).getTime()
      return t >= baslangic && t < bitis
    })
    return {
      saat: new Date(baslangic).getHours(),
      toplam: grup.length,
      kritik: grup.filter(o => o.siddet === 'kritik').length,
      yuksek: grup.filter(o => o.siddet === 'yuksek').length,
    }
  })

  const maks = Math.max(...saatler.map(s => s.toplam), 1)

  return (
    <div style={{ padding: '10px 12px', borderTop: '1px solid #21262d' }}>
      <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        📈 Son 24 Saat Aktivitesi
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '40px' }}>
        {saatler.map((s, i) => {
          const yukseklik = Math.max((s.toplam / maks) * 40, s.toplam > 0 ? 3 : 0)
          const renk = s.kritik > 0 ? '#ff4444' : s.yuksek > 0 ? '#ff8800' : '#58a6ff'
          return (
            <div
              key={i}
              title={`${s.saat}:00 — ${s.toplam} olay${s.kritik ? ` (${s.kritik} kritik)` : ''}`}
              style={{
                flex: 1, height: `${yukseklik}px`,
                background: s.toplam > 0 ? renk : '#1c2128',
                borderRadius: '2px 2px 0 0',
                opacity: s.toplam > 0 ? 1 : 0.4,
                cursor: s.toplam > 0 ? 'pointer' : 'default',
                transition: 'opacity 0.15s',
                minWidth: 0,
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ color: '#333', fontSize: '9px' }}>-24sa</span>
        <span style={{ color: '#333', fontSize: '9px' }}>şimdi</span>
      </div>
    </div>
  )
}