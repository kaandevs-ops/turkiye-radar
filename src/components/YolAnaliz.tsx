'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { aiConfigAl } from '@/lib/ai'
import type { Olay } from '@/types/olay'

// ─── Türkiye şehir koordinatları ─────────────────────────────────────────────
const SEHIRLER: Record<string, { koord: [number, number]; isim: string }> = {
  istanbul:     { koord: [41.0082, 28.9784], isim: 'İstanbul' },
  ankara:       { koord: [39.9334, 32.8597], isim: 'Ankara' },
  izmir:        { koord: [38.4237, 27.1428], isim: 'İzmir' },
  bursa:        { koord: [40.1885, 29.0610], isim: 'Bursa' },
  antalya:      { koord: [36.8969, 30.7133], isim: 'Antalya' },
  adana:        { koord: [37.0000, 35.3213], isim: 'Adana' },
  konya:        { koord: [37.8746, 32.4872], isim: 'Konya' },
  gaziantep:    { koord: [37.0662, 37.3825], isim: 'Gaziantep' },
  mersin:       { koord: [36.8000, 34.6415], isim: 'Mersin' },
  kayseri:      { koord: [38.7205, 35.4826], isim: 'Kayseri' },
  diyarbakir:   { koord: [37.9144, 40.2310], isim: 'Diyarbakır' },
  samsun:       { koord: [41.2867, 36.3313], isim: 'Samsun' },
  denizli:      { koord: [37.7765, 29.0875], isim: 'Denizli' },
  trabzon:      { koord: [41.0015, 39.7178], isim: 'Trabzon' },
  van:          { koord: [38.4891, 43.3800], isim: 'Van' },
  malatya:      { koord: [38.3552, 38.3552], isim: 'Malatya' },
  erzurum:      { koord: [39.9043, 41.2797], isim: 'Erzurum' },
  kahramanmaras:{ koord: [37.5858, 36.9371], isim: 'Kahramanmaraş' },
  hatay:        { koord: [36.4018, 36.2021], isim: 'Hatay' },
  elazig:       { koord: [38.6810, 39.2264], isim: 'Elazığ' },
  manisa:       { koord: [38.6191, 27.4289], isim: 'Manisa' },
  balikesir:    { koord: [39.6484, 27.8830], isim: 'Balıkesir' },
  tekirdag:     { koord: [40.9781, 27.5066], isim: 'Tekirdağ' },
  mugla:        { koord: [37.2153, 28.3636], isim: 'Muğla' },
  mardin:       { koord: [37.3212, 40.7373], isim: 'Mardin' },
  urfa:         { koord: [37.1674, 38.7955], isim: 'Şanlıurfa' },
  canakkale:    { koord: [40.1553, 26.4142], isim: 'Çanakkale' },
  edirne:       { koord: [41.6818, 26.5557], isim: 'Edirne' },
  rize:         { koord: [41.0201, 40.5234], isim: 'Rize' },
  sakarya:      { koord: [40.6940, 30.4034], isim: 'Sakarya' },
  kocaeli:      { koord: [40.8533, 29.9187], isim: 'Kocaeli' },
  eskisehir:    { koord: [39.7767, 30.5206], isim: 'Eskişehir' },
  afyon:        { koord: [38.7637, 30.5387], isim: 'Afyonkarahisar' },
  sivas:        { koord: [39.7477, 37.0179], isim: 'Sivas' },
  tokat:        { koord: [40.3167, 36.5644], isim: 'Tokat' },
  ordu:         { koord: [40.9862, 37.8794], isim: 'Ordu' },
  batman:       { koord: [37.8833, 41.1333], isim: 'Batman' },
  nigde:        { koord: [37.9667, 34.6794], isim: 'Niğde' },
  kirklareli:   { koord: [41.7333, 27.2253], isim: 'Kırklareli' },
  bolu:         { koord: [40.7359, 31.6061], isim: 'Bolu' },
  zonguldak:    { koord: [41.4564, 31.7960], isim: 'Zonguldak' },
  kastamonu:    { koord: [41.3887, 33.7830], isim: 'Kastamonu' },
}

// ─── Tipler ──────────────────────────────────────────────────────────────────
interface RotaNoktasi {
  sehirKey: string
  isim: string
  koord: [number, number]
}

interface YolRaporu {
  genelDurum: 'temiz' | 'dikkat' | 'tehlikeli'
  ozet: string
  tahminliSure: string
  tahminliKm: string
  uyarilar: {
    tip: 'deprem' | 'hava' | 'trafik' | 'guvenlik' | 'diger'
    seviye: 'dusuk' | 'orta' | 'yuksek' | 'kritik'
    baslik: string
    aciklama: string
    bolge: string
  }[]
  tavsiyeler: string[]
  alternatifGuzergah?: string
}

interface Props {
  olaylar: Olay[]
  onKapat: () => void
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────────
function mesafeHesapla(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
}

function rotaYakiniOlaylar(rota: RotaNoktasi[], olaylar: Olay[], kmEsik = 150): Olay[] {
  return olaylar.filter(o => {
    return rota.some(nokta => {
      const km = mesafeHesapla(nokta.koord, [o.koordinat[1], o.koordinat[0]])
      return km <= kmEsik
    })
  })
}

function sehirSuggest(input: string): string[] {
  const norm = input.toLowerCase().trim()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
  if (!norm) return []
  return Object.entries(SEHIRLER)
    .filter(([key, { isim }]) =>
      key.startsWith(norm) || isim.toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .startsWith(norm)
    )
    .slice(0, 5)
    .map(([key]) => key)
}

// ─── Gerçek Leaflet Harita ────────────────────────────────────────────────────
function MiniHarita({ rota }: { rota: RotaNoktasi[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const layersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || rota.length < 2) return

    // Leaflet CSS yoksa ekle
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const initMap = async () => {
      const L = (await import('leaflet')).default

      // Önceki katmanları temizle
      layersRef.current.forEach(l => l.remove())
      layersRef.current = []

      if (!leafletMapRef.current) {
        const map = L.map(mapRef.current!, {
          zoomControl: true,
          attributionControl: false,
          scrollWheelZoom: true,
          dragging: true,
        })

        // Karanlık tema tile layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map)

        leafletMapRef.current = map
      }

      const map = leafletMapRef.current

      // Rota koordinatları
      const latLngs: [number, number][] = rota.map(n => [n.koord[0], n.koord[1]])

      // Animasyonlu rota çizgisi (glow efekti için iki katman)
      const glowLine = L.polyline(latLngs, {
        color: '#58a6ff',
        weight: 8,
        opacity: 0.15,
      }).addTo(map)

      const mainLine = L.polyline(latLngs, {
        color: '#58a6ff',
        weight: 3,
        opacity: 0.9,
        dashArray: undefined,
      }).addTo(map)

      layersRef.current.push(glowLine, mainLine)

      // Başlangıç marker (yeşil)
      const startIcon = L.divIcon({
        html: `
          <div style="
            width:14px; height:14px;
            background:#00ff88;
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 0 8px #00ff88, 0 0 16px #00ff8866;
            position:relative;
          ">
            <div style="
              position:absolute; top:50%; left:50%;
              transform:translate(-50%,-50%);
              width:24px; height:24px;
              border:2px solid #00ff8855;
              border-radius:50%;
              animation:pulse 1.5s ease-out infinite;
            "></div>
          </div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      // Bitiş marker (kırmızı)
      const endIcon = L.divIcon({
        html: `
          <div style="
            width:14px; height:14px;
            background:#ff4444;
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 0 8px #ff4444, 0 0 16px #ff444466;
          "></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })

      // Ara nokta marker (mavi)
      const midIcon = L.divIcon({
        html: `
          <div style="
            width:10px; height:10px;
            background:#58a6ff;
            border:2px solid #fff;
            border-radius:50%;
            box-shadow:0 0 6px #58a6ff;
          "></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      })

      rota.forEach((n, i) => {
        const isFirst = i === 0
        const isLast = i === rota.length - 1
        const icon = isFirst ? startIcon : isLast ? endIcon : midIcon
        const renk = isFirst ? '#00ff88' : isLast ? '#ff6666' : '#58a6ff'

        const marker = L.marker([n.koord[0], n.koord[1]], { icon })
          .bindTooltip(`
            <div style="
              background:#0d1117;
              border:1px solid ${renk}55;
              color:${renk};
              font-size:11px;
              font-weight:700;
              padding:4px 8px;
              border-radius:6px;
              white-space:nowrap;
            ">${isFirst ? '🟢' : isLast ? '🔴' : '🔵'} ${n.isim}</div>`,
            { permanent: true, direction: 'top', offset: [0, -10], className: 'yol-tooltip' }
          )
          .addTo(map)

        layersRef.current.push(marker)
      })

      // Haritayı rotaya sığdır
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [30, 30] })
    }

    initMap()
  }, [rota])

  // Bileşen unmount olunca haritayı temizle
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [])

  if (rota.length < 2) return null

  return (
    <>
      <style>{`
        .yol-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .yol-tooltip::before { display: none !important; }
        @keyframes pulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: '10px',
          border: '1px solid #21262d',
          overflow: 'hidden',
          zIndex: 1,
        }}
      />
    </>
  )
}

// ─── Uyarı rengi ─────────────────────────────────────────────────────────────
function uyariRenk(seviye: string) {
  if (seviye === 'kritik') return '#ff4444'
  if (seviye === 'yuksek') return '#ff8800'
  if (seviye === 'orta') return '#ffd700'
  return '#44ff88'
}

function uyariEmoji(tip: string) {
  if (tip === 'deprem') return '🔴'
  if (tip === 'hava') return '🌦'
  if (tip === 'trafik') return '🚗'
  if (tip === 'guvenlik') return '🚨'
  return '⚠️'
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function YolAnaliz({ olaylar, onKapat }: Props) {
  const [rota, setRota] = useState<RotaNoktasi[]>([])
  const [inputDeger, setInputDeger] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [ekleniyor, setEkleniyor] = useState<'baslangic' | 'bitis' | 'ara'>('baslangic')
  const [rapor, setRapor] = useState<YolRaporu | null>(null)
  const [analiz, setAnaliz] = useState<'bosta' | 'yukleniyor' | 'tamamlandi' | 'hata'>('bosta')
  const [hataMsg, setHataMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Şehir ekle
  const sehirEkle = useCallback((key: string) => {
    const s = SEHIRLER[key]
    if (!s) return
    const yeniNokta: RotaNoktasi = { sehirKey: key, isim: s.isim, koord: s.koord }

    setRota(prev => {
      if (prev.find(n => n.sehirKey === key)) return prev
      if (ekleniyor === 'baslangic' && prev.length === 0) return [yeniNokta]
      if (ekleniyor === 'bitis') return [...prev, yeniNokta]
      if (ekleniyor === 'ara' && prev.length >= 2) {
        const kopya = [...prev]
        kopya.splice(kopya.length - 1, 0, yeniNokta)
        return kopya
      }
      return [...prev, yeniNokta]
    })

    setInputDeger('')
    setSuggestions([])
    if (ekleniyor === 'baslangic') setEkleniyor('bitis')
    else setEkleniyor('bitis')
    inputRef.current?.focus()
  }, [ekleniyor])

  const inputDegis = (v: string) => {
    setInputDeger(v)
    setSuggestions(v.length > 1 ? sehirSuggest(v) : [])
  }

  const noktaSil = (idx: number) => {
    setRota(prev => prev.filter((_, i) => i !== idx))
    setRapor(null)
    setAnaliz('bosta')
  }

  // AI Analizi
  const analizBaslat = useCallback(async () => {
    if (rota.length < 2) return
    setAnaliz('yukleniyor')
    setRapor(null)
    setHataMsg('')

    const config = aiConfigAl()
    const yakinOlaylar = rotaYakiniOlaylar(rota, olaylar, 120)

    const toplamKm = rota.reduce((acc, n, i) => {
      if (i === 0) return 0
      return acc + mesafeHesapla(rota[i - 1].koord, n.koord)
    }, 0)

    const guzergah = rota.map(n => n.isim).join(' → ')

    const olayOzeti = yakinOlaylar.slice(0, 40).map(o =>
      `[${o.siddet.toUpperCase()}] ${o.kategori}: ${o.baslik} (${o.kaynak}, ${o.tarih.slice(0, 10)})`
    ).join('\n')

    const jsonSema = `{
  "genelDurum": "temiz",
  "ozet": "Kisa ozet buraya.",
  "tahminliSure": "3 saat 20 dk",
  "tahminliKm": "450 km",
  "uyarilar": [
    {
      "tip": "deprem",
      "seviye": "orta",
      "baslik": "Uyari basligi",
      "aciklama": "Detay aciklama.",
      "bolge": "Sehir adi"
    }
  ],
  "tavsiyeler": ["Tavsiye 1.", "Tavsiye 2."],
  "alternatifGuzergah": ""
}`

    const system = `Sen Turkiye icin yapay zeka destekli yol analizi asistanisin. Verilen guzergah ve olaylari analiz ederek surucuye kapsamli bir yol raporu sunarsın.
KRITIK KURALLAR:
1. SADECE asagidaki JSON formatinda yanit ver. Baska hicbir sey yazma.
2. Markdown kullanma, kod blogu acma, \`\`\` yazma.
3. JSON string degerlerinde tırnak isaretleri kullanma, ozel karakter kullanma.
4. "ozet" ve "aciklama" alanlari tek satirda olmali, satir sonu icermemeli.
5. Her alan dolu olmali. "alternatifGuzergah" bos string olabilir.
6. genelDurum sadece: temiz, dikkat veya tehlikeli olabilir.
7. seviye sadece: dusuk, orta, yuksek veya kritik olabilir.
8. tip sadece: deprem, hava, trafik, guvenlik veya diger olabilir.
JSON formati:
${jsonSema}`

    const userMsg = `Güzergah: ${guzergah}
Tahmini mesafe: ${toplamKm} km
Rota üzerindeki ve yakınındaki güncel olaylar (${yakinOlaylar.length} adet):
${olayOzeti || 'Yakın çevrede kayıtlı olay bulunamadı.'}

Bu güzergah için kapsamlı yol raporu oluştur. Olayları dikkate al, hava durumu, trafik, deprem riski ve güvenlik açısından değerlendir.`

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          system,
          messages: [{ role: 'user', content: userMsg }],
        }),
      })
      const data = await res.json()
      if (data.hata) throw new Error(data.hata)

      let ham = (data.content || '').toString()

      // 1) <think>...</think> bloklarini temizle
      ham = ham.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

      // 2) Markdown code fence temizle
      ham = ham.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()

      // 3) Kontrol karakterlerini temizle (Türkçe karakterlere dokunma)
      ham = ham.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

      // 4) İlk { ve son } arasını al (greedy match yerine güvenli yöntem)
      const baslangic = ham.indexOf('{')
      const bitis = ham.lastIndexOf('}')
      if (baslangic === -1 || bitis === -1 || bitis <= baslangic) {
        throw new Error('Geçersiz AI yanıtı - JSON bulunamadı')
      }
      let temiz = ham.slice(baslangic, bitis + 1)

      // 5) Trailing comma düzelt
      temiz = temiz.replace(/,(\s*[}\]])/g, '$1')

      // 6) String içindeki bare newline/tab'ları escape et
      temiz = temiz.replace(/"((?:[^"\\]|\\.)*)"/g, (_m: string, inner: string) => {
        return '"' + inner.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '') + '"'
      })

      let parsed: YolRaporu
      try {
        parsed = JSON.parse(temiz)
      } catch (parseErr: any) {
        // Fallback: temel alanları regex ile çıkar
        console.error('[YolAnaliz] JSON parse hatası:', parseErr.message)
        console.error('[YolAnaliz] Ham (ilk 300):', temiz.slice(0, 300))
        const gd = temiz.match(/"genelDurum"\s*:\s*"([^"]+)"/)
        const oz = temiz.match(/"ozet"\s*:\s*"([^"]+)"/)
        const su = temiz.match(/"tahminliSure"\s*:\s*"([^"]+)"/)
        const km = temiz.match(/"tahminliKm"\s*:\s*"([^"]+)"/)
        if (!gd) throw new Error('JSON parse başarısız: ' + parseErr.message)
        parsed = {
          genelDurum: (gd[1] as 'temiz' | 'dikkat' | 'tehlikeli') || 'dikkat',
          ozet: oz?.[1] || 'AI analizi tamamlandı fakat detaylı rapor oluşturulamadı.',
          tahminliSure: su?.[1] || 'Bilinmiyor',
          tahminliKm: km?.[1] || `~${toplamKm} km`,
          uyarilar: [],
          tavsiyeler: ['Güncel yol koşullarını kontrol ediniz.'],
        }
      }

      parsed.tahminliKm = parsed.tahminliKm || `~${toplamKm} km`
      setRapor(parsed)
      setAnaliz('tamamlandi')
    } catch (err: any) {
      setHataMsg(err.message || 'Analiz başarısız')
      setAnaliz('hata')
    }
  }, [rota, olaylar])

  const durumRenk = rapor?.genelDurum === 'tehlikeli' ? '#ff4444'
    : rapor?.genelDurum === 'dikkat' ? '#ff8800' : '#00ff88'
  const durumEmoji = rapor?.genelDurum === 'tehlikeli' ? '🔴'
    : rapor?.genelDurum === 'dikkat' ? '🟠' : '🟢'

  const toplamKm = rota.length >= 2
    ? rota.reduce((acc, n, i) => i === 0 ? 0 : acc + mesafeHesapla(rota[i - 1].koord, n.koord), 0)
    : 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2500,
        background: '#0d1117cc', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onKapat}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(520px, 96vw)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#0d1117',
          border: '1px solid #21262d',
          borderRadius: '16px',
          boxShadow: '0 32px 100px rgba(0,0,0,0.9)',
          fontFamily: 'system-ui, sans-serif',
          scrollbarWidth: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #21262d',
          display: 'flex', alignItems: 'center', gap: '10px',
          position: 'sticky', top: 0,
          background: '#0d1117', zIndex: 10,
        }}>
          <span style={{ fontSize: '20px' }}>🗺️</span>
          <div>
            <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: '15px' }}>AI Yol Analizi</div>
            <div style={{ color: '#555', fontSize: '11px' }}>Haber ve yapay zeka destekli güzergah raporu</div>
          </div>
          <button
            onClick={onKapat}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Rota Noktaları */}
          <div>
            <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Güzergah
            </div>

            {/* Eklenen noktalar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {rota.map((n, i) => (
                <div key={n.sehirKey} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#161b22', border: '1px solid #21262d',
                  borderRadius: '8px', padding: '8px 12px',
                }}>
                  <span style={{ fontSize: '12px', color: i === 0 ? '#00ff88' : i === rota.length - 1 ? '#ff6666' : '#58a6ff' }}>
                    {i === 0 ? '🟢' : i === rota.length - 1 ? '🔴' : '🔵'}
                  </span>
                  <span style={{ color: '#e6edf3', fontSize: '13px', fontWeight: 600, flex: 1 }}>{n.isim}</span>
                  {i > 0 && (
                    <span style={{ color: '#444', fontSize: '10px' }}>
                      +{mesafeHesapla(rota[i - 1].koord, n.koord)} km
                    </span>
                  )}
                  <button
                    onClick={() => noktaSil(i)}
                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  >✕</button>
                </div>
              ))}
            </div>

            {/* Input + öneri */}
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  ref={inputRef}
                  value={inputDeger}
                  onChange={e => inputDegis(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && suggestions.length > 0) sehirEkle(suggestions[0])
                  }}
                  placeholder={
                    rota.length === 0 ? '📍 Başlangıç şehri...' :
                    rota.length === 1 ? '🏁 Varış şehri...' :
                    '+ Ara nokta ekle...'
                  }
                  style={{
                    flex: 1, background: '#161b22', border: '1px solid #30363d',
                    borderRadius: '8px', padding: '9px 12px',
                    color: '#e6edf3', fontSize: '13px', outline: 'none',
                  }}
                />
                {rota.length >= 2 && (
                  <button
                    onClick={() => setEkleniyor('ara')}
                    title="Ara nokta ekle"
                    style={{
                      background: '#161b22', border: '1px solid #30363d',
                      borderRadius: '8px', color: '#58a6ff', cursor: 'pointer',
                      padding: '0 12px', fontSize: '12px',
                    }}
                  >+ Ara</button>
                )}
              </div>

              {/* Öneri listesi */}
              {suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: '#161b22', border: '1px solid #30363d',
                  borderRadius: '8px', marginTop: '4px', overflow: 'hidden',
                }}>
                  {suggestions.map(key => (
                    <button
                      key={key}
                      onClick={() => sehirEkle(key)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        background: 'none', border: 'none', borderBottom: '1px solid #21262d',
                        padding: '9px 14px', color: '#e6edf3', fontSize: '13px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#21262d')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      📍 {SEHIRLER[key].isim}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mini bilgi */}
            {rota.length >= 2 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <span style={{ color: '#555', fontSize: '11px' }}>
                  📏 Toplam: <span style={{ color: '#8b949e' }}>{toplamKm} km</span>
                </span>
                <span style={{ color: '#555', fontSize: '11px' }}>
                  📍 {rota.length} nokta
                </span>
                <span style={{ color: '#555', fontSize: '11px' }}>
                  ⚠️ {rotaYakiniOlaylar(rota, olaylar).length} olay yakında
                </span>
              </div>
            )}
          </div>

          {/* Mini Harita */}
          {rota.length >= 2 && <MiniHarita rota={rota} />}

          {/* Analiz Butonu */}
          {rota.length >= 2 && (
            <button
              onClick={analizBaslat}
              disabled={analiz === 'yukleniyor'}
              style={{
                background: analiz === 'yukleniyor' ? '#161b22' : 'linear-gradient(135deg, #1f6feb, #0d419d)',
                border: `1px solid ${analiz === 'yukleniyor' ? '#30363d' : '#1f6feb'}`,
                borderRadius: '10px', padding: '12px 16px',
                color: analiz === 'yukleniyor' ? '#555' : '#fff',
                fontSize: '14px', fontWeight: 700, cursor: analiz === 'yukleniyor' ? 'default' : 'pointer',
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {analiz === 'yukleniyor'
                ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> AI Analiz ediliyor...</>
                : <>🤖 Güzergahı AI ile Analiz Et</>
              }
            </button>
          )}

          {/* Hata */}
          {analiz === 'hata' && (
            <div style={{
              background: '#ff444422', border: '1px solid #ff444444',
              borderRadius: '8px', padding: '10px 14px', color: '#ff6666', fontSize: '12px',
            }}>
              ✗ {hataMsg} — AI ayarlarınızı kontrol edin
            </div>
          )}

          {/* RAPOR */}
          {rapor && analiz === 'tamamlandi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Genel Durum Başlığı */}
              <div style={{
                background: `${durumRenk}11`,
                border: `1px solid ${durumRenk}44`,
                borderRadius: '12px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>{durumEmoji}</span>
                  <span style={{ color: durumRenk, fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {rapor.genelDurum === 'temiz' ? 'Güzergah Temiz'
                      : rapor.genelDurum === 'dikkat' ? 'Dikkatli Olun'
                      : 'Tehlikeli Güzergah'}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#555', fontSize: '11px' }}>🕐 {rapor.tahminliSure}</span>
                    <span style={{ color: '#555', fontSize: '11px' }}>📏 {rapor.tahminliKm}</span>
                  </div>
                </div>
                <p style={{ color: '#8b949e', fontSize: '12px', lineHeight: 1.55, margin: 0 }}>
                  {rapor.ozet}
                </p>
              </div>

              {/* Uyarılar */}
              {rapor.uyarilar?.length > 0 && (
                <div>
                  <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Uyarılar ({rapor.uyarilar.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {rapor.uyarilar.map((u, i) => {
                      const renk = uyariRenk(u.seviye)
                      return (
                        <div key={i} style={{
                          background: '#161b22',
                          border: `1px solid ${renk}33`,
                          borderLeft: `3px solid ${renk}`,
                          borderRadius: '8px', padding: '10px 12px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px' }}>{uyariEmoji(u.tip)}</span>
                            <span style={{ color: renk, fontSize: '11px', fontWeight: 700 }}>{u.baslik}</span>
                            <span style={{
                              marginLeft: 'auto', fontSize: '9px', fontWeight: 700,
                              background: `${renk}22`, color: renk,
                              border: `1px solid ${renk}44`, borderRadius: '4px', padding: '1px 6px',
                              textTransform: 'uppercase',
                            }}>{u.seviye}</span>
                          </div>
                          <p style={{ color: '#8b949e', fontSize: '11px', lineHeight: 1.4, margin: 0 }}>
                            {u.aciklama}
                          </p>
                          <span style={{ color: '#444', fontSize: '10px', marginTop: '4px', display: 'block' }}>📍 {u.bolge}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tavsiyeler */}
              {rapor.tavsiyeler?.length > 0 && (
                <div>
                  <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sürücü Tavsiyeleri
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {rapor.tavsiyeler.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                        background: '#161b22', border: '1px solid #21262d',
                        borderRadius: '8px', padding: '8px 12px',
                      }}>
                        <span style={{ color: '#58a6ff', fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                        <span style={{ color: '#8b949e', fontSize: '12px', lineHeight: 1.4 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternatif Güzergah */}
              {rapor.alternatifGuzergah && (
                <div style={{
                  background: '#58a6ff11', border: '1px solid #58a6ff33',
                  borderRadius: '8px', padding: '10px 14px',
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '13px' }}>🔀</span>
                  <div>
                    <div style={{ color: '#58a6ff', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Alternatif Güzergah</div>
                    <div style={{ color: '#8b949e', fontSize: '12px', lineHeight: 1.4 }}>{rapor.alternatifGuzergah}</div>
                  </div>
                </div>
              )}

              {/* Yakın olaylar sayısı */}
              <div style={{ color: '#333', fontSize: '10px', textAlign: 'center' }}>
                {rotaYakiniOlaylar(rota, olaylar).length} güncel olay analiz edildi •{' '}
                {new Date().toLocaleTimeString('tr-TR')}
              </div>
            </div>
          )}

          {/* Boş durum */}
          {rota.length < 2 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#333' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
              <div style={{ fontSize: '12px' }}>Başlangıç ve varış şehri ekleyerek</div>
              <div style={{ fontSize: '12px' }}>AI destekli yol analizi başlatın</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}