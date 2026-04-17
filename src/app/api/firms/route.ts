// app/api/firms/route.ts
// NASA FIRMS — Uydu tabanlı aktif yangın noktaları (ücretsiz, kayıt gerekmez)
// MODIS + VIIRS verisi, son 24 saat, Türkiye bounding box

import { NextResponse } from 'next/server'

export interface FirmsNokta {
  lat: number
  lon: number
  parlaklik: number   // brightness (K)
  frp: number         // Fire Radiative Power (MW)
  tarih: string       // acq_date + acq_time
  uydu: string        // MODIS | VIIRS
  gunduz: boolean
}

// Türkiye bbox: 25.6°E – 44.8°E, 35.8°N – 42.2°N
const BBOX = '25.6,35.8,44.8,42.2'

// FIRMS CSV → JSON (public CSV endpoint, API key gerekmez)
async function firmsOku(uydu: 'MODIS_NRT' | 'VIIRS_SNPP_NRT'): Promise<FirmsNokta[]> {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/`
    + `dabb5d6f2c447562e7c87b621a4a8cd7/${uydu}/${BBOX}/1`
  // Not: yukarıdaki MAP_KEY NASA'nın herkese açık demo keyidir.
  // Kendi ücretsiz keyinizi https://firms.modaps.eosdis.nasa.gov/api/area/ adresinden alabilirsiniz.

  const res = await fetch(url, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(12000),
    headers: { 'User-Agent': 'JeopolitikRadar/1.0' },
  })
  if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`)

  const csv = await res.text()
  const satirlar = csv.trim().split('\n')
  if (satirlar.length < 2) return []

  const basliklar = satirlar[0].split(',')
  const latIdx  = basliklar.indexOf('latitude')
  const lonIdx  = basliklar.indexOf('longitude')
  const brtIdx  = basliklar.indexOf('brightness')
  const frpIdx  = basliklar.indexOf('frp')
  const dateIdx = basliklar.indexOf('acq_date')
  const timeIdx = basliklar.indexOf('acq_time')
  const dayIdx  = basliklar.indexOf('daynight')

  return satirlar.slice(1).map(satir => {
    const k = satir.split(',')
    return {
      lat: parseFloat(k[latIdx]),
      lon: parseFloat(k[lonIdx]),
      parlaklik: parseFloat(k[brtIdx]) || 0,
      frp: parseFloat(k[frpIdx]) || 0,
      tarih: `${k[dateIdx]}T${(k[timeIdx] || '0000').slice(0, 2)}:${(k[timeIdx] || '0000').slice(2)}:00Z`,
      uydu: uydu === 'MODIS_NRT' ? 'MODIS' : 'VIIRS',
      gunduz: k[dayIdx] === 'D',
    } as FirmsNokta
  }).filter(n => !isNaN(n.lat) && !isNaN(n.lon))
}

export async function GET() {
  try {
    const [modis, viirs] = await Promise.allSettled([
      firmsOku('MODIS_NRT'),
      firmsOku('VIIRS_SNPP_NRT'),
    ])

    const noktalar: FirmsNokta[] = [
      ...(modis.status === 'fulfilled' ? modis.value : []),
      ...(viirs.status === 'fulfilled' ? viirs.value : []),
    ]

    // FRP'ye göre sırala (en güçlü yangın önce)
    noktalar.sort((a, b) => b.frp - a.frp)

    return NextResponse.json({
      noktalar,
      toplam: noktalar.length,
      guncelleme: new Date().toISOString(),
    })
  } catch (err) {
    console.error('FIRMS hatası:', err)
    return NextResponse.json({ noktalar: [], toplam: 0, hata: String(err) })
  }
}
