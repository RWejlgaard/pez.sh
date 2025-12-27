const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const bubblesElement = document.getElementById('bubbles');
const shotsElement = document.getElementById('shots');
const messageElement = document.getElementById('message');

// Game constants
const BUBBLE_RADIUS = 20;
const ROWS = 12;
const COLS = 13;
const HEX_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);
const SHOOTER_Y = canvas.height - 50;
const TOP_MARGIN = 40;

// Terminal colors matching website theme
const COLORS = {
    background: '#000000',
    bubbles: [
        '#ff0000',  // Red
        '#00ff00',  // Green
        '#0000ff',  // Blue
        '#ffff00',  // Yellow
        '#ff00ff',  // Magenta
        '#00ffff',  // Cyan
    ],
    shooter: '#ffffff',
    aim: '#808080',
    text: '#ffffff'
};

// Game state
let gameState = {
    grid: [],
    currentBubble: null,
    nextBubble: null,
    shooter: { x: canvas.width / 2, y: SHOOTER_Y },
    mousePos: { x: canvas.width / 2, y: 0 },
    activeBubble: null,
    score: 0,
    shots: 0,
    gameOver: false,
    gameWon: false,
    animatingBubbles: []
};

// Bubble object
function createBubble(row, col, color) {
    return {
        row,
        col,
        color,
        x: getBubbleX(row, col),
        y: getBubbleY(row),
        radius: BUBBLE_RADIUS,
        falling: false,
        vy: 0
    };
}

// Get bubble position
function getBubbleX(row, col) {
    const leftMargin = 20;
    const offset = (row % 2 === 0) ? 0 : BUBBLE_RADIUS;
    return leftMargin + col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + offset;
}

function getBubbleY(row) {
    return row * HEX_HEIGHT + TOP_MARGIN + BUBBLE_RADIUS;
}

// Initialize grid
function initGrid() {
    const grid = [];
    const numColors = 5; // Start with 5 colors

    for (let row = 0; row < 6; row++) {
        grid[row] = [];
        const maxCols = (row % 2 === 0) ? COLS : COLS - 1;
        for (let col = 0; col < maxCols; col++) {
            const color = COLORS.bubbles[Math.floor(Math.random() * numColors)];
            grid[row][col] = createBubble(row, col, color);
        }
    }

    // Fill remaining rows with null
    for (let row = 6; row < ROWS; row++) {
        grid[row] = [];
    }

    return grid;
}

// Get random bubble color from existing colors in grid
function getRandomBubbleColor() {
    const existingColors = new Set();
    for (let row = 0; row < gameState.grid.length; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            if (gameState.grid[row][col]) {
                existingColors.add(gameState.grid[row][col].color);
            }
        }
    }

    if (existingColors.size === 0) {
        return COLORS.bubbles[Math.floor(Math.random() * COLORS.bubbles.length)];
    }

    const colorsArray = Array.from(existingColors);
    return colorsArray[Math.floor(Math.random() * colorsArray.length)];
}

// Initialize game
function initGame() {
    gameState.grid = initGrid();
    gameState.currentBubble = {
        color: getRandomBubbleColor(),
        x: gameState.shooter.x,
        y: gameState.shooter.y
    };
    gameState.nextBubble = { color: getRandomBubbleColor() };
    gameState.activeBubble = null;
    gameState.score = 0;
    gameState.shots = 0;
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.animatingBubbles = [];

    updateUI();
    render();
}

// Find closest grid position for bubble
function findGridPosition(x, y) {
    for (let row = 0; row < ROWS; row++) {
        const maxCols = (row % 2 === 0) ? COLS : COLS - 1;
        for (let col = 0; col < maxCols; col++) {
            const bubbleX = getBubbleX(row, col);
            const bubbleY = getBubbleY(row);
            const dist = Math.sqrt((x - bubbleX) ** 2 + (y - bubbleY) ** 2);

            if (dist < BUBBLE_RADIUS * 1.5) {
                return { row, col };
            }
        }
    }
    return null;
}

// Get neighbors of a bubble
function getNeighbors(row, col) {
    const neighbors = [];
    const isEvenRow = row % 2 === 0;

    const offsets = isEvenRow ? [
        [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
    ] : [
        [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
    ];

    for (let [dr, dc] of offsets) {
        const newRow = row + dr;
        const newCol = col + dc;

        if (newRow >= 0 && newRow < ROWS && newCol >= 0) {
            const maxCols = (newRow % 2 === 0) ? COLS : COLS - 1;
            if (newCol < maxCols && gameState.grid[newRow][newCol]) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
    }

    return neighbors;
}

// Find matching bubbles
function findMatches(row, col, color) {
    const matches = [];
    const visited = new Set();
    const queue = [{ row, col }];

    while (queue.length > 0) {
        const { row: r, col: c } = queue.shift();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const bubble = gameState.grid[r][c];
        if (!bubble || bubble.color !== color) continue;

        matches.push({ row: r, col: c });

        const neighbors = getNeighbors(r, c);
        for (let neighbor of neighbors) {
            queue.push(neighbor);
        }
    }

    return matches;
}

// Find floating bubbles (not connected to top)
function findFloatingBubbles() {
    const visited = new Set();
    const queue = [];

    // Start from top row
    for (let col = 0; col < gameState.grid[0].length; col++) {
        if (gameState.grid[0][col]) {
            queue.push({ row: 0, col });
        }
    }

    // BFS to find all connected bubbles
    while (queue.length > 0) {
        const { row, col } = queue.shift();
        const key = `${row},${col}`;

        if (visited.has(key)) continue;
        visited.add(key);

        const neighbors = getNeighbors(row, col);
        for (let neighbor of neighbors) {
            queue.push(neighbor);
        }
    }

    // Find bubbles not visited (floating)
    const floating = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const key = `${row},${col}`;
            if (gameState.grid[row][col] && !visited.has(key)) {
                floating.push({ row, col });
            }
        }
    }

    return floating;
}

// Remove bubbles with animation
function removeBubbles(positions, isFloating = false) {
    for (let { row, col } of positions) {
        const bubble = gameState.grid[row][col];
        if (bubble) {
            // Add to animating bubbles
            gameState.animatingBubbles.push({
                x: bubble.x,
                y: bubble.y,
                color: bubble.color,
                scale: 1,
                alpha: 1,
                isFloating: isFloating,
                vy: isFloating ? 0 : 0,
                animationFrame: 0
            });
            gameState.grid[row][col] = null;
        }
    }
}

// Check if game is won
function checkWin() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            if (gameState.grid[row][col]) {
                return false;
            }
        }
    }
    return true;
}

// Check if game is over (bubbles reached bottom)
function checkGameOver() {
    for (let col = 0; col < gameState.grid[ROWS - 1].length; col++) {
        if (gameState.grid[ROWS - 1][col]) {
            return true;
        }
    }
    return false;
}

// Add row of bubbles
function addRow() {
    // Shift all rows down
    for (let row = ROWS - 1; row > 0; row--) {
        gameState.grid[row] = gameState.grid[row - 1];
        // Update bubble positions
        for (let col = 0; col < gameState.grid[row].length; col++) {
            if (gameState.grid[row][col]) {
                gameState.grid[row][col].row = row;
                gameState.grid[row][col].y = getBubbleY(row);
            }
        }
    }

    // Add new row at top
    gameState.grid[0] = [];
    const maxCols = COLS;
    for (let col = 0; col < maxCols; col++) {
        const color = COLORS.bubbles[Math.floor(Math.random() * COLORS.bubbles.length)];
        gameState.grid[0][col] = createBubble(0, col, color);
    }
}

// Shoot bubble
function shootBubble(targetX, targetY) {
    if (gameState.activeBubble || gameState.gameOver || gameState.gameWon) return;

    const dx = targetX - gameState.shooter.x;
    const dy = targetY - gameState.shooter.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    gameState.activeBubble = {
        x: gameState.shooter.x,
        y: gameState.shooter.y,
        vx: (dx / length) * 10,
        vy: (dy / length) * 10,
        color: gameState.currentBubble.color
    };

    gameState.shots++;
    updateUI();
}

// Update active bubble
function updateActiveBubble() {
    if (!gameState.activeBubble) return;

    const bubble = gameState.activeBubble;
    bubble.x += bubble.vx;
    bubble.y += bubble.vy;

    // Wall collision
    if (bubble.x - BUBBLE_RADIUS <= 0 || bubble.x + BUBBLE_RADIUS >= canvas.width) {
        bubble.vx *= -1;
        bubble.x = Math.max(BUBBLE_RADIUS, Math.min(canvas.width - BUBBLE_RADIUS, bubble.x));
    }

    // Check collision with grid bubbles
    let collided = false;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const gridBubble = gameState.grid[row][col];
            if (gridBubble) {
                const dist = Math.sqrt((bubble.x - gridBubble.x) ** 2 + (bubble.y - gridBubble.y) ** 2);
                if (dist < BUBBLE_RADIUS * 2) {
                    collided = true;
                    break;
                }
            }
        }
        if (collided) break;
    }

    // Check if reached top
    if (bubble.y - BUBBLE_RADIUS <= TOP_MARGIN) {
        collided = true;
    }

    // Handle collision
    if (collided) {
        const pos = findGridPosition(bubble.x, bubble.y);
        if (pos && !gameState.grid[pos.row][pos.col]) {
            // Add bubble to grid
            gameState.grid[pos.row][pos.col] = createBubble(pos.row, pos.col, bubble.color);

            // Find matches
            const matches = findMatches(pos.row, pos.col, bubble.color);
            if (matches.length >= 3) {
                removeBubbles(matches);
                gameState.score += matches.length * 10;

                // Find and remove floating bubbles
                const floating = findFloatingBubbles();
                if (floating.length > 0) {
                    removeBubbles(floating, true);
                    gameState.score += floating.length * 20;
                }
            }

            // Check win/lose
            if (checkWin()) {
                gameState.gameWon = true;
                messageElement.textContent = 'YOU WIN! Press N for new game';
            } else if (checkGameOver()) {
                gameState.gameOver = true;
                messageElement.textContent = 'GAME OVER! Press N for new game';
            }

            updateUI();
        }

        // Reset active bubble and get new one
        gameState.activeBubble = null;
        gameState.currentBubble = gameState.nextBubble;
        gameState.nextBubble = { color: getRandomBubbleColor() };
    }
}

// Update UI
function updateUI() {
    scoreElement.textContent = `Score: ${gameState.score}`;
    shotsElement.textContent = `Shots: ${gameState.shots}`;

    let bubbleCount = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            if (gameState.grid[row][col]) bubbleCount++;
        }
    }
    bubblesElement.textContent = `Bubbles: ${bubbleCount}`;
}

// Draw bubble
function drawBubble(x, y, color, radius = BUBBLE_RADIUS) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

// Render game
function render() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid bubbles
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < gameState.grid[row].length; col++) {
            const bubble = gameState.grid[row][col];
            if (bubble) {
                drawBubble(bubble.x, bubble.y, bubble.color);
            }
        }
    }

    // Draw animating bubbles
    for (let bubble of gameState.animatingBubbles) {
        ctx.save();
        ctx.globalAlpha = bubble.alpha;
        drawBubble(bubble.x, bubble.y, bubble.color, BUBBLE_RADIUS * bubble.scale);
        ctx.restore();
    }

    // Draw active bubble
    if (gameState.activeBubble) {
        drawBubble(gameState.activeBubble.x, gameState.activeBubble.y, gameState.activeBubble.color);
    }

    // Draw aim line
    if (!gameState.activeBubble && !gameState.gameOver && !gameState.gameWon) {
        ctx.strokeStyle = COLORS.aim;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(gameState.shooter.x, gameState.shooter.y);
        ctx.lineTo(gameState.mousePos.x, gameState.mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw shooter
    ctx.fillStyle = COLORS.shooter;
    ctx.beginPath();
    ctx.moveTo(gameState.shooter.x - 15, gameState.shooter.y + 10);
    ctx.lineTo(gameState.shooter.x + 15, gameState.shooter.y + 10);
    ctx.lineTo(gameState.shooter.x, gameState.shooter.y - 10);
    ctx.closePath();
    ctx.fill();

    // Draw current bubble
    if (gameState.currentBubble && !gameState.activeBubble) {
        drawBubble(gameState.shooter.x, gameState.shooter.y - 30, gameState.currentBubble.color, BUBBLE_RADIUS * 0.8);
    }

    // Draw next bubble indicator
    if (gameState.nextBubble) {
        ctx.fillStyle = COLORS.text;
        ctx.font = '14px monospace';
        ctx.fillText('NEXT:', 20, canvas.height - 20);
        drawBubble(80, canvas.height - 25, gameState.nextBubble.color, BUBBLE_RADIUS * 0.6);
    }
}

// Update animating bubbles
function updateAnimatingBubbles() {
    for (let i = gameState.animatingBubbles.length - 1; i >= 0; i--) {
        const bubble = gameState.animatingBubbles[i];
        bubble.animationFrame++;

        if (bubble.isFloating) {
            // Falling animation
            bubble.vy += 0.5;
            bubble.y += bubble.vy;
            bubble.alpha = Math.max(0, 1 - bubble.animationFrame / 30);

            if (bubble.animationFrame > 30 || bubble.y > canvas.height) {
                gameState.animatingBubbles.splice(i, 1);
            }
        } else {
            // Pop animation - expand then fade
            if (bubble.animationFrame < 10) {
                bubble.scale = 1 + (bubble.animationFrame / 10) * 0.5;
            } else {
                bubble.scale = 1.5 - ((bubble.animationFrame - 10) / 10) * 1.5;
                bubble.alpha = Math.max(0, 1 - (bubble.animationFrame - 10) / 10);
            }

            if (bubble.animationFrame > 20) {
                gameState.animatingBubbles.splice(i, 1);
            }
        }
    }
}

// Game loop
function gameLoop() {
    updateActiveBubble();
    updateAnimatingBubbles();
    render();
    requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    gameState.mousePos.x = e.clientX - rect.left;
    gameState.mousePos.y = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    if (gameState.gameOver || gameState.gameWon) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (y < gameState.shooter.y) {
        shootBubble(x, y);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n') {
        messageElement.textContent = '';
        initGame();
    }
});

// Start game
initGame();
gameLoop();
