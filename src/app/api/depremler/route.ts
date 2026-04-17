import { NextResponse } from 'next/server'
import type { Olay } from '@/types/olay'

async function usgsDepremler(): Promise<Olay[]> {
  const res = await fetch(
    'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=1&minlatitude=35&maxlatitude=43&minlongitude=25&maxlongitude=45&orderby=time&limit=50',
    { next: { revalidate: 60 } }
  )
  const data = await res.json()
  return data.features.map((f: any) => ({
    id: `usgs-${f.id}`,
    baslik: `${f.properties.mag} Büyüklüğünde Deprem`,
    kategori: f.properties.mag >= 4 ? 'DEPREM' : 'DEPREM_ARTCI',
    aciklama: f.properties.place || 'Türkiye',
    koordinat: [f.geometry.coordinates[0], f.geometry.coordinates[1]] as [number, number],
    tarih: new Date(f.properties.time).toISOString(),
    siddet: f.properties.mag >= 5 ? 'kritik' : f.properties.mag >= 4 ? 'yuksek' : f.properties.mag >= 3 ? 'orta' : 'dusuk',
    kaynak: 'USGS',
    url: f.properties.url,
    buyukluk: f.properties.mag,
    derinlik: f.geometry.coordinates[2],
  } as any))
}

async function kandilliDepremler(): Promise<Olay[]> {
  try {
    const res = await fetch(
      'http://www.koeri.boun.edu.tr/scripts/lst0.asp',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      }
    )
    const buffer = await res.arrayBuffer()
    // windows-1254 encoding
    const text = new TextDecoder('windows-1254').decode(buffer)

    const lines = text.split('\n').filter(l => /^\d{4}\.\d{2}\.\d{2}/.test(l.trim()))
    const olaylar: Olay[] = []

    for (const line of lines.slice(0, 50)) {
      try {
        // Format: 2026.04.13 22:19:49  37.9587   32.3285   5.9   -.-  1.6  -.-   YER_ADI  Durum
        const parts = line.trim().split(/\s+/)
        if (parts.length < 8) continue

        const tarihStr = `${parts[0].replace(/\./g, '-')}T${parts[1]}+03:00`
        const lat = parseFloat(parts[2])
        const lon = parseFloat(parts[3])
        const derinlik = parseFloat(parts[4])
        const mag = parseFloat(parts[6]) // 5. sütun -.- olabilir, 7. sütun magnitude

        if (isNaN(lat) || isNaN(lon) || isNaN(mag)) continue

        // Yer ismi: index 8'den sonrası, son kelime (durum) hariç
        const yerParts = parts.slice(8, parts.length - 1)
        const yer = yerParts.join(' ').trim() || 'Türkiye'

        olaylar.push({
          id: `kandilli-${parts[0]}-${parts[1]}-${lat}-${lon}`,
          baslik: `${mag} Büyüklüğünde Deprem - ${yer}`,
          kategori: mag >= 4 ? 'DEPREM' : 'DEPREM_ARTCI',
          aciklama: `Kandilli Rasathanesi. Yer: ${yer}. Derinlik: ${derinlik} km`,
          koordinat: [lon, lat] as [number, number],
          tarih: new Date(tarihStr).toISOString(),
          siddet: mag >= 5 ? 'kritik' : mag >= 4 ? 'yuksek' : mag >= 3 ? 'orta' : 'dusuk',
          kaynak: 'Kandilli',
          buyukluk: mag,
          derinlik,
        } as any)
      } catch {
        continue
      }
    }

    return olaylar
  } catch (err) {
    console.error('Kandilli alınamadı:', err)
    return []
  }
}

export async function GET() {
  try {
    const [usgsRes, kandilliRes] = await Promise.allSettled([
      usgsDepremler(),
      kandilliDepremler(),
    ])

    const usgs = usgsRes.status === 'fulfilled' ? usgsRes.value : []
    const kandilli = kandilliRes.status === 'fulfilled' ? kandilliRes.value : []

    const tumDepremler = [...usgs]
    for (const k of kandilli) {
      const duplicate = usgs.some(u => {
        const latFark = Math.abs(u.koordinat[1] - k.koordinat[1])
        const lonFark = Math.abs(u.koordinat[0] - k.koordinat[0])
        const zamanFark = Math.abs(new Date(u.tarih).getTime() - new Date(k.tarih).getTime())
        return latFark < 0.15 && lonFark < 0.15 && zamanFark < 120000
      })
      if (!duplicate) tumDepremler.push(k)
    }

    tumDepremler.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())

    return NextResponse.json({
      olaylar: tumDepremler,
      kaynaklar: { usgs: usgs.length, kandilli: kandilli.length, toplam: tumDepremler.length },
      guncellendi: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ hata: 'Deprem verisi alınamadı' }, { status: 500 })
  }
}
