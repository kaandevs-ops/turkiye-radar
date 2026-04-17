import { NextResponse } from 'next/server'
import type { Olay } from '@/types/olay'

function wmoTespit(code: number): { kategori: string; aciklama: string; siddet: string } | null {
  if (code >= 95) return { kategori: 'HORTUM', aciklama: 'Şiddetli fırtına', siddet: 'kritik' }
  if (code >= 85) return { kategori: 'KAR_FIRTINASI', aciklama: 'Yoğun kar yağışı', siddet: 'yuksek' }
  if (code >= 80) return { kategori: 'SEL', aciklama: 'Sağanak yağış', siddet: 'yuksek' }
  if (code >= 71) return { kategori: 'KAR_FIRTINASI', aciklama: 'Kar yağışı', siddet: 'orta' }
  if (code >= 61) return { kategori: 'SEL', aciklama: 'Şiddetli yağmur', siddet: 'orta' }
  if (code === 45 || code === 48) return { kategori: 'SIS', aciklama: 'Sis', siddet: 'dusuk' }
  return null
}

const SEHIRLER = [
  { isim: 'İstanbul', lat: 41.01, lon: 28.97 },
  { isim: 'Ankara', lat: 39.93, lon: 32.86 },
  { isim: 'İzmir', lat: 38.42, lon: 27.14 },
  { isim: 'Bursa', lat: 40.18, lon: 29.06 },
  { isim: 'Antalya', lat: 36.89, lon: 30.71 },
  { isim: 'Adana', lat: 37.00, lon: 35.32 },
  { isim: 'Konya', lat: 37.87, lon: 32.48 },
  { isim: 'Gaziantep', lat: 37.06, lon: 37.38 },
  { isim: 'Kayseri', lat: 38.72, lon: 35.48 },
  { isim: 'Erzurum', lat: 39.90, lon: 41.27 },
  { isim: 'Trabzon', lat: 41.00, lon: 39.71 },
  { isim: 'Samsun', lat: 41.28, lon: 36.33 },
  { isim: 'Diyarbakır', lat: 37.91, lon: 40.23 },
  { isim: 'Van', lat: 38.48, lon: 43.38 },
  { isim: 'Malatya', lat: 38.35, lon: 38.31 },
  { isim: 'Kahramanmaraş', lat: 37.58, lon: 36.93 },
  { isim: 'Hatay', lat: 36.40, lon: 36.35 },
  { isim: 'Muğla', lat: 37.21, lon: 28.36 },
  { isim: 'Denizli', lat: 37.77, lon: 29.08 },
  { isim: 'Eskişehir', lat: 39.77, lon: 30.52 },
]

export async function GET() {
  try {
    const lats = SEHIRLER.map(s => s.lat).join(',')
    const lons = SEHIRLER.map(s => s.lon).join(',')
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=weathercode,precipitation_sum,windspeed_10m_max,precipitation_probability_max&timezone=Europe/Istanbul&forecast_days=1`
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const results = Array.isArray(data) ? data : [data]
    const olaylar: Olay[] = []

    results.forEach((sonuc: any, i: number) => {
      const sehir = SEHIRLER[i]
      if (!sehir) return
      const weathercode = sonuc.daily?.weathercode?.[0] ?? 0
      const yagis = sonuc.daily?.precipitation_sum?.[0] ?? 0
      const ruzgar = sonuc.daily?.windspeed_10m_max?.[0] ?? 0
      const yagisOlasiligi = sonuc.daily?.precipitation_probability_max?.[0] ?? 0
      const uyari = wmoTespit(weathercode)
      if (!uyari && yagis < 20 && ruzgar < 60) return
      const kategori = uyari?.kategori || (ruzgar >= 60 ? 'HORTUM' : 'SEL')
      const siddet = uyari?.siddet || (ruzgar >= 80 ? 'kritik' : ruzgar >= 60 ? 'yuksek' : 'orta')
      let aciklama = uyari?.aciklama || 'Olumsuz hava koşulları'
      if (yagis > 0) aciklama += `. Yağış: ${yagis.toFixed(1)}mm`
      if (ruzgar > 30) aciklama += `. Rüzgar: ${ruzgar.toFixed(0)}km/h`
      if (yagisOlasiligi > 0) aciklama += `. Yağış ihtimali: %${yagisOlasiligi}`
      olaylar.push({
        id: `hava-${sehir.isim}-${new Date().toDateString()}`,
        baslik: `${sehir.isim}: ${aciklama.split('.')[0]}`,
        kategori: kategori as any,
        aciklama,
        koordinat: [sehir.lon, sehir.lat],
        tarih: new Date().toISOString(),
        siddet: siddet as any,
        kaynak: 'Open-Meteo',
      } as Olay)
    })

    return NextResponse.json({ olaylar, toplam: olaylar.length })
  } catch (err) {
    console.error('Hava verisi alınamadı:', err)
    return NextResponse.json({ olaylar: [], toplam: 0 })
  }
}
