# 🇹🇷 Türkiye Radar

Türkiye'ye özel gerçek zamanlı tehdit ve olay izleme platformu. Doğal afetler, güvenlik olayları, ekonomik göstergeler, hava kalitesi ve ulaşım verilerini tek haritada birleştirir. Yapay zeka destekli analizler ve akıllı rota uyarıları içerir.

---

## 📸 Ekran Görüntüleri

> *(yakında eklenecek)*

---

## 🚀 Özellikler

### 🗺️ Canlı Olay Haritası
- Türkiye genelindeki tüm olaylar interaktif harita üzerinde anlık olarak gösterilir
- Olaylar kritiklik seviyesine göre renk kodlanır (kritik / yüksek / orta / düşük)
- Kategori ve şiddet filtresi ile olaylar kolayca daraltılabilir
- Olay detay paneli ile her olayın tam bilgisine tek tıkla ulaşılır

### 🤖 Yapay Zeka Entegrasyonu
- **Deprem Risk Analizi** — Son deprem verileri AI ile işlenerek risk skoru, yoğun bölge tespiti ve 24 saatlik tahmin üretilir
- **Anomali Tespiti** — Döviz kurları ve hava kalitesi verilerinde olağandışı sapmalar otomatik olarak tespit edilir
- **Yol Analizi** — İki nokta arasındaki güzergah üzerindeki tüm aktif olaylar (trafik, hava durumu, güvenlik vb.) analiz edilerek alternatif rotalar ve uyarılar sunulur
- Desteklenen AI sağlayıcıları: **Ollama** (yerel), **Groq**, **OpenAI**, **Anthropic**

### 📊 Dashboard
- Toplam olay sayısı, kritik olay sayısı ve son 1 saatteki aktivite özeti
- Şiddet dağılımı ve kategori bazlı olay istatistikleri
- Son 7 günlük trend grafiği
- Kaynak bazlı veri dağılımı

### 📰 Canlı Haberler
- NTV, CNN Türk, Hürriyet, Sabah, Sözcü RSS akışlarından gündem haberleri
- Haberler harita olaylarıyla ilişkilendirilerek gösterilir

### 💱 Ekonomik Göstergeler
- TCMB'den anlık döviz kurları (USD, EUR, GBP ve diğerleri)
- Borsa, faiz ve enflasyon kategorisi altında ekonomik gelişmeler

### 🌍 Veri Kaynakları
| Kategori | Kaynaklar |
|---|---|
| Deprem | USGS |
| Meteoroloji & Uyarı | MGM, AFAD |
| Hava Kalitesi | OpenAQ benzeri API |
| Döviz | TCMB |
| Haberler | NTV, CNN Türk, Hürriyet, Sabah, Sözcü |
| Ulaşım | KGM Yol Durumu |
| Gemiler | AIS verileri |
| Uçaklar | Canlı uçuş verileri |
| Siber Olaylar | CyberMonitor |
| Çatışma & Güvenlik | ACLED |
| Orman Yangınları | NASA FIRMS, NASA EONET |

---

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Adımlar

```bash
# Repoyu klonla
git clone https://github.com/kaandevs-ops/turkiye-radar.git
cd turkiye-radar

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

---

## ⚙️ Yapılandırma

### AI Ayarları
Uygulama içi AI Ayarları panelinden sağlayıcı seçimi yapılır. API anahtarı gerekmez — yerel Ollama kullanımı desteklenir.

| Sağlayıcı | Model (varsayılan) | Notlar |
|---|---|---|
| Ollama | qwen3.5:latest | Yerel, ücretsiz |
| Groq | llama3-70b-8192 | API key gerekli |
| OpenAI | gpt-4o-mini | API key gerekli |
| Anthropic | claude-haiku | API key gerekli |

---

## 🏗️ Teknoloji Yığını

- **Framework:** Next.js 15 (App Router)
- **Dil:** TypeScript
- **Harita:** Leaflet + React Leaflet
- **Stil:** Tailwind CSS
- **AI:** Çoklu sağlayıcı (Ollama / Groq / OpenAI / Anthropic)

---

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── api/          # Backend API rotaları
│   │   ├── acled/    # Çatışma verileri
│   │   ├── ai/       # AI proxy
│   │   ├── depremler/
│   │   ├── doviz/
│   │   ├── firms/    # NASA orman yangınları
│   │   ├── gemiler/
│   │   ├── haberler/
│   │   ├── hava/
│   │   ├── havakalitesi/
│   │   ├── ucaklar/
│   │   └── ...
│   └── page.tsx      # Ana sayfa
├── components/
│   ├── Harita.tsx
│   ├── Dashboard.tsx
│   ├── Sidebar.tsx
│   ├── DetayPanel.tsx
│   ├── HaberKartlari.tsx
│   ├── IstatistikBar.tsx
│   ├── YolAnaliz.tsx
│   ├── AIAyarlar.tsx
│   └── Bildirim.tsx
├── lib/
│   ├── ai.ts
│   ├── aiIslemler.ts
│   └── kaynaklar.ts
└── types/
    └── olay.ts
```

---

## 📄 Lisans

MIT