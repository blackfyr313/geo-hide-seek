<div align="center">

<img src="client/public/icon-192.png" alt="GeoHiders Logo" width="120" height="120" />

# GeoHiders

### **Multiplayer Geography Hide & Seek — Powered by Google Street View**

Hide anywhere on Earth, drop three cryptic clues, and dare your friends to find you on the map.
The closer their guess lands, the more points they steal.

<br />

[![Live Site](https://img.shields.io/badge/▶_play_now-geohiders.com-00d4aa?style=for-the-badge&labelColor=050912)](https://geohiders.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge&labelColor=050912)](#license)
[![Multiplayer](https://img.shields.io/badge/multiplayer-up_to_8-orange?style=for-the-badge&labelColor=050912)](#features)
[![No Account](https://img.shields.io/badge/account-not_required-22c55e?style=for-the-badge&labelColor=050912)](#how-to-play)

<br />

**[▶ Play Now](https://geohiders.com)** · **[How to Play](https://geohiders.com/how-to-play)** · **[FAQ](https://geohiders.com/faq)** · **[About](https://geohiders.com/about)** · **[Contact](https://geohiders.com/contact)**

</div>

---

<div align="center">

### 🌍 195+ Countries · ⚡ Real-Time WebSockets · 🎮 No Download · 📱 Mobile Ready

</div>

---

## 📑 Table of Contents

- [About the Game](#-about-the-game)
- [How to Play](#-how-to-play)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Game Mechanics](#-game-mechanics)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Author](#-author)
- [License](#-license)

---

## 🎯 About the Game

GeoHiders turns the entire planet into a hide-and-seek board. Every round, one player becomes the **Explorer** — they pick any spot on Earth using Google Street View, write three short clues, and challenge the rest of the room to find them. The **Agents** read the clues, study the map, and drop a pin where they think the Explorer is hiding. Closer guesses score more points.

There's no app to install, no account to create, and no email to verify. Make a room, share a 6-character code, and you're playing in under a minute.

> **Why we built it:** geography games online are mostly competitive solo experiences. GeoHiders is the opposite — a party game first, designed for laughter, terrible clues, lucky guesses, and the moment someone drops a pin three streets away from where the Explorer was standing.

---

## 🎮 How to Play

| Step | What happens |
|:---:|---|
| **1** | One player creates a room and shares the link or 6-character code |
| **2** | The host assigns one Explorer per team; the rest become Agents |
| **3** | Explorer gets a random Street View location and 90 s to write three clues |
| **4** | Agents read the clues and have 60 s to drop a pin on the world map |
| **5** | Score = `max(0, 5000 − distance_in_km)` — closer is better |
| **6** | Red team plays, then Blue team plays — repeat for the configured rounds |
| **7** | Team with the most points after all rounds wins |

> 💡 New player? Click **Rules** on the landing page for an animated walkthrough — or read the [full guide on geohiders.com/how-to-play](https://geohiders.com/how-to-play).

---

## ✨ Features

### 🎮 Gameplay
- 🌍 **Truly random worldwide Street View** locations — every round, anywhere on Earth
- 🗺️ **Interactive dark-mode world map** with Map/Satellite toggle for Agents
- 👀 **Spectator mode** — opposing team watches the exact same panorama as the Explorer
- 🔄 **Auto-sync panorama by `panoId`** — every spectator sees the identical view, never a nearby alternative
- 🏆 **Live scoreboard + animated results** with polylines from each guess to the truth
- 📍 **Reverse-geocoded location reveal** — city and country shown after each round

### 👥 Multiplayer
- ⚡ **Real-time via Socket.IO** — no refreshes, no polling
- 🚪 **Up to 8 players** in private rooms
- 🔗 **Shareable invite URLs** that auto-open the join modal (`?code=ABC123`)
- 🔁 **Reconnect grace period** — drop out and rejoin within 30 s without losing your slot
- 🤖 **Auto-advance fallbacks** — game continues smoothly if the Explorer or all Agents disconnect

### 🏠 Lobby & Rooms
- 🌐 **Public room browser** on the landing page for instant joining
- ⚙️ **Configurable rounds** (3, 5, 7, or 10 per team)
- 🎨 **Custom team colors** and player avatars
- 🔒 **Host-only controls** for role assignment, auto-balance, and game start

### 💬 In-Game Polish
- 🎵 **Subtle sound effects** for ticks, pin drops, and score reveals (mutable)
- 🔔 **Live toasts** for joins, disconnects, and reconnects
- 📜 **In-game chat** for banter between rounds
- 🎬 **Animated transitions** between hiding, guessing, and results phases

### 📚 Content & SEO
- 📖 **Static content pages** — Privacy, Terms, About, How to Play, FAQ, Contact
- 🔍 **SEO-optimized** — sitemap.xml, robots.txt, Open Graph, JSON-LD structured data
- 💰 **Google AdSense integration** — Auto Ads + reusable `AdBanner` component
- 🍪 **Cookie consent** managed by Google Funding Choices (GDPR-ready)

### 📱 Quality of Life
- 📱 **Fully mobile-responsive** across all pages
- 🌑 **Dark theme** with high-contrast readable UI
- ⌨️ **Keyboard-friendly** modal navigation
- 🚀 **Fast initial load** — code-split chunks for React, Framer Motion, Leaflet, Socket.IO

---

## 🛠 Tech Stack

<div align="center">

### Frontend
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](#)

### Backend
[![Node.js](https://img.shields.io/badge/Node.js_18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)

### Maps & APIs
[![Google Maps](https://img.shields.io/badge/Google_Maps_API-4285F4?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

### Hosting
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)

### Analytics & Ads
[![Google Analytics](https://img.shields.io/badge/Google_Analytics-E37400?style=for-the-badge&logo=googleanalytics&logoColor=white)](#)
[![AdSense](https://img.shields.io/badge/Google_AdSense-4285F4?style=for-the-badge&logo=googleadsense&logoColor=white)](#)

</div>

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 5, JSX |
| **Animation** | Framer Motion 10 |
| **Icons** | React Icons (Feather set) |
| **Maps** | Google Maps JavaScript API (Street View + Maps), Leaflet for result overlays |
| **Backend** | Node.js 18+, Express 4 |
| **Real-time** | Socket.IO 4 |
| **Styling** | Inline styles + brand CSS for static pages |
| **Fonts** | Special Elite, Syne, DM Sans, JetBrains Mono (Google Fonts) |
| **Monetization** | Google AdSense, Google Funding Choices |
| **Analytics** | Google Analytics 4, Google Tag Manager |
| **Frontend Host** | Vercel (Vite SPA + static pages) |
| **Backend Host** | Render (WebSocket-capable Node service) |

---

## 📸 Screenshots

> Live site: **https://geohiders.com** — best experience.

<div align="center">

| Landing Page | Lobby |
|:---:|:---:|
| _Animated globe, public room browser, and live world stats_ | _Team columns, role assignment, custom settings_ |
| Visit [geohiders.com](https://geohiders.com) | Visit [geohiders.com](https://geohiders.com) (create a room) |

| Explorer (Street View) | Agent (Guess Map) |
|:---:|:---:|
| _90 s to roam the world and drop three clues_ | _60 s to read clues and pin your guess_ |
| Hide phase | Seek phase |

| Results & Scoreboard | Game Over |
|:---:|:---:|
| _Polylines from every guess to the truth_ | _Final scores, rematch, return to lobby_ |
| Round end | Game end |

</div>

> 💡 To contribute screenshots: capture from `https://geohiders.com`, save as `social-assets/screenshot-<view>.png`, and reference here.

---

## 📁 Project Structure

```
geo-hide-seek/
├── README.md                            ← you are here
├── server/                              ← Node + Socket.IO game server
│   ├── index.js                         ← Express server, Socket.IO events, game logic
│   ├── package.json
│   └── .env.example
└── client/                              ← Vite + React frontend
    ├── index.html                       ← AdSense, GTM, GA, Funding Choices in <head>
    ├── vite.config.js                   ← + custom plugin serving static content pages
    ├── vercel.json                      ← Clean URLs + rewrites for content pages
    ├── package.json
    ├── .env.example
    ├── public/
    │   ├── ads.txt                      ← Google AdSense authorized seller declaration
    │   ├── sitemap.xml                  ← All public URLs for search engines
    │   ├── robots.txt
    │   ├── favicon.svg / icon-*.png     ← App icons
    │   ├── styles/content.css           ← Shared brand CSS for static pages
    │   ├── privacy/index.html           ← Privacy Policy
    │   ├── terms/index.html             ← Terms of Service
    │   ├── about/index.html             ← About page
    │   ├── how-to-play/index.html       ← Full game guide
    │   ├── faq/index.html               ← FAQ with FAQPage schema
    │   └── contact/index.html           ← Contact page
    └── src/
        ├── main.jsx                     ← React entry point
        ├── App.jsx                      ← Page router + URL sync
        ├── index.css                    ← Global styles + font imports
        ├── components/
        │   └── AdBanner.jsx             ← Reusable manual ad unit
        ├── context/
        │   ├── SocketContext.jsx        ← Socket.IO connection state
        │   ├── GameContext.jsx          ← Global game state
        │   └── UIContext.jsx            ← Modals, toasts, mute state
        ├── utils/
        │   └── sounds.js                ← Web Audio API beep helpers
        └── pages/
            ├── LandingPage.jsx          ← Home, create/join/rules modals, footer
            ├── LobbyPage.jsx            ← Team columns, role assignment, settings
            └── GamePage.jsx             ← Explorer, Agent, Spectator, Results views
```

### Key server concepts

| Object | Purpose |
|---|---|
| `rooms` | In-memory map of all active rooms keyed by room code |
| `timers` | Per-room phase timers (hiding → guessing → results) |
| `gracePeriodTimers` | Per-socket 30 s reconnect window timers |
| `startRound()` | Picks a location, assigns in-game roles, starts hiding timer |
| `transitionToGuessing()` | Ends hiding phase, starts guessing timer |
| `transitionToResults()` | Scores all guesses, increments round counters, auto-advances |
| `checkAllConnectedAgentsGuessed()` | Instantly advances to results when every Agent has guessed |
| `handleInGameDisconnect()` | Handles Explorer/Agent drop-outs with phase-aware side effects |

---

## ⚙️ Local Setup

### Prerequisites

- **Node.js 18+**
- **Google Maps API key** with **Maps JavaScript API** and **Street View Static API** enabled

### Step 1 — Start the server

```bash
cd server
npm install
npm run dev
```

> ✅ Expected output: `Geo Hide & Seek server running on port 4000`

### Step 2 — Configure the client

```bash
cd client
cp .env.example .env
```

Open `client/.env` and add your Google Maps API key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Step 3 — Start the client (new terminal)

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

> ⚠️ Google AdSense does not serve ads on `localhost` — blank space in ad slots is expected during development.

---

## 🔐 Environment Variables

### Client (`client/.env`)

| Variable | Required | Description |
|---|:---:|---|
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps JS API key (enables Street View and guess map) |
| `VITE_SERVER_URL` | 🚀 prod only | Full URL of the backend (e.g. `https://api.geohiders.com`) |

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port the Express server listens on |
| `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origin (set to your production frontend domain) |

---

## 🎯 Game Mechanics

### Scoring formula

```
points = max(0, 5000 − distance_km)
```

A perfect guess (exactly on the location) scores **5,000 points**. Every kilometer away subtracts one point. A guess on the wrong continent earns nearly nothing.

### Phase timers

| Phase | Duration | Description |
|---|:---:|---|
| 🟢 **Hiding** | 90 s | Explorer roams Street View and submits three clues |
| 🟡 **Guessing** | 60 s | Agents pin their guess on the world map |
| 🔴 **Results** | 12 s | Scores revealed, map shown, auto-advances to next round |

> ⏩ The Explorer can end the hiding phase early with **Done Exploring**. All Agents submitting their guesses also ends the guessing phase early.

### Roles

| Role | Assigned by | Sees |
|---|---|---|
| 🕵️ **Explorer** | Host (lobby) | Street View panorama + clue input |
| 🎯 **Agent** | Host (lobby) | Clue list + interactive guess map |
| 👁 **Spectator** | Auto (opposing team) | Street View (same `panoId` as Explorer) + live guess markers |

One Explorer is required per team. All other players on that team are Agents. The opposing team automatically becomes spectators for that round.

### Location sync

After the Explorer's Street View resolves via `getPanorama`, the actual `panoId` is confirmed back to the server and broadcast to all spectators. Spectators load the panorama directly by `panoId` — bypassing a second `getPanorama` call — so everyone sees the identical location rather than a potentially different nearby panorama.

### Rounds

Rounds alternate between teams. **Red always plays first.** The number of rounds per team is set by the host (3, 5, 7, or 10). Total sub-rounds = `totalRounds × 2`.

### Reconnect behaviour

If a player loses connection during a live game:

- Their slot is reserved for **30 seconds**
- Other players see a `"disconnected — 30 s to rejoin"` notification
- If they rejoin (same name, same room code) within 30 s, their socket ID is remapped and they resume their role
- If the **Explorer** disconnects during hiding → game skips to guessing after **5 seconds**
- If **all Agents** disconnect during guessing → round ends immediately and moves to results

---

## 🚀 Deployment

The live production deployment is at **[https://geohiders.com](https://geohiders.com)**.

### 🌐 Frontend (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set these environment variables in the Vercel dashboard:

```env
VITE_SERVER_URL=https://api.geohiders.com
VITE_GOOGLE_MAPS_API_KEY=your_production_key
```

The included `client/vercel.json` configures:
- ✅ **Clean URLs** for `/privacy`, `/terms`, `/about`, `/how-to-play`, `/faq`, `/contact`
- ✅ **SPA fallback** for all other unmatched routes
- ✅ **Trailing slash** redirects

### 🔌 Backend (Render)

Set these environment variables on Render:

```env
CLIENT_URL=https://geohiders.com
PORT=4000
```

Make sure your service type supports **WebSocket connections** (Render's Web Service does by default).

### 🗝 Google Maps API key

In Google Cloud Console → **Credentials** → your API key → **Application restrictions**, add your domain to the **HTTP referrers** list:

```
https://geohiders.com/*
```

### 💰 AdSense manual ad units

To place an ad in a specific location, create an ad unit in your AdSense dashboard and use the `AdBanner` component:

```jsx
import AdBanner from '../components/AdBanner'

<AdBanner adSlot="YOUR_AD_SLOT_ID" style={{ margin: '24px 0' }} />
```

Or rely on **Auto Ads** (enabled in the AdSense dashboard) — they're already wired up to all static and SPA pages.

### Ports

| Service | Local port | Production |
|---|:---:|---|
| Backend (Socket.IO + Express) | `4000` | `https://api.geohiders.com` |
| Frontend (Vite dev server) | `3000` | `https://geohiders.com` |

---

## 🗺 Roadmap

- [ ] **Public matchmaking** — drop into a random global room without needing a code
- [ ] **Themed rounds** — restrict hiders to specific regions (capitals only, islands only, train stations)
- [ ] **Solo practice mode** — sharpen map skills without needing other players online
- [ ] **Replay system** — review the round after it ends, see where everyone guessed
- [ ] **Optional persistent profiles** — for players who want to track their stats over time
- [ ] **Custom map themes** — alternate Map/Satellite/Terrain styles
- [ ] **More languages** — i18n for the UI and content pages

> 💌 Have an idea? Open an issue or [email Adarsh](mailto:adarshchauhan13@gmail.com).

---

## 👤 Author

<div align="center">

**Adarsh Chauhan**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/blackfyr313)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:adarshchauhan13@gmail.com)
[![Website](https://img.shields.io/badge/Website-00d4aa?style=for-the-badge&logo=googlechrome&logoColor=white)](https://geohiders.com)

</div>

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Adarsh Chauhan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to grant such permission, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

Map and Street View imagery is provided by **Google Maps Platform** and remains subject to Google's terms.

---

<div align="center">

### 🌍 Made with curiosity, coffee, and Google Street View

**[▶ Play GeoHiders Now](https://geohiders.com)**

<sub>Built by [Adarsh Chauhan](mailto:adarshchauhan13@gmail.com) · © 2026 GeoHiders</sub>

</div>
