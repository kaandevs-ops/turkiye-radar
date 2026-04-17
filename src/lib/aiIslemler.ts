import type { AIConfig } from './ai'
import type { Olay } from '@/types/olay'

async function aiIstek(config: AIConfig, system: string, userMsg: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  })
  const data = await res.json()
  if (data.hata) throw new Error(data.hata)
  return data.content
}

function jsonParse<T>(raw: string, fallback: T): T {
  // 1. <think> bloğunu temizle
  let temiz = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  // 2. ``` fence temizle
  temiz = temiz.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // 3. İlk { ... } bloğunu bul
  const match = temiz.match(/\{[\s\S]*\}/)
  if (!match) return fallback
  try {
    return JSON.parse(match[0]) as T
  } catch {
    // 4. Trailing comma gibi küçük hataları dene
    try {
      return JSON.parse(match[0].replace(/,\s*([}\]])/g, '$1')) as T
    } catch {
      return fallback
    }
  }
}

export interface HaberAnaliz {
  ozet: string
  onemSkoru: number
  anahtarKelimeler: string[]
  kategoriDogrulama: string
}

export async function haberOzetle(config: AIConfig, olay: Olay): Promise<HaberAnaliz> {
  const system = `Sen Türkiye'deki olayları analiz eden bir asistansın.
Yanıtını SADECE geçerli JSON formatında ver, hiçbir açıklama ekleme, düşünce zinciri yazma:
{"ozet":"2-3 cümle özet","onemSkoru":7,"anahtarKelimeler":["kelime1","kelime2"],"kategoriDogrulama":"DEPREM"}`

  const userMsg = `Analiz et:
Başlık: ${olay.baslik}
Açıklama: ${olay.aciklama || ''}
Kaynak: ${olay.kaynak}
Kategori: ${olay.kategori}`

  const raw = await aiIstek(config, system, userMsg)
  console.log('[AI ozet] ham yanıt:', raw.slice(0, 300))

  return jsonParse<HaberAnaliz>(raw, {
    ozet: raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim().slice(0, 300) || 'Özet alınamadı',
    onemSkoru: 5,
    anahtarKelimeler: [],
    kategoriDogrulama: olay.kategori,
  })
}

export interface DepremAnaliz {
  riskSkoru: number
  yogunBolge: string
  trend: 'artiyor' | 'azaliyor' | 'stabil'
  uyari: string
  tahminiRisk: string
}

export async function depremRiskAnaliz(config: AIConfig, depremler: Olay[]): Promise<DepremAnaliz> {
  const son = depremler
    .filter(d => d.kategori === 'DEPREM' || d.kategori === 'DEPREM_ARTCI')
    .slice(0, 30)

  if (son.length === 0) {
    return { riskSkoru: 20, yogunBolge: 'Veri yok', trend: 'stabil', uyari: 'Yeterli deprem verisi yok', tahminiRisk: 'Belirsiz' }
  }

  const ozet = son.map(d => `${d.tarih.slice(0, 16)} | ${d.baslik}`).join('\n')

  const system = `Sen deprem verisi analiz eden bir sismoloji asistanısın.
SADECE JSON formatında yanıt ver:
{"riskSkoru":45,"yogunBolge":"Doğu Anadolu","trend":"artiyor","uyari":"Kısa açıklama","tahminiRisk":"24 saatlik değerlendirme"}`

  const raw = await aiIstek(config, system, `Son ${son.length} deprem:\n${ozet}\n\nRisk analizi yap.`)

  return jsonParse<DepremAnaliz>(raw, {
    riskSkoru: 50, yogunBolge: 'Belirsiz', trend: 'stabil',
    uyari: 'Analiz tamamlanamadı', tahminiRisk: 'Veri yetersiz',
  })
}

export interface Anomali {
  tespit: boolean
  tip: string
  aciklama: string
  siddet: 'dusuk' | 'orta' | 'yuksek'
}

export async function anomaliTespit(
  config: AIConfig,
  tip: 'doviz' | 'havakalitesi' | 'deprem',
  mevcutDeger: number,
  gecmisDegerler: number[],
  birim: string
): Promise<Anomali> {
  const ort = gecmisDegerler.reduce((a, b) => a + b, 0) / (gecmisDegerler.length || 1)
  const yuzde = ort > 0 ? (Math.abs(mevcutDeger - ort) / ort) * 100 : 0

  const system = `Sen veri analisti asistanısın. SADECE JSON:
{"tespit":true,"tip":"Ani Artış","aciklama":"Kısa açıklama","siddet":"yuksek"}`

  const raw = await aiIstek(config, system,
    `${tip}: mevcut=${mevcutDeger}${birim}, ortalama=${ort.toFixed(2)}${birim}, fark=%${yuzde.toFixed(1)}. Anormal mi?`)

  return jsonParse<Anomali>(raw, {
    tespit: yuzde > 15, tip: 'Sapma',
    aciklama: `%${yuzde.toFixed(1)} sapma tespit edildi`, siddet: 'orta',
  })
}

export async function kisiselOneri(
  config: AIConfig,
  bakinanlar: string[],
  mevcutOlaylar: Olay[]
): Promise<string[]> {
  if (bakinanlar.length === 0) return []
  const katSayim: Record<string, number> = {}
  bakinanlar.forEach(k => { katSayim[k] = (katSayim[k] || 0) + 1 })
  const ilgi = Object.entries(katSayim).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k)
  return mevcutOlaylar
    .map(o => ({
      id: o.id,
      skor: (ilgi.includes(o.kategori) ? 10 : 0) +
            (o.siddet === 'kritik' ? 5 : o.siddet === 'yuksek' ? 3 : 0)
    }))
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 10)
    .map(s => s.id)
}
