const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.getElementById("score"),
  wave: document.getElementById("wave"),
  crystals: document.getElementById("crystals"),
  buildInfo: document.getElementById("buildInfo"),
  hpFill: document.getElementById("hpFill"),
  xpFill: document.getElementById("xpFill"),
  menu: document.getElementById("menu"),
  gameOver: document.getElementById("gameOver"),
  upgradeMenu: document.getElementById("upgradeMenu"),
  playBtn: document.getElementById("playBtn"),
  retryBtn: document.getElementById("retryBtn"),
  gameOverText: document.getElementById("gameOverText"),
  upgradeChoices: document.getElementById("upgradeChoices"),
  upgradeTitle: document.querySelector("#upgradeMenu h2"),
  lastRunInfo: document.getElementById("lastRunInfo"),
  menuCrystals: document.getElementById("menuCrystals"),
  shopList: document.getElementById("shopList"),
  autoFireToggle: document.getElementById("autoFireToggle"),
  difficultySelect: document.getElementById("difficultySelect"),
  upgradeChoicesSelect: document.getElementById("upgradeChoicesSelect"),
  bossEverySelect: document.getElementById("bossEverySelect")
};

const world = { width: 3200, height: 2400 };
const camera = { x: 1600, y: 1200 };
const keys = {};
const stars = [];

let particles = [];
let bullets = [];
let enemies = [];
let enemyProjectiles = [];
let running = false;
let choosingUpgrade = false;
let lastTime = 0;
let shootPressed = false;
let runHits = 0;

const shopUpgrades = [
  { id: "core_damage", label: "Núcleo de Dano", desc: "+18% dano permanente", baseCost: 50, growth: 1.6, apply: (level) => 1 + level * 0.18 },
  { id: "core_rate", label: "Núcleo de Cadência", desc: "+15% cadência permanente", baseCost: 50, growth: 1.58, apply: (level) => 1 + level * 0.15 },
  { id: "core_hp", label: "Casco de Titânio", desc: "+20% vida máxima permanente", baseCost: 60, growth: 1.62, apply: (level) => 1 + level * 0.2 },
  { id: "core_speed", label: "Servos Vetoriais", desc: "+12% velocidade permanente", baseCost: 48, growth: 1.58, apply: (level) => 1 + level * 0.12 },
  { id: "core_crit", label: "Matriz de Mira", desc: "+5% chance crítico permanente", baseCost: 55, growth: 1.65, apply: (level) => level * 0.05 },
  { id: "core_regen", label: "Nano Reparadores", desc: "+0.5 regen HP/s permanente", baseCost: 65, growth: 1.7, apply: (level) => level * 0.5 },
  { id: "core_economy", label: "Coletor Quântico", desc: "+10% cristais por level permanente", baseCost: 60, growth: 1.63, apply: (level) => 1 + level * 0.1 }
];

const runUpgrades = [
  { name: "Canhão Instável", text: "+30% dano", apply: () => { game.player.damage *= 1.3; } },
  { name: "Gatilho Turbo", text: "+22% cadência", apply: () => { game.player.fireRate *= 1.22; } },
  { name: "Motor Plasma", text: "+25% velocidade", apply: () => { game.player.speed *= 1.25; } },
  { name: "Blindagem Adaptativa", text: "+50 HP máximo", apply: () => { game.player.maxHp += 50; } },
  { name: "Visor de Precisão", text: "+10% chance crítico", apply: () => { game.player.critChance += 0.1; } },
  { name: "Amplificador Crítico", text: "+30% dano crítico", apply: () => { game.player.critMultiplier += 0.3; } },
  { name: "Ritmo de Combate", text: "+15% dano e +15% cadência", apply: () => { game.player.damage *= 1.15; game.player.fireRate *= 1.15; } },
  { name: "Nano Reparadores", text: "+1.8 HP/s de regeneração", apply: () => { game.player.regen += 1.8; } },
  { name: "Blindagem Reativa", text: "+15% redução de dano", apply: () => { game.player.damageReduction = clamp(game.player.damageReduction + 0.15, 0, 0.65); } },
  { name: "Matriz de Aprendizado", text: "+28% ganho de XP", apply: () => { game.player.xpGainMul *= 1.28; } },
  { name: "Núcleo Vampírico", text: "+6% roubo de vida em kills", apply: () => { game.player.lifeSteal += 0.06; } },
  { name: "Instinto Predador", text: "+18% velocidade e +15% cadência", apply: () => { game.player.speed *= 1.18; game.player.fireRate *= 1.15; } },
  { name: "Disparo Duplo", text: "+1 projétil por tiro", apply: () => { game.player.multishot += 1; } },
  { name: "Padrão de Espalhamento", text: "+8° abertura de tiros", apply: () => { game.player.spread += 8; } }
];

const difficultyConfig = {
  normal: { spawnMul: 1.15, enemyHpMul: 1.12, enemyDmgMul: 1.1, scoreMul: 1, crystalMul: 1, label: "Normal" },
  hard: { spawnMul: 1.45, enemyHpMul: 1.55, enemyDmgMul: 1.5, scoreMul: 1.3, crystalMul: 1.3, label: "Difícil" },
  insane: { spawnMul: 1.75, enemyHpMul: 1.85, enemyDmgMul: 2.0, scoreMul: 1.65, crystalMul: 1.65, label: "Insano" }
};

const persistent = loadPersistent();

const game = {
  score: 0,
  wave: 1,
  elapsed: 0,
  kills: 0,
  waveTimer: 0,
  spawnTimer: 0,
  bossSpawnedForWave: false,
  xp: 0,
  xpToNext: 100,
  crystalsRun: 0,
  playerLevel: 1,
  player: {
    x: 1600,
    y: 1200,
    radius: 16,
    speed: 320,
    maxHp: 150,
    hp: 150,
    fireRate: 6,
    damage: 22,
    critChance: 0.1,
    critMultiplier: 2,
    lifeSteal: 0,
    regen: 0,
    damageReduction: 0,
    xpGainMul: 1,
    aoeRadius: 110,
    pierce: 0,
    multishot: 1,
    spread: 0,
    bulletSpeed: 650,
    cooldown: 0,
    spawnPressure: 1
  }
};

function loadPersistent() {
  const base = { crystals: 0, highScore: 0, settings: { autoFire: true, difficulty: "normal", upgradeChoices: 4, bossEvery: 5 }, meta: {} };
  shopUpgrades.forEach((u) => (base.meta[u.id] = 0));
  try {
    const raw = JSON.parse(localStorage.getItem("game2_save"));
    return raw ? { ...base, crystals: raw.crystals || 0, settings: { ...base.settings, ...(raw.settings || {}) }, meta: { ...base.meta, ...(raw.meta || {}) } } : base;
  } catch { return base; }
}

function savePersistent() { localStorage.setItem("game2_save", JSON.stringify(persistent)); }

function applyMetaStats() {
  shopUpgrades.forEach((u) => {
    const level = persistent.meta[u.id] || 0;
    if (u.id.includes("damage")) game.player.damage *= u.apply(level);
    else if (u.id.includes("rate")) game.player.fireRate *= u.apply(level);
    else if (u.id.includes("hp")) game.player.maxHp = Math.round(game.player.maxHp * u.apply(level));
    else if (u.id.includes("speed")) game.player.speed *= u.apply(level);
    else if (u.id.includes("crit")) game.player.critChance += u.apply(level);
    else if (u.id.includes("regen")) game.player.regen += u.apply(level);
  });
  game.player.hp = game.player.maxHp;
}

function initStars() {
  stars.length = 0;
  for (let i = 0; i < 260; i += 1) {
    stars.push({ x: Math.random() * world.width, y: Math.random() * world.height, size: Math.random() * 2 + 0.4, speed: Math.random() * 35 + 18 });
  }
}

function resetRun() {
  bullets = []; enemies = []; enemyProjectiles = []; particles = []; runHits = 0;
  game.score = 0; game.wave = 1; game.elapsed = 0; game.waveTimer = 0; game.spawnTimer = 0; game.playerLevel = 1;
  game.xp = 0; game.xpToNext = 100; game.crystalsRun = 0; game.bossSpawnedForWave = false;
  game.player.x = 1600; game.player.y = 1200; game.player.maxHp = 150; game.player.hp = 150;
  game.player.speed = 320; game.player.fireRate = 6; game.player.damage = 22;
  game.player.critChance = 0.1; game.player.critMultiplier = 2; game.player.lifeSteal = 0;
  game.player.regen = 0; game.player.damageReduction = 0; game.player.xpGainMul = 1;
  game.player.pierce = 0; game.player.multishot = 1; game.player.spread = 0;
  applyMetaStats(); syncCamera();
}

function startRun() {
  resetRun();
  running = true;
  choosingUpgrade = false;
  ui.menu.classList.add("hidden");
  ui.gameOver.classList.add("hidden");
  ui.upgradeMenu.classList.add("hidden");
}

function endRun() {
  running = false;
  const diff = getDifficulty();
  const hitPenalty = Math.min(0.35, runHits * 0.006);
  const ecoMul = shopUpgrades[6].apply(persistent.meta.core_economy || 0);
  const gained = Math.floor((Math.floor(game.score / 45) + Math.floor(game.wave * 3.5) + game.crystalsRun * 1.2) * diff.crystalMul * (1 - hitPenalty) * ecoMul);
  persistent.crystals += gained;
  if (game.score > persistent.highScore) persistent.highScore = game.score;
  savePersistent();
  buildShop();
  ui.menu.classList.remove("hidden");
}

function levelUp() {
  const choices = shuffle(runUpgrades).slice(0, clamp(Number(persistent.settings.upgradeChoices) || 4, 3, 5));
  running = false; choosingUpgrade = true;
  ui.upgradeChoices.innerHTML = "";
  ui.upgradeTitle.textContent = "Level Up! Escolha um upgrade";
  choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = `${choice.name} - ${choice.text}`;
    btn.addEventListener("click", () => {
      choice.apply();
      choosingUpgrade = false;
      running = true;
      ui.upgradeMenu.classList.add("hidden");
      updateUi();
    });
    ui.upgradeChoices.appendChild(btn);
  });
  ui.upgradeMenu.classList.remove("hidden");
}

function buildShop() {
  ui.shopList.innerHTML = ""; ui.menuCrystals.textContent = persistent.crystals;
  shopUpgrades.forEach((item) => {
    const level = persistent.meta[item.id] || 0;
    const cost = Math.floor(item.baseCost * Math.pow(item.growth, level));
    const row = document.createElement("div");
    row.className = "shop-item";
    row.innerHTML = `<div><strong>${item.label}</strong><br><small>${item.desc} | Nv. ${level}</small></div>`;
    const btn = document.createElement("button");
    btn.textContent = `Comprar (${cost})`;
    btn.disabled = persistent.crystals < cost;
    btn.addEventListener("click", () => {
      if (persistent.crystals < cost) return;
      persistent.crystals -= cost;
      persistent.meta[item.id] = level + 1;
      savePersistent();
      buildShop();
      updateUi();
    });
    row.appendChild(btn);
    ui.shopList.appendChild(row);
  });
}

function update(dt) {
  if (!running) return;
  const diff = getDifficulty();
  game.elapsed += dt; syncCamera(); game.waveTimer += dt; game.spawnTimer += dt;
  if (game.player.regen > 0) game.player.hp = clamp(game.player.hp + game.player.regen * dt, 0, game.player.maxHp);

  const waveDuration = Math.max(9, 14 - game.wave * 0.3);
  if (game.waveTimer > waveDuration) { game.wave += 1; game.waveTimer = 0; game.bossSpawnedForWave = false; }

  const moveX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  const moveY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  const mag = Math.hypot(moveX, moveY) || 1;
  game.player.x = clamp(game.player.x + (moveX / mag) * game.player.speed * dt, 16, world.width - 16);
  game.player.y = clamp(game.player.y + (moveY / mag) * game.player.speed * dt, 16, world.height - 16);

  game.player.cooldown -= dt;
  if (game.player.cooldown <= 0 && (persistent.settings.autoFire || shootPressed || keys.Space)) {
    fire();
    game.player.cooldown = 1 / Math.max(0.35, game.player.fireRate);
  }

  const waveFactor = 1 + game.wave * 0.22;
  const bossWave = game.wave % Math.max(3, Number(persistent.settings.bossEvery)) === 0;
  if (bossWave && !game.bossSpawnedForWave && !enemies.some((e) => e.type === "boss")) {
    spawnBoss(waveFactor, diff);
    game.bossSpawnedForWave = true;
  }

  const bossAlive = enemies.some((e) => e.type === "boss");
  const timePressure = 1 + Math.min(1.2, game.elapsed / 95) + game.wave * 0.018;
  const spawnEvery = Math.max(0.06, ((bossAlive ? 1.25 : 0.52) / waveFactor) / (diff.spawnMul * timePressure * game.player.spawnPressure));
  while (game.spawnTimer > spawnEvery) { game.spawnTimer -= spawnEvery; spawnEnemy(waveFactor, diff, bossAlive); }

  for (const star of stars) { star.y += star.speed * dt; if (star.y > world.height) { star.y = -2; star.x = Math.random() * world.width; } }

  bullets = bullets.filter((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; return b.life > 0; });
  enemyProjectiles = enemyProjectiles.filter((p) => {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (distance(p, game.player) < p.r + game.player.radius) { game.player.hp -= p.damage * (1 - game.player.damageReduction); runHits++; return false; }
    return p.life > 0;
  });

  enemies.forEach((enemy) => {
    const dx = game.player.x - enemy.x, dy = game.player.y - enemy.y, dist = Math.hypot(dx, dy) || 1;
    if (enemy.type === "shooter") {
      const keepDist = 240, dir = dist > keepDist ? 1 : -0.35;
      enemy.x += (dx / dist) * enemy.speed * dir * dt; enemy.y += (dy / dist) * enemy.speed * dir * dt;
      enemy.shootCd -= dt;
      if (enemy.shootCd <= 0) { spawnEnemyProjectile(enemy.x, enemy.y, game.player.x, game.player.y, 250, enemy.damage * 0.8); enemy.shootCd = 1.7; }
    } else if (enemy.type === "dasher") {
      enemy.dashCd -= dt;
      if (enemy.dashCd <= 0) { enemy.dashCd = 1.8; enemy.dashTime = 0.28; }
      const dashMul = enemy.dashTime > 0 ? 2.35 : 1;
      enemy.x += (dx / dist) * enemy.speed * dashMul * dt; enemy.y += (dy / dist) * enemy.speed * dashMul * dt; enemy.dashTime -= dt;
    } else { enemy.x += (dx / dist) * enemy.speed * dt; enemy.y += (dy / dist) * enemy.speed * dt; }
  });

  resolveCollisions();
  particles = particles.filter((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; return p.life > 0; });
  if (game.player.hp <= 0) endRun();
  updateUi();
}

function resolveCollisions() {
  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const e = enemies[i];
    if (distance(e, game.player) < e.r + game.player.radius) { enemies.splice(i, 1); game.player.hp -= e.contact * (1 - game.player.damageReduction); runHits++; continue; }
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
  game.score += enemy.value * diff.scoreMul;
  game.xp = (game.xp || 0) + enemy.xp * game.player.xpGainMul;
  game.crystalsRun += enemy.crystal;
  spawnBurst(enemy.x, enemy.y, 13, "#8cfccf");
  if (game.xp >= game.xpToNext) { game.xp -= game.xpToNext; game.xpToNext = Math.floor(game.xpToNext * 1.18); game.playerLevel++; levelUp(); }
}

function fire() {
  const target = enemies.reduce((best, e) => (!best || distance(e, game.player) < distance(best, game.player) ? e : best), null);
  const angle = target ? Math.atan2(target.y - game.player.y, target.x - game.player.x) : -Math.PI / 2;
  const shots = Math.max(1, Math.floor(game.player.multishot));
  const spreadRad = (game.player.spread * Math.PI) / 180;
  const bulletSpeed = game.player.bulletSpeed;

  for (let i = 0; i < shots; i++) {
    const t = shots === 1 ? 0.5 : i / (shots - 1);
    const offset = (t - 0.5) * spreadRad;
    const shotAngle = angle + offset;
    const crit = Math.random() < game.player.critChance;
    const damage = crit ? game.player.damage * game.player.critMultiplier : game.player.damage;
    bullets.push({ x: game.player.x, y: game.player.y, vx: Math.cos(shotAngle) * bulletSpeed, vy: Math.sin(shotAngle) * bulletSpeed, r: crit ? 5 : 4, life: 1.5, damage, pierceLeft: game.player.pierce });
  }
}

function chooseEnemyType(wave) {
  const pool = ["chaser", "tank"];
  if (wave >= 3) pool.push("dasher");
  if (wave >= 4) pool.push("shooter");
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnEnemy(waveFactor, diff, bossAlive) {
  if (bossAlive && Math.random() < 0.45) return;
  const side = Math.floor(Math.random() * 4), margin = 30;
  const viewLeft = camera.x - canvas.width / 2, viewRight = camera.x + canvas.width / 2, viewTop = camera.y - canvas.height / 2, viewBottom = camera.y + canvas.height / 2;
  let x = 0, y = 0;
  if (side === 0) { x = Math.random() * canvas.width + viewLeft; y = viewTop - margin; }
  else if (side === 1) { x = viewRight + margin; y = Math.random() * canvas.height + viewTop; }
  else if (side === 2) { x = Math.random() * canvas.width + viewLeft; y = viewBottom + margin; }
  else { x = viewLeft - margin; y = Math.random() * canvas.height + viewTop; }
  x = clamp(x, 24, world.width - 24); y = clamp(y, 24, world.height - 24);
  const type = chooseEnemyType(game.wave);
  const template = getEnemyTemplate(type);
  const eliteChance = Math.min(0.24, 0.05 + game.wave * 0.015);
  const elite = type !== "boss" && Math.random() < eliteChance;
  const eliteMul = elite ? 1.35 : 1;
  enemies.push({ x, y, type, r: template.r, speed: template.speed * waveFactor, hp: template.hp * waveFactor * diff.enemyHpMul * eliteMul, maxHp: template.hp * waveFactor * diff.enemyHpMul * eliteMul, contact: template.contact * diff.enemyDmgMul, damage: template.damage * diff.enemyDmgMul, value: template.value, xp: template.xp, crystal: template.crystal, shootCd: template.shootCd || 99, dashCd: 1.8 + Math.random() * 0.8, dashTime: 0, strafeDir: Math.random() < 0.5 ? -1 : 1 });
}

function spawnBoss(waveFactor, diff) {
  const bossHp = 1800 + game.wave * 280;
  enemies.push({ x: 1600, y: 1200, type: "boss", r: 44, speed: 120, hp: bossHp, maxHp: bossHp, contact: 30, damage: 22, value: 450, xp: 220, crystal: 12, shootCd: 0.7, dashCd: 99, dashTime: 0, strafeDir: 1 });
}

function getEnemyTemplate(type) {
  if (type === "tank") return { r: 19, speed: 100, hp: 280, value: 38, xp: 24, crystal: 2, contact: 26, damage: 20 };
  if (type === "dasher") return { r: 12, speed: 160, hp: 120, value: 30, xp: 20, crystal: 1, contact: 18, damage: 16 };
  if (type === "shooter") return { r: 13, speed: 130, hp: 150, value: 34, xp: 22, crystal: 1, contact: 16, damage: 18, shootCd: 1.5 };
  return { r: 14, speed: 140, hp: 100, value: 24, xp: 16, crystal: 1, contact: 14, damage: 14 };
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

  ctx.fillStyle = "rgba(204, 231, 255, 0.85)"; for (const s of stars) ctx.fillRect(s.x, s.y, s.size, s.size);

  ctx.fillStyle = "#18f4ff"; ctx.beginPath();
  ctx.moveTo(game.player.x, game.player.y - 18); ctx.lineTo(game.player.x - 14, game.player.y + 16);
  ctx.lineTo(game.player.x + 14, game.player.y + 16); ctx.closePath(); ctx.fill();

  for (const b of bullets) { ctx.fillStyle = "#ffd46a"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
  for (const p of enemyProjectiles) { ctx.fillStyle = "#ff8a58"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }

  for (const e of enemies) {
    const colors = e.type === "boss" ? ["#ff245f", "#ffd1dc"] : e.type === "tank" ? ["#7f55cc", "#ccb4ff"] : e.type === "dasher" ? ["#ff8d37", "#ffd5a8"] : e.type === "shooter" ? ["#2db3ff", "#c4f1ff"] : ["#ff9f4f", "#ff7f2e"];
    ctx.fillStyle = colors[0]; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = colors[1]; ctx.lineWidth = 2; ctx.stroke();
  }

  for (const p of particles) { const a = clamp(p.life / p.maxLife, 0, 1); ctx.fillStyle = `${p.color}${Math.floor(a * 255).toString(16).padStart(2, "0")}`; ctx.fillRect(p.x, p.y, p.size, p.size); }
  ctx.restore();
}

function updateUi() {
  ui.score.textContent = Math.floor(game.score); ui.wave.textContent = game.wave; ui.crystals.textContent = persistent.crystals + game.crystalsRun;
  ui.buildInfo.textContent = `${difficultyConfig[persistent.settings.difficulty].label} | Build Base | Nível ${game.playerLevel}`;
  ui.menuCrystals.textContent = persistent.crystals; ui.hpFill.style.width = `${(game.player.hp / game.player.maxHp) * 100}%`;
  ui.xpFill.style.width = `${(game.xp / game.xpToNext) * 100}%`;
}

function animate(ts) { const dt = Math.min(0.033, (ts - lastTime) / 1000 || 0); lastTime = ts; update(dt); render(); requestAnimationFrame(animate); }

function spawnBurst(x, y, count, color) {
  for (let i = 0; i < count; i += 1) { const a = Math.random() * Math.PI * 2, speed = Math.random() * 160 + 30;
    particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: Math.random() * 0.35 + 0.2, maxLife: 0.55, size: Math.random() * 3 + 1, color }); }
}

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function getDifficulty() { return difficultyConfig[persistent.settings.difficulty] || difficultyConfig.normal; }
function syncCamera() { camera.x = clamp(game.player.x, canvas.width / 2, world.width - canvas.width / 2); camera.y = clamp(game.player.y, canvas.height / 2, world.height - canvas.height / 2); }

function syncOptionsUi() { ui.difficultySelect.value = persistent.settings.difficulty; ui.upgradeChoicesSelect.value = String(persistent.settings.upgradeChoices); ui.bossEverySelect.value = String(persistent.settings.bossEvery); }

function bindSettings() {
  ui.difficultySelect.addEventListener("change", () => { persistent.settings.difficulty = ui.difficultySelect.value; savePersistent(); updateUi(); });
  ui.upgradeChoicesSelect.addEventListener("change", () => { persistent.settings.upgradeChoices = clamp(Number(ui.upgradeChoicesSelect.value) || 4, 3, 5); savePersistent(); });
  ui.bossEverySelect.addEventListener("change", () => { persistent.settings.bossEvery = clamp(Number(ui.bossEverySelect.value) || 5, 4, 6); savePersistent(); });
  ui.autoFireToggle?.addEventListener("change", () => { persistent.settings.autoFire = ui.autoFireToggle.checked; savePersistent(); });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = Math.max(640, Math.floor(rect.width * dpr)), h = Math.max(400, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; initStars(); if (!running) { game.player.x = 1600; game.player.y = 1200; syncCamera(); } }
}

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.ArrowUp = true;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.ArrowDown = true;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.ArrowLeft = true;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.ArrowRight = true;
  if (e.code === "Space") shootPressed = true;
  if (!running && !choosingUpgrade && e.code === "Enter") startRun();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW" || e.code === "ArrowUp") keys.ArrowUp = false;
  if (e.code === "KeyS" || e.code === "ArrowDown") keys.ArrowDown = false;
  if (e.code === "KeyA" || e.code === "ArrowLeft") keys.ArrowLeft = false;
  if (e.code === "KeyD" || e.code === "ArrowRight") keys.ArrowRight = false;
  if (e.code === "Space") shootPressed = false;
});

ui.playBtn?.addEventListener("click", startRun);
window.addEventListener("resize", resizeCanvas);
buildShop(); syncOptionsUi(); bindSettings(); resizeCanvas();
initStars(); updateUi(); requestAnimationFrame(animate);
