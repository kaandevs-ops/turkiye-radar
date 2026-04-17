@AGENTS.md
# Türkiye Radar — Proje Bağlamı

## Stack
Next.js 16.2.3, React 19, TypeScript 5, Leaflet + markercluster, Tailwind CSS 4

## Veri Kaynakları
- Deprem: USGS + Kandilli (windows-1254 encoding, duplicate dedup)
- Haberler: 8 RSS (NTV, CNN Türk, Hurriyet, Sabah, TRT, AA, Haberturk, Daily Sabah)
- /api/havakalitesi, /api/doviz (TCMB XML), /api/hava
- PWA: public/sw.js + manifest.json var ama tam aktif değil

## Teknik Borç
- (aqiRes as any) — havakalitesi tipi yazılmamış
- gecmisiKaydet/gecmisiYukle useCallback dışında, her render yeniden oluşuyor
- Inline style çok fazla, Tailwind neredeyse kullanılmıyor
- (window as any).L — Leaflet global yazılıyor
- TypeScript strict mode kapalı

## Hafta 1 Planı
- [ ] TypeScript temizliği, as any kaldır
- [ ] useLocalStorage custom hook
- [ ] Browser Notification API (Bildirim.tsx)
- [ ] Deprem detay: büyüklük göstergesi + artçı gruplama

## Hafta 2 Planı
- [ ] Dashboard: pasta grafik, bar chart
- [ ] PWA tam aktif
- [ ] README: GIF + mimari diyagram
- [ ] TypeScript strict mode, Lighthouse 90+

## Oturum 1 — 14 Nisan 2026
Tüm kodlar incelendi, plan oluşturuldu.
Sonraki adım: Dashboard.tsx, Bildirim.tsx, Sidebar.tsx görmek, Hafta 1 başlamak.
