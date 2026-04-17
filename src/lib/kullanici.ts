// src/lib/kullanici.ts
import type { Olay } from '@/types/olay'

const PROFIL_KEY = 'tr-radar-profil'

export interface KullaniciProfil {
  kategoriSayac: Record<string, number>   // kaç kez o kategoriye tıklandı
  sonTiklamalar: { id: string; kategori: string; zaman: number }[]  // son 100 tıklama
  toplamTiklama: number
}

export function profilAl(): KullaniciProfil {
  try {
    const json = localStorage.getItem(PROFIL_KEY)
    if (json) return JSON.parse(json)
  } catch {}
  return { kategoriSayac: {}, sonTiklamalar: [], toplamTiklama: 0 }
}

export function olayaTiklandi(olay: Olay): void {
  try {
    const profil = profilAl()
    // Kategori sayacını artır
    profil.kategoriSayac[olay.kategori] = (profil.kategoriSayac[olay.kategori] || 0) + 1
    profil.toplamTiklama += 1
    // Son tıklamalara ekle (max 100)
    profil.sonTiklamalar.unshift({ id: olay.id, kategori: olay.kategori, zaman: Date.now() })
    if (profil.sonTiklamalar.length > 100) profil.sonTiklamalar.pop()
    localStorage.setItem(PROFIL_KEY, JSON.stringify(profil))
  } catch {}
}

export function ilgiKategorileri(profil: KullaniciProfil, topN = 5): string[] {
  return Object.entries(profil.kategoriSayac)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k)
}

export function kisiselSirala(olaylar: Olay[], profil: KullaniciProfil): Olay[] {
  if (profil.toplamTiklama < 3) return olaylar // yeterli veri yoksa normal sırala

  const ilgi = ilgiKategorileri(profil, 5)
  const maks = Math.max(...Object.values(profil.kategoriSayac), 1)

  return [...olaylar].sort((a, b) => {
    const skorA = kisiyiSkorla(a, ilgi, profil.kategoriSayac, maks)
    const skorB = kisiyiSkorla(b, ilgi, profil.kategoriSayac, maks)
    if (skorA !== skorB) return skorB - skorA
    // Aynı skorda tarihe göre sırala
    return new Date(b.tarih).getTime() - new Date(a.tarih).getTime()
  })
}

function kisiyiSkorla(
  olay: Olay,
  ilgiKat: string[],
  sayac: Record<string, number>,
  maks: number
): number {
  let skor = 0
  // İlgi kategorisi bonusu (0-30 puan)
  const katSkor = (sayac[olay.kategori] || 0) / maks
  skor += katSkor * 30
  // Şiddet bonusu
  if (olay.siddet === 'kritik') skor += 15
  else if (olay.siddet === 'yuksek') skor += 8
  else if (olay.siddet === 'orta') skor += 3
  // Taze haber bonusu (son 2 saat içindeyse +5)
  const yasMs = Date.now() - new Date(olay.tarih).getTime()
  if (yasMs < 2 * 3600000) skor += 5
  return skor
}

export function profilSifirla(): void {
  try { localStorage.removeItem(PROFIL_KEY) } catch {}
}
