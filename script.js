const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const ui = {
  score: document.getElementById("score"), wave: document.getElementById("wave"), crystals: document.getElementById("crystals"),
  buildInfo: document.getElementById("buildInfo"), hpFill: document.getElementById("hpFill"), xpFill: document.getElementById("xpFill"),
  menu: document.getElementById("menu"), upgradeMenu: document.getElementById("upgradeMenu"), playBtn: document.getElementById("playBtn"),
  upgradeChoices: document.getElementById("upgradeChoices"), upgradeTitle: document.querySelector("#upgradeMenu h2"),
  lastRunInfo: document.getElementById("lastRunInfo"), menuCrystals: document.getElementById("menuCrystals"), shopList: document.getElementById("shopList"),
  difficultySelect: document.getElementById("difficultySelect"), upgradeChoicesSelect: document.getElementById("upgradeChoicesSelect"), bossEverySelect: document.getElementById("bossEverySelect")
};

const world = { width: 2800, height: 2000 }, camera = { x: 1400, y: 1000 }, keys = {}, stars = [];
let bullets = [], enemies = [], enemyProjectiles = [], particles = [], running = false, choosingUpgrade = false, lastTime = 0, runHits = 0;

const difficultyConfig = {
  normal: { spawnMul: 1, enemyHpMul: 1, enemyDmgMul: 1, scoreMul: 1, crystalMul: 1, label: "Normal" },
  hard: { spawnMul: 1.3, enemyHpMul: 1.3, enemyDmgMul: 1.3, scoreMul: 1.25, crystalMul: 1.25, label: "Dificil" },
  insane: { spawnMul: 1.6, enemyHpMul: 1.65, enemyDmgMul: 1.7, scoreMul: 1.6, crystalMul: 1.6, label: "Insano" }
};

const persistent = loadPersistent();
const shopUpgrades = [
  { id: "core_damage", label: "Nucleo de Dano", desc: "+15% dano permanente", baseCost: 50, growth: 1.6, applyLevel: (l) => 1 + l * 0.15 },
  { id: "core_rate", label: "Nucleo de Cadencia", desc: "+12% cadencia permanente", baseCost: 50, growth: 1.58, applyLevel: (l) => 1 + l * 0.12 },
  { id: "core_hp", label: "Casco Reforcado", desc: "+18% vida maxima permanente", baseCost: 60, growth: 1.6, applyLevel: (l) => 1 + l * 0.18 }
];
const runUpgrades = [
  { name: "Canhao Instavel", text: "+28% dano", apply: () => { game.player.damage *= 1.28; } },
  { name: "Gatilho Turbo", text: "+20% cadencia", apply: () => { game.player.fireRate *= 1.2; } },
  { name: "Motor Plasma", text: "+20% velocidade", apply: () => { game.player.speed *= 1.2; } },
  { name: "Blindagem Adaptativa", text: "+40 HP max", apply: () => { game.player.maxHp += 40; game.player.hp += 40; } },
  { name: "Visor de Precisao", text: "+8% critico", apply: () => { game.player.critChance = clamp(game.player.critChance + 0.08, 0, 0.65); } },
  { name: "Nano Reparadores", text: "+1.2 HP/s", apply: () => { game.player.regen += 1.2; } }
];

const game = {
  score: 0, wave: 1, elapsed: 0, waveTimer: 0, spawnTimer: 0, playerLevel: 1,
  xp: 0, xpToNext: 90, crystalsRun: 0, bossSpawnedForWave: false, player: createPlayerState()
};

function createPlayerState() {
  return { x: 1400, y: 1000, radius: 16, speed: 300, maxHp: 140, hp: 140, fireRate: 5.5, damage: 22, critChance: 0.1, critMultiplier: 2, regen: 0, damageReduction: 0, cooldown: 0 };
}

function loadPersistent() {
  const base = { crystals: 0, settings: { difficulty: "normal", upgradeChoices: 3, bossEvery: 5 }, meta: { core_damage: 0, core_rate: 0, core_hp: 0 } };
  try {
    const raw = localStorage.getItem("game2_save");
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      crystals: Math.max(0, Number(parsed.crystals) || 0),
      settings: {
        difficulty: parsed.settings?.difficulty || base.settings.difficulty,
        upgradeChoices: clamp(Number(parsed.settings?.upgradeChoices) || 3, 3, 5),
        bossEvery: clamp(Number(parsed.settings?.bossEvery) || 5, 4, 6)
      },
      meta: { ...base.meta, ...(parsed.meta || {}) }
    };
  } catch { return base; }
}
function savePersistent() { localStorage.setItem("game2_save", JSON.stringify(persistent)); }

function applyMetaStats() {
  game.player.damage *= shopUpgrades[0].applyLevel(persistent.meta.core_damage || 0);
  game.player.fireRate *= shopUpgrades[1].applyLevel(persistent.meta.core_rate || 0);
  game.player.maxHp = Math.round(game.player.maxHp * shopUpgrades[2].applyLevel(persistent.meta.core_hp || 0));
  game.player.hp = game.player.maxHp;
}

function initStars() {
  stars.length = 0;
  for (let i = 0; i < 180; i += 1) stars.push({ x: Math.random() * world.width, y: Math.random() * world.height, size: Math.random() * 2 + 0.4, speed: Math.random() * 28 + 16 });
}

function resetRun() {
  bullets = []; enemies = []; enemyProjectiles = []; particles = []; runHits = 0;
  game.score = 0; game.wave = 1; game.elapsed = 0; game.waveTimer = 0; game.spawnTimer = 0; game.playerLevel = 1;
  game.xp = 0; game.xpToNext = 90; game.crystalsRun = 0; game.bossSpawnedForWave = false; game.player = createPlayerState();
  applyMetaStats(); syncCamera();
}
function startRun() { resetRun(); running = true; choosingUpgrade = false; ui.menu.classList.add("hidden"); ui.upgradeMenu.classList.add("hidden"); }
function endRun() {
  running = false;
  const diff = getDifficulty(), penalty = Math.min(0.35, runHits * 0.007);
  const gained = Math.floor((Math.floor(game.score / 42) + game.wave * 2 + game.crystalsRun) * diff.crystalMul * (1 - penalty));
  persistent.crystals += gained; savePersistent(); buildShop();
  ui.lastRunInfo.textContent = `Ultima run: Wave ${game.wave} | Score ${Math.floor(game.score)} | Cristais +${gained}`;
  ui.menu.classList.remove("hidden");
}

function levelUp() {
  const choices = shuffle(runUpgrades).slice(0, clamp(Number(persistent.settings.upgradeChoices) || 3, 3, 5));
  running = false; choosingUpgrade = true; ui.upgradeTitle.textContent = "Level Up! Escolha um upgrade"; ui.upgradeChoices.innerHTML = "";
  for (const choice of choices) {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${choice.name} - ${choice.text}`;
    btn.addEventListener("click", () => { choice.apply(); choosingUpgrade = false; running = true; ui.upgradeMenu.classList.add("hidden"); updateUi(); });
    ui.upgradeChoices.appendChild(btn);
  }
  ui.upgradeMenu.classList.remove("hidden");
}

function buildShop() {
  ui.shopList.innerHTML = ""; ui.menuCrystals.textContent = persistent.crystals;
  for (const item of shopUpgrades) {
    const level = persistent.meta[item.id] || 0, cost = Math.floor(item.baseCost * Math.pow(item.growth, level));
    const row = document.createElement("div");
    row.className = "shop-item";
    row.innerHTML = `<div><strong>${item.label}</strong><br><small>${item.desc} | Nv. ${level}</small></div>`;
    const btn = document.createElement("button");
    btn.textContent = `Comprar (${cost})`;
    btn.disabled = persistent.crystals < cost;
    btn.addEventListener("click", () => {
      if (persistent.crystals < cost) return;
      persistent.crystals -= cost; persistent.meta[item.id] = level + 1; savePersistent(); buildShop(); updateUi();
    });
    row.appendChild(btn); ui.shopList.appendChild(row);
  }
}

function update(dt) {
  if (!running) return;
  const diff = getDifficulty();
  game.elapsed += dt; game.waveTimer += dt; game.spawnTimer += dt;
  if (game.player.regen > 0) game.player.hp = clamp(game.player.hp + game.player.regen * dt, 0, game.player.maxHp);
  if (game.waveTimer > Math.max(8, 13 - game.wave * 0.25)) { game.wave += 1; game.waveTimer = 0; game.bossSpawnedForWave = false; }

  const mx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), my = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0), mag = Math.hypot(mx, my) || 1;
  game.player.x = clamp(game.player.x + (mx / mag) * game.player.speed * dt, 16, world.width - 16);
  game.player.y = clamp(game.player.y + (my / mag) * game.player.speed * dt, 16, world.height - 16);
  syncCamera();

  game.player.cooldown -= dt;
  if (game.player.cooldown <= 0) { fire(); game.player.cooldown = 1 / Math.max(0.5, game.player.fireRate); }

  const bossWave = game.wave >= persistent.settings.bossEvery && game.wave % persistent.settings.bossEvery === 0;
  if (bossWave && !game.bossSpawnedForWave && !enemies.some((e) => e.type === "boss")) { spawnEnemy("boss", diff); game.bossSpawnedForWave = true; }

  const spawnEvery = Math.max(0.11, 0.65 / ((1 + game.wave * 0.2) * diff.spawnMul));
  while (game.spawnTimer > spawnEvery) { game.spawnTimer -= spawnEvery; spawnEnemy(chooseEnemyType(game.wave), diff); }

  bullets = bullets.filter((b) => (b.x += b.vx * dt, b.y += b.vy * dt, (b.life -= dt) > 0));
  enemyProjectiles = enemyProjectiles.filter((p) => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (distance(p, game.player) < p.r + game.player.radius) { game.player.hp -= p.damage * (1 - game.player.damageReduction); runHits += 1; return false; }
    return p.life > 0;
  });

  for (const enemy of enemies) {
    const dx = game.player.x - enemy.x, dy = game.player.y - enemy.y, dist = Math.hypot(dx, dy) || 1;
    if (enemy.type === "shooter" || enemy.type === "boss") {
      const keep = enemy.type === "boss" ? 260 : 220, dir = dist > keep ? 1 : -0.25;
      enemy.x += (dx / dist) * enemy.speed * dir * dt;
      enemy.y += (dy / dist) * enemy.speed * dir * dt;
      enemy.shootCd -= dt;
      if (enemy.shootCd <= 0) {
        spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, enemy.type === "boss" ? 250 : 220, enemy.damage);
        enemy.shootCd = enemy.type === "boss" ? 0.65 : 1.5;
      }
    } else if (enemy.type === "dasher") {
      enemy.dashCd -= dt;
      if (enemy.dashCd <= 0) { enemy.dashCd = 1.7; enemy.dashTime = 0.25; }
      const mul = enemy.dashTime > 0 ? 2.4 : 1;
      enemy.x += (dx / dist) * enemy.speed * mul * dt;
      enemy.y += (dy / dist) * enemy.speed * mul * dt;
      enemy.dashTime -= dt;
    } else {
      enemy.x += (dx / dist) * enemy.speed * dt;
      enemy.y += (dy / dist) * enemy.speed * dt;
    }
  }

  resolveCollisions();
  particles = particles.filter((p) => (p.x += p.vx * dt, p.y += p.vy * dt, (p.life -= dt) > 0));
  if (game.player.hp <= 0) endRun();
  updateUi();
}

function resolveCollisions() {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    if (distance(e, game.player) < e.r + game.player.radius) {
      enemies.splice(i, 1); game.player.hp -= e.contact * (1 - game.player.damageReduction); runHits += 1; continue;
    }
    for (let b = bullets.length - 1; b >= 0; b -= 1) {
      if (distance(e, bullets[b]) < e.r + bullets[b].r) {
        e.hp -= bullets[b].damage; bullets.splice(b, 1);
        if (e.hp <= 0) { enemies.splice(i, 1); onEnemyKilled(e); break; }
      }
    }
  }
}

function onEnemyKilled(enemy) {
  const diff = getDifficulty();
  game.score += enemy.value * diff.scoreMul; game.xp += enemy.xp; game.crystalsRun += enemy.crystal; spawnBurst(enemy.x, enemy.y, 10, "#8cfccf");
  if (game.xp >= game.xpToNext) { game.xp -= game.xpToNext; game.xpToNext = Math.floor(game.xpToNext * 1.17); game.playerLevel += 1; levelUp(); }
}

function fire() {
  const target = enemies.reduce((best, e) => (!best || distance(e, game.player) < distance(best, game.player) ? e : best), null);
  const angle = target ? Math.atan2(target.y - game.player.y, target.x - game.player.x) : -Math.PI / 2;
  const crit = Math.random() < game.player.critChance;
  bullets.push({ x: game.player.x, y: game.player.y, vx: Math.cos(angle) * 640, vy: Math.sin(angle) * 640, r: crit ? 5 : 4, life: 1.5, damage: crit ? game.player.damage * game.player.critMultiplier : game.player.damage });
}

function chooseEnemyType(wave) {
  const pool = ["chaser", "tank"];
  if (wave >= 3) pool.push("dasher");
  if (wave >= 4) pool.push("shooter");
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnEnemy(type, diff) {
  const side = Math.floor(Math.random() * 4), margin = 40;
  const left = camera.x - canvas.width / 2, right = camera.x + canvas.width / 2, top = camera.y - canvas.height / 2, bottom = camera.y + canvas.height / 2;
  const x = side === 1 ? right + margin : side === 3 ? left - margin : Math.random() * canvas.width + left;
  const y = side === 0 ? top - margin : side === 2 ? bottom + margin : Math.random() * canvas.height + top;
  const t = getEnemyTemplate(type);
  enemies.push({ ...t, type, x: clamp(x, 24, world.width - 24), y: clamp(y, 24, world.height - 24), hp: t.hp * diff.enemyHpMul, maxHp: t.hp * diff.enemyHpMul, contact: t.contact * diff.enemyDmgMul, damage: t.damage * diff.enemyDmgMul, shootCd: t.shootCd || 99, dashCd: 1.5 + Math.random() * 0.8, dashTime: 0 });
}

function getEnemyTemplate(type) {
  if (type === "tank") return { r: 19, speed: 82, hp: 220, value: 34, xp: 22, crystal: 2, contact: 24, damage: 18 };
  if (type === "dasher") return { r: 12, speed: 138, hp: 105, value: 26, xp: 18, crystal: 1, contact: 16, damage: 14 };
  if (type === "shooter") return { r: 13, speed: 108, hp: 130, value: 30, xp: 20, crystal: 1, contact: 14, damage: 16, shootCd: 1.4 };
  if (type === "boss") return { r: 44, speed: 72, hp: 1750 + game.wave * 220, value: 350, xp: 180, crystal: 8, contact: 30, damage: 20, shootCd: 0.7 };
  return { r: 14, speed: 126, hp: 92, value: 22, xp: 15, crystal: 1, contact: 14, damage: 14 };
}

function spawnEnemyProjectile(x, y, tx, ty, speed, damage) {
  const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
  enemyProjectiles.push({ x, y, vx: (dx / d) * speed, vy: (dy / d) * speed, damage, r: 4, life: 2.2 });
}

function render() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#071732"); grad.addColorStop(1, "#030916");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

  ctx.fillStyle = "rgba(204, 231, 255, 0.85)";
  for (const s of stars) ctx.fillRect(s.x, s.y, s.size, s.size);

  ctx.fillStyle = "#18f4ff";
  ctx.beginPath();
  ctx.moveTo(game.player.x, game.player.y - 18);
  ctx.lineTo(game.player.x - 14, game.player.y + 16);
  ctx.lineTo(game.player.x + 14, game.player.y + 16);
  ctx.closePath();
  ctx.fill();

  for (const b of bullets) { ctx.fillStyle = "#ffd46a"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
  for (const p of enemyProjectiles) { ctx.fillStyle = "#ff8a58"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }

  for (const e of enemies) {
    const c = e.type === "boss" ? ["#ff245f", "#ffd1dc"] : e.type === "tank" ? ["#7f55cc", "#ccb4ff"] : e.type === "dasher" ? ["#ff8d37", "#ffd5a8"] : e.type === "shooter" ? ["#2db3ff", "#c4f1ff"] : ["#ff9f4f", "#ff7f2e"];
    ctx.fillStyle = c[0]; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c[1]; ctx.lineWidth = 2; ctx.stroke();
  }

  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = `${p.color}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  ctx.restore();
}

function updateUi() {
  ui.score.textContent = Math.floor(game.score);
  ui.wave.textContent = game.wave;
  ui.crystals.textContent = persistent.crystals + game.crystalsRun;
  ui.buildInfo.textContent = `${difficultyConfig[persistent.settings.difficulty].label} | Build Base | 5 inimigos`;
  ui.menuCrystals.textContent = persistent.crystals;
  ui.hpFill.style.width = `${(game.player.hp / game.player.maxHp) * 100}%`;
  ui.xpFill.style.width = `${(game.xp / game.xpToNext) * 100}%`;
}

function animate(ts) {
  const dt = Math.min(0.033, (ts - lastTime) / 1000 || 0);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(animate);
}

function spawnBurst(x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2, speed = Math.random() * 160 + 30;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: Math.random() * 0.35 + 0.2, maxLife: 0.55, size: Math.random() * 3 + 1, color });
  }
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function getDifficulty() { return difficultyConfig[persistent.settings.difficulty] || difficultyConfig.normal; }
function syncCamera() { camera.x = clamp(game.player.x, canvas.width / 2, world.width - canvas.width / 2); camera.y = clamp(game.player.y, canvas.height / 2, world.height - canvas.height / 2); }

function syncOptionsUi() {
  ui.difficultySelect.value = persistent.settings.difficulty;
  ui.upgradeChoicesSelect.value = String(persistent.settings.upgradeChoices);
  ui.bossEverySelect.value = String(persistent.settings.bossEvery);
}

function bindSettings() {
  ui.difficultySelect.addEventListener("change", () => { persistent.settings.difficulty = ui.difficultySelect.value; savePersistent(); updateUi(); });
  ui.upgradeChoicesSelect.addEventListener("change", () => { persistent.settings.upgradeChoices = clamp(Number(ui.upgradeChoicesSelect.value) || 3, 3, 5); savePersistent(); });
  ui.bossEverySelect.addEventListener("change", () => { persistent.settings.bossEvery = clamp(Number(ui.bossEverySelect.value) || 5, 4, 6); savePersistent(); });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(640, Math.floor(rect.width * dpr)), h = Math.max(400, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h; initStars();
    if (!running) { game.player.x = 1400; game.player.y = 1000; syncCamera(); }
  }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.ArrowUp = true;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.ArrowDown = true;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.ArrowLeft = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.ArrowRight = true;
  if (!running && !choosingUpgrade && e.code === "Enter") startRun();
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.ArrowUp = false;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.ArrowDown = false;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.ArrowLeft = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.ArrowRight = false;
});

ui.playBtn.addEventListener("click", startRun);
window.addEventListener("resize", resizeCanvas);
buildShop();
syncOptionsUi();
bindSettings();
resizeCanvas();
updateUi();
requestAnimationFrame(animate);
