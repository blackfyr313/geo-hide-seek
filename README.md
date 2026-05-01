# GeoHiders

A real-time multiplayer geography game where one team hides inside a Google Street View location while the other team decodes clues and pins their best guess on a world map. The closer the guess, the more points scored.

**Live:** [https://geohiders.com](https://geohiders.com)

---

## Table of Contents

- [How to Play](#how-to-play)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Game Mechanics](#game-mechanics)
- [Deployment](#deployment)

---

## How to Play

1. **Create or join a room** — One player creates a room and shares the link or room code with friends. Others join via the URL or by entering the code manually.
2. **Pick teams and roles** — The host assigns one Explorer per team and the rest become Agents.
3. **Explorer hides** — The Explorer sees a secret Google Street View location and has 90 seconds to drop text clues without naming the country or coordinates.
4. **Agents guess** — Agents read the clues and click anywhere on a world map to pin their guess. They have 60 seconds.
5. **Score** — Each agent earns up to 5,000 points based on how close their pin is to the real location. `5000 - distance_km` points, minimum 0.
6. **Teams alternate** — Red team plays, then Blue team plays. This repeats for the configured number of rounds.
7. **Winner** — The team with the most total points after all rounds wins.

Not sure how it works? Click **Rules** on the landing page for an animated walkthrough.

---

## Features

- Real-time multiplayer via Socket.io — no page refreshes needed
- Google Street View panorama for the Explorer — truly random worldwide locations every round
- Interactive dark-mode world map for Agents to pin guesses, with Map/Satellite toggle
- Spectator mode — the opposing team watches Street View (same exact panorama as the Explorer) and live guess markers
- Explorer/Spectator location sync — panorama is shared by `panoId` so everyone sees the identical location, never a nearby alternative
- Shareable room links — URL updates to `?code=XXXXXX` so anyone can join by just opening the link
- Host controls — assign roles, auto-balance teams, configure rounds, start game
- Reconnect support — if a player drops mid-game they have 30 seconds to rejoin by name and resume their role
- Auto-advance — if the Explorer disconnects the game skips to guessing after 5 seconds; if all Agents disconnect the round ends immediately
- Round results screen with a map showing all guesses and polylines to the real location
- Reverse-geocoded location reveal — city and country shown after each round
- Game over screen with final scores, rematch, and return-to-lobby options
- In-game toasts for player join/disconnect/reconnect events
- Public room browser on the landing page
- Animated Rules modal on landing page — visual walkthrough of all game phases
- Fully mobile-responsive layout across all pages
- Dark theme with readable contrast across all UI states
- Google AdSense integration — auto ads + reusable AdBanner component for manual placement
- Ad blocking recovery via Google Funding Choices

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Animation | Framer Motion |
| Icons | React Icons (Feather) |
| Maps | Google Maps JavaScript API (Street View + Maps) |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Styling | Inline styles |
| Fonts | Special Elite, Syne, DM Sans, JetBrains Mono (Google Fonts) |
| Monetisation | Google AdSense, Google Funding Choices |

---

## Project Structure

```
geo-hide-seek/
├── server/
│   ├── index.js          — Express server, Socket.io events, game logic
│   ├── package.json
│   └── .env.example
└── client/
    ├── index.html        — AdSense + Funding Choices scripts in <head>
    ├── vite.config.js
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx              — React entry point
        ├── App.jsx               — Page router + URL sync
        ├── index.css             — Global styles + font imports
        ├── components/
        │   └── AdBanner.jsx      — Reusable manual ad unit component
        ├── context/
        │   ├── SocketContext.jsx — Socket.io connection + connected state
        │   └── GameContext.jsx   — Global game state (room, player, page, notifications)
        └── pages/
            ├── LandingPage.jsx   — Home, create/join/rules modals, public room browser
            ├── LobbyPage.jsx     — Team columns, role assignment, ready/start flow
            └── GamePage.jsx      — All in-game views (explorer, agent, spectator, results)
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
| `checkAllConnectedAgentsGuessed()` | Instantly advances to results when every connected agent has guessed |
| `handleInGameDisconnect()` | Handles explorer/agent drop-outs with phase-aware side effects |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Google Maps API key with **Maps JavaScript API** and **Street View Static API** enabled

### Step 1 — Start the server

```bash
cd server
npm install
npm run dev
```

You should see: `Geo Hide & Seek server running on port 4000`

### Step 2 — Configure the client

```bash
cd client
cp .env.example .env
```

Open `client/.env` and add your Google Maps API key:

```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Step 3 — Start the client (new terminal)

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

> Note: Google AdSense does not serve ads on `localhost` — blank space is expected in development.

---

## Environment Variables

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JS API key (enables Street View and guess map) |
| `VITE_SERVER_URL` | Production only | Full URL of the backend server e.g. `https://api.geohiders.com` |

### Server (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Port the Express server listens on |
| `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origin (set to your frontend domain in production) |

---

## Game Mechanics

### Scoring

```
points = max(0, 5000 - distance_km)
```

A perfect guess (exactly on the location) scores 5,000 points. Every kilometre away subtracts one point.

### Phase timers

| Phase | Duration | Description |
|---|---|---|
| Hiding | 90 s | Explorer roams Street View and submits clues |
| Guessing | 60 s | Agents pin their guess on the world map |
| Results | 12 s | Scores revealed, map shown, auto-advances to next round |

The Explorer can end the hiding phase early by clicking **Done Exploring**. All Agents submitting their guess also ends the guessing phase early.

### Roles

| Role | Assigned by | Sees |
|---|---|---|
| Explorer | Host (lobby) | Street View panorama + clue input |
| Agent | Host (lobby) | Clue list + interactive guess map |
| Spectator | Auto (opposing team) | Street View (same panoId as Explorer) + live guess markers on map |

One Explorer is required per team. All other players on that team are Agents. The opposing team automatically becomes spectators for that round.

### Location sync

After the Explorer's Street View resolves via `getPanorama`, the actual `panoId` is confirmed back to the server and broadcast to all spectators. Spectators load the panorama directly by `panoId` — bypassing a second `getPanorama` call — so everyone sees the identical location rather than a potentially different nearby panorama.

### Rounds

Rounds alternate between teams. Red always plays first. The number of rounds per team is set by the host (3, 5, 7, or 10). Total sub-rounds = `totalRounds × 2`.

### Reconnect behaviour

If a player loses connection during a live game:
- Their slot is kept for **30 seconds**
- Other players see a `"disconnected — 30 s to rejoin"` notification
- If they rejoin (same name, same room code) within 30 s their socket ID is remapped and they resume their role
- If the disconnected player was the **Explorer** during hiding, the game skips to guessing after **5 seconds**
- If all **Agents** disconnect during guessing, the round ends immediately and moves to results

---

## Deployment

The live production deployment is at **[https://geohiders.com](https://geohiders.com)**.

When deploying to a live domain you need to update two things in the client and one thing in the server.

### Client

Replace the hardcoded `localhost:4000` references with an environment variable.

**`client/src/context/SocketContext.jsx`**
```js
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000', { autoConnect: true })
```

**`client/src/pages/LandingPage.jsx`**
```js
fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'}/public-rooms`)
```

Then set in your hosting platform (Vercel, Netlify, etc.):
```
VITE_SERVER_URL=https://api.geohiders.com
VITE_GOOGLE_MAPS_API_KEY=your_production_key
```

### Server

Set on your server host (Railway, Render, Heroku, etc.):
```
CLIENT_URL=https://geohiders.com
PORT=4000
```

### Google Maps API key

In Google Cloud Console go to **Credentials → your API key → Application restrictions** and add your domain to the **HTTP referrers** list:
```
https://geohiders.com/*
```

### AdSense manual ad units

To place an ad in a specific location, create an ad unit in your AdSense dashboard and use the `AdBanner` component:

```jsx
import AdBanner from '../components/AdBanner'

<AdBanner adSlot="YOUR_AD_SLOT_ID" style={{ margin: '24px 0' }} />
```

### Ports

| Service | Local port | Production |
|---|---|---|
| Backend (Socket.io + Express) | 4000 | https://api.geohiders.com |
| Frontend (Vite dev server) | 3000 | https://geohiders.com |
