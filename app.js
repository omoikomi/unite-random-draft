/* ===== UNITE ランダムドラフト ===== */

const SLOT_ASSIGN = {
  // 選択順 -> 行
  1: "top", 2: "bottom", 3: "bottom", 4: "top", 5: "top",
  6: "bottom", 7: "bottom", 8: "top", 9: "top", 10: "bottom",
};
// 上行に並ぶ順 / 下行に並ぶ順 (※選択順そのものを表示)
const TOP_ORDER    = [1, 4, 5, 8, 9];
const BOTTOM_ORDER = [2, 3, 6, 7, 10];

const ALL_ROLES = ["Atk", "Def", "Spd", "Sup", "Bal"];
const ROLE_LABEL = {
  Atk: "アタック型", Def: "ディフェンス型", Spd: "スピード型",
  Sup: "サポート型", Bal: "バランス型",
};

const state = {
  allPokemon: [],     // {file,name,role}[]
  pool: [],           // 抽選プール
  picks: [],          // 選択順に積む {file,name,role}
  pickCount: 10,
  roles: new Set(ALL_ROLES),  // チェック済みロール
  bans:  new Set(),           // BANされた file 名
};

const MIN_PICK = 1;

// ── 起動 ─────────────────────────────────────────────
(async function init() {
  try {
    const res = await fetch("data/pokemon.json?ts=" + Date.now());
    state.allPokemon = await res.json();
  } catch (e) {
    document.getElementById("setupInfo").textContent =
      "pokemon.json の読み込みに失敗しました: " + e.message;
    return;
  }
  bindSetup();
  rebuildSetup();
})();

// ── 条件設定画面 ───────────────────────────────────────
function rebuildSetup() {
  const available = availablePool();
  const filtered = filteredPool();
  const maxN = Math.max(MIN_PICK, available.length);
  if (state.pickCount < MIN_PICK) state.pickCount = MIN_PICK;
  if (state.pickCount > maxN) state.pickCount = maxN;
  document.getElementById("pickCount").textContent = state.pickCount;
  document.getElementById("pickDec").disabled = state.pickCount <= MIN_PICK;
  document.getElementById("pickInc").disabled = state.pickCount >= maxN;

  const roleLabel = state.roles.size === ALL_ROLES.length
    ? "全て"
    : Array.from(state.roles).map(r => ROLE_LABEL[r]).join("/") || "(なし)";
  const bansInScope = filtered.filter(p => state.bans.has(p.file)).length;
  const banBadge = document.getElementById("banCount");
  banBadge.textContent = state.bans.size;
  banBadge.classList.toggle("zero", state.bans.size === 0);
  document.getElementById("setupInfo").textContent =
    `候補: ${available.length}体 (${roleLabel}, BAN ${bansInScope}体除く) ／ 最大${maxN}体まで抽選可能`;
}

function bindSetup() {
  document.getElementById("pickDec").addEventListener("click", () => {
    state.pickCount = Math.max(MIN_PICK, state.pickCount - 1);
    rebuildSetup();
  });
  document.getElementById("pickInc").addEventListener("click", () => {
    const maxN = Math.max(MIN_PICK, availablePool().length);
    state.pickCount = Math.min(maxN, state.pickCount + 1);
    rebuildSetup();
  });
  document.getElementById("banOpenBtn").addEventListener("click", openBan);
  document.getElementById("banDoneBtn").addEventListener("click", closeBan);
  document.getElementById("banClearBtn").addEventListener("click", () => {
    state.bans.clear();
    renderBanGrid();
    rebuildSetup();
  });
  document.querySelectorAll('.role-cb').forEach(cb => {
    cb.addEventListener("change", e => {
      if (e.target.checked) state.roles.add(e.target.value);
      else state.roles.delete(e.target.value);
      syncAllCheckbox();
      rebuildSetup();
    });
  });
  document.getElementById("roleAll").addEventListener("change", e => {
    const on = e.target.checked;
    document.querySelectorAll('.role-cb').forEach(cb => {
      cb.checked = on;
      if (on) state.roles.add(cb.value);
      else state.roles.delete(cb.value);
    });
    rebuildSetup();
  });
  document.getElementById("startBtn").addEventListener("click", onStart);
  document.getElementById("resetBtn").addEventListener("click", onReset);
  document.getElementById("rerollBtn").addEventListener("click", onReroll);
  document.getElementById("backBtn").addEventListener("click", onBackToSetup);
}

function syncAllCheckbox() {
  const all = document.getElementById("roleAll");
  all.checked = state.roles.size === ALL_ROLES.length;
}

function filteredPool() {
  if (state.roles.size === 0) return [];
  return state.allPokemon.filter(p => state.roles.has(p.role));
}

function availablePool() {
  return filteredPool().filter(p => !state.bans.has(p.file));
}

// ── Global BAN 画面 ──────────────────────────────────
function openBan() {
  renderBanGrid();
  show("view-ban");
}
function closeBan() {
  show("view-setup");
  rebuildSetup();
}
function renderBanGrid() {
  const grid = document.getElementById("banGrid");
  grid.innerHTML = "";
  const filtered = filteredPool();
  filtered.forEach(p => {
    const el = document.createElement("div");
    el.className = "ban-item";
    el.dataset.role = p.role;
    el.dataset.file = p.file;
    if (state.bans.has(p.file)) el.classList.add("banned");
    el.innerHTML =
      `<span class="role-tag"></span>` +
      `<img src="assets/characters/${encodeURIComponent(p.file)}" alt="${escapeHtml(p.name)}">`;
    el.addEventListener("click", () => onToggleBan(p, el));
    grid.appendChild(el);
  });
  updateBanStatus();
  updateBanDisabled();
}
function onToggleBan(p, el) {
  if (state.bans.has(p.file)) {
    state.bans.delete(p.file);
    el.classList.remove("banned");
  } else {
    // 制約: 残り (filtered - bans) >= pickCount
    const filtered = filteredPool();
    const wouldRemain = filtered.filter(x => !state.bans.has(x.file) && x.file !== p.file).length;
    if (wouldRemain < state.pickCount) {
      // 上限に達しているので何もしない
      return;
    }
    state.bans.add(p.file);
    el.classList.add("banned");
  }
  updateBanStatus();
  updateBanDisabled();
}
function updateBanStatus() {
  const filtered = filteredPool();
  const bansInScope = filtered.filter(p => state.bans.has(p.file)).length;
  const remain = filtered.length - bansInScope;
  document.getElementById("banStatus").textContent =
    `BAN ${bansInScope}体 / 残り ${remain}体 (PickCount ${state.pickCount} 以上を維持)`;
}
function updateBanDisabled() {
  // BAN 不可な未BAN項目を視覚的に disabled
  const filtered = filteredPool();
  const bansInScope = filtered.filter(p => state.bans.has(p.file)).length;
  const canMoreBan = (filtered.length - bansInScope) > state.pickCount;
  document.querySelectorAll(".ban-item").forEach(el => {
    const isBanned = el.classList.contains("banned");
    el.classList.toggle("disabled", !isBanned && !canMoreBan);
  });
}

// ── 抽選 & 画面遷移 ───────────────────────────────────
function onStart() {
  const candidates = availablePool();
  if (candidates.length === 0) {
    alert("ロールを1つ以上選択してください。");
    return;
  }
  if (candidates.length < state.pickCount) {
    alert(`候補が ${candidates.length}体しかありません。条件を見直してください。`);
    return;
  }
  state.pool = shuffle(candidates).slice(0, state.pickCount);
  state.picks = [];
  renderDraft();
  show("view-draft");
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── ドラフト描画 ───────────────────────────────────────
function renderDraft() {
  const rowTop    = document.getElementById("rowTop");
  const rowBottom = document.getElementById("rowBottom");
  rowTop.innerHTML = ""; rowBottom.innerHTML = "";

  const total = state.pickCount;
  const draftView = document.getElementById("view-draft");
  if (total < 10) {
    // 単列モード: 上行のみ、1..total を順番に表示
    draftView.classList.add("single-row");
    for (let i = 1; i <= total; i++) rowTop.appendChild(buildSlot(i));
  } else {
    // 通常モード: TOP_ORDER / BOTTOM_ORDER の順
    draftView.classList.remove("single-row");
    for (const idx of TOP_ORDER)    if (idx <= total) rowTop.appendChild(buildSlot(idx));
    for (const idx of BOTTOM_ORDER) if (idx <= total) rowBottom.appendChild(buildSlot(idx));
  }

  const pool = document.getElementById("pool");
  pool.innerHTML = "";
  state.pool.forEach((p, i) => {
    const el = document.createElement("div");
    el.className = "pick";
    el.dataset.role = p.role;
    el.dataset.idx = i;
    el.innerHTML =
      `<span class="role-tag"></span>` +
      `<img src="assets/characters/${encodeURIComponent(p.file)}" alt="${escapeHtml(p.name)}">`;
    el.addEventListener("click", () => onPick(i, el));
    pool.appendChild(el);
  });

  refreshSlots();
}

function buildSlot(selIndex) {
  const div = document.createElement("div");
  div.className = "slot";
  div.dataset.sel = selIndex;
  div.setAttribute("data-num", selIndex);
  return div;
}

function refreshSlots(flashSel) {
  document.querySelectorAll(".slot").forEach(s => {
    const idx = parseInt(s.dataset.sel, 10);
    const pick = state.picks[idx - 1];
    s.classList.toggle("filled", !!pick);
    s.querySelectorAll("img").forEach(n => n.remove());
    if (pick) {
      const img = document.createElement("img");
      img.src = `assets/characters/${encodeURIComponent(pick.file)}`;
      img.alt = pick.name;
      s.appendChild(img);
    }
    if (flashSel && idx === flashSel) {
      s.classList.remove("flash");
      void s.offsetWidth; // reflow
      s.classList.add("flash");
    }
  });
}

// ── ピックアップ操作 ───────────────────────────────────
function onPick(poolIdx, el) {
  if (el.classList.contains("picked") || el.classList.contains("picking")) return;
  if (state.picks.length >= state.pickCount) return;
  const p = state.pool[poolIdx];
  state.picks.push(p);
  const selIndex = state.picks.length;
  el.classList.add("picking");
  refreshSlots(selIndex);
  setTimeout(() => {
    el.classList.remove("picking");
    el.classList.add("picked");
  }, 340);
}

function onReset() {
  state.picks = [];
  document.querySelectorAll(".pick.picked, .pick.picking").forEach(el => {
    el.classList.remove("picked");
    el.classList.remove("picking");
  });
  refreshSlots();
}

function onReroll() {
  onStart();  // 同じ条件で再抽選
}

function onBackToSetup() {
  show("view-setup");
}

// ── ユーティリティ ────────────────────────────────────
function show(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === viewId));
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
