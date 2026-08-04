import * as THREE from 'three';

// ======================== CONFIGURAÇÕES ========================
const GRAVITY = -25;
const JUMP_FORCE = 10;
const MOVE_SPEED = 6;
const ITEMS_PER_PHASE = 3;
const TOTAL_PHASES = 3;
const ENEMY_SPEED = 1.2;
const ENEMY_DAMAGE = 10;
const DASH_COOLDOWN = 3; // segundos
const SHIELD_COOLDOWN = 5;
const SHIELD_DURATION = 2;

// ======================== CENA E CÂMERA ========================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a3a);
scene.fog = new THREE.Fog(0x1a2a3a, 25, 50);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 8, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.bias = 0.0001;
document.body.appendChild(renderer.domElement);

// ======================== LUZES ========================
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
sunLight.position.set(10, 20, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 50;
sunLight.shadow.camera.left = -20;
sunLight.shadow.camera.right = 20;
sunLight.shadow.camera.top = 20;
sunLight.shadow.camera.bottom = -20;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3a7d44, 0.5);
scene.add(hemiLight);

// ======================== JOGADOR ========================
const player = {
    mesh: null,
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    position: new THREE.Vector3(0, 2, 0),
    health: 100,
    maxHealth: 100,
    items: 0,
    keys: 0,
    phase: 1,
    isAlive: true,
    shieldActive: false,
    shieldTimer: 0,
    dashCooldown: 0,
    shieldCooldown: 0,
    weapon: null
};

function createPlayer() {
    const group = new THREE.Group();

    // Torso (camisa azul)
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.4 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.5), torsoMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    group.add(torso);

    // Cabeça (pele)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b8, roughness: 0.3 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), headMat);
    head.position.y = 1.4;
    head.castShadow = true;
    group.add(head);

    // Cabelo (chapéu ou cabelo curto)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), hairMat);
    hair.position.y = 1.55;
    hair.scale.y = 0.5;
    hair.castShadow = true;
    group.add(hair);

    // Olhos
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.45, 0.28);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.45, 0.28);
    group.add(eyeR);

    // Braços
    const armMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b8, roughness: 0.3 });
    const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6);
    // Braço esquerdo
    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.5, 0.85, 0);
    armL.rotation.z = 0.3;
    armL.castShadow = true;
    group.add(armL);
    // Braço direito
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.5, 0.85, 0);
    armR.rotation.z = -0.3;
    armR.castShadow = true;
    group.add(armR);

    // Mãos
    const handMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b8 });
    const handGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const handL = new THREE.Mesh(handGeo, handMat);
    handL.position.set(-0.55, 0.6, 0);
    group.add(handL);
    const handR = new THREE.Mesh(handGeo, handMat);
    handR.position.set(0.55, 0.6, 0);
    group.add(handR);

    // Pernas (calça jeans)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 });
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.2, 0.25, 0);
    legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.2, 0.25, 0);
    legR.castShadow = true;
    group.add(legR);

    // Sapatos
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const shoeGeo = new THREE.BoxGeometry(0.15, 0.08, 0.3);
    const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
    shoeL.position.set(-0.2, 0.04, 0.05);
    group.add(shoeL);
    const shoeR = new THREE.Mesh(shoeGeo, shoeMat);
    shoeR.position.set(0.2, 0.04, 0.05);
    group.add(shoeR);

    // --- ARMA (pistola na mão direita) ---
    const weaponGroup = new THREE.Group();
    // Corpo da pistola
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), gunMat);
    gunBody.position.set(0, 0, 0.15);
    weaponGroup.add(gunBody);
    // Cano
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, 0.35);
    weaponGroup.add(barrel);
    // Cabo
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.08), gripMat);
    grip.position.set(0, -0.1, 0.08);
    weaponGroup.add(grip);
    // Gatilho
    const trig = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), gripMat);
    trig.position.set(0, -0.02, 0.1);
    weaponGroup.add(trig);

    // Posiciona a arma na mão direita
    weaponGroup.position.set(0.55, 0.6, 0.1);
    weaponGroup.rotation.z = -0.2;
    weaponGroup.rotation.x = -0.3;
    group.add(weaponGroup);
    player.weapon = weaponGroup;

    group.position.copy(player.position);
    scene.add(group);
    player.mesh = group;
    return group;
}

// ======================== INIMIGOS ========================
let enemies = [];

function createEnemy(x, z) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc2233, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xaa3344 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), headMat);
    head.position.y = 1.0;
    head.castShadow = true;
    group.add(head);

    // Olhos vermelhos
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eL = new THREE.Mesh(eyeGeo, eyeMat);
    eL.position.set(-0.1, 1.05, 0.22);
    group.add(eL);
    const eR = new THREE.Mesh(eyeGeo, eyeMat);
    eR.position.set(0.1, 1.05, 0.22);
    group.add(eR);

    group.position.set(x, -0.2, z);
    group.userData = {
        type: 'enemy',
        alive: true,
        health: 30,
        attackCooldown: 0
    };
    return group;
}

function spawnEnemies(phase) {
    const count = 2 + phase; // 3 na fase 1, 4 na fase 2, 5 na fase 3
    for (let i = 0; i < count; i++) {
        const pos = getRandomPosition(2);
        const enemy = createEnemy(pos.x, pos.z);
        scene.add(enemy);
        enemies.push(enemy);
    }
}

// ======================== FASES ========================
let phaseObjects = [];
let items = [];
let doors = [];
let keys = [];

function getRandomPosition(minDist = 1) {
    let x, z, valid;
    let attempts = 0;
    do {
        x = (Math.random() - 0.5) * 16;
        z = (Math.random() - 0.5) * 16;
        valid = Math.abs(x) < 7 && Math.abs(z) < 7;
        if (valid && player.mesh) {
            const dx = x - player.mesh.position.x;
            const dz = z - player.mesh.position.z;
            if (Math.hypot(dx, dz) < minDist) valid = false;
        }
        attempts++;
        if (attempts > 100) break;
    } while (!valid);
    return { x, z };
}

function createGround(phase) {
    const colors = [0x4a7c59, 0x8B9DC3, 0xC9A87C];
    const groundMat = new THREE.MeshStandardMaterial({
        color: colors[(phase - 1) % colors.length],
        roughness: 0.8,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    ground.name = 'ground';
    return ground;
}

function createWalls(phase) {
    const wallGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
        color: phase === 1 ? 0x3a5a7a : phase === 2 ? 0x5a3a7a : 0x7a5a3a,
        roughness: 0.6,
        metalness: 0.2
    });
    const wallHeight = 3;
    const wallThick = 0.3;
    const size = 11;

    const wallPositions = [
        { x: 0, z: -size / 2, w: size, h: wallHeight, d: wallThick },
        { x: 0, z: size / 2, w: size, h: wallHeight, d: wallThick },
        { x: -size / 2, z: 0, w: wallThick, h: wallHeight, d: size },
        { x: size / 2, z: 0, w: wallThick, h: wallHeight, d: size }
    ];

    wallPositions.forEach((pos) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(pos.w, pos.h, pos.d), wallMat);
        wall.position.set(pos.x, wallHeight / 2 - 0.5, pos.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.name = 'wall';
        wallGroup.add(wall);
    });

    return wallGroup;
}

function createItem(x, z) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: new THREE.Color(0xff8800).multiplyScalar(0.3),
        roughness: 0.2,
        metalness: 0.8
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const glowMat = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        emissive: new THREE.Color(0xff8800).multiplyScalar(0.5),
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), glowMat);
    glow.position.y = 0.5;
    group.add(glow);

    group.position.set(x, -0.2, z);
    group.userData = { type: 'item', collected: false };
    return group;
}

function createKey(x, z) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: new THREE.Color(0xffaa00).multiplyScalar(0.2)
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6), mat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.3;
    group.add(body);
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 6, 12), mat);
    head.position.set(0, 0.3, 0.25);
    group.add(head);
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.1), mat);
    tooth.position.set(0, 0.3, -0.25);
    group.add(tooth);

    const glowMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: new THREE.Color(0xffd700).multiplyScalar(0.5),
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), glowMat);
    glow.position.y = 0.3;
    group.add(glow);

    group.position.set(x, -0.2, z);
    group.userData = { type: 'key', collected: false };
    return group;
}

function createDoor(x, z) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.3 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.15), mat);
    door.position.y = 1;
    door.castShadow = true;
    group.add(door);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.3), frameMat);
    frame.position.y = 1;
    group.add(frame);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), handleMat);
    handle.position.set(0.4, 0.8, 0.2);
    group.add(handle);

    const portalMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: new THREE.Color(0x00ff88).multiplyScalar(0.5),
        transparent: true,
        opacity: 0.3
    });
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.8), portalMat);
    portal.position.set(0, 1, 0.1);
    group.add(portal);

    group.position.set(x, -0.5, z);
    group.userData = { type: 'door', opened: false };
    return group;
}

function createPhase(phase) {
    // Limpa fase anterior
    phaseObjects.forEach(obj => scene.remove(obj));
    phaseObjects = [];
    items = [];
    doors = [];
    keys = [];
    enemies.forEach(e => scene.remove(e));
    enemies = [];

    // Chão
    const ground = createGround(phase);
    scene.add(ground);
    phaseObjects.push(ground);

    // Paredes
    const walls = createWalls(phase);
    scene.add(walls);
    phaseObjects.push(walls);

    // Decoração
    const decorColors = [0xff6b6b, 0xffd93d, 0x6bcbff];
    const decorMat = new THREE.MeshStandardMaterial({
        color: decorColors[(phase - 1) % decorColors.length],
        roughness: 0.5,
        emissive: new THREE.Color(decorColors[(phase - 1) % decorColors.length]).multiplyScalar(0.1)
    });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 3 + Math.random() * 2;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 6), decorMat);
        pillar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);
        phaseObjects.push(pillar);
    }

    // Itens
    for (let i = 0; i < ITEMS_PER_PHASE; i++) {
        const pos = getRandomPosition();
        const item = createItem(pos.x, pos.z);
        scene.add(item);
        items.push(item);
        phaseObjects.push(item);
    }

    // Chave
    const keyPos = getRandomPosition();
    const key = createKey(keyPos.x, keyPos.z);
    scene.add(key);
    keys.push(key);
    phaseObjects.push(key);

    // Porta
    const doorPos = getRandomPosition();
    const door = createDoor(doorPos.x, doorPos.z);
    scene.add(door);
    doors.push(door);
    phaseObjects.push(door);

    // Inimigos
    spawnEnemies(phase);

    // Posiciona jogador
    player.mesh.position.set(0, 0.5, 0);
    player.velocity.set(0, 0, 0);

    updateHUD();
}

// ======================== COLISÕES ========================
function checkCollision(pos, radius = 0.5) {
    const wallCheck = 10.5;
    if (Math.abs(pos.x) > wallCheck || Math.abs(pos.z) > wallCheck) return true;
    return false;
}

function checkItemCollision() {
    const pPos = player.mesh.position;

    items.forEach(item => {
        if (!item.userData.collected) {
            if (pPos.distanceTo(item.position) < 1) {
                item.userData.collected = true;
                scene.remove(item);
                player.items++;
                updateHUD();
                showMessage('📦 Item coletado!');
            }
        }
    });

    keys.forEach(key => {
        if (!key.userData.collected) {
            if (pPos.distanceTo(key.position) < 1) {
                key.userData.collected = true;
                scene.remove(key);
                player.keys++;
                updateHUD();
                showMessage('🔑 Chave encontrada!');
            }
        }
    });

    doors.forEach(door => {
        if (!door.userData.opened) {
            if (pPos.distanceTo(door.position) < 1.5 && player.keys > 0) {
                door.userData.opened = true;
                door.scale.x = 0.1;
                door.scale.z = 0.1;
                player.keys--;
                updateHUD();
                showMessage('🚪 Porta aberta!');
                const totalItems = items.filter(i => i.userData.collected).length;
                if (totalItems === ITEMS_PER_PHASE) {
                    setTimeout(() => nextPhase(), 1500);
                } else {
                    showMessage(`📦 Colete todos os itens (${totalItems}/${ITEMS_PER_PHASE})`);
                }
            } else if (pPos.distanceTo(door.position) < 1.5 && player.keys === 0) {
                showMessage('🔑 Você precisa de uma chave!');
            }
        }
    });
}

function checkEnemyCollision() {
    const pPos = player.mesh.position;
    enemies.forEach(enemy => {
        if (!enemy.userData.alive) return;
        if (pPos.distanceTo(enemy.position) < 1) {
            if (!player.shieldActive) {
                player.health -= ENEMY_DAMAGE * 0.02; // dano contínuo
                if (player.health <= 0) {
                    player.health = 0;
                    player.isAlive = false;
                    showGameOver();
                }
                updateHUD();
            }
            // Empurra o jogador para trás
            const dir = new THREE.Vector3().subVectors(pPos, enemy.position).normalize();
            player.mesh.position.add(dir.multiplyScalar(0.1));
        }
    });
}

// ======================== PODERES ========================
function useDash() {
    if (player.dashCooldown > 0) return;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(player.mesh.quaternion);
    forward.multiplyScalar(8);
    player.mesh.position.add(forward);
    player.dashCooldown = DASH_COOLDOWN;
    showPowerCooldown('Dash', DASH_COOLDOWN);
}

function useShield() {
    if (player.shieldCooldown > 0) return;
    player.shieldActive = true;
    player.shieldTimer = SHIELD_DURATION;
    player.shieldCooldown = SHIELD_COOLDOWN;
    showPowerCooldown('Escudo', SHIELD_DURATION);
    // Efeito visual: brilho azul ao redor do jogador (opcional)
}

let powerCooldownTimeout = null;

function showPowerCooldown(name, duration) {
    const el = document.getElementById('power-cooldown');
    el.textContent = `⚡ ${name} ativado!`;
    el.style.display = 'block';
    clearTimeout(powerCooldownTimeout);
    powerCooldownTimeout = setTimeout(() => {
        el.style.display = 'none';
    }, duration * 1000);
}

// ======================== CONTROLES ========================
const keysPressed = { w: false, a: false, s: false, d: false, space: false, q: false, e: false };

document.addEventListener('keydown', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': keysPressed.w = true; break;
        case 'a': keysPressed.a = true; break;
        case 's': keysPressed.s = true; break;
        case 'd': keysPressed.d = true; break;
        case ' ': e.preventDefault(); if (player.onGround && player.isAlive) { player.velocity.y = JUMP_FORCE; player.onGround = false; } break;
        case 'q': e.preventDefault(); useDash(); break;
        case 'e': e.preventDefault(); useShield(); break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key.toLowerCase()) {
        case 'w': keysPressed.w = false; break;
        case 'a': keysPressed.a = false; break;
        case 's': keysPressed.s = false; break;
        case 'd': keysPressed.d = false; break;
        case ' ': break;
    }
});

// ======================== HUD ========================
function updateHUD() {
    document.getElementById('health').textContent = `❤️ ${Math.max(0, Math.round(player.health))}`;
    document.getElementById('phase').textContent = `🌍 Fase ${player.phase}/${TOTAL_PHASES}`;
    document.getElementById('items').textContent = `📦 ${items.filter(i => i.userData.collected).length}/${ITEMS_PER_PHASE}`;
    document.getElementById('keys').textContent = `🔑 ${player.keys}`;
}

let messageTimeout = null;
function showMessage(text) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msg.textContent = 'WASD, ESPAÇO | Q-Dash, E-Escudo';
    }, 3000);
}

function showPhaseComplete() {
    const el = document.getElementById('phase-complete');
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 2000);
}

function showGameOver() {
    const el = document.getElementById('game-over');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; restartGame(); }, 3000);
}

function showVictory() {
    document.getElementById('victory').style.display = 'block';
}

// ======================== GERENCIAMENTO ========================
function nextPhase() {
    if (player.phase >= TOTAL_PHASES) {
        showVictory();
        return;
    }
    player.phase++;
    player.items = 0;
    player.keys = 0;
    player.health = Math.min(player.maxHealth, player.health + 30); // cura parcial
    createPhase(player.phase);
    showPhaseComplete();
    updateHUD();
}

function restartGame() {
    player.phase = 1;
    player.health = 100;
    player.items = 0;
    player.keys = 0;
    player.isAlive = true;
    player.shieldActive = false;
    player.dashCooldown = 0;
    player.shieldCooldown = 0;
    createPhase(1);
    updateHUD();
    document.getElementById('game-over').style.display = 'none';
}

// ======================== LOOP PRINCIPAL ========================
const clock = new THREE.Clock();

function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);

    if (player.isAlive) {
        // Movimento
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        const moveX = (keysPressed.d ? 1 : 0) - (keysPressed.a ? 1 : 0);
        const moveZ = (keysPressed.s ? 1 : 0) - (keysPressed.w ? 1 : 0);
        const moveVec = new THREE.Vector3();
        moveVec.addScaledVector(right, moveX);
        moveVec.addScaledVector(forward, moveZ);
        moveVec.normalize().multiplyScalar(MOVE_SPEED * delta);

        player.velocity.y += GRAVITY * delta;
        const newPos = player.mesh.position.clone();
        newPos.x += moveVec.x;
        newPos.z += moveVec.z;
        newPos.y += player.velocity.y * delta;

        if (newPos.y < 0.5) {
            newPos.y = 0.5;
            player.velocity.y = 0;
            player.onGround = true;
        } else {
            player.onGround = false;
        }

        if (!checkCollision(newPos)) {
            player.mesh.position.copy(newPos);
        } else {
            // Colisão com paredes - movimento separado
            const testX = new THREE.Vector3(newPos.x, player.mesh.position.y, player.mesh.position.z);
            if (!checkCollision(testX)) player.mesh.position.x = newPos.x;
            const testZ = new THREE.Vector3(player.mesh.position.x, player.mesh.position.y, newPos.z);
            if (!checkCollision(testZ)) player.mesh.position.z = newPos.z;
            if (player.velocity.y < 0 && player.mesh.position.y <= 0.5) {
                player.mesh.position.y = 0.5;
                player.velocity.y = 0;
                player.onGround = true;
            }
        }

        // Rotação
        if (moveX !== 0 || moveZ !== 0) {
            const angle = Math.atan2(moveX, moveZ);
            player.mesh.rotation.y = angle;
        }

        // Colisões
        checkItemCollision();
        checkEnemyCollision();

        // Atualiza cooldowns
        if (player.dashCooldown > 0) player.dashCooldown -= delta;
        if (player.shieldCooldown > 0) player.shieldCooldown -= delta;
        if (player.shieldActive) {
            player.shieldTimer -= delta;
            if (player.shieldTimer <= 0) {
                player.shieldActive = false;
            }
        }

        // Dano por queda
        if (player.mesh.position.y < -5) {
            player.health -= 20 * delta;
            if (player.health <= 0) {
                player.health = 0;
                player.isAlive = false;
                showGameOver();
            }
            updateHUD();
        }

        // Câmera
        const camOffset = new THREE.Vector3(0, 5, 7);
        const targetPos = player.mesh.position.clone().add(camOffset);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(player.mesh.position.x, 1, player.mesh.position.z);

        // Inimigos perseguem
        enemies.forEach(enemy => {
            if (!enemy.userData.alive) return;
            const dir = new THREE.Vector3().subVectors(player.mesh.position, enemy.position);
            dir.y = 0;
            if (dir.length() > 0.5) {
                dir.normalize().multiplyScalar(ENEMY_SPEED * delta);
                enemy.position.add(dir);
                enemy.lookAt(player.mesh.position.x, 0, player.mesh.position.z);
            }
        });
    }

    // Animação de itens
    items.forEach(item => {
        if (!item.userData.collected) {
            item.rotation.y += delta * 2;
            item.position.y = -0.2 + Math.sin(Date.now() * 0.002 + item.id) * 0.15;
        }
    });
    keys.forEach(key => {
        if (!key.userData.collected) {
            key.rotation.y += delta * 2;
            key.position.y = -0.2 + Math.sin(Date.now() * 0.002 + key.id) * 0.15;
        }
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// ======================== INÍCIO ========================
createPlayer();
createPhase(1);
animate();

console.log('⚔️ Aventura 3D com poderes e inimigos!');
console.log('WASD mover, ESPAÇO pular, Q-Dash, E-Escudo');
