// app/api/altyapi/route.ts
// Türkiye kritik altyapı noktaları — hiçbir API key gerektirmez
// Nükleer, rafineriler, boru hatları, madenler, barajlar, askeri üsler,
// tarım/hayvancılık bölgeleri, limanlar, denizaltı kablolar, enerji santralleri

import { NextResponse } from 'next/server'

export type AltyapiTip =
  | 'NUKLEER_TESIS'
  | 'RAFINERY'
  | 'DOGALGAZ_TERMINALI'
  | 'BORU_HATTI'
  | 'MADEN'
  | 'TARIM_BOLGESI'
  | 'HAYVANCILIK'
  | 'LIMAN'
  | 'HAVAALANI'
  | 'ASKERI_US'
  | 'ENERJI_SANTRALI'
  | 'RUZGAR_CIFTLIGI'
  | 'GUNES_CIFTLIGI'
  | 'BARAJ'
  | 'DENIZALTI_KABLO'

export interface AltyapiNokta {
  id: string
  isim: string
  tip: AltyapiTip
  koordinat: [number, number] // [lon, lat]
  il: string
  kapasite?: string
  aciklama?: string
  operatör?: string
  url?: string
  stratejikOnem: 'dusuk' | 'orta' | 'yuksek' | 'kritik'
}

const ALTYAPI_NOKTALAR: AltyapiNokta[] = [
  // ─── NÜKLEER TESİSLER ───────────────────────────────────────────────
  {
    id: 'nuk-001', isim: 'Akkuyu NGS (İnşaat)', tip: 'NUKLEER_TESIS',
    koordinat: [33.545, 36.147], il: 'Mersin',
    kapasite: '4x1200 MW (Rosatom)', aciklama: 'Türkiye\'nin ilk nükleer santrali. Rusya yapımı, 2025 devreye giriş hedefi.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'nuk-002', isim: 'Sinop NGS Projesi', tip: 'NUKLEER_TESIS',
    koordinat: [35.15, 42.02], il: 'Sinop',
    kapasite: 'Planlama aşamasında', aciklama: 'Türkiye\'nin planlanan ikinci nükleer santrali.',
    stratejikOnem: 'yuksek',
  },

  // ─── RAFİNERİLER ─────────────────────────────────────────────────────
  {
    id: 'ref-001', isim: 'Tüpraş İzmit Rafinerisi', tip: 'RAFINERY',
    koordinat: [29.96, 40.78], il: 'Kocaeli',
    kapasite: '11 milyon ton/yıl', aciklama: 'Türkiye\'nin en büyük rafinerisi. Ham petrol işleme kapasitesi.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ref-002', isim: 'Tüpraş İzmir Rafinerisi', tip: 'RAFINERY',
    koordinat: [26.98, 38.85], il: 'İzmir',
    kapasite: '10.5 milyon ton/yıl', aciklama: 'Aliağa\'da Ege\'nin en büyük petrokimya tesisi.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ref-003', isim: 'Tüpraş Kırıkkale Rafinerisi', tip: 'RAFINERY',
    koordinat: [33.51, 39.85], il: 'Kırıkkale',
    kapasite: '5.5 milyon ton/yıl', aciklama: 'İç Anadolu yakıt ihtiyacını karşılar.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'ref-004', isim: 'Tüpraş Batman Rafinerisi', tip: 'RAFINERY',
    koordinat: [41.13, 37.88], il: 'Batman',
    kapasite: '1.5 milyon ton/yıl', aciklama: 'Güneydoğu Anadolu ham petrol rafinerisi.',
    stratejikOnem: 'yuksek',
  },

  // ─── DOĞALGAZ TERMİNALLERİ ───────────────────────────────────────────
  {
    id: 'gaz-001', isim: 'Marmara Ereğlisi LNG Terminali', tip: 'DOGALGAZ_TERMINALI',
    koordinat: [27.96, 40.97], il: 'Tekirdağ',
    kapasite: '6 bcm/yıl', aciklama: 'Türkiye\'nin ilk LNG terminali. Ege ve Marmara bölgesine gaz tedariki.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'gaz-002', isim: 'Aliağa LNG Terminali (EgeGaz)', tip: 'DOGALGAZ_TERMINALI',
    koordinat: [26.96, 38.83], il: 'İzmir',
    kapasite: '4.5 bcm/yıl', aciklama: 'Batı Türkiye\'nin enerji güvenliği için kritik.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'gaz-003', isim: 'FSRU Ertuğrul Gazi (Saros)', tip: 'DOGALGAZ_TERMINALI',
    koordinat: [26.7, 40.7], il: 'Edirne/Tekirdağ',
    kapasite: '5.3 bcm/yıl', aciklama: 'Yüzen LNG terminali. 2023\'te devreye girdi.',
    stratejikOnem: 'kritik',
  },

  // ─── BORU HATLARI (Kilit Noktalar) ──────────────────────────────────
  {
    id: 'boru-001', isim: 'BTC (Bakü-Tiflis-Ceyhan) Türkiye Girişi', tip: 'BORU_HATTI',
    koordinat: [41.5, 41.0], il: 'Ardahan',
    kapasite: '1.2 mbpd', aciklama: 'Azerbaycan ham petrolünün Akdeniz\'e ulaşmasını sağlayan kritik hat. Gürcistan sınırından giriş.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'boru-002', isim: 'BTC Ceyhan Terminal', tip: 'BORU_HATTI',
    koordinat: [35.93, 36.91], il: 'Adana',
    kapasite: '1.2 mbpd ihracat', aciklama: 'BTC\'nin deniz terminali. Akdeniz\'deki en büyük petrol ihracat terminali.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'boru-003', isim: 'TANAP Türkiye Girişi', tip: 'BORU_HATTI',
    koordinat: [41.6, 40.2], il: 'Ardahan',
    kapasite: '16 bcm/yıl', aciklama: 'Trans Anadolu Doğalgaz Boru Hattı. Azerbaycan gazını Avrupa\'ya taşır.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'boru-004', isim: 'TürkAkım (Karadeniz çıkışı)', tip: 'BORU_HATTI',
    koordinat: [28.8, 41.3], il: 'İstanbul',
    kapasite: '31.5 bcm/yıl', aciklama: 'Rusya\'dan Türkiye\'ye karadeniz altı doğalgaz hattı. İstanbul yakınında kıyıya çıkar.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'boru-005', isim: 'Irak-Türkiye Ham Petrol Boru Hattı (Kerkük-Ceyhan)', tip: 'BORU_HATTI',
    koordinat: [38.5, 37.5], il: 'Gaziantep/Şanlıurfa',
    kapasite: '0.35-0.6 mbpd', aciklama: 'Irak Kürdistan petrolünü Ceyhan\'a taşır. Güvenlik hassasiyeti yüksek.',
    stratejikOnem: 'kritik',
  },

  // ─── MADENLER ───────────────────────────────────────────────────────
  {
    id: 'mad-001', isim: 'Etibank Kırka Bor Madeni', tip: 'MADEN',
    koordinat: [30.56, 39.24], il: 'Eskişehir',
    kapasite: 'Dünya rezervinin %72\'si', aciklama: 'Dünyanın en büyük bor madeni. Türkiye bor tekelinin kalbi.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'mad-002', isim: 'Bandırma Bor Tesisi', tip: 'MADEN',
    koordinat: [27.97, 40.35], il: 'Balıkesir',
    kapasite: 'Yıllık 1.2 milyon ton bor ürünü', aciklama: 'Eti Maden\'in ana işleme tesisi.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'mad-003', isim: 'Ovacık Altın Madeni', tip: 'MADEN',
    koordinat: [39.38, 39.37], il: 'Tunceli',
    kapasite: '180,000 oz/yıl', aciklama: 'Türkiye\'nin ilk siyanürsüz altın madeni.',
    stratejikOnem: 'orta',
  },
  {
    id: 'mad-004', isim: 'Kisladag Altın Madeni (Eldorado Gold)', tip: 'MADEN',
    koordinat: [28.59, 38.42], il: 'Uşak',
    kapasite: '350,000 oz/yıl', aciklama: 'Türkiye\'nin en büyük altın madeni.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'mad-005', isim: 'Güleman Krom Madeni', tip: 'MADEN',
    koordinat: [40.62, 38.65], il: 'Elazığ',
    kapasite: '600,000 ton/yıl', aciklama: 'Türkiye\'nin en önemli krom madeni.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'mad-006', isim: 'Soma Kömür Havzası', tip: 'MADEN',
    koordinat: [27.61, 39.18], il: 'Manisa',
    kapasite: '14 milyon ton/yıl', aciklama: 'Türkiye\'nin en büyük linyit havzası. 2014 maden faciası bölgesi.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'mad-007', isim: 'Zonguldak Taşkömür Havzası', tip: 'MADEN',
    koordinat: [31.79, 41.45], il: 'Zonguldak',
    kapasite: '2.5 milyon ton/yıl', aciklama: 'Türkiye\'nin tek taşkömür havzası. TTK işletmesi.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'mad-008', isim: 'Çayeli Bakır Madeni', tip: 'MADEN',
    koordinat: [40.98, 41.09], il: 'Rize',
    kapasite: '1.2 milyon ton/yıl cevher', aciklama: 'Türkiye\'nin en büyük bakır madeni.',
    stratejikOnem: 'orta',
  },

  // ─── BARAJLAR ────────────────────────────────────────────────────────
  {
    id: 'bar-001', isim: 'Atatürk Barajı', tip: 'BARAJ',
    koordinat: [38.32, 37.48], il: 'Şanlıurfa/Adıyaman',
    kapasite: '2400 MW / 48.7 milyar m³', aciklama: 'Türkiye\'nin en büyük barajı. GAP\'ın kalbi. Dicle-Fırat havzası.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'bar-002', isim: 'Keban Barajı', tip: 'BARAJ',
    koordinat: [38.74, 38.79], il: 'Elazığ',
    kapasite: '1330 MW', aciklama: 'Fırat Nehri üzerinde. Türkiye\'nin ilk büyük barajlarından.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'bar-003', isim: 'İlısu Barajı', tip: 'BARAJ',
    koordinat: [41.84, 37.63], il: 'Mardin/Batman',
    kapasite: '1200 MW', aciklama: 'Dicle Nehri üzerinde, Hasankeyf tartışması. 2019\'da su tutulmaya başlandı.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'bar-004', isim: 'Yusufeli Barajı', tip: 'BARAJ',
    koordinat: [41.61, 40.83], il: 'Artvin',
    kapasite: '540 MW', aciklama: 'Çoruh Nehri üzerinde, dağlık arazide inşa edildi.',
    stratejikOnem: 'orta',
  },

  // ─── ASKERİ ÜSLER ────────────────────────────────────────────────────
  {
    id: 'ask-001', isim: 'İncirlik Hava Üssü', tip: 'ASKERI_US',
    koordinat: [35.43, 37.00], il: 'Adana',
    kapasite: 'NATO Üssü — ABD 39. Hava Üssü', aciklama: 'NATO\'nun en kritik hava üslerinden biri. B61 nükleer bombaları barındırdığı ileri sürülüyor.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-002', isim: 'Kürecik Radar Üssü (NATO BMD)', tip: 'ASKERI_US',
    koordinat: [38.12, 38.68], il: 'Malatya',
    kapasite: 'AN/TPY-2 X-Band Radar', aciklama: 'NATO füze savunma radar sistemi. İran balistik füze tehdidine karşı erken uyarı sağlar.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-003', isim: 'Çorlu Hava Üssü (1. Ana Jet Üssü)', tip: 'ASKERI_US',
    koordinat: [27.9, 41.12], il: 'Tekirdağ',
    kapasite: 'F-16 filosu', aciklama: 'Trakya bölgesi hava savunması için kritik.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-004', isim: 'Konya Hava Üssü (3. Ana Jet Üssü)', tip: 'ASKERI_US',
    koordinat: [32.56, 37.98], il: 'Konya',
    kapasite: 'F-16 filosu + AWACS', aciklama: 'İç Anadolu\'nun kritik hava operasyonları merkezi. Aynı zamanda NATO Allies uçuş tatbikat üssü.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-005', isim: 'Diyarbakır Hava Üssü (8. Ana Jet Üssü)', tip: 'ASKERI_US',
    koordinat: [40.2, 37.88], il: 'Diyarbakır',
    kapasite: 'F-16, helikopter filosu', aciklama: 'Güneydoğu Türkiye operasyonlarının merkezi. PKK ile mücadelede kilit rol.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-006', isim: 'Gölcük Deniz Üssü', tip: 'ASKERI_US',
    koordinat: [29.83, 40.72], il: 'Kocaeli',
    kapasite: 'TCG Ana Deniz Üssü', aciklama: 'Türk Deniz Kuvvetleri\'nin ana karargahı. Denizaltılar dahil.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ask-007', isim: 'İzmir NATO Komutanlığı (LANDCOM)', tip: 'ASKERI_US',
    koordinat: [27.14, 38.46], il: 'İzmir',
    kapasite: 'NATO Kara Kuvvetleri Komutanlığı', aciklama: 'NATO\'nun tüm kara kuvvetlerini koordine eder.',
    stratejikOnem: 'kritik',
  },

  // ─── LİMANLAR ────────────────────────────────────────────────────────
  {
    id: 'lim-001', isim: 'Ambarlı Limanı', tip: 'LIMAN',
    koordinat: [28.68, 40.97], il: 'İstanbul',
    kapasite: '3 milyon TEU/yıl', aciklama: 'Türkiye\'nin en büyük konteyner limanı.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'lim-002', isim: 'Mersin Limanı', tip: 'LIMAN',
    koordinat: [34.65, 36.80], il: 'Mersin',
    kapasite: '1.9 milyon TEU/yıl', aciklama: 'Akdeniz\'deki en önemli Türk limanı. Orta Doğu ihracat kapısı.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'lim-003', isim: 'İskenderun Limanı', tip: 'LIMAN',
    koordinat: [36.18, 36.59], il: 'Hatay',
    kapasite: '3 milyon ton/yıl', aciklama: 'Ceyhan petrol terminaline yakın, stratejik Akdeniz limanı.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'lim-004', isim: 'Trabzon Limanı', tip: 'LIMAN',
    koordinat: [39.73, 41.00], il: 'Trabzon',
    kapasite: '5 milyon ton/yıl', aciklama: 'Karadeniz\'in en önemli Türk limanı. İpek Yolu güzergahı.',
    stratejikOnem: 'yuksek',
  },

  // ─── ENERJİ SANTRALLERİ ──────────────────────────────────────────────
  {
    id: 'ens-001', isim: 'Afşin-Elbistan A/B Termik Santrali', tip: 'ENERJI_SANTRALI',
    koordinat: [36.88, 38.35], il: 'Kahramanmaraş',
    kapasite: '2990 MW', aciklama: 'Türkiye\'nin en büyük termik santrali. Linyit yakıtlı.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'ens-002', isim: 'Yatağan Termik Santrali', tip: 'ENERJI_SANTRALI',
    koordinat: [28.14, 37.34], il: 'Muğla',
    kapasite: '630 MW', aciklama: 'Ege bölgesi enerji tedarikçisi.',
    stratejikOnem: 'orta',
  },

  // ─── RÜZGAR ÇİFTLİKLERİ ─────────────────────────────────────────────
  {
    id: 'ruz-001', isim: 'Soma Rüzgar Enerji Santrali', tip: 'RUZGAR_CIFTLIGI',
    koordinat: [27.4, 39.3], il: 'Manisa',
    kapasite: '135 MW', aciklama: 'Ege bölgesinin büyük rüzgar çiftliği.',
    stratejikOnem: 'dusuk',
  },
  {
    id: 'ruz-002', isim: 'Belen Rüzgar Enerji Santrali', tip: 'RUZGAR_CIFTLIGI',
    koordinat: [36.5, 36.6], il: 'Hatay',
    kapasite: '120 MW', aciklama: 'Akdeniz bölgesi rüzgar enerjisi tesisi.',
    stratejikOnem: 'dusuk',
  },

  // ─── GÜNEŞ ÇİFTLİKLERİ ──────────────────────────────────────────────
  {
    id: 'gun-001', isim: 'Karapınar GES (Kalyon)', tip: 'GUNES_CIFTLIGI',
    koordinat: [33.55, 37.72], il: 'Konya',
    kapasite: '1000 MW (tamamlandığında)', aciklama: 'Avrupa\'nın en büyük güneş enerji santrallerinden biri.',
    stratejikOnem: 'yuksek',
  },

  // ─── DENİZALTI KABLOLAR ──────────────────────────────────────────────
  {
    id: 'kab-001', isim: 'SEA-ME-WE 3 (İstanbul çıkışı)', tip: 'DENIZALTI_KABLO',
    koordinat: [29.0, 41.1], il: 'İstanbul',
    kapasite: '40 Gbps', aciklama: 'Avrupa-Asya internet bağlantısının kritik bileşeni. İstanbul boğazından geçiyor.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'kab-002', isim: 'FLAG (Fiber-optic Link Around the Globe) Marmaris', tip: 'DENIZALTI_KABLO',
    koordinat: [28.27, 36.85], il: 'Muğla',
    kapasite: '10 Gbps', aciklama: 'Dünya çevresini dolanan fiber optik kablo sistemi. Türkiye çıkışı Marmaris.',
    stratejikOnem: 'yuksek',
  },

  // ─── TARIM / HAYVANCILIK ─────────────────────────────────────────────
  {
    id: 'tar-001', isim: 'Konya Ovası — Buğday Üretim Merkezi', tip: 'TARIM_BOLGESI',
    koordinat: [32.48, 37.87], il: 'Konya',
    kapasite: '4 milyon ton/yıl buğday', aciklama: 'Türkiye\'nin tahıl ambarı. Gıda güvenliği açısından kritik.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'tar-002', isim: 'Çukurova Ovası — Pamuk ve Sebze', tip: 'TARIM_BOLGESI',
    koordinat: [35.32, 37.0], il: 'Adana/Mersin',
    kapasite: '400,000 ton/yıl pamuk', aciklama: 'Türkiye\'nin tekstil sanayisinin hammadde kaynağı.',
    stratejikOnem: 'yuksek',
  },
  {
    id: 'tar-003', isim: 'Ege Havzası — Zeytin ve Bağ', tip: 'TARIM_BOLGESI',
    koordinat: [27.8, 38.5], il: 'İzmir/Aydın/Manisa',
    kapasite: '650,000 ton/yıl zeytinyağı', aciklama: 'Türkiye\'nin ihracat tarımının merkezi.',
    stratejikOnem: 'orta',
  },
  {
    id: 'hay-001', isim: 'Doğu Anadolu Hayvancılık Havzası', tip: 'HAYVANCILIK',
    koordinat: [41.1, 39.9], il: 'Erzurum/Kars',
    kapasite: '3 milyon büyükbaş', aciklama: 'Türkiye\'nin büyükbaş hayvancılık merkezi. Kırmızı et üretiminin %40\'ı.',
    stratejikOnem: 'orta',
  },

  // ─── HAVAALANLARI (Kritik) ────────────────────────────────────────────
  {
    id: 'hav-001', isim: 'İstanbul Havalimanı', tip: 'HAVAALANI',
    koordinat: [28.74, 41.26], il: 'İstanbul',
    kapasite: '90 milyon yolcu/yıl', aciklama: 'Dünyanın en büyük havalimanlarından biri.',
    stratejikOnem: 'kritik',
  },
  {
    id: 'hav-002', isim: 'Ankara Esenboğa Havalimanı', tip: 'HAVAALANI',
    koordinat: [32.99, 40.12], il: 'Ankara',
    kapasite: '25 milyon yolcu/yıl', aciklama: 'Başkent havalimanı, protokol uçuşları merkezi.',
    stratejikOnem: 'yuksek',
  },
]

export async function GET() {
  return NextResponse.json({
    noktalar: ALTYAPI_NOKTALAR,
    toplam: ALTYAPI_NOKTALAR.length,
    guncelleme: new Date().toISOString(),
  })
}