require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express     = require("express");
const http        = require("http");
const { Server }  = require("socket.io");
const cors        = require("cors");
const compression = require("compression");
const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",").map(o => o.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(compression());
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
//  Random worldwide Street View location picker
// ─────────────────────────────────────────────
// Weighted coverage zones [latMin, latMax, lngMin, lngMax, weight]
// Weight ∝ Google Street View coverage density in that region
const SV_ZONES = [
  [ 25,  49, -124,  -67, 35], // USA
  [ 44,  60, -130,  -58,  8], // Canada
  [ 15,  30, -117,  -87,  5], // Mexico / Central America
  [ 35,  60,  -11,   25, 28], // Western & Central Europe
  [ 50,  58,  -10,    2,  4], // UK / Ireland
  [ 55,  71,    5,   32,  5], // Scandinavia
  [ 41,  56,   14,   40,  5], // Eastern Europe / Balkans
  [ 30,  46,  128,  145, 12], // Japan
  [ 34,  38,  126,  130,  4], // South Korea
  [-40, -10,  112,  153, 10], // Australia
  [-47, -34,  166,  178,  3], // New Zealand
  [-35,   5,  -73,  -35,  8], // Brazil
  [-55, -22,  -73,  -53,  4], // Argentina / Chile
  [ -5,  12,  -80,  -60,  3], // Colombia / Venezuela / Peru
  [  8,  30,   68,   90,  7], // India
  [  1,  22,   98,  140,  6], // Southeast Asia
  [ 22,  42,  108,  125,  5], // Eastern China
  [ 50,  65,   30,  100,  5], // Russia (populated belt)
  [-35, -20,   16,   35,  4], // South Africa
  [-12,  12,   30,   45,  3], // East Africa
  [  4,  15,  -18,   15,  2], // West Africa
  [ 20,  38,   32,   62,  3], // Middle East
  [ 22,  26,  114,  122,  3], // Taiwan / Hong Kong
];

// Region-specific zone subsets for custom room settings
const REGION_ZONES = {
  americas: [
    [ 25,  49, -124,  -67, 35],
    [ 44,  60, -130,  -58,  8],
    [ 15,  30, -117,  -87,  5],
    [-35,   5,  -73,  -35,  8],
    [-55, -22,  -73,  -53,  4],
    [ -5,  12,  -80,  -60,  3],
  ],
  europe: [
    [ 35,  60,  -11,   25, 28],
    [ 50,  58,  -10,    2,  4],
    [ 55,  71,    5,   32,  5],
    [ 41,  56,   14,   40,  5],
  ],
  asia: [
    [ 30,  46,  128,  145, 12],
    [ 34,  38,  126,  130,  4],
    [  8,  30,   68,   90,  7],
    [  1,  22,   98,  140,  6],
    [ 22,  42,  108,  125,  5],
    [ 22,  26,  114,  122,  3],
    [ 20,  38,   32,   62,  3],
  ],
  africa: [
    [-35, -20,   16,   35,  4],
    [-12,  12,   30,   45,  3],
    [  4,  15,  -18,   15,  2],
  ],
  oceania: [
    [-40, -10,  112,  153, 10],
    [-47, -34,  166,  178,  3],
  ],
};

function pickLocation(region = 'all') {
  const zones = (region && region !== 'all' && REGION_ZONES[region]) ? REGION_ZONES[region] : SV_ZONES;
  const total = zones.reduce((s, z) => s + z[4], 0);
  let r = Math.random() * total;
  let zone = zones[0];
  for (const z of zones) { r -= z[4]; if (r <= 0) { zone = z; break; } }
  const [latMin, latMax, lngMin, lngMax] = zone;
  const lat = +(latMin + Math.random() * (latMax - latMin)).toFixed(5);
  const lng = +(lngMin + Math.random() * (lngMax - lngMin)).toFixed(5);
  const latStr = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
  return { lat, lng, name: `${latStr}, ${lngStr}`, city: 'Random Location', id: Date.now() };
}

// ─────────────────────────────────────────────
//  In-memory store
// ─────────────────────────────────────────────
const rooms               = {};
const timers              = {};
const gracePeriodTimers   = {}; // socketId → timeout — 30 s grace window for mid-game reconnects
const locationConfirmTimers = {}; // roomCode → timeout — fallback if explorer never confirms coords
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

function createRoom({ hostId, hostName, isPublic, totalRounds }) {
  const code = generateRoomCode();
  rooms[code] = {
    code,
    isPublic: isPublic ?? false,
    totalRounds: totalRounds ?? 3,   // rounds PER TEAM
    settings: { hidingSecs: 90, guessSecs: 60, region: 'all' },
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
    locationConfirmed: false,
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
    settings: room.settings,
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
  room.locationConfirmed = false;
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
const RESULTS_SECS  = 18;

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
  room.currentLocation = pickLocation(room.settings?.region);
  room.locationConfirmed = false;
  room.phaseEndsAt = Date.now() + (room.settings?.hidingSecs ?? HIDING_SECS) * 1000;

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

  // Send seed to explorer only — they confirm the actual panorama coords back via location_confirmed
  // Spectators get the confirmed coords shortly after; fallback sends seed after 10 s
  if (explorerId) {
    io.to(explorerId).emit("location_assigned", { location: room.currentLocation });
  }
  clearTimeout(locationConfirmTimers[code]);
  locationConfirmTimers[code] = setTimeout(() => {
    if (rooms[code] && !rooms[code].locationConfirmed) {
      Object.values(rooms[code].players)
        .filter(p => p.role === "spectator")
        .forEach(p => io.to(p.id).emit("location_assigned", { location: rooms[code].currentLocation }));
    }
  }, 10000);

  const explorer = room.players[explorerId];
  console.log(`[Game] ${code} Round ${room.round} — Team: ${activeTeam} — Explorer: ${explorer?.name}, seed: ${room.currentLocation.name}`);

  clearTimeout(timers[code]);
  timers[code] = setTimeout(() => transitionToGuessing(code), (room.settings?.hidingSecs ?? HIDING_SECS) * 1000);
}

function transitionToGuessing(code) {
  const room = rooms[code];
  if (!room || room.phase !== "hiding") return;

  room.phase = "guessing";
  room.phaseEndsAt = Date.now() + (room.settings?.guessSecs ?? GUESSING_SECS) * 1000;

  io.to(code).emit("room_updated", getRoomSnapshot(code));

  clearTimeout(timers[code]);
  timers[code] = setTimeout(() => transitionToResults(code), (room.settings?.guessSecs ?? GUESSING_SECS) * 1000);
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

  // ── LOCATION CONFIRMED (explorer snapped to actual panorama) ────────────────
  socket.on("location_confirmed", ({ code, lat, lng, panoId, city, country }) => {
    const room = rooms[code];
    if (!room || room.phase !== "hiding") return;
    const player = room.players[socket.id];
    if (!player || player.role !== "explorer") return;
    const latStr = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}`;
    const lngStr = `${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;
    const name = city && country ? `${city}, ${country}` : city || country || `${latStr}, ${lngStr}`;
    room.currentLocation = { lat, lng, name, city: country || 'Unknown', id: room.currentLocation.id, panoId };
    room.locationConfirmed = true;
    clearTimeout(locationConfirmTimers[code]);
    // Now tell spectators the confirmed real position
    Object.values(room.players)
      .filter(p => p.role === "spectator")
      .forEach(p => io.to(p.id).emit("location_assigned", { location: room.currentLocation }));
    console.log(`[Game] ${code} location confirmed: ${room.currentLocation.name}`);
  });

  // ── REQUEST NEW LOCATION (explorer found no Street View nearby) ─────────────
  socket.on("request_new_location", ({ code }) => {
    const room = rooms[code];
    if (!room || room.phase !== "hiding") return;
    const player = room.players[socket.id];
    if (!player || player.role !== "explorer") return;
    room.currentLocation = pickLocation(room.settings?.region);
    room.locationConfirmed = false;
    socket.emit("location_assigned", { location: room.currentLocation });
    // Reset the spectator fallback timer
    clearTimeout(locationConfirmTimers[code]);
    locationConfirmTimers[code] = setTimeout(() => {
      if (rooms[code] && !rooms[code].locationConfirmed) {
        Object.values(rooms[code].players)
          .filter(p => p.role === "spectator")
          .forEach(p => io.to(p.id).emit("location_assigned", { location: rooms[code].currentLocation }));
      }
    }, 10000);
    console.log(`[Game] ${code} retrying location — new seed: ${room.currentLocation.name}`);
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

  // ── UPDATE SETTINGS (host only, lobby only) ──
  socket.on("update_settings", ({ code, settings }, callback) => {
    const room = rooms[code];
    if (!room) return callback?.({ error: "Room not found." });
    if (!room.players[socket.id]?.isHost) return callback?.({ error: "Only the host can change settings." });
    if (room.status !== "lobby") return callback?.({ error: "Settings can only be changed in the lobby." });

    const { hidingSecs, guessSecs, region } = settings ?? {};
    const validHide   = [30, 60, 90, 120];
    const validGuess  = [30, 45, 60, 90];
    const validRegion = ['all', 'americas', 'europe', 'asia', 'africa', 'oceania'];

    if (hidingSecs  !== undefined && !validHide.includes(hidingSecs))
      return callback?.({ error: "Invalid hiding time." });
    if (guessSecs   !== undefined && !validGuess.includes(guessSecs))
      return callback?.({ error: "Invalid guessing time." });
    if (region      !== undefined && !validRegion.includes(region))
      return callback?.({ error: "Invalid region." });

    if (hidingSecs  !== undefined) room.settings.hidingSecs  = hidingSecs;
    if (guessSecs   !== undefined) room.settings.guessSecs   = guessSecs;
    if (region      !== undefined) room.settings.region      = region;

    io.to(code).emit("room_updated", getRoomSnapshot(code));
    callback?.({ success: true });
  });

  // ── TEAM CHAT ────────────────────────────────
  socket.on("team_chat", ({ code, message }, callback) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player || !message?.trim()) return;
    io.to(code).emit("team_chat_message", {
      playerId: socket.id,
      playerName: player.name,
      team: player.team,
      message: message.trim().slice(0, 200),
      ts: Date.now(),
    });
    if (callback) callback({ success: true });
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
  console.log(`🌍 GeoHiders.com server running on port ${PORT}`);
});
