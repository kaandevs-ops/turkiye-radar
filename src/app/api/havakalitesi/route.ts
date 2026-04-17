import { NextResponse } from 'next/server'
import type { Olay } from '@/types/olay'

const SEHIRLER = [
  { ad: 'İstanbul', lat: 41.0082, lon: 28.9784 },
  { ad: 'Ankara', lat: 39.9334, lon: 32.8597 },
  { ad: 'İzmir', lat: 38.4237, lon: 27.1428 },
  { ad: 'Bursa', lat: 40.1885, lon: 29.0610 },
  { ad: 'Antalya', lat: 36.8969, lon: 30.7133 },
  { ad: 'Adana', lat: 37.0000, lon: 35.3213 },
  { ad: 'Konya', lat: 37.8746, lon: 32.4872 },
  { ad: 'Gaziantep', lat: 37.0662, lon: 37.3825 },
  { ad: 'Diyarbakır', lat: 37.9144, lon: 40.2310 },
  { ad: 'Trabzon', lat: 41.0015, lon: 39.7178 },
  { ad: 'Samsun', lat: 41.2867, lon: 36.3313 },
  { ad: 'Kayseri', lat: 38.7205, lon: 35.4826 },
]

export async function GET() {
  try {
    const sonuclar = await Promise.allSettled(
      SEHIRLER.map(s =>
        fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${s.lat}&longitude=${s.lon}&current=pm2_5,pm10,us_aqi&timezone=Europe/Istanbul`,
          { next: { revalidate: 1800 } }
        ).then(r => r.json()).then(d => ({ sehir: s, data: d }))
      )
    )

    const olaylar: Olay[] = []

    sonuclar.forEach(res => {
      if (res.status !== 'fulfilled') return
      const { sehir, data } = res.value
      const aqi = data?.current?.us_aqi
      const pm25 = data?.current?.pm2_5
      const pm10 = data?.current?.pm10
      if (aqi == null || aqi <= 50) return

      let siddet: Olay['siddet'] = 'orta'
      let aqiLabel = 'Orta'
      if (aqi > 200) { siddet = 'kritik'; aqiLabel = 'Çok Sağlıksız' }
      else if (aqi > 150) { siddet = 'kritik'; aqiLabel = 'Sağlıksız' }
      else if (aqi > 100) { siddet = 'yuksek'; aqiLabel = 'Hassas Gruplar İçin Sağlıksız' }

      olaylar.push({
        id: `aqi-${sehir.ad}`,
        baslik: `${sehir.ad} Hava Kalitesi: ${aqiLabel} (AQI ${aqi})`,
        aciklama: `PM2.5: ${pm25?.toFixed(1) ?? '-'} µg/m³ · PM10: ${pm10?.toFixed(1) ?? '-'} µg/m³`,
        kaynak: 'Hava Kalitesi',
        kategori: 'HAVA_KALİTESİ' as any,
        siddet,
        tarih: new Date().toISOString(),
        koordinat: [sehir.lon, sehir.lat],
        url: `https://www.iqair.com/tr/turkey` as any,
      })
    })

    return NextResponse.json({ olaylar })
  } catch {
    return NextResponse.json({ olaylar: [] })
  }
}
