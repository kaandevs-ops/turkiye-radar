import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const xml = await res.text()

    const kurlar: any[] = []
    const regex = /<Currency[^>]*CurrencyCode="([^"]+)"[^>]*>[\s\S]*?<CurrencyName>([^<]+)<\/CurrencyName>[\s\S]*?<ForexBuying>([^<]*)<\/ForexBuying>[\s\S]*?<ForexSelling>([^<]*)<\/ForexSelling>/g

    let match
    while ((match = regex.exec(xml)) !== null) {
      if (match[3] && match[4]) {
        kurlar.push({
          kod: match[1],
          isim: match[2],
          alis: parseFloat(match[3]),
          satis: parseFloat(match[4]),
        })
      }
    }

    return NextResponse.json({ kurlar, guncellendi: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ hata: 'Döviz verisi alınamadı' }, { status: 500 })
  }
}
