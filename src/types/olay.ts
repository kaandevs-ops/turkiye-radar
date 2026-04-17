export type Kategori =
  // Doğal Afetler
  | 'DEPREM'
  | 'DEPREM_ARTCI'
  | 'YANGIN'
  | 'ORMAN_YANGINI'
  | 'SEL'
  | 'TAŞKIN'
  | 'KAR_FIRTINASI'
  | 'HORTUM'
  | 'HEYELAN'
  | 'TSUNAMI'
  | 'DOLU'
  | 'SICAK_HAVA'
  | 'DON'
  | 'SIS'
  | 'DEPREM_RISK'
  // Güvenlik & Askeriye
  | 'GUVENLIK'
  | 'ASKER'
  | 'SINIR'
  | 'TEROR'
  | 'OPERASYON'
  | 'PROTESTO'
  | 'GÖSTERI'
  | 'TUTUKLAMA'
  | 'KURTARMA'
  | 'KACAKCILIK'
  | 'UYUSTURUCU'
  // Trafik & Ulaşım
  | 'TRAFIK_KAZA'
  | 'YOL_KAPALI'
  | 'HAVA_ULASIM'
  | 'DENIZ_ULASIM'
  | 'TREN_KAZA'
  | 'METRO'
  | 'KOPRU'
  // Altyapı & Enerji
  | 'ELEKTRIK_KESINTI'
  | 'DOGALGAZ_KESINTI'
  | 'SU_KESINTI'
  | 'INTERNET_KESINTI'
  | 'BINA_COKME'
  | 'INSAAT_KAZA'
  | 'MADEN_KAZA'
  | 'ALTYAPI'
  // Ekonomi & Finans
  | 'DOVIZ'
  | 'FAIZ'
  | 'BORSA'
  | 'ENFLASYON'
  | 'GREV'
  | 'IFLAS'
  | 'IHRACAT'
  | 'DOGALGAZ_FIYAT'
  // Sağlık
  | 'SALGIN'
  | 'HASTANE'
  | 'ZEHIRLENME'
  | 'GIDA_ZEHIRLENMESI'
  | 'SAGLIK_BAKANLIGI'
  // Çevre
  | 'HAVA_KIRLILIGI'
  | 'DENIZ_KIRLILIGI'
  | 'ORMAN_TAHRIBAT'
  | 'HAYVAN_SALGINI'
  | 'NUKLEER'
  // Siyaset & Hukuk
  | 'SIYASET'
  | 'MECLIS'
  | 'SECIM'
  | 'MAHKEME'
  | 'YOLSUZLUK'
  | 'AFAD_UYARI'
  // Sosyal
  | 'EGITIM'
  | 'SPOR'
  | 'KULTUR'
  | 'DIN'
  | 'GOCMEN'
  // Teknoloji
  | 'SIBER_SALDIRI'
  | 'TEKNOLOJI'
  // Jeopolitik / OSINT (YENİ)
  | 'CATISMA'
  | 'SIVIL_SIDDET'
  | 'AYAKLANMA'
  | 'STRATEJIK'
  | 'FIRTINA'
  | 'VOLKAN'
  | 'KASIRGA'
  | 'KURAKLIK'
  | 'TOZ_FIRTINASI'
  | 'SICAK_DALGA'
  | 'DENIZ_OLAYI'
  | 'INSAN_KAYNAKLI'
  | 'HAVA_KALİTESİ'
  // Diğer
  | 'DIGER'

export type Siddet = 'dusuk' | 'orta' | 'yuksek' | 'kritik'

export interface Olay {
  id: string
  baslik: string
  kategori: Kategori
  aciklama: string
  koordinat: [number, number]
  tarih: string
  siddet: Siddet
  kaynak: string
  url?: string
  il?: string
  ilce?: string
  etiketler?: string[]
  guncellendi?: string
  resim?: string
}