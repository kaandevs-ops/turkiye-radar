# 🇹🇷 Türkiye Radar

A real-time threat and event monitoring platform for Turkey. Earthquakes, security incidents, economic indicators, air quality, live news, maritime traffic, and flight data — all unified on a single interactive map, powered by AI-driven analysis.

> Inspired by global situational awareness tools like WorldMonitor, built specifically for Turkey.

---

## 📸 Screenshots

> *(coming soon)*

---

## ✨ Features

### 🗺️ Live Event Map
- All active events across Turkey displayed on an interactive map in real time
- Color-coded by severity: critical / high / medium / low
- Filter by category, severity level, or free-text search
- Click any event to open a full detail panel with source, timestamp, coordinates, and description
- Data auto-refreshes every 2 minutes with a live countdown timer

### 🤖 AI-Powered Analysis
- **Event Summarizer** — Click any news item to get an AI-generated summary, importance score (1–10), keyword extraction, and category validation
- **Event Chat** — Ask follow-up questions about any specific event in a contextual chat interface (e.g. "Which regions are affected?", "What should be done?")
- **Earthquake Risk Analysis** — Last 30 seismic events are processed by AI to produce a risk score (0–100), active fault zone identification, trend detection (rising / falling / stable), and a 24-hour risk forecast
- **Anomaly Detection** — AI monitors live exchange rates (USD, EUR, GBP) and air quality index for statistical outliers and flags unusual deviations automatically
- **AI Route Analysis** — Select two points on the map; AI scans all active events along the route (traffic, weather, security, road closures) and returns a risk assessment with alternative route suggestions

Supported AI providers:

| Provider | Default Model | Notes |
|---|---|---|
| Ollama | qwen3.5:latest | Local, no API key needed |
| Groq | llama3-70b-8192 | API key required |
| OpenAI | gpt-4o-mini | API key required |
| Anthropic | claude-haiku | API key required |

### 📊 Dashboard
- Total event count, critical alert count, high-severity count, and last-hour activity
- Severity distribution bar chart and donut chart with percentage breakdown
- Category breakdown with relative frequency bars (up to 12 categories)
- 7-day trend chart with daily totals, color-coded by highest severity of the day
- Data source distribution showing which APIs contributed what volume

### 🔔 Smart Notifications
- Real-time toast notifications for all incoming critical and high-severity events
- Audio alerts with distinct sounds for critical vs. high-priority events (Web Audio API, no external dependency)
- Notifications auto-dismiss after 10 seconds; up to 6 stacked simultaneously
- Sound can be toggled on/off from the top-right corner

### 👤 Personalized Feed
- User interaction profile stored locally — every event click is recorded by category
- Events are re-ranked based on your interest history: categories you engage with most appear higher
- Freshness bonus for events published in the last 2 hours
- Severity bonus layered on top of personal preferences
- Profile resets automatically; no account or login required

### 📰 Live News Panel
- Bottom news ticker pulling from NTV, CNN Türk, Hürriyet, Sabah, and Sözcü RSS feeds
- News cards are linked to map events; clicking a card focuses the map on that location
- Panel can be toggled open/closed without losing map context

### 💱 Economic Indicators
- Live TCMB (Central Bank of Turkey) exchange rates: USD, EUR, GBP, and more
- Rates refresh every 5 minutes
- Bottom status bar toggles between exchange rate view and event statistics view

### 🌐 Data Sources

| Category | Sources |
|---|---|
| Earthquakes | USGS |
| Weather Alerts | MGM (Turkish Meteorological Service) |
| Disaster Warnings | AFAD |
| Air Quality | OpenAQ-compatible API |
| Exchange Rates | TCMB (Central Bank of Turkey) |
| News | NTV, CNN Türk, Hürriyet, Sabah, Sözcü |
| Road Conditions | KGM (General Directorate of Highways) |
| Maritime Traffic | AIS live vessel data |
| Flight Tracking | Live flight data API |
| Cyber Incidents | CyberMonitor |
| Conflict & Security | ACLED |
| Wildfires | NASA FIRMS, NASA EONET |
| Infrastructure | Custom aggregation |

### 🗂️ Event Categories (50+)

Natural disasters (earthquake, aftershock, flood, wildfire, storm, tornado, landslide, tsunami, heatwave, blizzard, drought, volcanic), security (terrorism, military operation, protest, arrest, border incident, smuggling), transportation (traffic accident, road closure, flight incident, maritime incident, train crash, metro), infrastructure (power outage, gas/water/internet outage, building collapse, mining accident), economics (exchange rate, inflation, stock market, strike, bankruptcy), health (epidemic, hospital, poisoning, food contamination), environment (air pollution, sea pollution, deforestation, nuclear), politics (parliament, election, court, corruption), and more.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Map | Leaflet + React Leaflet + MarkerCluster |
| Styling | Tailwind CSS |
| AI | Multi-provider (Ollama / Groq / OpenAI / Anthropic) |
| Audio | Web Audio API (no dependencies) |
| Storage | localStorage (event history, user profile, AI config) |
| Data | 12+ external APIs via Next.js API routes |

---

## 🚀 Getting Started

### Requirements
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/kaandevs-ops/turkiye-radar.git
cd turkiye-radar
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### AI Setup (Optional)
No AI configuration is required to use the map. To enable AI features, click the AI settings icon in the sidebar and choose your provider:

- **Ollama (recommended for local use):** Install [Ollama](https://ollama.com), pull a model (`ollama pull qwen3:latest`), and select Ollama in settings — no API key needed
- **Groq / OpenAI / Anthropic:** Enter your API key in the AI settings panel

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── acled/        # Conflict & security events
│   │   ├── ai/           # Multi-provider AI proxy
│   │   ├── altyapi/      # Infrastructure outages
│   │   ├── cybermonitor/ # Cyber incidents
│   │   ├── depremler/    # Earthquake data (USGS)
│   │   ├── doviz/        # Exchange rates (TCMB)
│   │   ├── eonet/        # NASA natural events
│   │   ├── firms/        # NASA wildfire data
│   │   ├── gemiler/      # Maritime traffic
│   │   ├── haberler/     # News RSS feeds
│   │   ├── hava/         # Weather alerts
│   │   ├── havakalitesi/ # Air quality
│   │   ├── telegram/     # Telegram channel feed
│   │   └── ucaklar/      # Flight tracking
│   └── page.tsx
├── components/
│   ├── AIAyarlar.tsx     # AI provider settings panel
│   ├── Bildirim.tsx      # Real-time alert notifications
│   ├── Dashboard.tsx     # Statistics & AI analysis dashboard
│   ├── DetayPanel.tsx    # Event detail + AI chat panel
│   ├── HaberKartlari.tsx # Bottom news cards
│   ├── Harita.tsx        # Interactive Leaflet map
│   ├── IstatistikBar.tsx # Bottom status bar (exchange rates / stats)
│   ├── Sidebar.tsx       # Event list, filters, personalized feed
│   └── YolAnaliz.tsx     # AI route analysis modal
├── lib/
│   ├── ai.ts             # AI config management
│   ├── aiIslemler.ts     # AI functions (summarize, analyze, detect)
│   ├── kaynaklar.ts      # Category definitions, colors, source URLs
│   └── kullanici.ts      # User profile & personalization engine
└── types/
    └── olay.ts           # Core event type definition
```

---

## 🔒 Privacy

All data is processed locally in the browser. No user data is sent to any external server. The personalization profile (click history) is stored exclusively in `localStorage` and never leaves your device. AI requests go directly from your browser to your chosen provider.

---

## 📄 License

MIT