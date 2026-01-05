const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const messageElement = document.getElementById('message');

// Game state
let gameState = 'playing'; // 'playing', 'gameOver', 'levelComplete'
let score = 0;
let level = 1;
let lives = 3;

// Player
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 30,
    speed: 5
};

// Invaders
let invaders = [];
let invaderDirection = 1; // 1 for right, -1 for left
let invaderSpeed = 1;
let invaderDropDistance = 20;
let invaderRows = 5;
let invaderCols = 11;
let invaderWidth = 30;
let invaderHeight = 20;
let invaderSpacing = 10;

// Bullets
let playerBullets = [];
let invaderBullets = [];
const bulletSpeed = 7;
const invaderBulletSpeed = 3;

// Shields
let shields = [];
const shieldWidth = 60;
const shieldHeight = 40;
const shieldBlockSize = 4;

// Keys
const keys = {};

// Timing
let lastInvaderShot = 0;
const invaderShootInterval = 1000; // ms

// Initialize game
function init() {
    createInvaders();
    createShields();
    gameLoop();
}

function createInvaders() {
    invaders = [];
    const startX = 100;
    const startY = 80;

    for (let row = 0; row < invaderRows; row++) {
        for (let col = 0; col < invaderCols; col++) {
            invaders.push({
                x: startX + col * (invaderWidth + invaderSpacing),
                y: startY + row * (invaderHeight + invaderSpacing),
                width: invaderWidth,
                height: invaderHeight,
                alive: true,
                type: row // Different types for different rows
            });
        }
    }
}

function createShields() {
    shields = [];
    const shieldY = canvas.height - 150;
    const spacing = (canvas.width - (shieldWidth * 4)) / 5;

    for (let i = 0; i < 4; i++) {
        const shield = {
            x: spacing + i * (shieldWidth + spacing),
            y: shieldY,
            blocks: []
        };

        // Create shield blocks
        for (let row = 0; row < shieldHeight / shieldBlockSize; row++) {
            for (let col = 0; col < shieldWidth / shieldBlockSize; col++) {
                // Create a curved top shape
                const distFromCenter = Math.abs(col - shieldWidth / shieldBlockSize / 2);
                const maxDist = shieldWidth / shieldBlockSize / 2;
                const heightFactor = 1 - (distFromCenter / maxDist) * 0.3;

                if (row > (shieldHeight / shieldBlockSize) * 0.2 || row < (shieldHeight / shieldBlockSize) * heightFactor) {
                    // Skip bottom center blocks
                    if (row > (shieldHeight / shieldBlockSize) * 0.6 &&
                        col > shieldWidth / shieldBlockSize * 0.35 &&
                        col < shieldWidth / shieldBlockSize * 0.65) {
                        continue;
                    }

                    shield.blocks.push({
                        x: col * shieldBlockSize,
                        y: row * shieldBlockSize,
                        alive: true
                    });
                }
            }
        }

        shields.push(shield);
    }
}

function drawPlayer() {
    ctx.fillStyle = '#00ff00';

    // Draw a simple tank/ship
    // Base
    ctx.fillRect(player.x + 5, player.y + 20, 30, 10);
    // Turret
    ctx.fillRect(player.x + 15, player.y + 10, 10, 10);
    // Cannon
    ctx.fillRect(player.x + 18, player.y, 4, 10);
}

function drawInvaders() {
    invaders.forEach(invader => {
        if (!invader.alive) return;

        // Different colors for different rows
        const colors = ['#ff0000', '#ff8080', '#ffff00', '#00ffff', '#ff00ff'];
        ctx.fillStyle = colors[invader.type];

        // Simple invader shape
        ctx.fillRect(invader.x + 5, invader.y, 20, 5);
        ctx.fillRect(invader.x, invader.y + 5, 30, 10);
        ctx.fillRect(invader.x + 5, invader.y + 15, 5, 5);
        ctx.fillRect(invader.x + 20, invader.y + 15, 5, 5);
    });
}

function drawBullets() {
    ctx.fillStyle = '#00ff00';
    playerBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 3, 10);
    });

    ctx.fillStyle = '#ff0000';
    invaderBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, 3, 10);
    });
}

function drawShields() {
    ctx.fillStyle = '#00ffff';
    shields.forEach(shield => {
        shield.blocks.forEach(block => {
            if (block.alive) {
                ctx.fillRect(
                    shield.x + block.x,
                    shield.y + block.y,
                    shieldBlockSize,
                    shieldBlockSize
                );
            }
        });
    });
}

function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys[' '] && playerBullets.length < 3) {
        shootPlayerBullet();
        keys[' '] = false; // Prevent holding space
    }
}

function shootPlayerBullet() {
    playerBullets.push({
        x: player.x + player.width / 2 - 1.5,
        y: player.y,
        width: 3,
        height: 10
    });
}

function updateInvaders() {
    let shouldDrop = false;
    let changeDirection = false;

    // Check if any invader hit the edge
    invaders.forEach(invader => {
        if (!invader.alive) return;

        if ((invader.x <= 0 && invaderDirection === -1) ||
            (invader.x + invader.width >= canvas.width && invaderDirection === 1)) {
            changeDirection = true;
        }
    });

    if (changeDirection) {
        invaderDirection *= -1;
        shouldDrop = true;
    }

    // Move invaders
    invaders.forEach(invader => {
        if (!invader.alive) return;

        invader.x += invaderDirection * invaderSpeed;
        if (shouldDrop) {
            invader.y += invaderDropDistance;
        }

        // Check if invaders reached the player
        if (invader.y + invader.height >= player.y) {
            gameState = 'gameOver';
        }
    });

    // Random invader shooting
    const now = Date.now();
    if (now - lastInvaderShot > invaderShootInterval) {
        shootInvaderBullet();
        lastInvaderShot = now;
    }
}

function shootInvaderBullet() {
    // Get all alive invaders
    const aliveInvaders = invaders.filter(inv => inv.alive);
    if (aliveInvaders.length === 0) return;

    // Pick a random invader from the bottom rows
    const bottomInvaders = aliveInvaders.filter(inv => {
        // Check if there's no invader below this one
        return !invaders.some(other =>
            other.alive &&
            other.y > inv.y &&
            Math.abs(other.x - inv.x) < invaderWidth
        );
    });

    if (bottomInvaders.length > 0) {
        const shooter = bottomInvaders[Math.floor(Math.random() * bottomInvaders.length)];
        invaderBullets.push({
            x: shooter.x + shooter.width / 2 - 1.5,
            y: shooter.y + shooter.height,
            width: 3,
            height: 10
        });
    }
}

function updateBullets() {
    // Update player bullets
    playerBullets = playerBullets.filter(bullet => {
        bullet.y -= bulletSpeed;
        return bullet.y > 0;
    });

    // Update invader bullets
    invaderBullets = invaderBullets.filter(bullet => {
        bullet.y += invaderBulletSpeed;
        return bullet.y < canvas.height;
    });
}

function checkCollisions() {
    // Player bullets vs invaders
    playerBullets = playerBullets.filter(bullet => {
        let hit = false;
        invaders.forEach(invader => {
            if (!invader.alive) return;

            if (bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                invader.alive = false;
                hit = true;
                score += (5 - invader.type) * 10;
                updateScore();
            }
        });
        return !hit;
    });

    // Check for level complete
    if (invaders.every(inv => !inv.alive)) {
        gameState = 'levelComplete';
    }

    // Bullets vs shields
    playerBullets = playerBullets.filter(bullet => {
        return !checkBulletShieldCollision(bullet);
    });

    invaderBullets = invaderBullets.filter(bullet => {
        return !checkBulletShieldCollision(bullet);
    });

    // Invader bullets vs player
    invaderBullets = invaderBullets.filter(bullet => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            lives--;
            updateLives();
            if (lives <= 0) {
                gameState = 'gameOver';
            } else {
                // Brief invincibility - just remove the bullet
                messageElement.textContent = 'Hit! Be careful!';
                setTimeout(() => {
                    if (gameState === 'playing') {
                        messageElement.textContent = '';
                    }
                }, 1000);
            }
            return false;
        }
        return true;
    });
}

function checkBulletShieldCollision(bullet) {
    let hit = false;
    shields.forEach(shield => {
        shield.blocks.forEach(block => {
            if (!block.alive) return;

            const blockX = shield.x + block.x;
            const blockY = shield.y + block.y;

            if (bullet.x < blockX + shieldBlockSize &&
                bullet.x + bullet.width > blockX &&
                bullet.y < blockY + shieldBlockSize &&
                bullet.y + bullet.height > blockY) {
                block.alive = false;
                hit = true;
            }
        });
    });
    return hit;
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
}

function updateLevel() {
    levelElement.textContent = `Level: ${level}`;
}

function updateLives() {
    livesElement.textContent = `Lives: ${lives}`;
}

function nextLevel() {
    level++;
    updateLevel();

    // Increase difficulty
    invaderSpeed += 0.3;
    if (invaderRows < 6) {
        invaderRows++;
    }

    // Reset game objects
    playerBullets = [];
    invaderBullets = [];
    invaderDirection = 1;
    player.x = canvas.width / 2 - 20;

    createInvaders();
    createShields();

    gameState = 'playing';
    messageElement.textContent = `Level ${level}!`;
    setTimeout(() => {
        if (gameState === 'playing') {
            messageElement.textContent = '';
        }
    }, 2000);
}

function restart() {
    score = 0;
    level = 1;
    lives = 3;
    invaderSpeed = 1;
    invaderRows = 5;

    updateScore();
    updateLevel();
    updateLives();

    playerBullets = [];
    invaderBullets = [];
    invaderDirection = 1;
    player.x = canvas.width / 2 - 20;

    createInvaders();
    createShields();

    gameState = 'playing';
    messageElement.textContent = '';
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game objects
    drawShields();
    drawPlayer();
    drawInvaders();
    drawBullets();

    // Draw messages
    if (gameState === 'gameOver') {
        ctx.fillStyle = '#ff0000';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px monospace';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 40);
        messageElement.textContent = 'Game Over! Press R to restart';
    } else if (gameState === 'levelComplete') {
        ctx.fillStyle = '#00ff00';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px monospace';
        ctx.fillText('Press Space to Continue', canvas.width / 2, canvas.height / 2 + 40);
        messageElement.textContent = 'Level Complete! Press Space for next level';
    }
}

function update() {
    if (gameState === 'playing') {
        updatePlayer();
        updateInvaders();
        updateBullets();
        checkCollisions();
    } else if (gameState === 'levelComplete') {
        if (keys[' ']) {
            nextLevel();
            keys[' '] = false;
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'r' || e.key === 'R') {
        restart();
    }

    // Prevent space bar from scrolling
    if (e.key === ' ') {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Start game
init();
