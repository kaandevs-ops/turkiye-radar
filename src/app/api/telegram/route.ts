// app/api/telegram/route.ts
// Telegram public kanallarından mesaj çeker — bot token gerektirmez
// t.me/s/{kanal} üzerinden HTML parse yapar

import { NextResponse } from 'next/server'
import type { Olay } from '@/types/olay'

// ─── Takip edilecek public kanallar ───────────────────────────────────────────
const KANALLAR = [
  // Trafik & Kaza
  { username: 'istanbul_trafik',     etiket: 'Trafik-İST' },
  { username: 'istanbultrafik',      etiket: 'Trafik-İST' },
  { username: 'ankaratrafik',        etiket: 'Trafik-ANK' },
  { username: 'turkiyetrafik',       etiket: 'Trafik-TR'  },
  { username: 'kazahaber',           etiket: 'Kaza'       },
  // Deprem & Afet
  { username: 'kandillirbd',         etiket: 'Deprem'     },
  { username: 'depremson',           etiket: 'Deprem'     },
  { username: 'afadtr',              etiket: 'AFAD'       },
  { username: 'depremizle',          etiket: 'Deprem'     },
  // Orman Yangını
  { username: 'ormanyangin',         etiket: 'Yangın'     },
  { username: 'yanginhabertr',       etiket: 'Yangın'     },
  { username: 'ogmhaber',            etiket: 'Yangın'     },
  // Genel haber & son dakika
  { username: 'sondakikatr',         etiket: 'SonDakika'  },
  { username: 'haberlertr',          etiket: 'Haber'      },
  { username: 'trthaber',            etiket: 'Haber'      },
  { username: 'anadoluajansi',       etiket: 'Haber'      },
  { username: 'ntvsondakika',        etiket: 'Haber'      },
]

// ─── Şehir koordinat tablosu ──────────────────────────────────────────────────
const SEHIRLER: Record<string, [number, number]> = {
  istanbul: [28.9784, 41.0082], ankara: [32.8597, 39.9334], izmir: [27.1428, 38.4237],
  bursa: [29.0610, 40.1885], antalya: [30.7133, 36.8969], adana: [35.3213, 37.0000],
  konya: [32.4872, 37.8746], gaziantep: [37.3825, 37.0662], mersin: [34.6415, 36.8000],
  kayseri: [35.4826, 38.7205], eskisehir: [30.5206, 39.7767], samsun: [36.3313, 41.2867],
  trabzon: [39.7178, 41.0015], van: [43.3800, 38.4891], erzurum: [41.2797, 39.9043],
  malatya: [38.3552, 38.3552], diyarbakir: [40.2310, 37.9144], hatay: [36.2021, 36.4018],
  denizli: [29.0875, 37.7765], manisa: [27.4289, 38.6191], sakarya: [30.4034, 40.6940],
  kocaeli: [29.9187, 40.8533], zonguldak: [31.7960, 41.4564], bolu: [31.6061, 40.7359],
  afyon: [30.5387, 38.7637], sivas: [37.0179, 39.7477], tokat: [36.5644, 40.3167],
  ordu: [37.8794, 40.9862], rize: [40.5234, 41.0201], sinop: [35.1511, 42.0231],
  edirne: [26.5557, 41.6818], tekirdag: [27.5066, 40.9781], canakkale: [26.4142, 40.1553],
  mugla: [28.3636, 37.2153], mardin: [40.7373, 37.3212], sanliurfa: [38.7955, 37.1674],
  kahramanmaras: [36.9371, 37.5858], elazig: [39.2264, 38.6810], batman: [41.1333, 37.8833],
  // İlçeler
  besiktas: [28.9960, 41.0430], kadikoy: [29.0302, 40.9927], uskudar: [29.0155, 41.0234],
  sisli: [28.9870, 41.0600], fatih: [28.9497, 41.0186], beyoglu: [28.9744, 41.0338],
  bakirkoy: [28.8721, 40.9819], maltepe: [29.1333, 40.9333], pendik: [29.2333, 40.8833],
  umraniye: [29.1167, 41.0167], kartal: [29.1833, 40.9000], tuzla: [29.3000, 40.8167],
  bornova: [27.2167, 38.4667], karsiyaka: [27.1167, 38.4500], konak: [27.1333, 38.4167],
  osmangazi: [29.0167, 40.1833], nilufer: [28.9500, 40.2167],
  kepez: [30.7167, 37.0167], konyaalti: [30.6167, 36.8833], muratpasa: [30.7167, 36.8833],
  yenimahalle: [32.7833, 39.9667], cankaya: [32.8500, 39.9000], kecioren: [32.8500, 40.0000],
  iskenderun: [36.1667, 36.5833], antakya: [36.2000, 36.2000],
  tarsus: [34.8833, 36.9167], ceyhan: [35.8167, 37.0333],
  alanya: [32.0167, 36.5500], bodrum: [27.4333, 37.0333], fethiye: [29.1167, 36.6500],
  marmaris: [28.2667, 36.8500], akhisar: [27.8333, 38.9167], nazilli: [28.3167, 37.9167],
}

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
}

function sehirBul(metin: string): [number, number] | null {
  const n = normalize(metin)
  const sirali = Object.entries(SEHIRLER).sort((a, b) => b[0].length - a[0].length)
  for (const [sehir, koord] of sirali) {
    const re = new RegExp('(^|[^a-z])' + sehir + '([^a-z]|$)')
    if (re.test(n)) return koord
  }
  return null
}

function kategoriTespit(metin: string): string {
  const m = normalize(metin)
  if (m.match(/deprem|sarsinti|artci|buyuklugunde/)) return 'DEPREM'
  if (m.match(/orman yangin/)) return 'ORMAN_YANGINI'
  if (m.match(/yangin|alevler|alev/)) return 'YANGIN'
  if (m.match(/sel|taskin|su baskin/)) return 'SEL'
  if (m.match(/heyelan|toprak kayma|cig/)) return 'HEYELAN'
  if (m.match(/kar firtina|tipi|kar kapatmis/)) return 'KAR_FIRTINASI'
  if (m.match(/hortum|kasirga/)) return 'HORTUM'
  if (m.match(/trafik kaza|zincirleme|devrildi|carpisti|otobüs kaza|tir devrildi/)) return 'TRAFIK_KAZA'
  if (m.match(/yol kapandi|yol kapali|karayolu kapali/)) return 'YOL_KAPALI'
  if (m.match(/teror|bomba|patlama|silahli saldiri/)) return 'TEROR'
  if (m.match(/operasyon|baskın|ele gecir/)) return 'OPERASYON'
  if (m.match(/afad|tahliye|arama kurtarma/)) return 'AFAD_UYARI'
  if (m.match(/gozalti|tutuklama/)) return 'TUTUKLAMA'
  if (m.match(/elektrik kesinti/)) return 'ELEKTRIK_KESINTI'
  if (m.match(/su kesinti/)) return 'SU_KESINTI'
  if (m.match(/bina coktu|bina yikildi/)) return 'BINA_COKME'
  if (m.match(/dolar|euro|kur |doviz/)) return 'DOVIZ'
  if (m.match(/borsa|bist|hisse/)) return 'BORSA'
  return 'DIGER'
}

function siddetTespit(metin: string, kategori: string): 'kritik' | 'yuksek' | 'orta' | 'dusuk' {
  const m = normalize(metin)
  if (m.match(/son dakika|acil|kritik|olu|hayatini kaybetti|patlama|buyuk deprem|siddetli|katliam/)) return 'kritik'
  if (['DEPREM', 'TEROR', 'YANGIN', 'ORMAN_YANGINI', 'SEL', 'BINA_COKME', 'HEYELAN'].includes(kategori)) return 'yuksek'
  if (['TRAFIK_KAZA', 'OPERASYON', 'AFAD_UYARI', 'TUTUKLAMA'].includes(kategori)) return 'orta'
  return 'dusuk'
}

// HTML entity decode
function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
}

// t.me/s/{kanal} → Olay[]
async function telegramKanalOku(username: string, etiket: string): Promise<Olay[]> {
  const url = `https://t.me/s/${username}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TurkiyeRadar/1.0)',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Her mesaj bloğunu yakala
    const mesajBloklar = html.match(/<div class="tgme_widget_message_wrap[^"]*"[\s\S]*?(?=<div class="tgme_widget_message_wrap|<\/section)/g) || []

    const olaylar: Olay[] = []
    const simdi = Date.now()
    const limit24 = 24 * 3600 * 1000

    for (const blok of mesajBloklar.slice(0, 20)) {
      // Mesaj metni
      const metinMatch = blok.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/)
      if (!metinMatch) continue
      const ham = metinMatch[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim()
      const metin = decodeHtml(ham)
      if (metin.length < 15) continue

      // Mesaj tarihi
      const tarihMatch = blok.match(/datetime="([^"]+)"/)
      const tarih = tarihMatch ? new Date(tarihMatch[1]) : new Date()
      if (isNaN(tarih.getTime())) continue
      if (simdi - tarih.getTime() > limit24) continue

      // Mesaj linki
      const linkMatch = blok.match(/href="(https:\/\/t\.me\/[^"]+)"/)
      const link = linkMatch ? linkMatch[1] : `https://t.me/${username}`

      // Resim
      const resimMatch = blok.match(/background-image:url\('([^']+)'\)/) ||
                         blok.match(/<img[^>]+src="([^"]+)"/)
      const resim = resimMatch ? resimMatch[1] : undefined

      const baslik = metin.split('\n')[0].slice(0, 120)
      const aciklama = metin.slice(0, 300)
      const kategori = kategoriTespit(metin)
      const siddet = siddetTespit(metin, kategori)
      const koord = sehirBul(metin)

      olaylar.push({
        id: `tg-${username}-${tarih.getTime()}`,
        baslik,
        aciklama,
        kategori: kategori as any,
        koordinat: koord ?? [35.0, 39.0],
        tarih: tarih.toISOString(),
        siddet,
        kaynak: `Telegram @${username}`,
        url: link,
        resim,
        etiketler: [etiket, 'telegram', koord ? 'koordinat-kesin' : 'koordinat-yok'],
      } as Olay)
    }

    return olaylar
  } catch (err) {
    console.error(`Telegram @${username} okunamadı:`, err)
    return []
  }
}

export async function GET() {
  // Tüm kanalları paralel çek
  const sonuclar = await Promise.allSettled(
    KANALLAR.map(k => telegramKanalOku(k.username, k.etiket))
  )

  const tumOlaylar: Olay[] = sonuclar
    .filter((r): r is PromiseFulfilledResult<Olay[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  // Aynı kaynaktan duplicate mesajları temizle (aynı tarih+kaynak)
  const goruldu = new Set<string>()
  const tekil = tumOlaylar.filter(o => {
    const key = o.id
    if (goruldu.has(key)) return false
    goruldu.add(key)
    return true
  })

  // Tarihe göre sırala
  tekil.sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())

  return NextResponse.json({
    olaylar: tekil,
    toplam: tekil.length,
    kanallar: KANALLAR.length,
    basarili: sonuclar.filter(r => r.status === 'fulfilled' && (r.value as Olay[]).length > 0).length,
  })
}
