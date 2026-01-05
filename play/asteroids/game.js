const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const messageEl = document.getElementById("message");

// Game state
let gameState = "playing"; // 'playing', 'gameOver', 'levelComplete'
let score = 0;
let level = 1;
let lives = 3;

// Ship
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: -Math.PI / 2,
  rotation: 0,
  velocity: { x: 0, y: 0 },
  size: 15,
  thrust: false,
  invulnerable: 0,
  respawnDelay: 0,
};

// Game objects
let bullets = [];
let asteroids = [];
let particles = [];

// Input
const keys = {};

// Constants
const SHIP_ACCELERATION = 0.15;
const SHIP_FRICTION = 0.99;
const SHIP_MAX_SPEED = 8;
const SHIP_ROTATION_SPEED = 0.08;
const BULLET_SPEED = 10;
const BULLET_LIFETIME = 60;
const ASTEROID_SPEEDS = [1, 1.5, 2];
const ASTEROID_SIZES = [40, 20, 10];
const POINTS = [20, 50, 100];
const INVULNERABLE_TIME = 120;

// Event listeners
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "r" || e.key === "R") {
    if (gameState === "gameOver") {
      restartGame();
    }
  }
  if (e.key === " ") {
    e.preventDefault();
    if (gameState === "playing" && ship.respawnDelay === 0) {
      shoot();
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function shoot() {
  const bullet = {
    x: ship.x + Math.cos(ship.angle) * ship.size,
    y: ship.y + Math.sin(ship.angle) * ship.size,
    velocity: {
      x: Math.cos(ship.angle) * BULLET_SPEED + ship.velocity.x,
      y: Math.sin(ship.angle) * BULLET_SPEED + ship.velocity.y,
    },
    lifetime: BULLET_LIFETIME,
  };
  bullets.push(bullet);
}

function createAsteroid(x, y, size) {
  const angle = Math.random() * Math.PI * 2;
  const speed = ASTEROID_SPEEDS[size];
  const asteroid = {
    x: x !== undefined ? x : Math.random() * canvas.width,
    y: y !== undefined ? y : Math.random() * canvas.height,
    velocity: {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    },
    size: size,
    radius: ASTEROID_SIZES[size],
    rotation: (Math.random() - 0.5) * 0.05,
    angle: Math.random() * Math.PI * 2,
    points: generateAsteroidShape(),
  };

  // Make sure asteroids don't spawn too close to ship at start
  if (x === undefined && y === undefined) {
    const dx = asteroid.x - ship.x;
    const dy = asteroid.y - ship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100) {
      asteroid.x = ship.x + Math.cos(angle) * 150;
      asteroid.y = ship.y + Math.sin(angle) * 150;
    }
  }

  return asteroid;
}

function generateAsteroidShape() {
  const points = [];
  const numPoints = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const radius = 0.8 + Math.random() * 0.4;
    points.push({ angle, radius });
  }
  return points;
}

function createParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: x,
      y: y,
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      lifetime: 30 + Math.random() * 20,
      color: color,
    });
  }
}

function initLevel() {
  asteroids = [];
  bullets = [];
  const numAsteroids = 3 + level;
  for (let i = 0; i < numAsteroids; i++) {
    asteroids.push(createAsteroid(undefined, undefined, 0));
  }
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
  ship.velocity = { x: 0, y: 0 };
  ship.angle = -Math.PI / 2;
  ship.invulnerable = INVULNERABLE_TIME;
  ship.respawnDelay = 0;
  gameState = "playing";
  messageEl.textContent = `LEVEL ${level}`;
  setTimeout(() => {
    if (gameState === "playing") messageEl.textContent = "";
  }, 2000);
}

function restartGame() {
  score = 0;
  level = 1;
  lives = 3;
  particles = [];
  updateUI();
  initLevel();
}

function nextLevel() {
  level++;
  updateUI();
  initLevel();
}

function loseLife() {
  lives--;
  updateUI();

  if (lives <= 0) {
    gameState = "gameOver";
    messageEl.textContent = "GAME OVER - Press R to restart";
  } else {
    ship.respawnDelay = 120;
    ship.invulnerable = INVULNERABLE_TIME;
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.velocity = { x: 0, y: 0 };
    ship.angle = -Math.PI / 2;
    createParticles(ship.x, ship.y, 20, "#ffffff");
  }
}

function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  levelEl.textContent = `Level: ${level}`;
  livesEl.textContent = `Lives: ${lives}`;
}

function update() {
  if (gameState !== "playing") return;

  // Ship respawn delay
  if (ship.respawnDelay > 0) {
    ship.respawnDelay--;
    return;
  }

  // Ship controls
  if (keys["ArrowLeft"]) {
    ship.angle -= SHIP_ROTATION_SPEED;
  }
  if (keys["ArrowRight"]) {
    ship.angle += SHIP_ROTATION_SPEED;
  }

  ship.thrust = false;
  if (keys["ArrowUp"]) {
    ship.velocity.x += Math.cos(ship.angle) * SHIP_ACCELERATION;
    ship.velocity.y += Math.sin(ship.angle) * SHIP_ACCELERATION;
    ship.thrust = true;
  }

  // Apply friction and speed limit
  ship.velocity.x *= SHIP_FRICTION;
  ship.velocity.y *= SHIP_FRICTION;

  const speed = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
  if (speed > SHIP_MAX_SPEED) {
    ship.velocity.x = (ship.velocity.x / speed) * SHIP_MAX_SPEED;
    ship.velocity.y = (ship.velocity.y / speed) * SHIP_MAX_SPEED;
  }

  // Update ship position
  ship.x += ship.velocity.x;
  ship.y += ship.velocity.y;

  // Wrap ship around screen
  if (ship.x < 0) ship.x = canvas.width;
  if (ship.x > canvas.width) ship.x = 0;
  if (ship.y < 0) ship.y = canvas.height;
  if (ship.y > canvas.height) ship.y = 0;

  // Invulnerability timer
  if (ship.invulnerable > 0) {
    ship.invulnerable--;
  }

  // Thrust particles
  if (ship.thrust && Math.random() > 0.5) {
    const exhaustX = ship.x - Math.cos(ship.angle) * ship.size;
    const exhaustY = ship.y - Math.sin(ship.angle) * ship.size;
    // Create particles that shoot backward (opposite of ship direction)
    const spreadAngle = (Math.random() - 0.5) * 0.5; // Add some spread
    const particleAngle = ship.angle + Math.PI + spreadAngle; // Opposite direction
    const speed = Math.random() * 2 + 1;
    particles.push({
      x: exhaustX,
      y: exhaustY,
      velocity: {
        x: Math.cos(particleAngle) * speed,
        y: Math.sin(particleAngle) * speed,
      },
      lifetime: 20 + Math.random() * 10,
      color: "#ff0000",
    });
  }

  // Update bullets
  bullets = bullets.filter((bullet) => {
    bullet.x += bullet.velocity.x;
    bullet.y += bullet.velocity.y;
    bullet.lifetime--;

    // Wrap bullets
    if (bullet.x < 0) bullet.x = canvas.width;
    if (bullet.x > canvas.width) bullet.x = 0;
    if (bullet.y < 0) bullet.y = canvas.height;
    if (bullet.y > canvas.height) bullet.y = 0;

    return bullet.lifetime > 0;
  });

  // Update asteroids
  asteroids.forEach((asteroid) => {
    asteroid.x += asteroid.velocity.x;
    asteroid.y += asteroid.velocity.y;
    asteroid.angle += asteroid.rotation;

    // Wrap asteroids
    if (asteroid.x < -asteroid.radius)
      asteroid.x = canvas.width + asteroid.radius;
    if (asteroid.x > canvas.width + asteroid.radius)
      asteroid.x = -asteroid.radius;
    if (asteroid.y < -asteroid.radius)
      asteroid.y = canvas.height + asteroid.radius;
    if (asteroid.y > canvas.height + asteroid.radius)
      asteroid.y = -asteroid.radius;
  });

  // Update particles
  particles = particles.filter((particle) => {
    particle.x += particle.velocity.x;
    particle.y += particle.velocity.y;
    particle.lifetime--;
    return particle.lifetime > 0;
  });

  // Collision detection: bullets vs asteroids
  const newAsteroids = [];
  bullets = bullets.filter((bullet) => {
    let bulletHit = false;
    asteroids = asteroids.filter((asteroid) => {
      const dx = bullet.x - asteroid.x;
      const dy = bullet.y - asteroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < asteroid.radius) {
        bulletHit = true;
        score += POINTS[asteroid.size];
        updateUI();

        // Create particles
        createParticles(asteroid.x, asteroid.y, 10, "#00ffff");

        // Split asteroid into smaller pieces (size 0=large, 1=medium, 2=small)
        if (asteroid.size < 2) {
          for (let i = 0; i < 2; i++) {
            newAsteroids.push(
              createAsteroid(asteroid.x, asteroid.y, asteroid.size + 1),
            );
          }
        }

        return false; // Remove asteroid
      }
      return true;
    });
    return !bulletHit;
  });
  asteroids.push(...newAsteroids);

  // Collision detection: ship vs asteroids
  if (ship.invulnerable === 0) {
    asteroids.forEach((asteroid) => {
      const dx = ship.x - asteroid.x;
      const dy = ship.y - asteroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ship.size + asteroid.radius) {
        loseLife();
      }
    });
  }

  // Check for level complete
  if (asteroids.length === 0) {
    nextLevel();
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ship (skip if respawning)
  if (ship.respawnDelay === 0) {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Flicker if invulnerable
    if (
      ship.invulnerable === 0 ||
      Math.floor(ship.invulnerable / 5) % 2 === 0
    ) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.size, 0);
      ctx.lineTo(-ship.size, ship.size / 2);
      ctx.lineTo(-ship.size / 2, 0);
      ctx.lineTo(-ship.size, -ship.size / 2);
      ctx.closePath();
      ctx.stroke();

      // Thrust flame
      if (ship.thrust) {
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(-ship.size / 2, ship.size / 4);
        ctx.lineTo(-ship.size * 1.5, 0);
        ctx.lineTo(-ship.size / 2, -ship.size / 4);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Draw bullets
  ctx.fillStyle = "#00ff00";
  bullets.forEach((bullet) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw asteroids
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  asteroids.forEach((asteroid) => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.angle);
    ctx.beginPath();
    asteroid.points.forEach((point, i) => {
      const x = Math.cos(point.angle) * asteroid.radius * point.radius;
      const y = Math.sin(point.angle) * asteroid.radius * point.radius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  });

  // Draw particles
  particles.forEach((particle) => {
    const alpha = particle.lifetime / 50;
    ctx.fillStyle =
      particle.color +
      Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    ctx.fillRect(particle.x, particle.y, 2, 2);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Initialize and start game
initLevel();
gameLoop();
