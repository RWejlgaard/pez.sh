const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelElement = document.getElementById('level');
const healthElement = document.getElementById('health');
const ammoElement = document.getElementById('ammo');
const killsElement = document.getElementById('kills');
const messageElement = document.getElementById('message');

// Game constants
const GRID_SIZE = 30;
const TILE_SIZE = canvas.width / GRID_SIZE;
const VISION_RADIUS = 7;
const PLAYER_SPEED = 0.15;
const BULLET_SPEED = 0.5;
const ENEMY_SPEED = 0.08;

// Terminal colors
const COLORS = {
    background: '#000000',
    wall: '#808080',
    wallExplored: '#404040',
    floor: '#1a1a1a',
    floorExplored: '#0d0d0d',
    player: '#00ffff',
    enemy: '#ff0000',
    stairs: '#00ff00',
    bullet: '#ffff00',
    text: '#ffffff',
    muzzleFlash: '#ff8800'
};

// Tile types
const TILES = {
    WALL: '#',
    FLOOR: '.',
};

// Input state
let keys = {};
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
let mouseAngle = 0;
let mouseDown = false;

// Weapon types
const WEAPONS = {
    PISTOL: {
        name: 'Pistol',
        ammo: 12,
        maxAmmo: 12,
        damage: 25,
        fireRate: 15,
        reloadTime: 60,
        color: '#808080'
    },
    SHOTGUN: {
        name: 'Shotgun',
        ammo: 8,
        maxAmmo: 8,
        damage: 15,
        pellets: 5,
        spread: 0.3,
        fireRate: 30,
        reloadTime: 90,
        color: '#ff8800'
    },
    RIFLE: {
        name: 'Rifle',
        ammo: 30,
        maxAmmo: 30,
        damage: 20,
        fireRate: 5,
        reloadTime: 80,
        color: '#00ff00'
    },
    SMG: {
        name: 'SMG',
        ammo: 25,
        maxAmmo: 25,
        damage: 15,
        fireRate: 3,
        reloadTime: 70,
        color: '#ffff00'
    }
};

// Game state
let gameState = {
    running: false,
    level: 1,
    player: {
        x: 0,
        y: 0,
        angle: 0,
        health: 100,
        maxHealth: 100,
        weapon: WEAPONS.PISTOL,
        ammo: 12,
        maxAmmo: 12,
        kills: 0,
        reloadTime: 0,
        shootCooldown: 0,
        muzzleFlash: 0
    },
    enemies: [],
    bullets: [],
    weaponPickups: [],
    stairs: { x: 0, y: 0 },
    dungeon: [],
    visible: [],
    explored: [],
    messageQueue: []
};

// Room generation
class Room {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.centerX = Math.floor(x + width / 2);
        this.centerY = Math.floor(y + height / 2);
    }

    intersects(other) {
        return this.x <= other.x + other.width &&
               this.x + this.width >= other.x &&
               this.y <= other.y + other.height &&
               this.y + this.height >= other.y;
    }
}

// Initialize dungeon
function createDungeon() {
    const dungeon = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(TILES.WALL)
    );

    const rooms = [];
    const numRooms = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < numRooms * 3; i++) {
        const width = 4 + Math.floor(Math.random() * 6);
        const height = 4 + Math.floor(Math.random() * 6);
        const x = Math.floor(Math.random() * (GRID_SIZE - width - 2)) + 1;
        const y = Math.floor(Math.random() * (GRID_SIZE - height - 2)) + 1;

        const newRoom = new Room(x, y, width, height);

        let overlaps = false;
        for (const room of rooms) {
            if (newRoom.intersects(room)) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            for (let ry = newRoom.y; ry < newRoom.y + newRoom.height; ry++) {
                for (let rx = newRoom.x; rx < newRoom.x + newRoom.width; rx++) {
                    dungeon[ry][rx] = TILES.FLOOR;
                }
            }
            rooms.push(newRoom);
            if (rooms.length >= numRooms) break;
        }
    }

    for (let i = 0; i < rooms.length - 1; i++) {
        const roomA = rooms[i];
        const roomB = rooms[i + 1];

        if (Math.random() < 0.5) {
            createHorizontalCorridor(dungeon, roomA.centerX, roomB.centerX, roomA.centerY);
            createVerticalCorridor(dungeon, roomA.centerY, roomB.centerY, roomB.centerX);
        } else {
            createVerticalCorridor(dungeon, roomA.centerY, roomB.centerY, roomA.centerX);
            createHorizontalCorridor(dungeon, roomA.centerX, roomB.centerX, roomB.centerY);
        }
    }

    return { dungeon, rooms };
}

function createHorizontalCorridor(dungeon, x1, x2, y) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
            dungeon[y][x] = TILES.FLOOR;
        }
    }
}

function createVerticalCorridor(dungeon, y1, y2, x) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
            dungeon[y][x] = TILES.FLOOR;
        }
    }
}

// Initialize game
function initGame() {
    const { dungeon, rooms } = createDungeon();
    gameState.dungeon = dungeon;
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.weaponPickups = [];

    gameState.visible = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(false)
    );
    gameState.explored = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(false)
    );

    const firstRoom = rooms[0];
    gameState.player.x = firstRoom.centerX + 0.5;
    gameState.player.y = firstRoom.centerY + 0.5;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.ammo = gameState.player.weapon.ammo;
    gameState.player.maxAmmo = gameState.player.weapon.maxAmmo;
    gameState.player.reloadTime = 0;
    gameState.player.shootCooldown = 0;

    updateVisibility();

    const lastRoom = rooms[rooms.length - 1];
    gameState.stairs.x = lastRoom.centerX;
    gameState.stairs.y = lastRoom.centerY;

    // Place at least 1 weapon per floor
    const weaponTypes = [WEAPONS.SHOTGUN, WEAPONS.RIFLE, WEAPONS.SMG];
    const guaranteedWeaponRoom = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];
    const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    gameState.weaponPickups.push({
        x: guaranteedWeaponRoom.centerX + 0.5,
        y: guaranteedWeaponRoom.centerY + 0.5,
        weapon: weaponType
    });

    // Maybe place 1-2 more weapons
    const extraWeapons = Math.random() < 0.5 ? 1 : Math.random() < 0.3 ? 2 : 0;
    for (let w = 0; w < extraWeapons; w++) {
        const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 2))];
        const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
        gameState.weaponPickups.push({
            x: room.x + 1 + Math.random() * (room.width - 2),
            y: room.y + 1 + Math.random() * (room.height - 2),
            weapon: weaponType
        });
    }

    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        const numEnemies = 2 + Math.floor(Math.random() * 3);

        for (let e = 0; e < numEnemies; e++) {
            const x = room.x + 1 + Math.random() * (room.width - 2);
            const y = room.y + 1 + Math.random() * (room.height - 2);
            const enemyHealth = 30 + gameState.level * 15;

            gameState.enemies.push({
                x,
                y,
                health: enemyHealth,
                maxHealth: enemyHealth,
                hitTime: 0
            });
        }
    }

    gameState.running = true;
    updateUI();
    showMessage('Clear the dungeon!');
}

// Calculate field of view
function updateVisibility() {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            gameState.visible[y][x] = false;
        }
    }

    const px = Math.floor(gameState.player.x);
    const py = Math.floor(gameState.player.y);

    gameState.visible[py][px] = true;
    gameState.explored[py][px] = true;

    for (let angle = 0; angle < 360; angle += 0.5) {
        const rad = angle * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        let x = gameState.player.x;
        let y = gameState.player.y;

        for (let i = 0; i < VISION_RADIUS; i++) {
            x += dx;
            y += dy;

            const tileX = Math.floor(x);
            const tileY = Math.floor(y);

            if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) {
                break;
            }

            gameState.visible[tileY][tileX] = true;
            gameState.explored[tileY][tileX] = true;

            if (gameState.dungeon[tileY][tileX] === TILES.WALL) {
                break;
            }
        }
    }
}

// Check wall collision
function isWall(x, y) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);
    if (tileX < 0 || tileX >= GRID_SIZE || tileY < 0 || tileY >= GRID_SIZE) return true;
    return gameState.dungeon[tileY][tileX] === TILES.WALL;
}

// Shoot bullet
function shoot() {
    if (gameState.player.ammo <= 0 || gameState.player.shootCooldown > 0 || gameState.player.reloadTime > 0) {
        if (gameState.player.ammo === 0 && gameState.player.reloadTime === 0) {
            reload();
        }
        return;
    }

    const weapon = gameState.player.weapon;
    gameState.player.ammo--;
    gameState.player.shootCooldown = weapon.fireRate;
    gameState.player.muzzleFlash = 3;

    const angle = gameState.player.angle;

    // Shotgun fires multiple pellets
    if (weapon.pellets) {
        for (let i = 0; i < weapon.pellets; i++) {
            const spread = (Math.random() - 0.5) * weapon.spread;
            const pelletAngle = angle + spread;
            gameState.bullets.push({
                x: gameState.player.x,
                y: gameState.player.y,
                vx: Math.cos(pelletAngle) * BULLET_SPEED,
                vy: Math.sin(pelletAngle) * BULLET_SPEED,
                damage: weapon.damage,
                life: 30
            });
        }
    } else {
        // Regular single bullet
        gameState.bullets.push({
            x: gameState.player.x,
            y: gameState.player.y,
            vx: Math.cos(angle) * BULLET_SPEED,
            vy: Math.sin(angle) * BULLET_SPEED,
            damage: weapon.damage,
            life: 30
        });
    }

    updateUI();
}

// Reload
function reload() {
    if (gameState.player.reloadTime > 0 || gameState.player.ammo === gameState.player.maxAmmo) return;
    gameState.player.reloadTime = gameState.player.weapon.reloadTime;
    showMessage(`Reloading ${gameState.player.weapon.name}...`);
}

// Update game
function update() {
    if (!gameState.running) return;

    // Update timers
    if (gameState.player.shootCooldown > 0) gameState.player.shootCooldown--;
    if (gameState.player.muzzleFlash > 0) gameState.player.muzzleFlash--;

    if (gameState.player.reloadTime > 0) {
        gameState.player.reloadTime--;
        if (gameState.player.reloadTime === 0) {
            gameState.player.ammo = gameState.player.maxAmmo;
            showMessage('Reloaded!');
            updateUI();
        }
    }

    // Auto-fire when mouse is held down
    if (mouseDown) {
        shoot();
    }

    // Player movement
    let moveX = 0;
    let moveY = 0;

    if (keys['w'] || keys['W']) moveY -= 1;
    if (keys['s'] || keys['S']) moveY += 1;
    if (keys['a'] || keys['A']) moveX -= 1;
    if (keys['d'] || keys['D']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX = (moveX / length) * PLAYER_SPEED;
        moveY = (moveY / length) * PLAYER_SPEED;

        const newX = gameState.player.x + moveX;
        const newY = gameState.player.y + moveY;

        if (!isWall(newX, gameState.player.y)) {
            gameState.player.x = newX;
        }
        if (!isWall(gameState.player.x, newY)) {
            gameState.player.y = newY;
        }

        updateVisibility();
    }

    // Check weapon pickups
    for (let i = gameState.weaponPickups.length - 1; i >= 0; i--) {
        const pickup = gameState.weaponPickups[i];
        const dist = Math.sqrt(
            Math.pow(gameState.player.x - pickup.x, 2) +
            Math.pow(gameState.player.y - pickup.y, 2)
        );

        if (dist < 0.5) {
            gameState.player.weapon = pickup.weapon;
            gameState.player.ammo = pickup.weapon.ammo;
            gameState.player.maxAmmo = pickup.weapon.maxAmmo;
            gameState.weaponPickups.splice(i, 1);
            showMessage(`Picked up ${pickup.weapon.name}!`);
            updateUI();
        }
    }

    // Check stairs
    const stairDist = Math.sqrt(
        Math.pow(gameState.player.x - gameState.stairs.x - 0.5, 2) +
        Math.pow(gameState.player.y - gameState.stairs.y - 0.5, 2)
    );
    if (stairDist < 0.5 && gameState.enemies.length === 0) {
        descendStairs();
        return;
    }

    // Update bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;

        if (bullet.life <= 0 || isWall(bullet.x, bullet.y)) {
            gameState.bullets.splice(i, 1);
            continue;
        }

        // Check bullet-enemy collision
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            const dist = Math.sqrt(
                Math.pow(bullet.x - enemy.x, 2) +
                Math.pow(bullet.y - enemy.y, 2)
            );

            if (dist < 0.4) {
                enemy.health -= bullet.damage;
                enemy.hitTime = 5;
                gameState.bullets.splice(i, 1);

                if (enemy.health <= 0) {
                    gameState.enemies.splice(j, 1);
                    gameState.player.kills++;
                    updateUI();
                }
                break;
            }
        }
    }

    // Update enemies
    for (const enemy of gameState.enemies) {
        if (enemy.hitTime > 0) enemy.hitTime--;

        const enemyTileX = Math.floor(enemy.x);
        const enemyTileY = Math.floor(enemy.y);

        if (!gameState.visible[enemyTileY][enemyTileX]) continue;

        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            const moveX = (dx / distance) * ENEMY_SPEED;
            const moveY = (dy / distance) * ENEMY_SPEED;

            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;

            if (!isWall(newX, enemy.y)) {
                enemy.x = newX;
            }
            if (!isWall(enemy.x, newY)) {
                enemy.y = newY;
            }

            // Check player collision
            const playerDist = Math.sqrt(
                Math.pow(enemy.x - gameState.player.x, 2) +
                Math.pow(enemy.y - gameState.player.y, 2)
            );

            if (playerDist < 0.5) {
                gameState.player.health -= 0.5;
                if (gameState.player.health <= 0) {
                    gameOver();
                }
                updateUI();
            }
        }
    }
}

// Descend stairs
function descendStairs() {
    gameState.level++;
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 30);
    // Keep current weapon when descending
    const currentWeapon = gameState.player.weapon;
    showMessage(`Descended to level ${gameState.level}!`);
    initGame();
    gameState.player.weapon = currentWeapon;
    gameState.player.ammo = currentWeapon.ammo;
    gameState.player.maxAmmo = currentWeapon.maxAmmo;
    updateUI();
}

// Game over
function gameOver() {
    gameState.running = false;
    showMessage(`GAME OVER! You reached level ${gameState.level}`);
}

// Update UI
function updateUI() {
    levelElement.textContent = `Dungeon Level: ${gameState.level}`;
    healthElement.textContent = `Health: ${Math.max(0, Math.floor(gameState.player.health))}/${gameState.player.maxHealth}`;
    ammoElement.textContent = `${gameState.player.weapon.name}: ${gameState.player.ammo}/${gameState.player.maxAmmo}`;
    killsElement.textContent = `Kills: ${gameState.player.kills}`;
}

// Show message
function showMessage(msg) {
    messageElement.textContent = msg;
    setTimeout(() => {
        if (messageElement.textContent === msg) {
            messageElement.textContent = '';
        }
    }, 2000);
}

// Render game
function render() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState.running && gameState.level === 1) {
        ctx.fillStyle = COLORS.text;
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEON SHOOTER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px monospace';
        ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 20);
        return;
    }

    // Draw dungeon with fog of war
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const tile = gameState.dungeon[y][x];
            const visible = gameState.visible[y][x];
            const explored = gameState.explored[y][x];

            if (!explored) continue;

            if (tile === TILES.WALL) {
                ctx.fillStyle = visible ? COLORS.wall : COLORS.wallExplored;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile === TILES.FLOOR) {
                ctx.fillStyle = visible ? COLORS.floor : COLORS.floorExplored;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    ctx.font = `${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw weapon pickups
    for (const pickup of gameState.weaponPickups) {
        const pickupTileX = Math.floor(pickup.x);
        const pickupTileY = Math.floor(pickup.y);

        if (gameState.visible[pickupTileY][pickupTileX]) {
            ctx.fillStyle = pickup.weapon.color;
            ctx.fillText('W',
                pickup.x * TILE_SIZE,
                pickup.y * TILE_SIZE
            );
        }
    }

    // Draw stairs
    if (gameState.visible[gameState.stairs.y][gameState.stairs.x]) {
        ctx.fillStyle = gameState.enemies.length === 0 ? COLORS.stairs : COLORS.wallExplored;
        ctx.fillText('>',
            gameState.stairs.x * TILE_SIZE + TILE_SIZE / 2,
            gameState.stairs.y * TILE_SIZE + TILE_SIZE / 2
        );
    }

    // Draw bullets
    ctx.fillStyle = COLORS.bullet;
    for (const bullet of gameState.bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x * TILE_SIZE, bullet.y * TILE_SIZE, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemies
    for (const enemy of gameState.enemies) {
        const enemyTileX = Math.floor(enemy.x);
        const enemyTileY = Math.floor(enemy.y);

        if (gameState.visible[enemyTileY][enemyTileX]) {
            ctx.fillStyle = enemy.hitTime > 0 ? COLORS.text : COLORS.enemy;
            ctx.fillText('E',
                enemy.x * TILE_SIZE,
                enemy.y * TILE_SIZE
            );

            // Health bar
            const healthPercent = enemy.health / enemy.maxHealth;
            const barWidth = TILE_SIZE - 4;
            const barHeight = 3;
            ctx.fillStyle = '#333333';
            ctx.fillRect(enemy.x * TILE_SIZE - barWidth/2, enemy.y * TILE_SIZE - TILE_SIZE/2 - 5, barWidth, barHeight);
            ctx.fillStyle = COLORS.enemy;
            ctx.fillRect(enemy.x * TILE_SIZE - barWidth/2, enemy.y * TILE_SIZE - TILE_SIZE/2 - 5, barWidth * healthPercent, barHeight);
        }
    }

    // Draw player
    const px = gameState.player.x * TILE_SIZE;
    const py = gameState.player.y * TILE_SIZE;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(gameState.player.angle);

    // Player body
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, TILE_SIZE / 3, 0, Math.PI * 2);
    ctx.fill();

    // Gun (colored by weapon type)
    ctx.fillStyle = gameState.player.weapon.color;
    ctx.fillRect(TILE_SIZE / 4, -2, TILE_SIZE / 3, 4);

    // Muzzle flash
    if (gameState.player.muzzleFlash > 0) {
        ctx.fillStyle = COLORS.muzzleFlash;
        ctx.beginPath();
        ctx.arc(TILE_SIZE / 1.5, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    // Draw crosshair at mouse
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mousePos.x - 10, mousePos.y);
    ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10);
    ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();

    // Draw game over
    if (!gameState.running && gameState.level > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.enemy;
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);

        ctx.fillStyle = COLORS.text;
        ctx.font = '16px monospace';
        ctx.fillText(`Level: ${gameState.level}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Kills: ${gameState.player.kills}`, canvas.width / 2, canvas.height / 2 + 25);
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 60);
    }
}

// Mouse events
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;

    const dx = mousePos.x - gameState.player.x * TILE_SIZE;
    const dy = mousePos.y - gameState.player.y * TILE_SIZE;
    gameState.player.angle = Math.atan2(dy, dx);
});

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (gameState.running) {
        shoot();
    }
});

canvas.addEventListener('mouseup', (e) => {
    mouseDown = false;
});

canvas.addEventListener('mouseleave', (e) => {
    mouseDown = false;
});

// Keyboard events
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.running) {
            gameState = {
                running: false,
                level: 1,
                player: {
                    x: 0,
                    y: 0,
                    angle: 0,
                    health: 100,
                    maxHealth: 100,
                    weapon: WEAPONS.PISTOL,
                    ammo: 12,
                    maxAmmo: 12,
                    kills: 0,
                    reloadTime: 0,
                    shootCooldown: 0,
                    muzzleFlash: 0
                },
                enemies: [],
                bullets: [],
                weaponPickups: [],
                stairs: { x: 0, y: 0 },
                dungeon: [],
                visible: [],
                explored: [],
                messageQueue: []
            };
            initGame();
        }
        return;
    }

    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (gameState.running) reload();
        return;
    }

    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
