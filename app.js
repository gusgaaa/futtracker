const DEFAULT_PLAYERS = [
  {
    "name": "Pina",
    "role": "Titular"
  },
  {
    "name": "Cristiano Ronaldo",
    "role": "Titular"
  },
  {
    "name": "Güler",
    "role": "Titular"
  },
  {
    "name": "Griezmann",
    "role": "Titular"
  },
  {
    "name": "Rice",
    "role": "Titular"
  },
  {
    "name": "Mariona",
    "role": "Titular"
  },
  {
    "name": "Nuno Mendes",
    "role": "Titular"
  },
  {
    "name": "Upamecano",
    "role": "Titular"
  },
  {
    "name": "Saliba",
    "role": "Titular"
  },
  {
    "name": "Cancelo",
    "role": "Titular"
  },
  {
    "name": "Joan Garcia",
    "role": "Titular"
  },
  {
    "name": "Guerrero",
    "role": "Reserva"
  },
  {
    "name": "Bednarek",
    "role": "Reserva"
  },
  {
    "name": "Asensio",
    "role": "Reserva"
  },
  {
    "name": "Kokçu",
    "role": "Reserva"
  },
  {
    "name": "Stiller",
    "role": "Reserva"
  },
  {
    "name": "Benitez",
    "role": "Reserva"
  },
  {
    "name": "Endrick",
    "role": "Reserva"
  }
];
const MATCH_COUNT = 15;
const STORAGE_KEY = "wl-tracker-365-editable-v2";

let state = loadState();
let currentMatch = 0;

function normalizePlayerName(name) {
  return String(name || "").trim();
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function defaultState() {
  return {
    players: clone(DEFAULT_PLAYERS),
    matches: createMatches(DEFAULT_PLAYERS),
    history: []
  };
}

function createMatches(players) {
  return Array.from({length: MATCH_COUNT}, (_, i) => ({
    id: i + 1,
    result: "",
    myScore: 0,
    oppScore: 0,
    players: players.map(p => ({ name: p.name, role: p.role, goals: 0, assists: 0, mvp: false }))
  }));
}

function loadState() {
  try {
    const loaded = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!loaded) return defaultState();
    if (!loaded.players) {
      loaded.players = clone(DEFAULT_PLAYERS);
    }
    if (!loaded.history) loaded.history = [];
    loaded.matches = syncMatchesWithSquad(loaded.matches || [], loaded.players);
    return loaded;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(id) { return document.getElementById(id); }

function syncMatchesWithSquad(matches, squad) {
  const synced = Array.from({length: MATCH_COUNT}, (_, i) => {
    const current = matches[i] || { id: i + 1, result: "", myScore: 0, oppScore: 0, players: [] };
    const currentByName = new Map((current.players || []).map(p => [p.name, p]));
    return {
      id: i + 1,
      result: current.result || "",
      myScore: Number(current.myScore || 0),
      oppScore: Number(current.oppScore || 0),
      players: squad.map(player => {
        const old = currentByName.get(player.name);
        return {
          name: player.name,
          role: player.role,
          goals: old ? Number(old.goals || 0) : 0,
          assists: old ? Number(old.assists || 0) : 0,
          mvp: old ? Boolean(old.mvp) : false
        };
      })
    };
  });
  return synced;
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.screen).classList.add("active");
    renderAll();
  });
});

function initControls() {
  const select = $("matchSelect");
  select.innerHTML = "";
  state.matches.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Jogo ${String(i+1).padStart(2,"0")}`;
    select.appendChild(opt);
  });
  select.addEventListener("change", e => {
    currentMatch = Number(e.target.value);
    renderMatch();
  });

  $("resultInput").addEventListener("change", e => {
    state.matches[currentMatch].result = e.target.value;
    saveState();
    renderAll();
  });

  $("myScore").addEventListener("input", e => {
    state.matches[currentMatch].myScore = Number(e.target.value || 0);
    saveState();
    renderAll();
  });

  $("oppScore").addEventListener("input", e => {
    state.matches[currentMatch].oppScore = Number(e.target.value || 0);
    saveState();
    renderAll();
  });

  $("clearMatch").addEventListener("click", () => {
    if (!confirm("Limpar todos os dados deste jogo?")) return;
    const clean = createMatches(state.players)[currentMatch];
    state.matches[currentMatch] = clean;
    saveState();
    renderAll();
  });

  $("resetAll").addEventListener("click", () => resetCurrentWL(false));
  $("resetCurrent").addEventListener("click", () => resetCurrentWL(false));

  $("newWL").addEventListener("click", () => {
    saveCurrentToHistory();
    state.matches = createMatches(state.players);
    currentMatch = 0;
    saveState();
    renderAll();
    alert("WL salva no histórico e nova WL iniciada.");
  });

  $("addPlayer").addEventListener("click", () => {
    const name = normalizePlayerName($("newPlayerName").value);
    const role = $("newPlayerRole").value;
    if (!name) return alert("Digite o nome do jogador.");
    if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return alert("Esse jogador já está no elenco.");
    }
    state.players.push({ name, role });
    state.matches = syncMatchesWithSquad(state.matches, state.players);
    $("newPlayerName").value = "";
    saveState();
    renderAll();
  });

  $("clearHistory").addEventListener("click", () => {
    if (!confirm("Limpar todo o histórico salvo?")) return;
    state.history = [];
    saveState();
    renderAll();
  });

  $("exportData").addEventListener("click", () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wl-tracker-365-dados.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

function resetCurrentWL(ask = true) {
  if (ask && !confirm("Resetar a WL atual sem salvar no histórico?")) return;
  state.matches = createMatches(state.players);
  currentMatch = 0;
  saveState();
  renderAll();
}

function totals(matches = state.matches, squad = state.players) {
  const map = new Map();
  squad.forEach(p => map.set(p.name, {...p, goals:0, assists:0, mvp:0, ga:0}));
  let wins = 0, losses = 0, rageQuits = 0, goalsFor = 0, goalsAgainst = 0;

  matches.forEach(m => {
    if (m.result === "Vitória") wins++;
    if (m.result === "Derrota") losses++;
    if (m.result === "Rage Quit") { rageQuits++; wins++; }
    goalsFor += Number(m.myScore || 0);
    goalsAgainst += Number(m.oppScore || 0);

    (m.players || []).forEach(p => {
      if (!map.has(p.name)) map.set(p.name, { name:p.name, role:p.role || "Antigo", goals:0, assists:0, mvp:0, ga:0 });
      const item = map.get(p.name);
      item.goals += Number(p.goals || 0);
      item.assists += Number(p.assists || 0);
      item.mvp += p.mvp ? 1 : 0;
      item.ga = item.goals + item.assists;
    });
  });

  const played = matches.filter(m => m.result).length;
  const arr = Array.from(map.values());
  return { players: arr, wins, losses, rageQuits, played, goalsFor, goalsAgainst };
}

function leader(players, key) {
  const sorted = [...players].sort((a,b) => b[key] - a[key]);
  return sorted[0] && sorted[0][key] > 0 ? `${sorted[0].name} (${sorted[0][key]})` : "—";
}

function saveCurrentToHistory() {
  const t = totals();
  const date = new Date().toLocaleString("pt-BR");
  state.history.unshift({
    id: Date.now(),
    date,
    record: `${t.wins}V - ${t.losses}D`,
    wins: t.wins,
    losses: t.losses,
    rageQuits: t.rageQuits,
    played: t.played,
    goalsFor: t.goalsFor,
    goalsAgainst: t.goalsAgainst,
    topScorer: leader(t.players, "goals"),
    topAssist: leader(t.players, "assists"),
    topMvp: leader(t.players, "mvp"),
    players: clone(state.players),
    matches: clone(state.matches)
  });
}

function renderHome() {
  const t = totals();
  $("wins").textContent = t.wins;
  $("losses").textContent = t.losses;
  $("rageQuits").textContent = t.rageQuits;
  $("winRate").textContent = t.played ? `${Math.round((t.wins / t.played) * 100)}%` : "0%";
  $("record").textContent = `${t.wins}V - ${t.losses}D`;
  $("topScorer").textContent = leader(t.players, "goals");
  $("topAssist").textContent = leader(t.players, "assists");
  $("topMvp").textContent = leader(t.players, "mvp");

  const wrap = $("matchOverview");
  wrap.innerHTML = "";
  state.matches.forEach(m => {
    const div = document.createElement("div");
    const cls = m.result === "Vitória" ? "win" : m.result === "Derrota" ? "loss" : m.result === "Rage Quit" ? "rq" : "";
    div.className = `match-chip ${cls}`;
    div.innerHTML = `<b>Jogo ${String(m.id).padStart(2,"0")}</b>
      <span>${m.result || "Não jogado"} · ${m.myScore} x ${m.oppScore}</span>`;
    wrap.appendChild(div);
  });
}

function renderMatch() {
  state.matches = syncMatchesWithSquad(state.matches, state.players);
  const m = state.matches[currentMatch] || state.matches[0];
  $("matchSelect").value = currentMatch;
  $("matchStatusText").textContent = `Jogo ${String(m.id).padStart(2,"0")}`;
  $("resultInput").value = m.result;
  $("myScore").value = m.myScore;
  $("oppScore").value = m.oppScore;

  const wrap = $("matchPlayers");
  wrap.innerHTML = "";
  m.players.forEach((p, idx) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <div class="player-name"><b>${p.name}</b><span>${p.role}</span></div>
      <div class="counter">
        <button data-action="dec" data-field="goals" data-idx="${idx}">−</button>
        <strong>${p.goals}</strong>
        <button data-action="inc" data-field="goals" data-idx="${idx}">+</button>
      </div>
      <div class="counter">
        <button data-action="dec" data-field="assists" data-idx="${idx}">−</button>
        <strong>${p.assists}</strong>
        <button data-action="inc" data-field="assists" data-idx="${idx}">+</button>
      </div>
      <button class="mvp-btn ${p.mvp ? "active" : ""}" data-mvp="${idx}">MVP</button>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.idx);
      const field = btn.dataset.field;
      const value = m.players[idx][field] || 0;
      m.players[idx][field] = btn.dataset.action === "inc" ? value + 1 : Math.max(0, value - 1);
      saveState();
      renderAll();
    });
  });

  wrap.querySelectorAll("button[data-mvp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.mvp);
      m.players.forEach(p => p.mvp = false);
      m.players[idx].mvp = true;
      saveState();
      renderAll();
    });
  });
}

function renderRankingBlock(id, players, key) {
  const wrap = $(id);
  wrap.innerHTML = "";
  const list = [...players].sort((a,b) => b[key] - a[key]).slice(0,8);
  if (!list.length) {
    wrap.innerHTML = `<p class="muted">Sem dados ainda.</p>`;
    return;
  }
  list.forEach((p, i) => {
    const line = document.createElement("div");
    line.className = "rank-line";
    line.innerHTML = `<span class="rank-pos">${i+1}</span><b>${p.name}</b><strong>${p[key]}</strong>`;
    wrap.appendChild(line);
  });
}

function renderRanking() {
  const t = totals();
  renderRankingBlock("goalsRanking", t.players, "goals");
  renderRankingBlock("assistsRanking", t.players, "assists");
  renderRankingBlock("gaRanking", t.players, "ga");
  renderRankingBlock("mvpRanking", t.players, "mvp");
}

function renderSquad() {
  const t = totals();
  const wrap = $("squadCards");
  wrap.innerHTML = "";
  t.players.forEach(p => {
    const card = document.createElement("div");
    card.className = "squad-card";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <small>${p.role}</small>
      <div class="squad-stats">
        <div><strong>${p.goals}</strong><span>Gols</span></div>
        <div><strong>${p.assists}</strong><span>Ast</span></div>
        <div><strong>${p.ga}</strong><span>Part.</span></div>
        <div><strong>${p.mvp}</strong><span>MVP</span></div>
      </div>`;
    wrap.appendChild(card);
  });
}

function renderManage() {
  const wrap = $("managePlayers");
  wrap.innerHTML = "";
  state.players.forEach((p, idx) => {
    const row = document.createElement("div");
    row.className = "manage-row";
    row.innerHTML = `
      <input value="${p.name.replace(/"/g, "&quot;")}" data-edit-name="${idx}" />
      <select data-edit-role="${idx}">
        <option value="Titular" ${p.role === "Titular" ? "selected" : ""}>Titular</option>
        <option value="Reserva" ${p.role === "Reserva" ? "selected" : ""}>Reserva</option>
      </select>
      <button class="ghost" data-save-player="${idx}">Salvar</button>
      <button class="danger subtle" data-remove-player="${idx}">Remover</button>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("[data-save-player]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.savePlayer);
      const nameInput = wrap.querySelector(`[data-edit-name="${idx}"]`);
      const roleInput = wrap.querySelector(`[data-edit-role="${idx}"]`);
      const oldName = state.players[idx].name;
      const newName = normalizePlayerName(nameInput.value);
      if (!newName) return alert("O nome não pode ficar vazio.");
      const duplicate = state.players.some((p, i) => i !== idx && p.name.toLowerCase() === newName.toLowerCase());
      if (duplicate) return alert("Já existe outro jogador com esse nome.");

      state.players[idx] = { name: newName, role: roleInput.value };
      state.matches.forEach(match => {
        const player = match.players.find(p => p.name === oldName);
        if (player) {
          player.name = newName;
          player.role = roleInput.value;
        }
      });
      state.matches = syncMatchesWithSquad(state.matches, state.players);
      saveState();
      renderAll();
    });
  });

  wrap.querySelectorAll("[data-remove-player]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.removePlayer);
      const name = state.players[idx].name;
      if (!confirm(`Remover ${name} da WL atual?`)) return;
      state.players.splice(idx, 1);
      state.matches.forEach(match => {
        match.players = match.players.filter(p => p.name !== name);
      });
      state.matches = syncMatchesWithSquad(state.matches, state.players);
      saveState();
      renderAll();
    });
  });
}

function renderHistory() {
  const wrap = $("historyList");
  wrap.innerHTML = "";
  if (!state.history.length) {
    wrap.innerHTML = `<div class="history-card"><div><h3>Nenhuma WL salva ainda</h3><p class="history-meta">Use “Salvar e iniciar nova WL” na aba Gerenciar.</p></div></div>`;
    return;
  }
  state.history.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-card";
    div.innerHTML = `
      <div>
        <h3>WL salva — <strong>${item.record}</strong></h3>
        <p class="history-meta">${item.date} · RQ: ${item.rageQuits} · Gols: ${item.goalsFor} · Sofridos: ${item.goalsAgainst}</p>
        <p class="history-meta">Artilheiro: ${item.topScorer} · Garçom: ${item.topAssist} · MVP: ${item.topMvp}</p>
      </div>
      <button class="ghost" data-load-history="${item.id}">Rever</button>
    `;
    wrap.appendChild(div);
  });

  wrap.querySelectorAll("[data-load-history]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = state.history.find(h => String(h.id) === String(btn.dataset.loadHistory));
      if (!item) return;
      alert(`Resumo da WL:\nCampanha: ${item.record}\nArtilheiro: ${item.topScorer}\nGarçom: ${item.topAssist}\nMVP: ${item.topMvp}`);
    });
  });
}

function renderSummary() {
  const t = totals();
  $("summaryRecord").textContent = `${t.wins}V - ${t.losses}D`;
  $("summaryScorer").textContent = leader(t.players, "goals");
  $("summaryAssist").textContent = leader(t.players, "assists");
  $("summaryMvp").textContent = leader(t.players, "mvp");
  $("summaryGoals").textContent = t.goalsFor;
}

function renderAll() {
  state.matches = syncMatchesWithSquad(state.matches, state.players);
  renderHome();
  renderMatch();
  renderRanking();
  renderSquad();
  renderManage();
  renderHistory();
  renderSummary();
}

initControls();
renderAll();
saveState();
