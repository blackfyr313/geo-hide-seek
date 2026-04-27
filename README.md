# 🌍 Geo Hide & Seek

## Quick Start (Windows / Mac / Linux)

### Step 1 — Start the Server
```bash
cd server
npm install
npm run dev
```
You should see: `🌍 Geo Hide & Seek server running on port 4000`

### Step 2 — Start the Client (new terminal)
```bash
cd client
npm install
npm run dev
```
You should see: `Local: http://localhost:3000`

### Step 3
Open **http://localhost:3000** in your browser.

---

## Project Structure
```
geo-hide-seek/
├── server/
│   ├── index.js          ← Express + Socket.io
│   └── package.json
└── client/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx              ← entry point
        ├── App.jsx               ← page router
        ├── index.css
        ├── context/
        │   ├── SocketContext.jsx
        │   └── GameContext.jsx
        └── pages/
            ├── LandingPage.jsx
            └── LobbyPage.jsx
```

## Ports
| Service | Port | URL |
|---------|------|-----|
| Backend (Socket.io) | 4000 | http://localhost:4000 |
| Frontend (Vite) | 3000 | http://localhost:3000 ← open this |
