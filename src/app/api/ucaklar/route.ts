import { NextResponse } from 'next/server'

// Türkiye bounding box: lamin=35, lomin=25, lamax=43, lomax=45
// OpenSky state vector fields:
// [0]icao24 [1]callsign [2]origin_country [3]time_position [4]last_contact
// [5]longitude [6]latitude [7]baro_altitude [8]on_ground [9]velocity
// [10]true_track [11]vertical_rate [12]sensors [13]geo_altitude [14]squawk
// [15]spi [16]position_source

export interface Ucak {
  id: string
  icao24: string
  callsign: string
  ulke: string
  lon: number
  lat: number
  irtifa: number // metre
  hiz: number   // m/s
  yon: number   // derece (0-360)
  dikey: number // m/s, pozitif = yükseliyor
  yerde: boolean
  zaman: number
}

export async function GET() {
  try {
    const url = 'https://opensky-network.org/api/states/all?lamin=35&lomin=25&lamax=43&lomax=45'
    const res = await fetch(url, {
      next: { revalidate: 15 },
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'TurkiyeRadar/1.0' },
    })

    if (!res.ok) {
      throw new Error(`OpenSky HTTP ${res.status}`)
    }

    const data = await res.json()
    const states: any[][] = data.states || []

    const ucaklar: Ucak[] = states
      .filter(s => s[5] != null && s[6] != null) // koordinat zorunlu
      .map(s => ({
        id: `ucak-${s[0]}`,
        icao24: s[0] || '',
        callsign: (s[1] || '').trim(),
        ulke: s[2] || '',
        lon: s[5],
        lat: s[6],
        irtifa: s[7] ?? s[13] ?? 0,
        hiz: s[9] ?? 0,
        yon: s[10] ?? 0,
        dikey: s[11] ?? 0,
        yerde: s[8] === true,
        zaman: s[3] ?? s[4] ?? 0,
      }))
      .filter(u => !u.yerde) // sadece havadaki uçaklar

    return NextResponse.json({
      ucaklar,
      toplam: ucaklar.length,
      guncellendi: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[ucaklar] hata:', err.message)
    return NextResponse.json({ ucaklar: [], toplam: 0, hata: err.message })
  }
}
