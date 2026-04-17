// app/api/eonet/route.ts
// NASA EONET — Earth Observatory Natural Event Tracker
// Deprem dışı doğal olaylar: fırtına, volkan, sel, kasırga vb.
// Tamamen ücretsiz, key gerektirmez

import { NextResponse } from 'next/server'

export interface EonetOlay {
  id: string
  baslik: string
  kategori: string
  tarih: string
  koordinat: [number, number] // [lon, lat]
  kaynak: string
  url: string
  kapalı: boolean
}

// EONET kategori → Türkçe kategori
const KATEGORI_MAP: Record<string, string> = {
  'Severe Storms': 'FIRTINA',
  'Wildfires': 'ORMAN_YANGINI',
  'Floods': 'SEL',
  'Volcanoes': 'VOLKAN',
  'Earthquakes': 'DEPREM',
  'Drought': 'KURAKLIK',
  'Dust and Haze': 'TOZ_FIRTINASI',
  'Sea and Lake Ice': 'BUZ',
  'Landslides': 'HEYELAN',
  'Snow': 'KAR_FIRTINASI',
  'Temperature Extremes': 'SICAK_DALGA',
  'Tropical Cyclones': 'KASIRGA',
  'Water Color': 'DENIZ_OLAYI',
  'Manmade': 'INSAN_KAYNAKLI',
}

export async function GET() {
  try {
    // Son 30 gün, tüm kategori, açık+kapalı olaylar
    const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?limit=200&days=30&status=all'
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'JeopolitikRadar/1.0' },
    })
    if (!res.ok) throw new Error(`EONET HTTP ${res.status}`)
    const json = await res.json()

    const olaylar: EonetOlay[] = []

    for (const ev of (json.events || [])) {
      if (!ev.geometry || ev.geometry.length === 0) continue

      // En son geometri noktasını al
      const geom = ev.geometry[ev.geometry.length - 1]
      let koordinat: [number, number]

      if (geom.type === 'Point') {
        koordinat = [geom.coordinates[0], geom.coordinates[1]]
      } else if (geom.type === 'Polygon') {
        // Merkez nokta
        const coords = geom.coordinates[0]
        const lons = coords.map((c: number[]) => c[0])
        const lats = coords.map((c: number[]) => c[1])
        koordinat = [
          lons.reduce((a: number, b: number) => a + b, 0) / lons.length,
          lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
        ]
      } else continue

      const katTur = ev.categories?.[0]?.title || 'Diğer'
      const kategori = KATEGORI_MAP[katTur] || 'DIGER'

      // Kaynak URL
      const kaynakUrl = ev.sources?.[0]?.url || `https://eonet.gsfc.nasa.gov/api/v3/events/${ev.id}`
      const kaynakId = ev.sources?.[0]?.id || 'EONET'

      olaylar.push({
        id: `eonet-${ev.id}`,
        baslik: ev.title,
        kategori,
        tarih: geom.date || ev.geometry[0]?.date || new Date().toISOString(),
        koordinat,
        kaynak: `NASA EONET (${kaynakId})`,
        url: kaynakUrl,
        kapalı: ev.closed !== null && ev.closed !== undefined,
      })
    }

    // Tarihe göre sırala
    olaylar.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())

    return NextResponse.json({
      olaylar,
      toplam: olaylar.length,
      guncelleme: new Date().toISOString(),
    })
  } catch (err) {
    console.error('EONET hatası:', err)
    return NextResponse.json({ olaylar: [], toplam: 0, hata: String(err) })
  }
}
