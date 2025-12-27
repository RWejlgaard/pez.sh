const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minesElement = document.getElementById('mines');
const flagsElement = document.getElementById('flags');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');

// Game constants
const GRID_SIZE = 16;
const TILE_SIZE = canvas.width / GRID_SIZE;
const MINE_COUNT = 40;

// Terminal colors
const COLORS = {
    background: '#000000',
    revealed: '#1a1a1a',
    unrevealed: '#404040',
    border: '#808080',
    mine: '#ff0000',
    flag: '#ff8800',
    text: '#ffffff',
    numbers: {
        1: '#00ffff',
        2: '#00ff00',
        3: '#ff0000',
        4: '#0000ff',
        5: '#ff00ff',
        6: '#00ffff',
        7: '#000000',
        8: '#808080'
    }
};

// Game state
let gameState = {
    initialized: false,
    running: false,
    won: false,
    grid: [],
    revealed: [],
    flagged: [],
    mineCount: MINE_COUNT,
    flagCount: 0,
    startTime: null,
    timerInterval: null
};

// Initialize grid
function initGame() {
    gameState.initialized = false;
    gameState.running = false;
    gameState.won = false;
    gameState.grid = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(0)
    );
    gameState.revealed = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(false)
    );
    gameState.flagged = Array(GRID_SIZE).fill(null).map(() =>
        Array(GRID_SIZE).fill(false)
    );
    gameState.mineCount = MINE_COUNT;
    gameState.flagCount = 0;
    gameState.startTime = null;

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    updateUI();
    render();
}

// Place mines after first click
function placeMines(firstX, firstY) {
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);

        // Don't place mine on first click or adjacent cells
        const dx = Math.abs(x - firstX);
        const dy = Math.abs(y - firstY);
        if (dx <= 1 && dy <= 1) continue;

        if (gameState.grid[y][x] !== -1) {
            gameState.grid[y][x] = -1;
            minesPlaced++;
        }
    }

    // Calculate numbers
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x] === -1) continue;

            let count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dy === 0 && dx === 0) continue;
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
                        if (gameState.grid[ny][nx] === -1) {
                            count++;
                        }
                    }
                }
            }
            gameState.grid[y][x] = count;
        }
    }
}

// Start timer
function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        timerElement.textContent = `Time: ${elapsed}`;
    }, 1000);
}

// Reveal cell
function revealCell(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (gameState.revealed[y][x] || gameState.flagged[y][x]) return;

    // Place mines on first click
    if (!gameState.initialized) {
        gameState.initialized = true;
        placeMines(x, y);
        gameState.running = true;
        startTimer();
        messageElement.textContent = '';
    }

    gameState.revealed[y][x] = true;

    // Hit a mine
    if (gameState.grid[y][x] === -1) {
        gameOver(false);
        return;
    }

    // If empty, reveal adjacent cells
    if (gameState.grid[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy === 0 && dx === 0) continue;
                revealCell(x + dx, y + dy);
            }
        }
    }

    checkWin();
}

// Toggle flag
function toggleFlag(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (gameState.revealed[y][x]) return;

    gameState.flagged[y][x] = !gameState.flagged[y][x];
    gameState.flagCount += gameState.flagged[y][x] ? 1 : -1;
    updateUI();
}

// Clear adjacent cells if correct number of flags
function clearAdjacent(x, y) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (!gameState.revealed[y][x]) return;
    if (gameState.grid[y][x] === 0 || gameState.grid[y][x] === -1) return;

    // Count adjacent flags
    let flagCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
                if (gameState.flagged[ny][nx]) {
                    flagCount++;
                }
            }
        }
    }

    // If flag count matches the number, reveal all non-flagged adjacent cells
    if (flagCount === gameState.grid[y][x]) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy === 0 && dx === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < GRID_SIZE && nx >= 0 && nx < GRID_SIZE) {
                    if (!gameState.flagged[ny][nx]) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
    }
}

// Check win condition
function checkWin() {
    let revealedCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.revealed[y][x]) {
                revealedCount++;
            }
        }
    }

    const totalNonMines = GRID_SIZE * GRID_SIZE - MINE_COUNT;
    if (revealedCount === totalNonMines) {
        gameOver(true);
    }
}

// Game over
function gameOver(won) {
    gameState.running = false;
    gameState.won = won;

    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }

    // Reveal all mines
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (gameState.grid[y][x] === -1) {
                gameState.revealed[y][x] = true;
            }
        }
    }

    if (won) {
        showMessage('YOU WIN! Click anywhere for new game');
    } else {
        showMessage('GAME OVER! Click anywhere for new game');
    }

    render();
}

// Update UI
function updateUI() {
    const remaining = MINE_COUNT - gameState.flagCount;
    minesElement.textContent = `Mines: ${remaining}`;
    flagsElement.textContent = `Flags: ${gameState.flagCount}`;

    if (!gameState.startTime) {
        timerElement.textContent = 'Time: 0';
    }
}

// Show message
function showMessage(msg) {
    messageElement.textContent = msg;
}

// Render game
function render() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;

            if (gameState.revealed[y][x]) {
                // Revealed cell
                ctx.fillStyle = COLORS.revealed;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                const value = gameState.grid[y][x];

                if (value === -1) {
                    // Mine
                    ctx.fillStyle = COLORS.mine;
                    ctx.font = `${TILE_SIZE * 0.6}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('*', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
                } else if (value > 0) {
                    // Number
                    ctx.fillStyle = COLORS.numbers[value] || COLORS.text;
                    ctx.font = `${TILE_SIZE * 0.5}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(value.toString(), px + TILE_SIZE / 2, py + TILE_SIZE / 2);
                }
            } else {
                // Unrevealed cell
                ctx.fillStyle = COLORS.unrevealed;
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);

                // Flag
                if (gameState.flagged[y][x]) {
                    ctx.fillStyle = COLORS.flag;
                    ctx.font = `${TILE_SIZE * 0.6}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('F', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
                }
            }

            // Border
            ctx.strokeStyle = COLORS.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw start message
    if (!gameState.initialized) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.text;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MINESWEEPER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px monospace';
        ctx.fillText('Click anywhere to start', canvas.width / 2, canvas.height / 2 + 20);
    }
}

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();

    // Restart game if game is over
    if (!gameState.running && gameState.initialized) {
        messageElement.textContent = '';
        initGame();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const x = Math.floor(mouseX / TILE_SIZE);
    const y = Math.floor(mouseY / TILE_SIZE);

    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    if (e.button === 0) {
        // Left click
        if (gameState.revealed[y][x]) {
            // Click on revealed number to clear adjacent
            clearAdjacent(x, y);
        } else {
            revealCell(x, y);
        }
    } else if (e.button === 2) {
        // Right click
        toggleFlag(x, y);
    }

    render();
});

// Prevent context menu
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Initialize
showMessage('Click anywhere to start');
initGame();
