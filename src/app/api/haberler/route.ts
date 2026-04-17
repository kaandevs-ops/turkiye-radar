import { NextResponse } from 'next/server'
import { KAYNAKLAR } from '@/lib/kaynaklar'
import type { Olay } from '@/types/olay'

const SEHIRLER: Record<string, [number, number]> = {
  istanbul: [28.9784, 41.0082], ankara: [32.8597, 39.9334], izmir: [27.1428, 38.4237],
  bursa: [29.0610, 40.1885], antalya: [30.7133, 36.8969], adana: [35.3213, 37.0000],
  konya: [32.4872, 37.8746], gaziantep: [37.3825, 37.0662], mersin: [34.6415, 36.8000],
  kayseri: [35.4826, 38.7205], eskisehir: [30.5206, 39.7767], diyarbakir: [40.2310, 37.9144],
  samsun: [36.3313, 41.2867], denizli: [29.0875, 37.7765], trabzon: [39.7178, 41.0015],
  van: [43.3800, 38.4891], malatya: [38.3552, 38.3552], erzurum: [41.2797, 39.9043],
  kahramanmaras: [36.9371, 37.5858], hatay: [36.2021, 36.4018], elazig: [39.2264, 38.6810],
  kovancilar: [39.8500, 38.7167],
  manisa: [27.4289, 38.6191], balikesir: [27.8830, 39.6484], tekirdag: [27.5066, 40.9781],
  mugla: [28.3636, 37.2153], mardin: [40.7373, 37.3212], urfa: [38.7955, 37.1674],
  canakkale: [26.4142, 40.1553], edirne: [26.5557, 41.6818], rize: [40.5234, 41.0201],
  sinop: [35.1511, 42.0231], kastamonu: [33.7830, 41.3887], giresun: [38.3893, 40.9128],
  sakarya: [30.4034, 40.6940], kocaeli: [29.9187, 40.8533], izmit: [29.9187, 40.8533],
  zonguldak: [31.7960, 41.4564], bolu: [31.6061, 40.7359], afyon: [30.5387, 38.7637],
  usak: [29.4082, 38.6823], kutahya: [29.9833, 39.4167], nigde: [34.6794, 37.9667],
  sivas: [37.0179, 39.7477], tokat: [36.5644, 40.3167], amasya: [35.8333, 40.6500],
  ordu: [37.8794, 40.9862], artvin: [41.8183, 41.1833], agri: [43.0503, 39.7167],
  mus: [41.5000, 38.7333], bitlis: [42.1000, 38.4000], siirt: [41.9500, 37.9333],
  batman: [41.1333, 37.8833], sirnak: [42.4618, 37.5186], hakkari: [43.7408, 37.5744],
  bingol: [40.5000, 38.8833], tunceli: [39.5472, 39.1078], adiyaman: [38.2786, 37.7648],
  sanliurfa: [38.7955, 37.1674], kilis: [37.1167, 36.7167], osmaniye: [36.2461, 37.0742],
  karabuk: [32.6233, 41.2061], bartin: [32.3375, 41.6347], duzce: [31.1583, 40.8439],
  yalova: [29.2778, 40.6500], kirklareli: [27.2253, 41.7333], igdir: [44.0450, 39.9167],
  // İlçeler ve alternatif yazımlar
  besiktas: [28.9960, 41.0430], kadikoy: [29.0302, 40.9927], uskudar: [29.0155, 41.0234],
  sisli: [28.9870, 41.0600], fatih: [28.9497, 41.0186], beyoglu: [28.9744, 41.0338],
  bakirkoy: [28.8721, 40.9819], maltepe: [29.1333, 40.9333], pendik: [29.2333, 40.8833],
  umraniye: [29.1167, 41.0167], kartal: [29.1833, 40.9000], sultanbeyli: [29.2667, 40.9667],
  gaziosmanpasa: [28.9083, 41.0667], eyup: [28.9333, 41.0833], sariyer: [29.0500, 41.1667],
  tuzla: [29.3000, 40.8167], cekmekoy: [29.2000, 41.0500], kagithane: [28.9667, 41.0833],
  bornova: [27.2167, 38.4667], karsiyaka: [27.1167, 38.4500], konak: [27.1333, 38.4167],
  buca: [27.1833, 38.3833], gaziemir: [27.1500, 38.3167], cigli: [27.0333, 38.5000],
  osmangazi: [29.0167, 40.1833], nilufer: [28.9500, 40.2167], yildirim: [29.1000, 40.1833],
  kepez: [30.7167, 37.0167], konyaalti: [30.6167, 36.8833], muratpasa: [30.7167, 36.8833],
  karatay: [32.5167, 37.8667], meram: [32.4333, 37.8333], selcuklu: [32.5000, 37.9000],
  sehitkamil: [37.3667, 37.0667], sahinbey: [37.4000, 37.0833],
  yenimahalle: [32.7833, 39.9667], cankaya: [32.8500, 39.9000], kecioren: [32.8500, 40.0000],
  mamak: [32.9167, 39.9333], etimesgut: [32.6833, 39.9500], sincan: [32.5833, 39.9667],
  iskenderun: [36.1667, 36.5833], antakya: [36.2000, 36.2000], dortyol: [36.2333, 36.8333],
  eregli: [34.0500, 37.5167], bor: [34.5500, 37.9000],
  orhaneli: [28.9833, 39.9000], inegol: [29.5167, 40.0833], gemlik: [29.1500, 40.4333],
  akhisar: [27.8333, 38.9167], turgutlu: [27.7000, 38.5000], salihli: [28.1333, 38.4833],
  nazilli: [28.3167, 37.9167], aydin: [27.8333, 37.8500], bodrum: [27.4333, 37.0333],
  fethiye: [29.1167, 36.6500], marmaris: [28.2667, 36.8500], milas: [27.7833, 37.3167],
  alanya: [32.0167, 36.5500], manavgat: [31.4333, 36.7833], serik: [31.1000, 36.9167],
  erdemli: [34.3000, 36.6167], tarsus: [34.8833, 36.9167], ceyhan: [35.8167, 37.0333],
  turhal: [36.0833, 40.3833], zile: [35.9000, 40.3000], erbaa: [36.5667, 40.6667],
  niksar: [36.9500, 40.5833],
  golbasi: [32.8000, 39.7833], haymana: [32.5000, 39.4333], beypazari: [31.9167, 40.1667],
  polatli: [32.1500, 39.5833], cubuk: [33.0500, 40.2333], kazan: [32.6833, 40.1167],
  afyonkarahisar: [30.5387, 38.7637], bolvadin: [31.0500, 38.7167], sandikli: [30.2667, 38.4667],
  alasehir: [28.5167, 38.3500], gediz: [29.4000, 39.0333],
  // Türkiye bölgeleri
  marmara: [28.9784, 41.0082], ege: [27.1428, 38.4237], akdeniz: [30.7133, 36.8969],
  karadeniz: [36.3313, 41.2867], anadolu: [32.8597, 39.9334], trakya: [26.5557, 41.6818],
  bogazici: [29.0500, 41.0500],
}

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u")
}

function sehirBul(metin: string): [number, number] | null {
  const n = normalize(metin)
  // Önce uzun isimler (kahramanmaras, sanliurfa vb) - kısa isimlere öncelik verme
  const sirali = Object.entries(SEHIRLER).sort((a, b) => b[0].length - a[0].length)
  for (const [sehir, koord] of sirali) {
    // Kelime sınırı kontrolü - "van" "ankara" içinde bulunmasın
    const re = new RegExp("(^|[^a-z])" + sehir + "([^a-z]|$)")
    if (re.test(n)) return koord
  }
  return null
}

function kategoriTespit(baslik: string, icerik: string): string {
  const m = (baslik + " " + icerik).toLowerCase()
  if (m.match(/deprem|sarsinti|artci/)) return "DEPREM"
  if (m.match(/orman yangin/)) return "ORMAN_YANGINI"
  if (m.match(/yangin|alevler/)) return "YANGIN"
  if (m.match(/sel|taskın|su baskin/)) return "SEL"
  if (m.match(/heyelan|toprak kayma|cig/)) return "HEYELAN"
  if (m.match(/kar firtina|tipi/)) return "KAR_FIRTINASI"
  if (m.match(/hortum|kasirga/)) return "HORTUM"
  if (m.match(/teror|bomb|patlama|intihar sald/)) return "TEROR"
  if (m.match(/operasyon|jandarma ele gecir|polis baskin/)) return "OPERASYON"
  if (m.match(/gozalti|tutuklama/)) return "TUTUKLAMA"
  if (m.match(/trafik kaza|zincirleme|arac devrildi|otobus kaza|tir devrildi/)) return "TRAFIK_KAZA"
  if (m.match(/yol kapandi|yol kapali/)) return "YOL_KAPALI"
  if (m.match(/ucak|havaliman|hava yolu/)) return "HAVA_ULASIM"
  if (m.match(/tren kaza|demiryolu|vagon/)) return "TREN_KAZA"
  if (m.match(/grev|is birak/)) return "GREV"
  if (m.match(/protesto|gosteri|miting|yuruyus/)) return "PROTESTO"
  if (m.match(/dolar|euro|kur |doviz|sterlin/)) return "DOVIZ"
  if (m.match(/enflasyon|tufe|fiyat art/)) return "ENFLASYON"
  if (m.match(/borsa|bist|hisse/)) return "BORSA"
  if (m.match(/faiz|merkez bankasi/)) return "FAIZ"
  if (m.match(/iflas|konkordato/)) return "IFLAS"
  if (m.match(/salgin|covid|corona/)) return "SALGIN"
  if (m.match(/zehirlenme|gida zehir/)) return "GIDA_ZEHIRLENMESI"
  if (m.match(/bina coktu|bina yikildi|cokus/)) return "BINA_COKME"
  if (m.match(/maden kaza|gocuk/)) return "MADEN_KAZA"
  if (m.match(/elektrik kesinti/)) return "ELEKTRIK_KESINTI"
  if (m.match(/su kesinti/)) return "SU_KESINTI"
  if (m.match(/dogalgaz kesinti/)) return "DOGALGAZ_KESINTI"
  if (m.match(/siber saldır|internet kesinti/)) return "SIBER_SALDIRI"
  if (m.match(/secim|sandik/)) return "SECIM"
  if (m.match(/mahkeme|dava |yargilama|beraat/)) return "MAHKEME"
  if (m.match(/yolsuzluk|rusvet|zimmet/)) return "YOLSUZLUK"
  if (m.match(/cumhurbask|basbakan|bakan |meclis|tbmm/)) return "SIYASET"
  if (m.match(/afad|tahliye|arama kurtarma/)) return "AFAD_UYARI"
  if (m.match(/gocmen|kacak|multeci/)) return "GOCMEN"
  if (m.match(/kacakcılık|uyusturucu|eroin|kokain/)) return "UYUSTURUCU"
  return "DIGER"
}

function siddetTespit(baslik: string, kategori: string): "kritik" | "yuksek" | "orta" | "dusuk" {
  const k = baslik.toLowerCase()
  if (k.match(/son dakika|acil|kritik|olu|hayatini kaybetti|patlama|katliam|buyuk deprem|siddetli/)) return "kritik"
  if (["DEPREM","TEROR","YANGIN","ORMAN_YANGINI","SEL","BINA_COKME","HEYELAN","MADEN_KAZA"].includes(kategori)) return "yuksek"
  if (["TRAFIK_KAZA","PROTESTO","MAHKEME","SALGIN","GIDA_ZEHIRLENMESI","GREV"].includes(kategori)) return "orta"
  return "dusuk"
}

function resimBul(item: string): string | undefined {
  return item.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1]
    || item.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/)?.[1]
    || item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
    || item.match(/<img[^>]+src="([^"]+)"/)?.[1]
}

function stableId(kaynak: string, baslik: string, tarih: string): string {
  const t = new Date(tarih).toISOString().slice(0, 16).replace(/[-:T]/g, "")
  const b = baslik.slice(0, 30).replace(/[^a-zA-Z0-9À-ž]/g, "").slice(0, 20)
  return `haber-${kaynak.replace(/\s/g,"-")}-${t}-${b}`
}

async function rssOku(url: string, kaynak: string): Promise<Olay[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TurkiyeRadar/1.0)" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
    const olaylar: Olay[] = []
    const simdi = Date.now()
    const limit72 = 72 * 3600 * 1000

    for (let i = 0; i < Math.min(items.length, 25); i++) {
      const item = items[i]
      const baslik = (
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] || "Haber"
      ).trim()
      const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.trim() || ""
      const tarihStr = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ""
      const aciklama = (
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>(.*?)<\/description>/)?.[1] || ""
      ).replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim().slice(0, 300)

      // 72 saatten eski haberleri atla
      const haberTarih = tarihStr ? new Date(tarihStr) : new Date()
      if (isNaN(haberTarih.getTime())) continue
      if (simdi - haberTarih.getTime() > limit72) continue

      const kategori = kategoriTespit(baslik, aciklama)
      const siddet = siddetTespit(baslik, kategori)
      const koord = sehirBul(baslik) || sehirBul(aciklama)

      // Koordinat yoksa haritada gösterilmeyecek ama listeye girecek
      const koordinat: [number, number] = koord ?? [35.0, 39.0]
      const etiket = koord ? "koordinat-kesin" : "koordinat-yok"

      olaylar.push({
        id: stableId(kaynak, baslik, haberTarih.toISOString()),
        kategori: kategori as any,
        baslik,
        aciklama,
        koordinat,
        tarih: haberTarih.toISOString(),
        siddet,
        kaynak,
        url: link,
        resim: resimBul(item),
        etiketler: [etiket],
      } as Olay)
    }
    return olaylar
  } catch (err) {
    console.error(`${kaynak} RSS alinamadi:`, err)
    return []
  }
}

export async function GET() {
  const sonuclar = await Promise.allSettled([
    rssOku(KAYNAKLAR.NTV_RSS, "NTV"),
    rssOku(KAYNAKLAR.CNN_TURK_RSS, "CNN Turk"),
    rssOku(KAYNAKLAR.HURRIYET_RSS, "Hurriyet"),
    rssOku(KAYNAKLAR.SABAH_RSS, "Sabah"),
    rssOku("https://www.trthaber.com/sondakika.rss", "TRT Haber"),
    rssOku("https://www.aa.com.tr/tr/rss/default?cat=guncel", "AA"),
    rssOku("https://www.haberturk.com/rss/anasayfa.xml", "Haberturk"),
    rssOku("https://feeds.feedburner.com/DailySabah", "Daily Sabah"),
  ])

  const olaylar = sonuclar
    .filter((r): r is PromiseFulfilledResult<Olay[]> => r.status === "fulfilled")
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime())

  return NextResponse.json({ olaylar, toplam: olaylar.length })
}
