'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import DetayPanel from '@/components/DetayPanel'
import Bildirim from '@/components/Bildirim'
import IstatistikBar from '@/components/IstatistikBar'
import HaberKartlari from '@/components/HaberKartlari'
import Dashboard from '@/components/Dashboard'
import YolAnaliz from '@/components/YolAnaliz'          // ← YENİ
import { olayaTiklandi, profilAl } from '@/lib/kullanici'
import type { KullaniciProfil } from '@/lib/kullanici'
import type { Olay } from '@/types/olay'

const Harita = dynamic(() => import('@/components/Harita'), { ssr: false })

export interface Filtreler {
  arama: string
  siddetler: string[]
  kategoriler: string[]
}

export default function AnaSayfa() {
  const [olaylar, setOlaylar] = useState<Olay[]>([])
  const [gecmisYuklendi, setGecmisYuklendi] = useState(false)
  const [seciliOlay, setSeciliOlay] = useState<Olay | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kartlarAcik, setKartlarAcik] = useState(true)
  const [filtreler, setFiltreler] = useState<Filtreler>({ arama: '', siddetler: [], kategoriler: [] })
  const [dashboardAcik, setDashboardAcik] = useState(false)
  const [yolAnalizAcik, setYolAnalizAcik] = useState(false)  // ← YENİ
  const [saniyeKalan, setSaniyeKalan] = useState(120)
  const [sonYenileme, setSonYenileme] = useState<Date | null>(null)
  const [kullaniciProfil, setKullaniciProfil] = useState<KullaniciProfil>({ kategoriSayac: {}, sonTiklamalar: [], toplamTiklama: 0 })

  useEffect(() => {
    setKullaniciProfil(profilAl())
  }, [])

  const olaySecil = useCallback((olay: Olay) => {
    setSeciliOlay(olay)
    olayaTiklandi(olay)
    setKullaniciProfil(profilAl())
  }, [])

  const gecmisiKaydet = (yeniOlaylar: Olay[]) => {
    try {
      const simdi = Date.now()
      const yediGun = simdi - 7 * 24 * 3600 * 1000
      const eskiJSON = localStorage.getItem('tr-radar-gecmis')
      const eski: Olay[] = eskiJSON ? JSON.parse(eskiJSON) : []
      const yeniIdler = new Set(yeniOlaylar.map(o => o.id))
      const birlesmis = [
        ...yeniOlaylar,
        ...eski.filter(o => !yeniIdler.has(o.id) && new Date(o.tarih).getTime() > yediGun)
      ]
      birlesmis.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      const sinirli = birlesmis.slice(0, 2000)
      localStorage.setItem('tr-radar-gecmis', JSON.stringify(sinirli))
    } catch {}
  }

  const gecmisiYukle = (): Olay[] => {
    try {
      const json = localStorage.getItem('tr-radar-gecmis')
      return json ? JSON.parse(json) : []
    } catch { return [] }
  }

  const veriYukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const [depRes, habRes, havaRes, aqiRes, tgRes] = await Promise.allSettled([
        fetch('/api/depremler').then(r => r.json()),
        fetch('/api/haberler').then(r => r.json()),
        fetch('/api/hava').then(r => r.json()),
        fetch('/api/havakalitesi').then(r => r.json()),
        fetch('/api/telegram').then(r => r.json()),
      ])
      const tumOlaylar: Olay[] = []
      if (depRes.status === 'fulfilled' && depRes.value.olaylar) tumOlaylar.push(...depRes.value.olaylar)
      if (habRes.status === 'fulfilled' && habRes.value.olaylar) tumOlaylar.push(...habRes.value.olaylar)
      if (havaRes.status === 'fulfilled' && havaRes.value.olaylar) tumOlaylar.push(...havaRes.value.olaylar)
      if (aqiRes.status === 'fulfilled' && (aqiRes as any).value.olaylar) tumOlaylar.push(...(aqiRes as any).value.olaylar)
      if (tgRes.status === 'fulfilled' && (tgRes as any).value.olaylar) tumOlaylar.push(...(tgRes as any).value.olaylar)
      tumOlaylar.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())
      gecmisiKaydet(tumOlaylar)
      setOlaylar(tumOlaylar)
      setSonYenileme(new Date())
      setSaniyeKalan(120)
    } catch (err) {
      console.error('Veri yuklenemedi:', err)
    } finally {
      setYukleniyor(false)
    }
  }, [])

  useEffect(() => {
    if (!gecmisYuklendi) {
      const g = gecmisiYukle()
      if (g.length > 0) setOlaylar(g)
      setGecmisYuklendi(true)
    }
    veriYukle()
    const interval = setInterval(veriYukle, 120_000)
    return () => clearInterval(interval)
  }, [veriYukle])

  useEffect(() => {
    const t = setInterval(() => setSaniyeKalan(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const filtreliOlaylar = olaylar.filter(o => {
    if (filtreler.arama) {
      const ara = filtreler.arama.toLowerCase()
      if (!o.baslik.toLowerCase().includes(ara) && !o.kaynak.toLowerCase().includes(ara)) return false
    }
    if (filtreler.siddetler.length > 0 && !filtreler.siddetler.includes(o.siddet)) return false
    if (filtreler.kategoriler.length > 0 && !filtreler.kategoriler.includes(o.kategori)) return false
    return true
  })

  return (
    <div className="ana-container" style={{ display: 'flex', height: '100vh', background: '#0d1117', fontFamily: 'system-ui, sans-serif' }}>
      <Sidebar
        olaylar={filtreliOlaylar}
        tumOlaylar={olaylar}
        seciliOlay={seciliOlay}
        onOlaySecil={olaySecil}
        yukleniyor={yukleniyor}
        filtreler={filtreler}
        onFiltreDegis={setFiltreler}
        saniyeKalan={saniyeKalan}
        sonYenileme={sonYenileme}
        onYenile={veriYukle}
        kullaniciProfil={kullaniciProfil}
      />
      <div style={{ flex: 1, position: 'relative', paddingBottom: kartlarAcik ? '198px' : '38px', transition: 'padding-bottom 0.3s ease' }}>
        <Harita olaylar={filtreliOlaylar} seciliOlay={seciliOlay} onOlaySecil={olaySecil} />
        <DetayPanel olay={seciliOlay} onKapat={() => setSeciliOlay(null)} />
        <Bildirim olaylar={olaylar} />
        {dashboardAcik && <Dashboard olaylar={olaylar} onKapat={() => setDashboardAcik(false)} />}

        {/* YOL ANALİZ MODALI ← YENİ */}
        {yolAnalizAcik && (
          <YolAnaliz olaylar={olaylar} onKapat={() => setYolAnalizAcik(false)} />
        )}

        {/* Dashboard butonu */}
        <button
          onClick={() => setDashboardAcik(p => !p)}
          title='Dashboard'
          style={{
            position: 'fixed', top: '16px', right: '56px', zIndex: 1500,
            background: dashboardAcik ? '#58a6ff22' : '#161b22',
            border: `1px solid ${dashboardAcik ? '#58a6ff' : '#30363d'}`,
            borderRadius: '8px', color: dashboardAcik ? '#58a6ff' : '#555',
            fontSize: '16px', cursor: 'pointer', padding: '6px 10px',
            transition: 'all 0.2s',
          }}
        >
          📊
        </button>

        {/* YOL ANALİZ BUTONU ← YENİ */}
        <button
          onClick={() => setYolAnalizAcik(p => !p)}
          title='AI Yol Analizi'
          style={{
            position: 'fixed', top: '16px', right: '102px', zIndex: 1500,
            background: yolAnalizAcik ? '#00ff8822' : '#161b22',
            border: `1px solid ${yolAnalizAcik ? '#00ff88' : '#30363d'}`,
            borderRadius: '8px', color: yolAnalizAcik ? '#00ff88' : '#555',
            fontSize: '16px', cursor: 'pointer', padding: '6px 10px',
            transition: 'all 0.2s',
          }}
        >
          🗺️
        </button>

        <button
          onClick={() => setKartlarAcik(p => !p)}
          title={kartlarAcik ? 'Haberleri Gizle' : 'Haberleri Göster'}
          style={{
            position: 'fixed', bottom: kartlarAcik ? '200px' : '42px', right: '56px',
            zIndex: 600, background: '#161b22', border: `1px solid ${kartlarAcik ? '#58a6ff' : '#30363d'}`,
            borderRadius: '8px', color: kartlarAcik ? '#58a6ff' : '#555',
            fontSize: '14px', cursor: 'pointer', padding: '5px 9px',
            transition: 'bottom 0.3s ease',
          }}
        >
          {kartlarAcik ? '📰 ▼' : '📰 ▲'}
        </button>
        {kartlarAcik && <HaberKartlari olaylar={filtreliOlaylar} onOlaySecil={olaySecil} />}
        <IstatistikBar olaylar={olaylar} />
      </div>
    </div>
  )
}