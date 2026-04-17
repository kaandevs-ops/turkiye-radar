import { NextResponse } from 'next/server'

// aisstream.io REST snapshot endpoint (ücretsiz API key ile)
// API key olmadan demo modu: statik sahte veriler döner
// Gerçek kullanım için AISSTREAM_API_KEY env variable gerekli
// https://aisstream.io → ücretsiz kayıt → API key al

export interface Gemi {
  id: string
  mmsi: string
  isim: string
  tip: string
  tipKodu: number
  lon: number
  lat: number
  hiz: number  // knot
  yon: number  // derece
  durum: string
  bayrak: string
}

function gemitTipAdi(typeCode: number): string {
  if (typeCode >= 70 && typeCode <= 79) return 'Kargo'
  if (typeCode >= 80 && typeCode <= 89) return 'Tanker'
  if (typeCode >= 60 && typeCode <= 69) return 'Yolcu'
  if (typeCode === 30) return 'Balıkçı'
  if (typeCode === 35) return 'Askeri'
  if (typeCode === 36) return 'Yelkenli'
  if (typeCode === 37) return 'Eğlence'
  if (typeCode >= 50 && typeCode <= 59) return 'Özel'
  if (typeCode === 31 || typeCode === 32) return 'Çekici'
  return 'Diğer'
}

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY

  if (!apiKey) {
    // API key yoksa demo verisi dön - Boğaz ve çevre sular
    const demoGemiler: Gemi[] = [
      { id: 'demo-1', mmsi: '271000001', isim: 'ISTANBUL STAR', tip: 'Kargo', tipKodu: 70, lon: 29.12, lat: 41.02, hiz: 8.2, yon: 45, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-2', mmsi: '271000002', isim: 'BOSPHORUS EXPRESS', tip: 'Tanker', tipKodu: 80, lon: 28.98, lat: 41.09, hiz: 6.1, yon: 180, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-3', mmsi: '271000003', isim: 'MARMARA QUEEN', tip: 'Yolcu', tipKodu: 60, lon: 29.05, lat: 40.98, hiz: 12.5, yon: 270, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-4', mmsi: '209000001', isim: 'AEGEAN SPIRIT', tip: 'Kargo', tipKodu: 71, lon: 26.50, lat: 38.80, hiz: 10.3, yon: 90, durum: 'Seyirde', bayrak: 'CY' },
      { id: 'demo-5', mmsi: '248000001', isim: 'BLACK SEA TRADER', tip: 'Tanker', tipKodu: 84, lon: 32.20, lat: 41.50, hiz: 7.8, yon: 200, durum: 'Seyirde', bayrak: 'MT' },
      { id: 'demo-6', mmsi: '271000004', isim: 'IZMIR BAY', tip: 'Kargo', tipKodu: 72, lon: 27.05, lat: 38.45, hiz: 5.5, yon: 315, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-7', mmsi: '271000005', isim: 'ANTALYA ROSE', tip: 'Yolcu', tipKodu: 69, lon: 30.68, lat: 36.82, hiz: 14.2, yon: 120, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-8', mmsi: '212000001', isim: 'MEDITERRANEAN STAR', tip: 'Tanker', tipKodu: 83, lon: 36.10, lat: 36.60, hiz: 9.1, yon: 45, durum: 'Seyirde', bayrak: 'CY' },
      { id: 'demo-9', mmsi: '271000006', isim: 'TRABZON EXPRESS', tip: 'Kargo', tipKodu: 70, lon: 39.72, lat: 41.05, hiz: 4.3, yon: 90, durum: 'Seyirde', bayrak: 'TR' },
      { id: 'demo-10', mmsi: '271000007', isim: 'BOGAZICI FERRY', tip: 'Yolcu', tipKodu: 60, lon: 29.02, lat: 41.05, hiz: 8.8, yon: 0, durum: 'Seyirde', bayrak: 'TR' },
    ]
    return NextResponse.json({ gemiler: demoGemiler, toplam: demoGemiler.length, mod: 'demo', guncellendi: new Date().toISOString() })
  }

  // Gerçek aisstream.io snapshot API
  try {
    // Türkiye suları bounding box (Ege, Marmara, Karadeniz, Akdeniz)
    const bbox = [[25.0, 35.0], [45.0, 43.0]]
    
    const res = await fetch('https://api.aisstream.io/v0/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        BoundingBoxes: [bbox],
        FilterMessageTypes: ['PositionReport'],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      throw new Error(`AISStream HTTP ${res.status}`)
    }

    const data = await res.json()
    const gemiler: Gemi[] = (data.vessels || data || [])
      .filter((v: any) => v.Longitude != null && v.Latitude != null)
      .map((v: any) => ({
        id: `gemi-${v.MMSI}`,
        mmsi: String(v.MMSI || ''),
        isim: v.ShipName?.trim() || v.Name?.trim() || `MMSI:${v.MMSI}`,
        tipKodu: v.ShipType || 0,
        tip: gemitTipAdi(v.ShipType || 0),
        lon: v.Longitude,
        lat: v.Latitude,
        hiz: v.Sog || v.Speed || 0,
        yon: v.Cog || v.Heading || 0,
        durum: v.NavigationalStatus || 'Seyirde',
        bayrak: v.Flag || v.Country || '',
      }))

    return NextResponse.json({
      gemiler,
      toplam: gemiler.length,
      mod: 'canli',
      guncellendi: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[gemiler] hata:', err.message)
    return NextResponse.json({ gemiler: [], toplam: 0, hata: err.message })
  }
}
