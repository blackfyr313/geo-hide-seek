require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const cors       = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
//  Email notifications
// ─────────────────────────────────────────────
const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      service: "gmail",
      family: 4, // force IPv4 — avoids ENETUNREACH on hosts without IPv6
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

if (transporter) {
  transporter.verify((err) => {
    if (err) console.error("[Email] SMTP verify failed:", err.message);
    else     console.log("[Email] SMTP ready");
  });
} else {
  console.warn("[Email] No EMAIL_USER/EMAIL_PASS — milestone emails disabled");
}

let lastMilestoneNotified = 0; // tracks the highest milestone emailed so far

async function sendViewerMilestoneEmail(count) {
  console.log(`[Email] called — count=${count} transporter=${!!transporter}`);
  if (!transporter) return;
  const to = process.env.NOTIFY_EMAIL || process.env.EMAIL_USER;
  if (!to) { console.log("[Email] ❌ No recipient — set NOTIFY_EMAIL in .env"); return; }
  console.log(`[Email] 📤 Sending to ${to}…`);

  const allRooms     = Object.values(rooms);
  const activeGames  = allRooms.filter(r => r.status === "playing").length;
  const openLobbies  = allRooms.filter(r => r.status === "lobby").length;
  const totalPlayers = allRooms.reduce(
    (s, r) => s + Object.values(r.players).filter(p => p.isConnected !== false).length, 0
  );
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  try {
    await transporter.sendMail({
      from: `"Geo Hide & Seek 🌍" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🎉 ${count} viewers on Geo Hide & Seek right now!`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;
                    background:#050912;color:#e2e8f0;padding:40px;border-radius:16px;
                    border:1px solid #1a2540;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;
                     text-transform:uppercase;color:#00d4aa;font-family:monospace;">
            Geo Hide &amp; Seek · Viewer Milestone
          </p>
          <h1 style="margin:0 0 6px;font-size:48px;font-weight:900;color:#fff;line-height:1;">
            ${count}
          </h1>
          <p style="margin:0 0 32px;color:#64748b;font-size:15px;">
            people are on your site right now
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          color:#475569;font-size:13px;">Active games</td>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          text-align:right;color:#00d4aa;font-weight:700;">${activeGames}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          color:#475569;font-size:13px;">Open lobbies</td>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          text-align:right;color:#00d4aa;font-weight:700;">${openLobbies}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          color:#475569;font-size:13px;">Players in rooms</td>
              <td style="padding:12px 0;border-top:1px solid #1a2540;
                          text-align:right;color:#00d4aa;font-weight:700;">${totalPlayers}</td>
            </tr>
          </table>
          <p style="margin:32px 0 0;font-size:12px;color:#334155;line-height:1.7;">
            Next alert at <strong style="color:#475569">${count + 5} viewers</strong>.<br/>
            ${now} IST
          </p>
        </div>`,
    });
    console.log(`[Email] Milestone notification sent — ${count} viewers`);
  } catch (err) {
    console.error("[Email] Failed to send:", err.code, err.message);
  }
}

// ─────────────────────────────────────────────
//  Locations database
// ─────────────────────────────────────────────
const LOCATIONS = [
  { id:  1, lat:  48.8584,  lng:   2.2945,  name: "Eiffel Tower",        city: "Paris, France" },
  { id:  2, lat:  35.6892,  lng: 139.6917,  name: "Shibuya Crossing",    city: "Tokyo, Japan" },
  { id:  3, lat: -22.9519,  lng: -43.2105,  name: "Copacabana Beach",    city: "Rio de Janeiro, Brazil" },
  { id:  4, lat: -33.8568,  lng: 151.2153,  name: "Sydney Opera House",  city: "Sydney, Australia" },
  { id:  5, lat:  40.7580,  lng: -73.9855,  name: "Times Square",        city: "New York, USA" },
  { id:  6, lat:  30.0444,  lng:  31.2357,  name: "Tahrir Square",       city: "Cairo, Egypt" },
  { id:  7, lat:  18.9220,  lng:  72.8347,  name: "Gateway of India",    city: "Mumbai, India" },
  { id:  8, lat: -33.9628,  lng:  18.4098,  name: "Table Mountain",      city: "Cape Town, South Africa" },
  { id:  9, lat:  51.5007,  lng:  -0.1246,  name: "Big Ben",             city: "London, UK" },
  { id: 10, lat:  41.8902,  lng:  12.4922,  name: "Colosseum",           city: "Rome, Italy" },
  { id: 11, lat:  52.5163,  lng:  13.3777,  name: "Brandenburg Gate",    city: "Berlin, Germany" },
  { id: 12, lat:  55.7539,  lng:  37.6208,  name: "Red Square",          city: "Moscow, Russia" },
  { id: 13, lat:  39.9087,  lng: 116.3975,  name: "Tiananmen Square",    city: "Beijing, China" },
  { id: 14, lat:   1.2838,  lng: 103.8591,  name: "Marina Bay Sands",    city: "Singapore" },
  { id: 15, lat:  25.1972,  lng:  55.2744,  name: "Burj Khalifa",        city: "Dubai, UAE" },
  { id: 16, lat:  37.9715,  lng:  23.7267,  name: "Acropolis",           city: "Athens, Greece" },
  { id: 17, lat:  41.0086,  lng:  28.9802,  name: "Hagia Sophia",        city: "Istanbul, Turkey" },
  { id: 18, lat: -13.1631,  lng: -72.5450,  name: "Machu Picchu",        city: "Cusco, Peru" },
  { id: 19, lat:  27.1751,  lng:  78.0421,  name: "Taj Mahal",           city: "Agra, India" },
  { id: 20, lat:  59.9311,  lng:  30.3609,  name: "Palace Square",       city: "St. Petersburg, Russia" },
  { id: 21, lat:  43.7230,  lng:  10.3966,  name: "Leaning Tower",       city: "Pisa, Italy" },
  { id: 22, lat:  40.4168,  lng:  -3.7038,  name: "Puerta del Sol",      city: "Madrid, Spain" },
  { id: 23, lat: -34.6037,  lng: -58.3816,  name: "Plaza de Mayo",       city: "Buenos Aires, Argentina" },
  { id: 24, lat:  13.7563,  lng: 100.5018,  name: "Grand Palace",        city: "Bangkok, Thailand" },
  { id: 25, lat:  -1.2921,  lng:  36.8219,  name: "Nairobi CBD",         city: "Nairobi, Kenya" },
  { id: 26, lat:  60.1699,  lng:  24.9384,  name: "Senate Square",       city: "Helsinki, Finland" },
  { id: 27, lat:  47.4979,  lng:  19.0402,  name: "Buda Castle",         city: "Budapest, Hungary" },
  { id: 28, lat:  50.0755,  lng:  14.4378,  name: "Old Town Square",     city: "Prague, Czech Republic" },
  { id: 29, lat:  33.6844,  lng:  73.0479,  name: "Faisal Mosque",       city: "Islamabad, Pakistan" },
  { id: 30, lat:  -4.3250,  lng:  15.3222,  name: "Central Boulevard",   city: "Kinshasa, DR Congo" },
];

// ─────────────────────────────────────────────
//  In-memory store
// ─────────────────────────────────────────────
const rooms         = {};
const timers        = {};
const gracePeriodTimers = {}; // socketId → timeout — 30 s grace window for mid-game reconnects
const recentEvents  = []; // rolling feed of real game events for the landing page
const connectedSockets = new Set(); // tracks every open browser tab on the site

function addEvent(msg, loc, flag) {
  recentEvents.unshift({ msg, loc, flag, ts: Date.now() });
  if (recentEvents.length > 20) recentEvents.pop();
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pickLocation(room) {
  const available = LOCATIONS.filter(l => !room.usedLocationIds.includes(l.id));
  const pool = available.length > 0 ? available : LOCATIONS;
  const loc = pool[Math.floor(Math.random() * pool.length)];
  room.usedLocationIds.push(loc.id);
  return loc;
}

function createRoom({ hostId, hostName, isPublic, totalRounds }) {
  const code = generateRoomCode();
  rooms[code] = {
    code,
    isPublic: isPublic ?? false,
    totalRounds: totalRounds ?? 3,   // rounds PER TEAM
    status: "lobby",
    players: {},
    teams: { red: [], blue: [] },
    phase: null,
    round: 0,                         // sub-round counter (1 … totalRounds*2)
    scores: { red: 0, blue: 0 },
    explorerIds: { red: null, blue: null },
    currentLocation: null,
    clues: { red: [], blue: [] },
    guesses: {},
    roundResults: null,
    phaseEndsAt: null,
    explorersDone: { red: false, blue: false },
    usedLocationIds: [],
    createdAt: Date.now(),
    currentTeamPlaying: null,
    redTeamRoundsCompleted: 0,
    blueTeamRoundsCompleted: 0,
  };
  addPlayerToRoom(code, hostId, hostName, true);
  return rooms[code];
}

function addPlayerToRoom(code, socketId, name, isHost = false) {
  const room = rooms[code];
  if (!room) return null;
  const team = room.teams.red.length <= room.teams.blue.length ? "red" : "blue";
  room.players[socketId] = {
    id: socketId, name, isHost, team,
    role: null, isReady: false, isConnected: true,
  };
  room.teams[team].push(socketId);
  return room.players[socketId];
}

function removePlayerFromRoom(code, socketId) {
  const room = rooms[code];
  if (!room) return;
  const player = room.players[socketId];
  if (!player) return;
  delete room.players[socketId];
  room.teams.red  = room.teams.red.filter(id => id !== socketId);
  room.teams.blue = room.teams.blue.filter(id => id !== socketId);
  if (player.isHost) {
    const remaining = Object.keys(room.players);
    if (remaining.length > 0) room.players[remaining[0]].isHost = true;
  }
  if (Object.keys(room.players).length === 0) {
    clearTimeout(timers[code]);
    delete timers[code];
    delete rooms[code];
  }
}

function getRoomSnapshot(code) {
  const room = rooms[code];
  if (!room) return null;
  return {
    code: room.code,
    isPublic: room.isPublic,
    totalRounds: room.totalRounds,
    status: room.status,
    players: Object.values(room.players),
    teams: room.teams,
    phase: room.phase,
    round: room.round,
    scores: room.scores,
    clues: room.clues,
    guessCount: Object.keys(room.guesses).length,
    totalAgents: Object.values(room.players).filter(p => p.role === "agent" && p.isConnected !== false).length,
    phaseEndsAt: room.phaseEndsAt,
    explorerIds: room.explorerIds,
    explorersDone: room.explorersDone,
    currentTeamPlaying: room.currentTeamPlaying,
    redTeamRoundsCompleted: room.redTeamRoundsCompleted,
    blueTeamRoundsCompleted: room.blueTeamRoundsCompleted,
  };
}

function resetRoomToLobby(room) {
  room.status = "lobby";
  room.phase = null;
  room.round = 0;
  room.scores = { red: 0, blue: 0 };
  room.currentLocation = null;
  room.clues = { red: [], blue: [] };
  room.guesses = {};
  room.roundResults = null;
  room.phaseEndsAt = null;
  room.explorersDone = { red: false, blue: false };
  room.explorerIds = { red: null, blue: null };
  room.usedLocationIds = [];
  room.currentTeamPlaying = null;
  room.redTeamRoundsCompleted = 0;
  room.blueTeamRoundsCompleted = 0;
  Object.values(room.players).forEach(p => {
    p.role = null;
    p.isReady = false;
  });
}

// ─────────────────────────────────────────────
//  Game phase transitions
// ─────────────────────────────────────────────
const HIDING_SECS   = 90;
const GUESSING_SECS = 60;
const RESULTS_SECS  = 12;

function startRound(code) {
  const room = rooms[code];
  if (!room) return;

  // Red always goes first; if equal completions → Red plays, else the one behind plays
  const activeTeam =
    room.redTeamRoundsCompleted <= room.blueTeamRoundsCompleted ? "red" : "blue";

  room.round += 1;
  room.currentTeamPlaying = activeTeam;
  room.status  = "playing";
  room.phase   = "hiding";
  room.clues   = { red: [], blue: [] };
  room.guesses = {};
  room.roundResults = null;
  room.explorersDone = { red: false, blue: false };
  room.currentLocation = pickLocation(room);
  room.phaseEndsAt = Date.now() + HIDING_SECS * 1000;

  // Use the pre-selected explorer for this team (set at game start)
  const explorerId = room.explorerIds[activeTeam];

  // Assign in-game roles
  Object.values(room.players).forEach(p => {
    if (p.team === activeTeam) {
      p.role = p.id === explorerId ? "explorer" : "agent";
    } else {
      p.role = "spectator";
    }
  });

  const snap = getRoomSnapshot(code);
  io.to(code).emit("room_updated", snap);

  // Send secret location to the explorer AND to spectators (so they can watch Street View)
  if (explorerId) {
    io.to(explorerId).emit("location_assigned", { location: room.currentLocation });
  }
  Object.values(room.players)
    .filter(p => p.role === "spectator")
    .forEach(p => io.to(p.id).emit("location_assigned", { location: room.currentLocation }));

  const explorer = room.players[explorerId];
  console.log(`[Game] ${code} Sub-round ${room.round} — Team: ${activeTeam} — Explorer: ${explorer?.name}, loc: ${room.currentLocation.city}`);

  clearTimeout(timers[code]);
  timers[code] = setTimeout(() => transitionToGuessing(code), HIDING_SECS * 1000);
}

function transitionToGuessing(code) {
  const room = rooms[code];
  if (!room || room.phase !== "hiding") return;

  room.phase = "guessing";
  room.phaseEndsAt = Date.now() + GUESSING_SECS * 1000;

  io.to(code).emit("room_updated", getRoomSnapshot(code));

  clearTimeout(timers[code]);
  timers[code] = setTimeout(() => transitionToResults(code), GUESSING_SECS * 1000);
}

function transitionToResults(code) {
  const room = rooms[code];
  if (!room || room.phase !== "guessing") return;

  room.phase = "results";
  room.phaseEndsAt = Date.now() + RESULTS_SECS * 1000;

  const { lat: tLat, lng: tLng } = room.currentLocation;
  const results = Object.entries(room.guesses).map(([pid, g]) => {
    const player = room.players[pid];
    const distKm = Math.round(haversineKm(tLat, tLng, g.lat, g.lng));
    const points  = Math.max(0, 5000 - distKm);
    return {
      playerId: pid,
      playerName: player?.name ?? "?",
      team: player?.team ?? "red",
      guess: g,
      distanceKm: distKm,
      points,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  results.forEach(r => { room.scores[r.team] = (room.scores[r.team] ?? 0) + r.points; });

  // Increment the active team's completed-round count
  if (room.currentTeamPlaying === "red") room.redTeamRoundsCompleted++;
  else                                    room.blueTeamRoundsCompleted++;

  io.to(code).emit("round_results", {
    location: room.currentLocation,
    results,
    scores: room.scores,
    round: room.round,
    totalRounds: room.totalRounds,
    currentTeamPlaying: room.currentTeamPlaying,
    redTeamRoundsCompleted: room.redTeamRoundsCompleted,
    blueTeamRoundsCompleted: room.blueTeamRoundsCompleted,
    phaseEndsAt: room.phaseEndsAt,
  });

  clearTimeout(timers[code]);
  timers[code] = setTimeout(() => {
    const isOver =
      room.redTeamRoundsCompleted  >= room.totalRounds &&
      room.blueTeamRoundsCompleted >= room.totalRounds;
    if (isOver) endGame(code);
    else        startRound(code);
  }, RESULTS_SECS * 1000);
}

function endGame(code) {
  const room = rooms[code];
  if (!room) return;
  room.status = "finished";
  room.phase  = "finished";
  const { red, blue } = room.scores;
  if (red !== blue) {
    const winner = red > blue ? "Red" : "Blue";
    const margin = Math.abs(red - blue);
    addEvent(`Team ${winner} won!`, `by ${margin.toLocaleString()} pts`, "🏆");
  } else {
    addEvent("It's a tie!", `${red.toLocaleString()} pts each`, "🤝");
  }
  io.to(code).emit("game_over", {
    scores: room.scores,
    players: Object.values(room.players),
    totalRounds: room.totalRounds,
  });
}

// Check if every connected agent has guessed; if so advance immediately
function checkAllConnectedAgentsGuessed(code) {
  const room = rooms[code];
  if (!room || room.phase !== "guessing") return;
  const connected = Object.values(room.players).filter(
    p => p.role === "agent" && p.isConnected !== false
  );
  if (connected.length === 0 || connected.every(p => room.guesses[p.id])) {
    clearTimeout(timers[code]);
    transitionToResults(code);
  }
}

// Called right after a player is soft-disconnected during a live game
function handleInGameDisconnect(code, socketId) {
  const room = rooms[code];
  if (!room) return;
  const player = room.players[socketId];
  if (!player) return;

  if (room.phase === "hiding" && player.role === "explorer") {
    // Give a 5 s grace window; if still gone, skip to guessing
    const remaining = room.phaseEndsAt - Date.now();
    if (remaining > 5000) {
      clearTimeout(timers[code]);
      timers[code] = setTimeout(() => {
        const r = rooms[code];
        if (r?.players[socketId]?.isConnected === false) transitionToGuessing(code);
        else if (r) {
          // Explorer reconnected — re-arm timer for remaining hide time
          const left = Math.max(0, r.phaseEndsAt - Date.now());
          clearTimeout(timers[code]);
          timers[code] = left > 0
            ? setTimeout(() => transitionToGuessing(code), left)
            : (() => { transitionToGuessing(code); return null; })();
        }
      }, 5000);
    }
    // If less than 5 s left, existing timer fires naturally
  } else if (room.phase === "guessing" && player.role === "agent") {
    checkAllConnectedAgentsGuessed(code);
  }
}

// ─────────────────────────────────────────────
//  REST endpoints
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/public-rooms", (_req, res) => {
  const publicRooms = Object.values(rooms)
    .filter(r => r.isPublic && r.status === "lobby")
    .map(r => {
      const host = Object.values(r.players).find(p => p.isHost);
      return {
        code: r.code,
        playerCount: Object.keys(r.players).length,
        totalRounds: r.totalRounds,
        hostName: host?.name ?? "Unknown",
        createdAt: r.createdAt,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(publicRooms);
});

app.get("/stats", (_req, res) => {
  const allRooms = Object.values(rooms);
  const activePlayers = allRooms.reduce(
    (sum, r) => sum + Object.values(r.players).filter(p => p.isConnected !== false).length, 0
  );
  const activeGames = allRooms.filter(r => r.status === "playing").length;
  const lobbyRooms  = allRooms.filter(r => r.status === "lobby").length;
  res.json({ activePlayers, activeGames, lobbyRooms, visitors: connectedSockets.size });
});

app.get("/recent-events", (_req, res) => {
  res.json(recentEvents.slice(0, 10));
});

// ─────────────────────────────────────────────
//  Socket.io events
// ─────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);
  connectedSockets.add(socket.id);
  const visitorCount = connectedSockets.size;
  io.emit("visitor_count", { count: visitorCount });
  console.log(`[Visitors] count=${visitorCount} lastMilestone=${lastMilestoneNotified} mod=${visitorCount % 5} → milestone=${visitorCount % 5 === 0} greaterThanLast=${visitorCount > lastMilestoneNotified}`);
  if (visitorCount % 5 === 0 && visitorCount > lastMilestoneNotified) {
    lastMilestoneNotified = visitorCount;
    console.log(`[Visitors] ✅ Milestone hit — triggering email for ${visitorCount} viewers`);
    sendViewerMilestoneEmail(visitorCount);
  } else if (visitorCount % 5 === 0) {
    console.log(`[Visitors] ⚠️ Multiple of 5 but lastMilestone=${lastMilestoneNotified} already covers it — skipping`);
  }

  // ── CREATE ROOM ──────────────────────────────
  socket.on("create_room", ({ name, isPublic, totalRounds }, callback) => {
    try {
      if (!name || name.trim().length < 2)
        return callback({ error: "Name must be at least 2 characters." });
      const room = createRoom({ hostId: socket.id, hostName: name.trim(), isPublic, totalRounds });
      socket.join(room.code);
      callback({ success: true, room: getRoomSnapshot(room.code) });
      io.to(room.code).emit("room_updated", getRoomSnapshot(room.code));
      if (isPublic) addEvent("New public room created", `by ${name.trim()}`, "🎮");
    } catch (err) {
      console.error(err);
      callback({ error: "Failed to create room." });
    }
  });

  // ── JOIN ROOM ────────────────────────────────
  socket.on("join_room", ({ name, code }, callback) => {
    try {
      if (!name || name.trim().length < 2)
        return callback({ error: "Name must be at least 2 characters." });
      const roomCode = (code || "").trim().toUpperCase();
      const room = rooms[roomCode];
      if (!room) return callback({ error: "Room not found. Check your room code." });

      if (room.status === "playing") {
        // Mid-game reconnect: only allowed if a disconnected slot with the same name exists
        const disconnected = Object.values(room.players).find(
          p => p.isConnected === false &&
               p.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (!disconnected)
          return callback({ error: "A game is currently in progress. Wait for it to finish." });

        const oldId = disconnected.id;

        // Cancel grace-period timer
        clearTimeout(gracePeriodTimers[oldId]);
        delete gracePeriodTimers[oldId];

        // Remap player to new socket ID
        room.players[socket.id] = { ...disconnected, id: socket.id, isConnected: true };
        delete room.players[oldId];
        ["red", "blue"].forEach(t => {
          room.teams[t] = room.teams[t].map(id => id === oldId ? socket.id : id);
          if (room.explorerIds[t] === oldId) room.explorerIds[t] = socket.id;
        });
        // Remap any guess the player had submitted before dropping
        if (room.guesses[oldId]) {
          room.guesses[socket.id] = room.guesses[oldId];
          delete room.guesses[oldId];
        }

        socket.join(roomCode);
        const snapshot = getRoomSnapshot(roomCode);
        callback({ success: true, room: snapshot });
        io.to(roomCode).emit("room_updated", snapshot);
        io.to(roomCode).emit("player_joined", {
          name: name.trim(),
          message: `${name.trim()} reconnected!`,
        });

        // Re-send secret location to explorer or spectator
        const rejoinedPlayer = room.players[socket.id];
        if (room.currentLocation &&
            (rejoinedPlayer.role === "explorer" || rejoinedPlayer.role === "spectator")) {
          socket.emit("location_assigned", { location: room.currentLocation });
        }

        // If explorer reconnected during hiding, restore the hide-phase timer
        if (room.phase === "hiding" && rejoinedPlayer.role === "explorer") {
          const left = Math.max(0, room.phaseEndsAt - Date.now());
          clearTimeout(timers[roomCode]);
          timers[roomCode] = left > 0
            ? setTimeout(() => transitionToGuessing(roomCode), left)
            : (() => { transitionToGuessing(roomCode); return null; })();
        }
        return;
      }

      // Normal lobby join
      if (Object.keys(room.players).length >= 10)
        return callback({ error: "Room is full (max 10 players)." });
      const nameTaken = Object.values(room.players).some(
        p => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== socket.id
      );
      if (nameTaken) return callback({ error: "That name is already taken in this room." });
      addPlayerToRoom(roomCode, socket.id, name.trim());
      socket.join(roomCode);
      const snapshot = getRoomSnapshot(roomCode);
      callback({ success: true, room: snapshot });
      io.to(roomCode).emit("room_updated", snapshot);
      socket.to(roomCode).emit("player_joined", { name: name.trim(), message: `${name.trim()} joined the game!` });
      const joinCount = Object.keys(rooms[roomCode].players).length;
      addEvent(`${joinCount} player${joinCount !== 1 ? "s" : ""} in lobby`, `Room ${roomCode}`, "👥");
    } catch (err) {
      console.error(err);
      callback({ error: "Failed to join room." });
    }
  });

  // ── TOGGLE READY ─────────────────────────────
  socket.on("toggle_ready", ({ code }, callback) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id]) return;
    room.players[socket.id].isReady = !room.players[socket.id].isReady;
    io.to(code).emit("room_updated", getRoomSnapshot(code));
    if (callback) callback({ success: true });
  });

  // ── SWITCH TEAM ──────────────────────────────
  socket.on("switch_team", ({ code }, callback) => {
    const room = rooms[code];
    if (!room || !room.players[socket.id]) return;
    const player = room.players[socket.id];
    const newTeam = player.team === "red" ? "blue" : "red";
    room.teams[player.team] = room.teams[player.team].filter(id => id !== socket.id);
    room.teams[newTeam].push(socket.id);
    player.team = newTeam;
    player.role = null; // reset lobby role on team switch
    io.to(code).emit("room_updated", getRoomSnapshot(code));
    if (callback) callback({ success: true });
  });

  // ── SET ROLE (host only) ─────────────────────
  socket.on("set_role", ({ code, playerId, role }, callback) => {
    const room = rooms[code];
    if (!room || room.status === "playing") return callback?.({ error: "Cannot change roles during an active game." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can assign roles." });

    const target = room.players[playerId];
    if (!target) return callback?.({ error: "Player not found." });
    if (!["explorer", "agent"].includes(role)) return callback?.({ error: "Invalid role." });

    // Only one explorer per team allowed
    if (role === "explorer") {
      const alreadyHasExplorer = room.teams[target.team].some(
        id => id !== playerId && room.players[id]?.role === "explorer"
      );
      if (alreadyHasExplorer)
        return callback?.({ error: "That team already has an explorer!" });
    }

    target.role = role;
    io.to(code).emit("room_updated", getRoomSnapshot(code));
    callback?.({ success: true });
  });

  // ── AUTO BALANCE (host only) ─────────────────
  socket.on("auto_balance", ({ code }, callback) => {
    const room = rooms[code];
    if (!room || room.status === "playing") return callback?.({ error: "Cannot balance roles during an active game." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can auto balance." });

    // Reset all roles, then pick 1 random explorer per team
    Object.values(room.players).forEach(p => { p.role = null; });
    ["red", "blue"].forEach(team => {
      const ids = room.teams[team];
      if (ids.length === 0) return;
      const explorerIdx = Math.floor(Math.random() * ids.length);
      ids.forEach((id, i) => {
        if (room.players[id]) room.players[id].role = i === explorerIdx ? "explorer" : "agent";
      });
    });

    io.to(code).emit("room_updated", getRoomSnapshot(code));
    callback?.({ success: true });
  });

  // ── START GAME ───────────────────────────────
  socket.on("start_game", ({ code }, callback) => {
    const room = rooms[code];
    if (!room) return callback?.({ error: "Room not found." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can start." });
    if (room.status === "playing") return callback?.({ error: "Game already in progress." });
    if (room.teams.red.length  < 2) return callback?.({ error: "Red team needs at least 2 players." });
    if (room.teams.blue.length < 2) return callback?.({ error: "Blue team needs at least 2 players." });

    const redExplorers  = room.teams.red.filter(id => room.players[id]?.role === "explorer");
    const blueExplorers = room.teams.blue.filter(id => room.players[id]?.role === "explorer");
    if (redExplorers.length  !== 1) return callback?.({ error: "Red team needs exactly 1 explorer." });
    if (blueExplorers.length !== 1) return callback?.({ error: "Blue team needs exactly 1 explorer." });

    // If starting from a finished game, reset all game counters (keep team/role assignments)
    if (room.status === "finished") {
      room.round = 0;
      room.scores = { red: 0, blue: 0 };
      room.currentLocation = null;
      room.clues = { red: [], blue: [] };
      room.guesses = {};
      room.roundResults = null;
      room.phaseEndsAt = null;
      room.explorersDone = { red: false, blue: false };
      room.explorerIds = { red: null, blue: null };
      room.usedLocationIds = [];
      room.currentTeamPlaying = null;
      room.redTeamRoundsCompleted = 0;
      room.blueTeamRoundsCompleted = 0;
    }

    // Lock in explorer IDs for the whole game session
    room.explorerIds.red  = redExplorers[0];
    room.explorerIds.blue = blueExplorers[0];

    const playerCount = Object.keys(room.players).length;
    addEvent(`${playerCount} player${playerCount !== 1 ? "s" : ""} started a match`, `Room ${code}`, "🎮");
    startRound(code);
    callback?.({ success: true });
  });

  // ── SUBMIT CLUE ──────────────────────────────
  socket.on("submit_clue", ({ code, clue }, callback) => {
    const room = rooms[code];
    if (!room || room.phase !== "hiding") return;
    const player = room.players[socket.id];
    if (!player || player.role !== "explorer") return;
    if (!clue || !clue.trim()) return;
    room.clues[player.team].push({ text: clue.trim(), author: player.name, timestamp: Date.now() });
    io.to(code).emit("clue_added", { clues: room.clues });
    if (callback) callback({ success: true });
  });

  // ── EXPLORER DONE ────────────────────────────
  socket.on("explorer_done", ({ code }, callback) => {
    const room = rooms[code];
    if (!room || room.phase !== "hiding") return;
    const player = room.players[socket.id];
    if (!player || player.role !== "explorer") return;

    room.explorersDone[player.team] = true;
    clearTimeout(timers[code]);
    transitionToGuessing(code);

    if (callback) callback({ success: true });
  });

  // ── SUBMIT GUESS ─────────────────────────────
  socket.on("submit_guess", ({ code, lat, lng }, callback) => {
    const room = rooms[code];
    if (!room || room.phase !== "guessing") return;
    const player = room.players[socket.id];
    if (!player || player.role !== "agent") return;
    room.guesses[socket.id] = { lat, lng };
    const agents = Object.values(room.players).filter(p => p.role === "agent" && p.isConnected !== false);
    const allGuessed = agents.length > 0 && agents.every(p => room.guesses[p.id]);

    // Broadcast count to everyone
    io.to(code).emit("guess_submitted", {
      guessCount: Object.keys(room.guesses).length,
      totalAgents: agents.length,
    });

    // Send enriched guess positions to spectators + explorer so they can see live guesses
    const enrichedGuesses = {};
    Object.entries(room.guesses).forEach(([pid, g]) => {
      const gp = room.players[pid];
      enrichedGuesses[pid] = { lat: g.lat, lng: g.lng, playerName: gp?.name ?? "?", team: gp?.team ?? "red" };
    });
    Object.values(room.players)
      .filter(p => p.role === "spectator" || p.role === "explorer")
      .forEach(p => io.to(p.id).emit("spectator_guess_update", { guesses: enrichedGuesses }));

    if (allGuessed) { clearTimeout(timers[code]); transitionToResults(code); }
    if (callback) callback({ success: true });
  });

  // ── REMATCH ──────────────────────────────────
  socket.on("rematch", ({ code }, callback) => {
    const room = rooms[code];
    if (!room) return callback?.({ error: "Room not found." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can start a rematch." });
    clearTimeout(timers[code]);
    resetRoomToLobby(room);
    io.to(code).emit("room_updated", getRoomSnapshot(code));
    io.to(code).emit("return_to_lobby", {});
    callback?.({ success: true });
  });

  // ── RETURN TO LOBBY ──────────────────────────
  socket.on("return_to_lobby", ({ code }, callback) => {
    const room = rooms[code];
    if (!room) return callback?.({ error: "Room not found." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can do this." });
    clearTimeout(timers[code]);
    resetRoomToLobby(room);
    io.to(code).emit("room_updated", getRoomSnapshot(code));
    io.to(code).emit("return_to_lobby", {});
    callback?.({ success: true });
  });

  // ── LEAVE ROOM ───────────────────────────────
  socket.on("leave_room", ({ code }) => {
    // Intentional leave: bypass soft-disconnect grace window, remove immediately
    const room = rooms[code];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;
    // Cancel any pending grace timer if they're rejoining-then-leaving
    clearTimeout(gracePeriodTimers[socket.id]);
    delete gracePeriodTimers[socket.id];
    removePlayerFromRoom(code, socket.id);
    socket.leave(code);
    const snap = getRoomSnapshot(code);
    if (snap) {
      io.to(code).emit("room_updated", snap);
      io.to(code).emit("player_left", { name: player.name, message: `${player.name} left.` });
    }
  });

  // ── DISCONNECT ───────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Disconnected: ${socket.id}`);
    connectedSockets.delete(socket.id);
    const countAfter = connectedSockets.size;
    const newMilestone = Math.floor(countAfter / 5) * 5;
    if (newMilestone < lastMilestoneNotified) {
      lastMilestoneNotified = newMilestone;
      console.log(`[Visitors] count=${countAfter} (after disconnect) — lastMilestone reset to ${lastMilestoneNotified}`);
    } else {
      console.log(`[Visitors] count=${countAfter} (after disconnect)`);
    }
    io.emit("visitor_count", { count: countAfter });
    for (const code of Object.keys(rooms)) {
      if (rooms[code]?.players[socket.id]) { handleDisconnect(socket, code); break; }
    }
  });

  function handleDisconnect(socket, code) {
    const room = rooms[code];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;

    socket.leave(code);

    if (room.status === "playing") {
      // ── Soft disconnect: keep the slot, notify, start 30 s grace window ──
      player.isConnected = false;
      io.to(code).emit("room_updated", getRoomSnapshot(code));
      io.to(code).emit("player_left", {
        name: player.name,
        message: `${player.name} disconnected — 30 s to rejoin`,
      });

      // Handle phase-specific side effects immediately
      handleInGameDisconnect(code, socket.id);

      // Permanently remove after 30 s if they don't rejoin
      gracePeriodTimers[socket.id] = setTimeout(() => {
        delete gracePeriodTimers[socket.id];
        const r = rooms[code];
        if (!r || !r.players[socket.id] || r.players[socket.id].isConnected) return;
        const pName = r.players[socket.id].name;
        removePlayerFromRoom(code, socket.id);
        const snap = getRoomSnapshot(code);
        if (snap) {
          io.to(code).emit("room_updated", snap);
          io.to(code).emit("player_left", { name: pName, message: `${pName} left the game.` });
        }
      }, 30000);
    } else {
      // ── Lobby: remove immediately ──
      removePlayerFromRoom(code, socket.id);
      const snapshot = getRoomSnapshot(code);
      if (snapshot) {
        io.to(code).emit("room_updated", snapshot);
        io.to(code).emit("player_left", { name: player.name, message: `${player.name} left.` });
      }
    }
  }
});

// ─────────────────────────────────────────────
//  Start server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🌍 Geo Hide & Seek server running on port ${PORT}`);
});
