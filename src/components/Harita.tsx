'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { KATEGORI_RENK } from '@/lib/kaynaklar'
import type { Olay } from '@/types/olay'
import type { Ucak } from '@/app/api/ucaklar/route'
import type { Gemi } from '@/app/api/gemiler/route'
import type { FirmsNokta } from '@/app/api/firms/route'
import type { EonetOlay } from '@/app/api/eonet/route'
import type { AltyapiNokta, AltyapiTip } from '@/app/api/altyapi/route'
import type { InternetKesinti } from '@/app/api/cybermonitor/route'

interface Props {
  olaylar: Olay[]
  seciliOlay: Olay | null
  onOlaySecil: (olay: Olay) => void
}

type HaritaMod = 'cluster' | 'heatmap' | 'nokta' | 'il-isi'
type HaritaKatman = 'dark' | 'satellite' | 'terrain'

// Altyapı tip renkleri
const ALTYAPI_RENK: Record<string, string> = {
  NUKLEER_TESIS: '#ff00ff',
  RAFINERY: '#ff8800',
  DOGALGAZ_TERMINALI: '#ffcc00',
  BORU_HATTI: '#888888',
  MADEN: '#cd7f32',
  TARIM_BOLGESI: '#44dd44',
  HAYVANCILIK: '#88ff44',
  LIMAN: '#00ccff',
  HAVAALANI: '#4488ff',
  ASKERI_US: '#ff3333',
  ENERJI_SANTRALI: '#ff6600',
  RUZGAR_CIFTLIGI: '#00ffcc',
  GUNES_CIFTLIGI: '#ffee00',
  BARAJ: '#0088ff',
  DENIZALTI_KABLO: '#cc44ff',
}
const ALTYAPI_IKON: Record<string, string> = {
  NUKLEER_TESIS: '☢', RAFINERY: '🛢', DOGALGAZ_TERMINALI: '⛽',
  BORU_HATTI: '⚙', MADEN: '⛏', TARIM_BOLGESI: '🌾', HAYVANCILIK: '🐄',
  LIMAN: '⚓', HAVAALANI: '✈', ASKERI_US: '★', ENERJI_SANTRALI: '🏭',
  RUZGAR_CIFTLIGI: '💨', GUNES_CIFTLIGI: '☀', BARAJ: '💧', DENIZALTI_KABLO: '🌐',
}

// Seçili uçak veya gemi tipi
type SeciliArac =
  | { tip: 'ucak'; veri: Ucak }
  | { tip: 'gemi'; veri: Gemi }
  | null

const KATMANLAR = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
}

// Türkiye il adları → koordinat eşleşmesi (GeoJSON için il ismi normalize)
const IL_NORMALIZE: Record<string, string> = {
  'ADANA': 'Adana', 'ADIYAMAN': 'Adıyaman', 'AFYONKARAHİSAR': 'Afyonkarahisar',
  'AĞRI': 'Ağrı', 'AMASYA': 'Amasya', 'ANKARA': 'Ankara', 'ANTALYA': 'Antalya',
  'ARTVİN': 'Artvin', 'AYDIN': 'Aydın', 'BALIKESİR': 'Balıkesir', 'BİLECİK': 'Bilecik',
  'BİNGÖL': 'Bingöl', 'BİTLİS': 'Bitlis', 'BOLU': 'Bolu', 'BURDUR': 'Burdur',
  'BURSA': 'Bursa', 'ÇANAKKALE': 'Çanakkale', 'ÇANKIRI': 'Çankırı', 'ÇORUM': 'Çorum',
  'DENİZLİ': 'Denizli', 'DİYARBAKIR': 'Diyarbakır', 'EDİRNE': 'Edirne', 'ELAZIĞ': 'Elazığ',
  'ERZİNCAN': 'Erzincan', 'ERZURUM': 'Erzurum', 'ESKİŞEHİR': 'Eskişehir',
  'GAZİANTEP': 'Gaziantep', 'GİRESUN': 'Giresun', 'GÜMÜŞHANE': 'Gümüşhane',
  'HAKKARİ': 'Hakkari', 'HATAY': 'Hatay', 'ISPARTA': 'Isparta', 'MERSİN': 'Mersin',
  'İSTANBUL': 'İstanbul', 'İZMİR': 'İzmir', 'KARS': 'Kars', 'KASTAMONU': 'Kastamonu',
  'KAYSERİ': 'Kayseri', 'KIRKLARELİ': 'Kırklareli', 'KIRŞEHİR': 'Kırşehir',
  'KOCAELİ': 'Kocaeli', 'KONYA': 'Konya', 'KÜTAHYA': 'Kütahya', 'MALATYA': 'Malatya',
  'MANİSA': 'Manisa', 'KAHRAMANMARAŞ': 'Kahramanmaraş', 'MARDİN': 'Mardin',
  'MUĞLA': 'Muğla', 'MUŞ': 'Muş', 'NEVŞEHİR': 'Nevşehir', 'NİĞDE': 'Niğde',
  'ORDU': 'Ordu', 'RİZE': 'Rize', 'SAKARYA': 'Sakarya', 'SAMSUN': 'Samsun',
  'SİİRT': 'Siirt', 'SİNOP': 'Sinop', 'SİVAS': 'Sivas', 'TEKİRDAĞ': 'Tekirdağ',
  'TOKAT': 'Tokat', 'TRABZON': 'Trabzon', 'TUNCELİ': 'Tunceli', 'ŞANLIURFA': 'Şanlıurfa',
  'UŞAK': 'Uşak', 'VAN': 'Van', 'YOZGAT': 'Yozgat', 'ZONGULDAK': 'Zonguldak',
  'AKSARAY': 'Aksaray', 'BAYBURT': 'Bayburt', 'KARAMAN': 'Karaman', 'KIRIKKALE': 'Kırıkkale',
  'BATMAN': 'Batman', 'ŞIRNAK': 'Şırnak', 'BARTIN': 'Bartın', 'ARDAHAN': 'Ardahan',
  'IĞDIR': 'Iğdır', 'YALOVA': 'Yalova', 'KARABÜK': 'Karabük', 'KİLİS': 'Kilis',
  'OSMANİYE': 'Osmaniye', 'DÜZCE': 'Düzce',
}

// Olaylardan il bazında renk/şiddet hesapla
function ilRenkHesapla(olaylar: Olay[]): Record<string, { renk: string; sayi: number; enKotuSiddet: string; kategoriler: string[] }> {
  const ilMap: Record<string, { siddetPuan: number; sayi: number; kategoriler: Set<string>; enKotuSiddet: string }> = {}

  const siddetPuan = { kritik: 100, yuksek: 40, orta: 10, dusuk: 1 }
  const siddetSira = ['kritik', 'yuksek', 'orta', 'dusuk']

  olaylar.forEach(o => {
    const ilRaw = o.il || (o as any).lokasyon || (o as any).sehir || ''
    if (!ilRaw) return
    const ilAdi = ilRaw.toUpperCase().trim()
    if (!ilMap[ilAdi]) ilMap[ilAdi] = { siddetPuan: 0, sayi: 0, kategoriler: new Set(), enKotuSiddet: 'dusuk' }
    ilMap[ilAdi].siddetPuan += siddetPuan[o.siddet] || 1
    ilMap[ilAdi].sayi++
    ilMap[ilAdi].kategoriler.add(o.kategori)
    if (siddetSira.indexOf(o.siddet) < siddetSira.indexOf(ilMap[ilAdi].enKotuSiddet)) {
      ilMap[ilAdi].enKotuSiddet = o.siddet
    }
  })

  const sonuc: Record<string, { renk: string; sayi: number; enKotuSiddet: string; kategoriler: string[] }> = {}
  Object.entries(ilMap).forEach(([il, d]) => {
    let renk: string
    if (d.enKotuSiddet === 'kritik') renk = '#ff2222'
    else if (d.enKotuSiddet === 'yuksek') renk = '#ff8800'
    else if (d.enKotuSiddet === 'orta') renk = '#ffcc00'
    else renk = '#44cc88'
    sonuc[il] = { renk, sayi: d.sayi, enKotuSiddet: d.enKotuSiddet, kategoriler: Array.from(d.kategoriler) }
  })
  return sonuc
}

// Gerçek uçak SVG — gövde + kanatlar + kuyruk
function ucakSvg(yon: number, renk: string = '#00aaff'): string {
  return `<div style="transform:rotate(${yon}deg);width:26px;height:26px;display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <!-- Gövde -->
      <ellipse cx="12" cy="12" rx="2" ry="8" fill="${renk}" opacity="0.95"/>
      <!-- Ana kanatlar -->
      <path d="M12 10 L2 15 L4 16 L12 13 L20 16 L22 15 Z" fill="${renk}" opacity="0.9"/>
      <!-- Kuyruk kanatları -->
      <path d="M12 18 L7 21 L8 22 L12 20 L16 22 L17 21 Z" fill="${renk}" opacity="0.85"/>
      <!-- Burun -->
      <ellipse cx="12" cy="5" rx="1.2" ry="2" fill="${renk}"/>
      <!-- Beyaz çerçeve -->
      <ellipse cx="12" cy="12" rx="2" ry="8" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
    </svg>
  </div>`
}

// Gemi SVG
function gemiSvg(yon: number, tip: string): string {
  const renk = tip === 'Tanker' ? '#ff8800' : tip === 'Yolcu' ? '#00ff88' : tip === 'Balıkçı' ? '#ffcc00' : '#88ccff'
  return `<div style="transform:rotate(${yon}deg);width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1 L12 6 L15 14 L9 16 L3 14 L6 6 Z"
        fill="${renk}" opacity="0.9" stroke="rgba(255,255,255,0.4)" stroke-width="0.6"/>
      <circle cx="9" cy="8" r="1.5" fill="rgba(255,255,255,0.5)"/>
    </svg>
  </div>`
}

// Uçak Detay Paneli
function UcakDetayPanel({ ucak, onKapat }: { ucak: Ucak; onKapat: () => void }) {
  const hizKmh = Math.round(ucak.hiz * 3.6)
  const irtifaFt = Math.round(ucak.irtifa * 3.28084)
  const renk = '#00aaff'

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '220px',
        right: '20px',
        width: '320px',
        background: '#0d1117',
        border: `1px solid ${renk}55`,
        borderRadius: '14px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 30px ${renk}18`,
        zIndex: 1100,
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease',
      }}
    >
      {/* Başlık */}
      <div style={{
        background: `linear-gradient(135deg, ${renk}33, ${renk}11)`,
        padding: '12px 16px',
        borderBottom: `1px solid ${renk}33`,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${renk}22`, border: `1px solid ${renk}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={renk}>
            <ellipse cx="12" cy="12" rx="2" ry="8"/>
            <path d="M12 10 L2 15 L4 16 L12 13 L20 16 L22 15 Z"/>
            <path d="M12 18 L7 21 L8 22 L12 20 L16 22 L17 21 Z"/>
            <ellipse cx="12" cy="5" rx="1.2" ry="2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: renk, fontWeight: 700, fontSize: '14px' }}>
            {ucak.callsign || ucak.icao24}
          </div>
          <div style={{ color: '#8b949e', fontSize: '11px' }}>{ucak.ulke}</div>
        </div>
        <button onClick={onKapat} style={{
          background: 'none', border: 'none', color: '#555',
          cursor: 'pointer', fontSize: '18px', lineHeight: '1',
        }}>✕</button>
      </div>

      {/* Bilgiler */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          background: '#161b22', borderRadius: '8px',
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px',
        }}>
          <AracInfoRow label="✈ ICAO24" deger={ucak.icao24} />
          <AracInfoRow label="📏 İrtifa" deger={`${irtifaFt.toLocaleString()} ft · ${Math.round(ucak.irtifa).toLocaleString()} m`} />
          <AracInfoRow label="💨 Hız" deger={`${hizKmh} km/h · ${ucak.hiz.toFixed(1)} m/s`} />
          <AracInfoRow label="🧭 Yön" deger={`${Math.round(ucak.yon)}°`} />
          {ucak.dikey !== 0 && (
            <AracInfoRow
              label="⬍ Dikey"
              deger={
                <span style={{ color: ucak.dikey > 0 ? '#00ff88' : '#ff6666', fontWeight: 700 }}>
                  {ucak.dikey > 0 ? '⬆ Yükseliyor' : '⬇ Alçalıyor'} {Math.abs(Math.round(ucak.dikey * 60))} ft/dk
                </span>
              }
            />
          )}
          <AracInfoRow label="📍 Konum" deger={`${ucak.lat.toFixed(4)}°N, ${ucak.lon.toFixed(4)}°E`} />
          <AracInfoRow
            label="🔵 Durum"
            deger={<span style={{ color: '#00ff88', fontWeight: 700 }}>✦ Havada</span>}
          />
        </div>

        {/* Hız göstergesi */}
        <div style={{ background: '#161b22', borderRadius: '8px', padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#444', fontSize: '11px' }}>⚡ Hız Göstergesi</span>
            <span style={{ color: renk, fontSize: '11px', fontWeight: 700 }}>{hizKmh} km/h</span>
          </div>
          <div style={{ background: '#21262d', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (hizKmh / 1000) * 100)}%`,
              height: '100%',
              background: `linear-gradient(to right, ${renk}88, ${renk})`,
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span style={{ color: '#444', fontSize: '9px' }}>0</span>
            <span style={{ color: '#444', fontSize: '9px' }}>500 km/h</span>
            <span style={{ color: '#444', fontSize: '9px' }}>1000+</span>
          </div>
        </div>

        <button onClick={onKapat} style={{
          padding: '9px', borderRadius: '8px',
          background: '#161b22', color: '#555', border: '1px solid #21262d',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
        }}>
          Kapat
        </button>
      </div>
    </div>
  )
}

// Gemi Detay Paneli
function GemiDetayPanel({ gemi, onKapat }: { gemi: Gemi; onKapat: () => void }) {
  const renkMap: Record<string, string> = {
    Tanker: '#ff8800', Yolcu: '#00ff88', Balıkçı: '#ffcc00', Kargo: '#88ccff',
  }
  const renk = renkMap[gemi.tip] || '#88ccff'
  const bayrakEmoji: Record<string, string> = {
    TR: '🇹🇷', CY: '🇨🇾', MT: '🇲🇹', GR: '🇬🇷', RU: '🇷🇺', UA: '🇺🇦',
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        bottom: '220px',
        right: '20px',
        width: '320px',
        background: '#0d1117',
        border: `1px solid ${renk}55`,
        borderRadius: '14px',
        boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 0 30px ${renk}18`,
        zIndex: 1100,
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease',
      }}
    >
      {/* Başlık */}
      <div style={{
        background: `linear-gradient(135deg, ${renk}33, ${renk}11)`,
        padding: '12px 16px',
        borderBottom: `1px solid ${renk}33`,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${renk}22`, border: `1px solid ${renk}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
        }}>🚢</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: renk, fontWeight: 700, fontSize: '14px' }}>{gemi.isim}</div>
          <div style={{ color: '#8b949e', fontSize: '11px' }}>{gemi.tip} · {bayrakEmoji[gemi.bayrak] || ''} {gemi.bayrak}</div>
        </div>
        <button onClick={onKapat} style={{
          background: 'none', border: 'none', color: '#555',
          cursor: 'pointer', fontSize: '18px', lineHeight: '1',
        }}>✕</button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{
          background: '#161b22', borderRadius: '8px',
          padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px',
        }}>
          <AracInfoRow label="🔢 MMSI" deger={gemi.mmsi} />
          <AracInfoRow label="📦 Tip" deger={<span style={{ color: renk, fontWeight: 700 }}>{gemi.tip}</span>} />
          <AracInfoRow label="🏴 Bayrak" deger={`${bayrakEmoji[gemi.bayrak] || ''} ${gemi.bayrak}`} />
          <AracInfoRow label="💨 Hız" deger={`${gemi.hiz.toFixed(1)} knot`} />
          <AracInfoRow label="🧭 Yön" deger={`${Math.round(gemi.yon)}°`} />
          <AracInfoRow label="📡 Durum" deger={<span style={{ color: '#00ff88', fontWeight: 700 }}>● {gemi.durum}</span>} />
          <AracInfoRow label="📍 Konum" deger={`${gemi.lat.toFixed(4)}°N, ${gemi.lon.toFixed(4)}°E`} />
        </div>

        {/* Tip rozeti */}
        <div style={{
          background: `${renk}11`, border: `1px solid ${renk}33`,
          borderRadius: '8px', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: renk, boxShadow: `0 0 8px ${renk}`,
          }} />
          <span style={{ color: renk, fontSize: '11px', fontWeight: 700 }}>
            {gemi.tip === 'Tanker' ? '⚠ Tehlikeli Yük' :
             gemi.tip === 'Yolcu' ? '👥 Yolcu Gemisi' :
             gemi.tip === 'Balıkçı' ? '🎣 Balıkçı Teknesi' :
             '📦 Kargo Gemisi'}
          </span>
        </div>

        <button onClick={onKapat} style={{
          padding: '9px', borderRadius: '8px',
          background: '#161b22', color: '#555', border: '1px solid #21262d',
          cursor: 'pointer', fontSize: '12px', fontWeight: 600,
        }}>
          Kapat
        </button>
      </div>
    </div>
  )
}

function AracInfoRow({ label, deger }: { label: string; deger: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#444', fontSize: '11px' }}>{label}</span>
      <span style={{ color: '#8b949e', fontSize: '11px' }}>{deger}</span>
    </div>
  )
}

export default function Harita({ olaylar, seciliOlay, onOlaySecil }: Props) {
  const mapRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const clusterRef = useRef<any>(null)
  const heatRef = useRef<any>(null)
  const tileRef = useRef<any>(null)
  const ucakLayerRef = useRef<any>(null)
  const gemiLayerRef = useRef<any>(null)
  const ilIsiLayerRef = useRef<any>(null)
  const initedRef = useRef(false)
  const setSeciliAracRef = useRef<(v: SeciliArac) => void>(() => {})

  const [mod, setMod] = useState<HaritaMod>('cluster')
  const [katman, setKatman] = useState<HaritaKatman>('dark')
  const [kritikSayisi, setKritikSayisi] = useState(0)
  const [ucaklar, setUcaklar] = useState<Ucak[]>([])
  const [gemiler, setGemiler] = useState<Gemi[]>([])
  const [ucakAktif, setUcakAktif] = useState(false)
  const [gemiAktif, setGemiAktif] = useState(false)
  const [ucakSayisi, setUcakSayisi] = useState(0)
  const [gemiSayisi, setGemiSayisi] = useState(0)
  const [ucakYukleniyor, setUcakYukleniyor] = useState(false)
  const [gemiYukleniyor, setGemiYukleniyor] = useState(false)
  const [gemiMod, setGemiMod] = useState<'demo' | 'canli'>('demo')
  const [seciliArac, setSeciliArac] = useState<SeciliArac>(null)

  // YENİ KATMANLAR
  const [firmsAktif, setFirmsAktif] = useState(false)
  const [eonetAktif, setEonetAktif] = useState(false)
  const [altyapiAktif, setAltyapiAktif] = useState(false)
  const [acledAktif, setAcledAktif] = useState(false)
  const [cyberAktif, setCyberAktif] = useState(false)
  const [firmsNoktalar, setFirmsNoktalar] = useState<FirmsNokta[]>([])
  const [eonetOlaylar, setEonetOlaylar] = useState<EonetOlay[]>([])
  const [altyapiNoktalar, setAltyapiNoktalar] = useState<AltyapiNokta[]>([])
  const [acledOlaylar, setAcledOlaylar] = useState<Olay[]>([])
  const [cyberKesintiler, setCyberKesintiler] = useState<InternetKesinti[]>([])
  const firmsLayerRef = useRef<any>(null)
  const eonetLayerRef = useRef<any>(null)
  const altyapiLayerRef = useRef<any>(null)
  const acledLayerRef = useRef<any>(null)
  const cyberLayerRef = useRef<any>(null)
  const [altyapiFiltre, setAltyapiFiltre] = useState<Set<AltyapiTip>>(new Set())

  // Leaflet closure'larının her zaman güncel setSeciliArac'ı kullanması için ref
  setSeciliAracRef.current = setSeciliArac

  // Detay paneli dışına tıklayınca kapat
  useEffect(() => {
    const handler = () => setSeciliArac(null)
    if (seciliArac) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [seciliArac])

  // Leaflet'ten gelen custom event'i dinle
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setSeciliArac(detail)
    }
    window.addEventListener('arac-sec', handler)
    return () => window.removeEventListener('arac-sec', handler)
  }, [])

  useEffect(() => {
    setKritikSayisi(olaylar.filter(o => o.siddet === 'kritik').length)
  }, [olaylar])

  const ucaklariYukle = useCallback(async () => {
    setUcakYukleniyor(true)
    try {
      const res = await fetch('/api/ucaklar')
      const data = await res.json()
      setUcaklar(data.ucaklar || [])
      setUcakSayisi(data.toplam || 0)
    } catch { }
    finally { setUcakYukleniyor(false) }
  }, [])

  const gemileriYukle = useCallback(async () => {
    setGemiYukleniyor(true)
    try {
      const res = await fetch('/api/gemiler')
      const data = await res.json()
      setGemiler(data.gemiler || [])
      setGemiSayisi(data.toplam || 0)
      setGemiMod(data.mod === 'canli' ? 'canli' : 'demo')
    } catch { }
    finally { setGemiYukleniyor(false) }
  }, [])

  useEffect(() => {
    if (!ucakAktif) { setUcaklar([]); return }
    ucaklariYukle()
    const t = setInterval(ucaklariYukle, 30_000)
    return () => clearInterval(t)
  }, [ucakAktif, ucaklariYukle])

  useEffect(() => {
    if (!gemiAktif) { setGemiler([]); return }
    gemileriYukle()
    const t = setInterval(gemileriYukle, 60_000)
    return () => clearInterval(t)
  }, [gemiAktif, gemileriYukle])

  // ── YENİ KATMAN VERİ YÜKLEME ────────────────────────────────────────
  useEffect(() => {
    if (!firmsAktif) { setFirmsNoktalar([]); return }
    fetch('/api/firms').then(r => r.json()).then(d => setFirmsNoktalar(d.noktalar || [])).catch(() => {})
    const t = setInterval(() => {
      fetch('/api/firms').then(r => r.json()).then(d => setFirmsNoktalar(d.noktalar || [])).catch(() => {})
    }, 300_000)
    return () => clearInterval(t)
  }, [firmsAktif])

  useEffect(() => {
    if (!eonetAktif) { setEonetOlaylar([]); return }
    fetch('/api/eonet').then(r => r.json()).then(d => setEonetOlaylar(d.olaylar || [])).catch(() => {})
  }, [eonetAktif])

  useEffect(() => {
    if (!altyapiAktif) { setAltyapiNoktalar([]); return }
    fetch('/api/altyapi').then(r => r.json()).then(d => setAltyapiNoktalar(d.noktalar || [])).catch(() => {})
  }, [altyapiAktif])

  useEffect(() => {
    if (!acledAktif) { setAcledOlaylar([]); return }
    fetch('/api/acled').then(r => r.json()).then(d => setAcledOlaylar(d.olaylar || [])).catch(() => {})
  }, [acledAktif])

  useEffect(() => {
    if (!cyberAktif) { setCyberKesintiler([]); return }
    fetch('/api/cybermonitor').then(r => r.json()).then(d => setCyberKesintiler(d.kesintiler || [])).catch(() => {})
    const t = setInterval(() => {
      fetch('/api/cybermonitor').then(r => r.json()).then(d => setCyberKesintiler(d.kesintiler || [])).catch(() => {})
    }, 900_000)
    return () => clearInterval(t)
  }, [cyberAktif])

  // Harita init
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || initedRef.current) return
    initedRef.current = true

    const init = async () => {
      const L = (await import('leaflet')).default
        ; (window as any).L = L
      await import('leaflet.markercluster')

      if (mapRef.current) return

      for (const href of [
        'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
      ]) {
        if (!document.querySelector(`link[href="${href}"]`)) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'; link.href = href
          document.head.appendChild(link)
        }
      }

      const map = L.map(containerRef.current!, {
        center: [39.0, 35.0], zoom: 6, minZoom: 4, maxZoom: 16,
        zoomControl: false,
      })

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const tile = L.tileLayer(KATMANLAR.dark, {
        attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd',
      }).addTo(map)

      tileRef.current = tile
      mapRef.current = map

      // Haritaya tıklayınca detay panelini kapat
      map.on('click', () => {
        window.dispatchEvent(new CustomEvent('arac-sec', { detail: null }))
      })
    }

    init()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null; clusterRef.current = null
        heatRef.current = null; tileRef.current = null
        ucakLayerRef.current = null; gemiLayerRef.current = null
        ilIsiLayerRef.current = null
        firmsLayerRef.current = null; eonetLayerRef.current = null
        altyapiLayerRef.current = null; acledLayerRef.current = null
        cyberLayerRef.current = null
        initedRef.current = false
      }
    }
  }, [])

  // Katman değişimi
  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!L || !map || !tileRef.current) return

    const timer = setTimeout(() => {
      if (!mapRef.current || !tileRef.current) return
      map.removeLayer(tileRef.current)
      const tileOptions: any = {
        attribution: '© OpenStreetMap',
        maxZoom: katman === 'terrain' ? 17 : 19,
      }
      if (katman === 'dark') tileOptions.subdomains = 'abcd'
      const yeniTile = L.tileLayer(KATMANLAR[katman], tileOptions).addTo(map)
      tileRef.current = yeniTile
    }, 100)

    return () => clearTimeout(timer)
  }, [katman])

  // Olay marker'ları
  useEffect(() => {
    const run = () => {
      const L = (window as any).L
      const map = mapRef.current
      if (!L || !map) return
      if (mod === 'cluster' && !L.markerClusterGroup) return

      if (clusterRef.current) { map.removeLayer(clusterRef.current); clusterRef.current = null }
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null }

      if (mod === 'il-isi') return

      if (mod === 'heatmap') {
        const heatGroup = L.layerGroup()
        olaylar.forEach(o => {
          const renk = KATEGORI_RENK[o.kategori] || '#808080'
          const r = o.siddet === 'kritik' ? 60 : o.siddet === 'yuksek' ? 40 : o.siddet === 'orta' ? 25 : 15
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:${r * 2}px;height:${r * 2}px;background:radial-gradient(circle,${renk}66 0%,${renk}11 60%,transparent 100%);border-radius:50%;pointer-events:none;"></div>`,
            iconSize: [r * 2, r * 2], iconAnchor: [r, r],
          })
          L.marker([o.koordinat[1], o.koordinat[0]], { icon, interactive: false }).addTo(heatGroup)
        })
        olaylar.forEach(o => {
          const renk = KATEGORI_RENK[o.kategori] || '#808080'
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:8px;height:8px;background:${renk};border-radius:50%;border:1px solid rgba(255,255,255,0.6);cursor:pointer;"></div>`,
            iconSize: [8, 8], iconAnchor: [4, 4],
          })
          L.marker([o.koordinat[1], o.koordinat[0]], { icon })
            .on('click', () => onOlaySecil(o))
            .bindTooltip(`<b>${o.baslik}</b><br/><span style="color:#aaa">${o.kaynak}</span>`, { direction: 'top' })
            .addTo(heatGroup)
        })
        map.addLayer(heatGroup)
        heatRef.current = heatGroup
        return
      }

      if (mod === 'nokta') {
        const group = L.layerGroup()
        olaylar.forEach(o => {
          const renk = KATEGORI_RENK[o.kategori] || '#808080'
          const boyut = o.siddet === 'kritik' ? 18 : o.siddet === 'yuksek' ? 13 : o.siddet === 'orta' ? 9 : 6
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:${boyut}px;height:${boyut}px;background:${renk};border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 ${boyut}px ${renk}99;cursor:pointer;"></div>`,
            iconSize: [boyut, boyut], iconAnchor: [boyut / 2, boyut / 2],
          })
          L.marker([o.koordinat[1], o.koordinat[0]], { icon })
            .on('click', () => onOlaySecil(o))
            .bindTooltip(`<div style="font-size:12px;max-width:220px"><b>${o.baslik}</b><br/><span style="color:#aaa">${o.kaynak}</span></div>`, { direction: 'top' })
            .addTo(group)
        })
        map.addLayer(group)
        clusterRef.current = group
        return
      }

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (c: any) => {
          const count = c.getChildCount()
          const boyut = count > 20 ? 44 : count > 10 ? 38 : count > 5 ? 32 : 28
          return L.divIcon({
            html: `<div style="width:${boyut}px;height:${boyut}px;background:rgba(88,166,255,0.15);border:2px solid #58a6ff88;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#58a6ff;font-size:${boyut > 38 ? 13 : 11}px;font-weight:700;">${count}</div>`,
            className: '', iconSize: [boyut, boyut], iconAnchor: [boyut / 2, boyut / 2],
          })
        },
      })

      olaylar.forEach(o => {
        const renk = KATEGORI_RENK[o.kategori] || '#808080'
        const boyut = o.siddet === 'kritik' ? 20 : o.siddet === 'yuksek' ? 15 : o.siddet === 'orta' ? 11 : 8
        const pulsar = o.siddet === 'kritik' ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${renk};animation:pulse 1.5s infinite;opacity:0.6;"></div>` : ''
        const icon = L.divIcon({
          className: '',
          html: `<div style="position:relative;width:${boyut}px;height:${boyut}px;">${pulsar}<div style="position:absolute;inset:0;background:${renk};border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 ${boyut}px ${renk}99;cursor:pointer;"></div></div>`,
          iconSize: [boyut, boyut], iconAnchor: [boyut / 2, boyut / 2],
        })
        L.marker([o.koordinat[1], o.koordinat[0]], { icon })
          .on('click', () => onOlaySecil(o))
          .bindTooltip(`<div style="font-family:sans-serif;font-size:12px;max-width:220px;line-height:1.4"><b>${o.baslik}</b><br/><span style="color:#aaa">${o.kaynak}</span></div>`, { direction: 'top' })
          .addTo(cluster)
      })

      map.addLayer(cluster)
      clusterRef.current = cluster
    }

    if (!mapRef.current || (mod === 'cluster' && !(window as any).L?.markerClusterGroup)) {
      const timer = setTimeout(run, 1000)
      return () => clearTimeout(timer)
    }
    run()
  }, [olaylar, onOlaySecil, mod])

  // İl ısı haritası layer
  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!L || !map) return

    if (ilIsiLayerRef.current) {
      map.removeLayer(ilIsiLayerRef.current)
      ilIsiLayerRef.current = null
    }

    if (mod !== 'il-isi') return

    // Point-in-polygon: ray casting algoritması
    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [px, py] = point
      let inside = false
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
          inside = !inside
        }
      }
      return inside
    }

    // GeoJSON feature içinde bir koordinatın olup olmadığını kontrol et
    const koordinatIlIcinde = (lon: number, lat: number, feature: any): boolean => {
      const geom = feature.geometry
      if (!geom) return false
      const point: [number, number] = [lon, lat]
      if (geom.type === 'Polygon') {
        return pointInPolygon(point, geom.coordinates[0])
      }
      if (geom.type === 'MultiPolygon') {
        return geom.coordinates.some((poly: number[][][]) => pointInPolygon(point, poly[0]))
      }
      return false
    }

    const GEO_URLS = [
      'https://cdn.jsdelivr.net/gh/cihadturhan/tr-geojson@master/geo/tr-cities-utf8.json',
      'https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json',
    ]

    const tryFetch = async () => {
      let geoJson: any = null
      for (const url of GEO_URLS) {
        try {
          const r = await fetch(url)
          if (r.ok) { geoJson = await r.json(); break }
        } catch { /* try next */ }
      }
      if (!geoJson || !mapRef.current) return

      // Her feature için point-in-polygon ile olayları eşleştir
      const siddetPuan: Record<string, number> = { kritik: 100, yuksek: 40, orta: 10, dusuk: 1 }
      const siddetSira = ['kritik', 'yuksek', 'orta', 'dusuk']

      // feature index → { sayi, enKotuSiddet, olaylar }
      const featureOlayMap: Record<number, { sayi: number; enKotuSiddet: string; olayListesi: Olay[] }> = {}

      geoJson.features.forEach((feature: any, idx: number) => {
        const eslesen: Olay[] = []
        olaylar.forEach(o => {
          const [lon, lat] = o.koordinat
          if (koordinatIlIcinde(lon, lat, feature)) {
            eslesen.push(o)
          }
        })
        if (eslesen.length > 0) {
          let enKotu = 'dusuk'
          eslesen.forEach(o => {
            if (siddetSira.indexOf(o.siddet) < siddetSira.indexOf(enKotu)) enKotu = o.siddet
          })
          featureOlayMap[idx] = { sayi: eslesen.length, enKotuSiddet: enKotu, olayListesi: eslesen }
        }
      })

      const opasiteMap: Record<string, number> = { kritik: 0.75, yuksek: 0.6, orta: 0.45, dusuk: 0.3 }
      const renkMap: Record<string, string> = { kritik: '#ff2222', yuksek: '#ff8800', orta: '#ffcc00', dusuk: '#44cc88' }
      const siddetYazi: Record<string, string> = { kritik: '🔴 KRİTİK', yuksek: '🟠 YÜKSEK', orta: '🟡 ORTA', dusuk: '🟢 DÜŞÜK' }

      const layer = L.geoJSON(geoJson, {
        style: (_feature: any, layerIdx?: number) => {
          const idx = geoJson.features.indexOf(_feature)
          const veri = featureOlayMap[idx]
          if (!veri) return { fillColor: '#21262d', fillOpacity: 0.45, color: '#30363d', weight: 1 }
          return {
            fillColor: renkMap[veri.enKotuSiddet],
            fillOpacity: opasiteMap[veri.enKotuSiddet],
            color: renkMap[veri.enKotuSiddet],
            weight: 1.5,
          }
        },
        onEachFeature: (feature: any, featureLayer: any) => {
          const idx = geoJson.features.indexOf(feature)
          const veri = featureOlayMap[idx]
          const rawName = feature.properties?.name || feature.properties?.NAME || feature.properties?.il || ''
          const tooltip = veri
            ? `<div style="font-family:sans-serif;font-size:12px;line-height:1.6;min-width:140px">
                <div style="font-weight:700;color:${renkMap[veri.enKotuSiddet]};margin-bottom:3px">${rawName}</div>
                <div style="color:#aaa">${siddetYazi[veri.enKotuSiddet]}</div>
                <div style="color:#888">${veri.sayi} olay</div>
              </div>`
            : `<div style="font-family:sans-serif;font-size:12px;color:#555">${rawName}<br/><span style="color:#444">Olay yok</span></div>`
          featureLayer.bindTooltip(tooltip, { sticky: true, direction: 'top' })
          featureLayer.on('click', () => {
            if (veri && veri.olayListesi.length > 0) {
              const enKritik = [...veri.olayListesi].sort((a, b) =>
                siddetSira.indexOf(a.siddet) - siddetSira.indexOf(b.siddet)
              )[0]
              onOlaySecil(enKritik)
            }
          })
        },
      })
      map.addLayer(layer)
      ilIsiLayerRef.current = layer
    }

    tryFetch()
  }, [olaylar, mod, onOlaySecil])

  // Uçak layer — click ile detay
  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!L || !map) return

    if (ucakLayerRef.current) {
      map.removeLayer(ucakLayerRef.current)
      ucakLayerRef.current = null
    }

    if (!ucakAktif || ucaklar.length === 0) return

    const layer = L.layerGroup()

    ucaklar.forEach(u => {
      const hizKmh = Math.round(u.hiz * 3.6)
      const irtifaFt = Math.round(u.irtifa * 3.28084)
      const renk = u.irtifa > 10000 ? '#00aaff' : u.irtifa > 5000 ? '#44ccff' : '#88eeff'

      const icon = L.divIcon({
        className: '',
        html: ucakSvg(u.yon, renk),
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })

      const hoverTooltip = `
        <div style="font-family:sans-serif;font-size:12px;line-height:1.6;min-width:140px;padding:2px 0">
          <div style="font-weight:700;color:#00aaff;margin-bottom:2px">✈ ${u.callsign || u.icao24}</div>
          <div style="color:#aaa">📏 ${irtifaFt.toLocaleString()} ft</div>
          <div style="color:#aaa">💨 ${hizKmh} km/h</div>
          <div style="color:#777;font-size:10px;margin-top:2px">Tıkla → detay</div>
        </div>
      `

      L.marker([u.lat, u.lon], { icon, zIndexOffset: 1000 })
        .bindTooltip(hoverTooltip, { direction: 'top', offset: [0, -14] })
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e)
          window.dispatchEvent(new CustomEvent('arac-sec', { detail: { tip: 'ucak', veri: u } }))
        })
        .addTo(layer)
    })

    map.addLayer(layer)
    ucakLayerRef.current = layer
  }, [ucaklar, ucakAktif])

  // Gemi layer — click ile detay
  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!L || !map) return

    if (gemiLayerRef.current) {
      map.removeLayer(gemiLayerRef.current)
      gemiLayerRef.current = null
    }

    if (!gemiAktif || gemiler.length === 0) return

    const layer = L.layerGroup()

    gemiler.forEach(g => {
      const icon = L.divIcon({
        className: '',
        html: gemiSvg(g.yon, g.tip),
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const hoverTooltip = `
        <div style="font-family:sans-serif;font-size:12px;line-height:1.6;min-width:140px;padding:2px 0">
          <div style="font-weight:700;color:#88ccff;margin-bottom:2px">🚢 ${g.isim}</div>
          <div style="color:#aaa">📦 ${g.tip}</div>
          <div style="color:#aaa">💨 ${g.hiz.toFixed(1)} knot</div>
          <div style="color:#777;font-size:10px;margin-top:2px">Tıkla → detay</div>
        </div>
      `

      L.marker([g.lat, g.lon], { icon, zIndexOffset: 900 })
        .bindTooltip(hoverTooltip, { direction: 'top', offset: [0, -12] })
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e)
          window.dispatchEvent(new CustomEvent('arac-sec', { detail: { tip: 'gemi', veri: g } }))
        })
        .addTo(layer)
    })

    map.addLayer(layer)
    gemiLayerRef.current = layer
  }, [gemiler, gemiAktif])

  // ── NASA FIRMS YANGIN KATMANI ────────────────────────────────────────
  useEffect(() => {
    const L = (window as any).L; const map = mapRef.current
    if (!L || !map) return
    if (firmsLayerRef.current) { map.removeLayer(firmsLayerRef.current); firmsLayerRef.current = null }
    if (!firmsAktif || firmsNoktalar.length === 0) return
    const layer = L.layerGroup()
    firmsNoktalar.forEach(n => {
      const yoğunluk = Math.min(1, n.frp / 200)
      const r = Math.max(6, Math.min(22, 6 + n.frp / 10))
      const renk = n.frp > 100 ? '#ff2200' : n.frp > 30 ? '#ff6600' : '#ffaa00'
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${r*2}px;height:${r*2}px;">
          <div style="position:absolute;inset:0;background:radial-gradient(circle,${renk}cc 0%,${renk}22 70%,transparent 100%);border-radius:50%;"></div>
          <div style="position:absolute;inset:${r/2}px;background:${renk};border-radius:50%;border:1px solid #fff6;"></div>
        </div>`,
        iconSize: [r*2, r*2], iconAnchor: [r, r],
      })
      L.marker([n.lat, n.lon], { icon })
        .bindTooltip(`<div style="font-size:11px;line-height:1.5"><b>🔥 NASA FIRMS</b><br/>FRP: ${n.frp.toFixed(1)} MW<br/>Uydu: ${n.uydu}<br/>${n.tarih.slice(0,10)}</div>`, { direction: 'top' })
        .addTo(layer)
    })
    map.addLayer(layer); firmsLayerRef.current = layer
  }, [firmsNoktalar, firmsAktif])

  // ── NASA EONET DOĞAL OLAYLAR ─────────────────────────────────────────
  useEffect(() => {
    const L = (window as any).L; const map = mapRef.current
    if (!L || !map) return
    if (eonetLayerRef.current) { map.removeLayer(eonetLayerRef.current); eonetLayerRef.current = null }
    if (!eonetAktif || eonetOlaylar.length === 0) return
    const layer = L.layerGroup()
    const eonetRenk: Record<string, string> = {
      FIRTINA: '#4499ff', ORMAN_YANGINI: '#ff4400', SEL: '#0088ff',
      VOLKAN: '#ff0000', KASIRGA: '#cc00ff', KURAKLIK: '#ffaa00',
      HEYELAN: '#884400', TOZ_FIRTINASI: '#aa8844', KAR_FIRTINASI: '#88ccff',
      SICAK_DALGA: '#ff6600', DEPREM: '#ff4444', DIGER: '#888888',
    }
    const eonetEmoji: Record<string, string> = {
      FIRTINA: '⛈', ORMAN_YANGINI: '🔥', SEL: '🌊', VOLKAN: '🌋',
      KASIRGA: '🌀', KURAKLIK: '☀', HEYELAN: '⛰', TOZ_FIRTINASI: '💨',
      KAR_FIRTINASI: '❄', SICAK_DALGA: '🌡', DEPREM: '🔴', DIGER: '🌍',
    }
    eonetOlaylar.forEach(o => {
      const renk = eonetRenk[o.kategori] || '#888'
      const emoji = eonetEmoji[o.kategori] || '🌍'
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${renk}22;border:2px solid ${renk};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;">${emoji}</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      })
      L.marker([o.koordinat[1], o.koordinat[0]], { icon })
        .bindTooltip(`<div style="font-size:11px;line-height:1.5"><b>${emoji} ${o.baslik}</b><br/>${o.kategori}<br/>${o.tarih.slice(0,10)}<br/><span style="color:#888">${o.kaynak}</span></div>`, { direction: 'top' })
        .on('click', () => { if (o.url) window.open(o.url, '_blank', 'noopener') })
        .addTo(layer)
    })
    map.addLayer(layer); eonetLayerRef.current = layer
  }, [eonetOlaylar, eonetAktif])

  // ── ALTYAPI / MADEN / ENERJİ KATMANI ────────────────────────────────
  useEffect(() => {
    const L = (window as any).L; const map = mapRef.current
    if (!L || !map) return
    if (altyapiLayerRef.current) { map.removeLayer(altyapiLayerRef.current); altyapiLayerRef.current = null }
    if (!altyapiAktif || altyapiNoktalar.length === 0) return
    const layer = L.layerGroup()
    const filtreli = altyapiFiltre.size > 0
      ? altyapiNoktalar.filter(n => altyapiFiltre.has(n.tip))
      : altyapiNoktalar
    filtreli.forEach(n => {
      const renk = ALTYAPI_RENK[n.tip] || '#aaaaaa'
      const ikon = ALTYAPI_IKON[n.tip] || '●'
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#0d1117cc;border:2px solid ${renk};border-radius:5px;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 0 8px ${renk}66;">${ikon}</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      })
      L.marker([n.koordinat[1], n.koordinat[0]], { icon })
        .bindTooltip(`<div style="font-size:11px;line-height:1.6;max-width:220px">
          <div style="font-weight:700;color:${renk}">${ikon} ${n.isim}</div>
          <div style="color:#aaa">${n.tip.replace(/_/g,' ')}</div>
          ${n.kapasite ? `<div style="color:#888">⚡ ${n.kapasite}</div>` : ''}
          ${n.operatör ? `<div style="color:#888">🏢 ${n.operatör}</div>` : ''}
          <div style="color:#666;margin-top:2px">${n.aciklama}</div>
        </div>`, { direction: 'top', maxWidth: 240 })
        .on('click', () => { if (n.url) window.open(n.url, '_blank', 'noopener') })
        .addTo(layer)
    })
    map.addLayer(layer); altyapiLayerRef.current = layer
  }, [altyapiNoktalar, altyapiAktif, altyapiFiltre])

  // ── ACLED ÇATIŞMA KATMANI ─────────────────────────────────────────────
  useEffect(() => {
    const L = (window as any).L; const map = mapRef.current
    if (!L || !map) return
    if (acledLayerRef.current) { map.removeLayer(acledLayerRef.current); acledLayerRef.current = null }
    if (!acledAktif || acledOlaylar.length === 0) return
    const layer = L.layerGroup()
    acledOlaylar.forEach(o => {
      const renk = o.siddet === 'kritik' ? '#ff0000' : o.siddet === 'yuksek' ? '#ff6600' : '#ffaa00'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:${renk};border-radius:2px;border:1px solid #fff6;box-shadow:0 0 6px ${renk}88;transform:rotate(45deg);"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      })
      L.marker([o.koordinat[1], o.koordinat[0]], { icon })
        .bindTooltip(`<div style="font-size:11px;line-height:1.5"><b>⚔️ ACLED</b><br/>${o.baslik}<br/><span style="color:#888">${o.tarih.slice(0,10)}</span></div>`, { direction: 'top' })
        .addTo(layer)
    })
    map.addLayer(layer); acledLayerRef.current = layer
  }, [acledOlaylar, acledAktif])

  // ── SİBER / İNTERNET KESİNTİ KATMANI ──────────────────────────────
  useEffect(() => {
    const L = (window as any).L; const map = mapRef.current
    if (!L || !map) return
    if (cyberLayerRef.current) { map.removeLayer(cyberLayerRef.current); cyberLayerRef.current = null }
    if (!cyberAktif || cyberKesintiler.length === 0) return
    const layer = L.layerGroup()
    cyberKesintiler.forEach(k => {
      const renk = k.siddet > 70 ? '#ff00ff' : k.siddet > 40 ? '#cc00cc' : '#880088'
      const r = Math.max(12, k.siddet / 3)
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:${r*2}px;height:${r*2}px;">
          <div style="position:absolute;inset:0;background:radial-gradient(circle,${renk}66,transparent 70%);border-radius:50%;"></div>
          <div style="position:absolute;inset:${r*.4}px;background:${renk}33;border:2px solid ${renk};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:${renk};">⚡</div>
        </div>`,
        iconSize: [r*2, r*2], iconAnchor: [r, r],
      })
      L.marker([k.koordinat[1], k.koordinat[0]], { icon })
        .bindTooltip(`<div style="font-size:11px;line-height:1.5"><b>💻 İnternet Kesintisi</b><br/>${k.ulke}<br/>Şiddet: ${k.siddet}%<br/><span style="color:#888">${k.kaynak}</span></div>`, { direction: 'top' })
        .on('click', () => window.open(k.url, '_blank', 'noopener'))
        .addTo(layer)
    })
    map.addLayer(layer); cyberLayerRef.current = layer
  }, [cyberKesintiler, cyberAktif])

  useEffect(() => {
    if (!mapRef.current || !seciliOlay) return
    mapRef.current.flyTo([seciliOlay.koordinat[1], seciliOlay.koordinat[0]], 9, { duration: 1.2 })
  }, [seciliOlay])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#1a1a2e' }} />

      {/* Sol kontrol paneli */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px', zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        {/* Harita modu */}
        <div style={{
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
          padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px',
          backdropFilter: 'blur(8px)',
        }}>
          {([
            { id: 'cluster', icon: '🔵', label: 'Cluster' },
            { id: 'nokta', icon: '⚪', label: 'Nokta' },
            { id: 'heatmap', icon: '🌡', label: 'Isı' },
            { id: 'il-isi', icon: '🗺', label: 'İl' },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setMod(m.id)} title={m.label} style={{
              background: mod === m.id ? '#21262d' : 'none',
              border: mod === m.id ? '1px solid #30363d' : '1px solid transparent',
              borderRadius: '6px', color: mod === m.id ? '#e6edf3' : '#555',
              cursor: 'pointer', fontSize: '14px', padding: '5px 8px',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
            }}>
              <span>{m.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Harita katmanı */}
        <div style={{
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
          padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px',
          backdropFilter: 'blur(8px)',
        }}>
          {([
            { id: 'dark', icon: '🌑', label: 'Koyu' },
            { id: 'satellite', icon: '🛰', label: 'Uydu' },
            { id: 'terrain', icon: '⛰', label: 'Arazi' },
          ] as const).map(k => (
            <button key={k.id} onClick={() => setKatman(k.id)} title={k.label} style={{
              background: katman === k.id ? '#21262d' : 'none',
              border: katman === k.id ? '1px solid #30363d' : '1px solid transparent',
              borderRadius: '6px', color: katman === k.id ? '#e6edf3' : '#555',
              cursor: 'pointer', fontSize: '14px', padding: '5px 8px',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
            }}>
              <span>{k.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: 600 }}>{k.label}</span>
            </button>
          ))}
        </div>

        {/* Uçak & Gemi katmanları */}
        <div style={{
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
          padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: '#444', fontSize: '9px', textAlign: 'center', letterSpacing: '0.5px', paddingBottom: '2px' }}>CANLI</div>

          <button
            onClick={() => setUcakAktif(p => !p)}
            style={{
              background: ucakAktif ? '#00aaff22' : 'none',
              border: ucakAktif ? '1px solid #00aaff44' : '1px solid transparent',
              borderRadius: '6px', color: ucakAktif ? '#00aaff' : '#555',
              cursor: 'pointer', fontSize: '14px', padding: '5px 8px',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <ellipse cx="12" cy="12" rx="2" ry="8"/>
              <path d="M12 10 L2 15 L4 16 L12 13 L20 16 L22 15 Z"/>
              <path d="M12 18 L7 21 L8 22 L12 20 L16 22 L17 21 Z"/>
              <ellipse cx="12" cy="5" rx="1.2" ry="2"/>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {ucakYukleniyor ? '...' : ucakAktif && ucakSayisi > 0 ? `${ucakSayisi}` : 'Uçak'}
            </span>
          </button>

          <button
            onClick={() => setGemiAktif(p => !p)}
            style={{
              background: gemiAktif ? '#88ccff22' : 'none',
              border: gemiAktif ? '1px solid #88ccff44' : '1px solid transparent',
              borderRadius: '6px', color: gemiAktif ? '#88ccff' : '#555',
              cursor: 'pointer', fontSize: '14px', padding: '5px 8px',
              display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
            }}
          >
            <span>🚢</span>
            <span style={{ fontSize: '10px', fontWeight: 600 }}>
              {gemiYukleniyor ? '...' : gemiAktif && gemiSayisi > 0 ? `${gemiSayisi}` : 'Gemi'}
            </span>
          </button>

          {gemiAktif && gemiMod === 'demo' && (
            <div style={{
              fontSize: '8px', color: '#ffcc00', textAlign: 'center',
              background: '#ffcc0011', border: '1px solid #ffcc0033',
              borderRadius: '4px', padding: '1px 4px',
            }}>DEMO</div>
          )}
        </div>

        {/* YENİ KATMANLAR */}
        <div style={{
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
          padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: '#444', fontSize: '9px', textAlign: 'center', letterSpacing: '0.5px', paddingBottom: '2px' }}>VERİ</div>

          {/* NASA FIRMS */}
          <button onClick={() => setFirmsAktif(p => !p)} style={{
            background: firmsAktif ? '#ff440022' : 'none',
            border: firmsAktif ? '1px solid #ff440066' : '1px solid transparent',
            borderRadius: '6px', color: firmsAktif ? '#ff6600' : '#555',
            cursor: 'pointer', fontSize: '13px', padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}>
            <span>🔥</span><span style={{ fontSize: '10px', fontWeight: 600 }}>Yangın</span>
          </button>

          {/* NASA EONET */}
          <button onClick={() => setEonetAktif(p => !p)} style={{
            background: eonetAktif ? '#4499ff22' : 'none',
            border: eonetAktif ? '1px solid #4499ff66' : '1px solid transparent',
            borderRadius: '6px', color: eonetAktif ? '#4499ff' : '#555',
            cursor: 'pointer', fontSize: '13px', padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}>
            <span>🌍</span><span style={{ fontSize: '10px', fontWeight: 600 }}>EONET</span>
          </button>

          {/* Altyapı / Maden */}
          <button onClick={() => setAltyapiAktif(p => !p)} style={{
            background: altyapiAktif ? '#cd7f3222' : 'none',
            border: altyapiAktif ? '1px solid #cd7f3266' : '1px solid transparent',
            borderRadius: '6px', color: altyapiAktif ? '#cd7f32' : '#555',
            cursor: 'pointer', fontSize: '13px', padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}>
            <span>⛏️</span><span style={{ fontSize: '10px', fontWeight: 600 }}>Altyapı</span>
          </button>

          {/* ACLED Çatışma */}
          <button onClick={() => setAcledAktif(p => !p)} style={{
            background: acledAktif ? '#ff000022' : 'none',
            border: acledAktif ? '1px solid #ff000066' : '1px solid transparent',
            borderRadius: '6px', color: acledAktif ? '#ff4444' : '#555',
            cursor: 'pointer', fontSize: '13px', padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}>
            <span>⚔️</span><span style={{ fontSize: '10px', fontWeight: 600 }}>Çatışma</span>
          </button>

          {/* Siber / İnternet */}
          <button onClick={() => setCyberAktif(p => !p)} style={{
            background: cyberAktif ? '#ff00ff22' : 'none',
            border: cyberAktif ? '1px solid #ff00ff66' : '1px solid transparent',
            borderRadius: '6px', color: cyberAktif ? '#ff44ff' : '#555',
            cursor: 'pointer', fontSize: '13px', padding: '5px 8px',
            display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s',
          }}>
            <span>💻</span><span style={{ fontSize: '10px', fontWeight: 600 }}>Siber</span>
          </button>
        </div>

        {/* ALTYAPI FİLTRE PANELİ */}
        {altyapiAktif && (
          <div style={{
            background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
            padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px',
            backdropFilter: 'blur(8px)', maxHeight: '280px', overflowY: 'auto',
          }}>
            <div style={{ color: '#444', fontSize: '9px', textAlign: 'center', letterSpacing: '0.5px', paddingBottom: '2px' }}>FİLTRE</div>
            {Object.entries(ALTYAPI_IKON).map(([tip, ikon]) => {
              const aktif = altyapiFiltre.size === 0 || altyapiFiltre.has(tip as AltyapiTip)
              const renk = ALTYAPI_RENK[tip] || '#aaa'
              return (
                <button key={tip} onClick={() => {
                  setAltyapiFiltre(prev => {
                    const next = new Set(prev)
                    if (next.size === 0) {
                      // İlk tıklamada sadece bunu seç
                      Object.keys(ALTYAPI_IKON).forEach(t => { if (t !== tip) next.add(t as AltyapiTip) })
                      return next
                    }
                    if (next.has(tip as AltyapiTip)) {
                      next.delete(tip as AltyapiTip)
                      if (next.size === Object.keys(ALTYAPI_IKON).length - 1) return new Set() // hepsi seçili
                    } else {
                      next.add(tip as AltyapiTip)
                    }
                    return next
                  })
                }} style={{
                  background: aktif ? `${renk}18` : 'none',
                  border: `1px solid ${aktif ? renk + '66' : 'transparent'}`,
                  borderRadius: '5px', color: aktif ? renk : '#444',
                  cursor: 'pointer', fontSize: '10px', padding: '3px 6px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span>{ikon}</span>
                  <span style={{ fontSize: '9px' }}>{tip.replace(/_/g, ' ')}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Kritik uyarı badge */}
      {kritikSayisi > 0 && (
        <div style={{
          position: 'absolute', top: '12px', right: '60px', zIndex: 1000,
          background: '#ff444422', border: '1px solid #ff444466', borderRadius: '8px',
          padding: '6px 12px', color: '#ff4444', fontSize: '12px', fontWeight: 700,
          backdropFilter: 'blur(8px)',
          animation: 'criticalPulse 2s infinite',
        }}>
          🚨 {kritikSayisi} KRİTİK
        </div>
      )}

      {/* Bilgi bar */}
      {(ucakAktif || gemiAktif) && (
        <div style={{
          position: 'absolute', bottom: '50px', left: '12px', zIndex: 1000,
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '8px',
          padding: '6px 12px', backdropFilter: 'blur(8px)',
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          {ucakAktif && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#00aaff">
                <ellipse cx="12" cy="12" rx="2" ry="8"/>
                <path d="M12 10 L2 15 L4 16 L12 13 L20 16 L22 15 Z"/>
                <path d="M12 18 L7 21 L8 22 L12 20 L16 22 L17 21 Z"/>
                <ellipse cx="12" cy="5" rx="1.2" ry="2"/>
              </svg>
              <span style={{ color: '#e6edf3', fontSize: '11px', fontWeight: 700 }}>{ucakSayisi}</span>
              <span style={{ color: '#555', fontSize: '10px' }}>uçak</span>
            </div>
          )}
          {ucakAktif && gemiAktif && <div style={{ width: '1px', height: '16px', background: '#21262d' }} />}
          {gemiAktif && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#88ccff', fontSize: '12px' }}>🚢</span>
              <span style={{ color: '#e6edf3', fontSize: '11px', fontWeight: 700 }}>{gemiSayisi}</span>
              <span style={{ color: '#555', fontSize: '10px' }}>gemi {gemiMod === 'demo' ? '(demo)' : '(AIS)'}</span>
            </div>
          )}
        </div>
      )}

      {/* İl ısı haritası legend */}
      {mod === 'il-isi' && (
        <div style={{
          position: 'absolute', bottom: '50px', right: '12px', zIndex: 1000,
          background: '#0d1117ee', border: '1px solid #21262d', borderRadius: '10px',
          padding: '10px 14px', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', gap: '6px',
          minWidth: '130px',
        }}>
          <div style={{ color: '#8b949e', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
            🗺 İl Risk Haritası
          </div>
          {[
            { renk: '#ff2222', label: 'Kritik' },
            { renk: '#ff8800', label: 'Yüksek' },
            { renk: '#ffcc00', label: 'Orta' },
            { renk: '#44cc88', label: 'Düşük' },
            { renk: '#21262d', label: 'Olay Yok' },
          ].map(({ renk, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: renk, flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} />
              <span style={{ color: '#8b949e', fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Araç Detay Panelleri */}
      {seciliArac?.tip === 'ucak' && (
        <UcakDetayPanel ucak={seciliArac.veri} onKapat={() => setSeciliArac(null)} />
      )}
      {seciliArac?.tip === 'gemi' && (
        <GemiDetayPanel gemi={seciliArac.veri} onKapat={() => setSeciliArac(null)} />
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes criticalPulse {
          0%, 100% { box-shadow: 0 0 0 0 #ff444444; }
          50% { box-shadow: 0 0 12px 4px #ff444422; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}