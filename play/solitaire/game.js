const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const movesElement = document.getElementById('moves');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');

// Game constants
const CARD_WIDTH = 70;
const CARD_HEIGHT = 100;
const CARD_SPACING = 15;
const STACK_OFFSET = 25;
const FOUNDATION_OFFSET = 20;

// Terminal colors matching website theme
const COLORS = {
    background: '#000000',
    cardBackground: '#1a1a1a',
    cardBorder: '#808080',
    cardBorderSelected: '#00ffff',
    cardBack: '#404040',
    redSuit: '#ff0000',
    blackSuit: '#ffffff',
    green: '#00ff00',
    text: '#ffffff',
    foundation: '#0d0d0d'
};

// Card suits and values
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Game state
let gameState = {
    deck: [],
    waste: [],
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []],
    selected: null,
    selectedFrom: null,
    moves: 0,
    score: 0,
    startTime: null,
    timerInterval: null,
    gameWon: false,
    drawCount: 0
};

// Card object constructor
function createCard(suit, value) {
    return {
        suit,
        value,
        faceUp: false,
        color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
    };
}

// Initialize a new game
function initGame() {
    // Clear intervals
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }

    // Create deck
    const deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            deck.push(createCard(suit, value));
        }
    }

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Reset game state
    gameState.deck = [];
    gameState.waste = [];
    gameState.foundations = [[], [], [], []];
    gameState.tableau = [[], [], [], [], [], [], []];
    gameState.selected = null;
    gameState.selectedFrom = null;
    gameState.moves = 0;
    gameState.score = 0;
    gameState.startTime = Date.now();
    gameState.gameWon = false;
    gameState.drawCount = 0;

    // Deal to tableau
    let cardIndex = 0;
    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            const card = deck[cardIndex++];
            if (i === j) {
                card.faceUp = true;
            }
            gameState.tableau[j].push(card);
        }
    }

    // Remaining cards go to deck
    gameState.deck = deck.slice(cardIndex);

    // Start timer
    gameState.timerInterval = setInterval(updateTimer, 1000);

    updateUI();
    render();
}

// Get card value for comparison
function getCardValue(card) {
    return VALUES.indexOf(card.value);
}

// Check if card can be placed on foundation
function canPlaceOnFoundation(card, foundation) {
    if (foundation.length === 0) {
        return card.value === 'A';
    }
    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && getCardValue(card) === getCardValue(topCard) + 1;
}

// Check if card can be placed on tableau
function canPlaceOnTableau(card, tableau) {
    if (tableau.length === 0) {
        return card.value === 'K';
    }
    const topCard = tableau[tableau.length - 1];
    return card.color !== topCard.color && getCardValue(card) === getCardValue(topCard) - 1;
}

// Try to auto-move card to foundation
function tryAutoMove(card, fromPile) {
    for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(card, gameState.foundations[i])) {
            moveCards([card], fromPile, gameState.foundations[i], 'foundation');
            return true;
        }
    }
    return false;
}

// Move cards from one pile to another
function moveCards(cards, fromPile, toPile, toType) {
    // Remove cards from source
    for (let card of cards) {
        const index = fromPile.indexOf(card);
        if (index > -1) {
            fromPile.splice(index, 1);
        }
    }

    // Add cards to destination
    toPile.push(...cards);

    // Flip top card of source pile if needed
    if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
        fromPile[fromPile.length - 1].faceUp = true;
    }

    // Update score
    if (toType === 'foundation') {
        gameState.score += 10;
    } else if (toType === 'tableau') {
        gameState.score += 5;
    }

    gameState.moves++;
    gameState.selected = null;
    gameState.selectedFrom = null;

    // Check for win
    checkWin();
    updateUI();
    render();
}

// Check if game is won
function checkWin() {
    let totalCards = 0;
    for (let foundation of gameState.foundations) {
        totalCards += foundation.length;
    }
    if (totalCards === 52) {
        gameState.gameWon = true;
        messageElement.textContent = 'YOU WIN! Press N for new game';
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
    }
}

// Draw cards from deck
function drawCards() {
    if (gameState.deck.length === 0) {
        // Reset deck from waste
        while (gameState.waste.length > 0) {
            const card = gameState.waste.pop();
            card.faceUp = false;
            gameState.deck.push(card);
        }
        gameState.drawCount++;
        if (gameState.drawCount > 0 && gameState.score >= 100) {
            gameState.score -= 100;
        }
    } else {
        // Draw 3 cards (or remaining cards)
        const count = Math.min(3, gameState.deck.length);
        for (let i = 0; i < count; i++) {
            const card = gameState.deck.pop();
            card.faceUp = true;
            gameState.waste.push(card);
        }
    }
    render();
}

// Update UI elements
function updateUI() {
    movesElement.textContent = `Moves: ${gameState.moves}`;
    scoreElement.textContent = `Score: ${gameState.score}`;
}

// Update timer
function updateTimer() {
    if (gameState.startTime && !gameState.gameWon) {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Get click position
function getClickPosition(x, y) {
    // Check deck
    const deckX = 20;
    const deckY = 20;
    if (x >= deckX && x < deckX + CARD_WIDTH && y >= deckY && y < deckY + CARD_HEIGHT) {
        return { type: 'deck' };
    }

    // Check waste
    const wasteX = deckX + CARD_WIDTH + CARD_SPACING;
    if (x >= wasteX && x < wasteX + CARD_WIDTH + 40 && y >= deckY && y < deckY + CARD_HEIGHT) {
        if (gameState.waste.length > 0) {
            return { type: 'waste', card: gameState.waste[gameState.waste.length - 1] };
        }
    }

    // Check foundations
    const foundationY = 20;
    const foundationStartX = canvas.width - (4 * (CARD_WIDTH + CARD_SPACING));
    for (let i = 0; i < 4; i++) {
        const foundationX = foundationStartX + i * (CARD_WIDTH + CARD_SPACING);
        if (x >= foundationX && x < foundationX + CARD_WIDTH && y >= foundationY && y < foundationY + CARD_HEIGHT) {
            return { type: 'foundation', index: i };
        }
    }

    // Check tableau
    const tableauY = 140;
    for (let i = 0; i < 7; i++) {
        const tableauX = 20 + i * (CARD_WIDTH + CARD_SPACING);
        const pile = gameState.tableau[i];

        if (x >= tableauX && x < tableauX + CARD_WIDTH) {
            // Check which card in the pile
            for (let j = pile.length - 1; j >= 0; j--) {
                const cardY = tableauY + j * FOUNDATION_OFFSET;
                const cardBottomY = (j === pile.length - 1) ? cardY + CARD_HEIGHT : cardY + FOUNDATION_OFFSET;

                if (y >= cardY && y < cardBottomY && pile[j].faceUp) {
                    return { type: 'tableau', index: i, cardIndex: j };
                }
            }
            // Clicked on empty tableau space
            if (pile.length === 0 && y >= tableauY && y < tableauY + CARD_HEIGHT) {
                return { type: 'tableau', index: i, cardIndex: -1 };
            }
        }
    }

    return null;
}

// Handle click
function handleClick(x, y) {
    if (gameState.gameWon) return;

    const pos = getClickPosition(x, y);
    if (!pos) {
        gameState.selected = null;
        gameState.selectedFrom = null;
        render();
        return;
    }

    // Click on deck
    if (pos.type === 'deck') {
        drawCards();
        gameState.selected = null;
        gameState.selectedFrom = null;
        return;
    }

    // If we have a selected card, try to move it
    if (gameState.selected) {
        let moved = false;

        // Try to place on foundation
        if (pos.type === 'foundation') {
            const foundation = gameState.foundations[pos.index];
            if (canPlaceOnFoundation(gameState.selected[0], foundation)) {
                moveCards(gameState.selected, gameState.selectedFrom, foundation, 'foundation');
                moved = true;
            }
        }

        // Try to place on tableau
        if (pos.type === 'tableau' && !moved) {
            const tableau = gameState.tableau[pos.index];
            if (canPlaceOnTableau(gameState.selected[0], tableau)) {
                moveCards(gameState.selected, gameState.selectedFrom, tableau, 'tableau');
                moved = true;
            }
        }

        if (!moved) {
            gameState.selected = null;
            gameState.selectedFrom = null;
            render();
        }
        return;
    }

    // Select a new card/cards
    if (pos.type === 'waste' && pos.card) {
        gameState.selected = [pos.card];
        gameState.selectedFrom = gameState.waste;
    } else if (pos.type === 'tableau' && pos.cardIndex >= 0) {
        const pile = gameState.tableau[pos.index];
        gameState.selected = pile.slice(pos.cardIndex);
        gameState.selectedFrom = pile;
    } else if (pos.type === 'foundation') {
        const foundation = gameState.foundations[pos.index];
        if (foundation.length > 0) {
            gameState.selected = [foundation[foundation.length - 1]];
            gameState.selectedFrom = foundation;
        }
    }

    render();
}

// Handle double click for auto-move
function handleDoubleClick(x, y) {
    if (gameState.gameWon) return;

    const pos = getClickPosition(x, y);
    if (!pos) return;

    let card = null;
    let fromPile = null;

    if (pos.type === 'waste' && pos.card) {
        card = pos.card;
        fromPile = gameState.waste;
    } else if (pos.type === 'tableau' && pos.cardIndex >= 0) {
        const pile = gameState.tableau[pos.index];
        if (pos.cardIndex === pile.length - 1) {
            card = pile[pile.length - 1];
            fromPile = pile;
        }
    }

    if (card && fromPile) {
        tryAutoMove(card, fromPile);
    }
}

// Draw a card
function drawCard(x, y, card, selected = false) {
    ctx.fillStyle = COLORS.cardBackground;
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    ctx.strokeStyle = selected ? COLORS.cardBorderSelected : COLORS.cardBorder;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    if (card.faceUp) {
        // Draw value and suit
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = card.color === 'red' ? COLORS.redSuit : COLORS.blackSuit;
        ctx.fillText(card.value, x + 5, y + 25);
        ctx.font = 'bold 30px monospace';
        ctx.fillText(card.suit, x + 5, y + 55);

        // Draw suit in bottom right (upside down)
        ctx.save();
        ctx.translate(x + CARD_WIDTH - 5, y + CARD_HEIGHT - 5);
        ctx.rotate(Math.PI);
        ctx.font = 'bold 20px monospace';
        ctx.fillText(card.value, 0, 20);
        ctx.font = 'bold 30px monospace';
        ctx.fillText(card.suit, 0, 50);
        ctx.restore();
    } else {
        // Draw card back
        ctx.fillStyle = COLORS.cardBack;
        ctx.fillRect(x + 5, y + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);

        // Draw pattern
        ctx.strokeStyle = COLORS.cardBorder;
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.strokeRect(x + 10 + i * 3, y + 10, CARD_WIDTH - 20 - i * 6, CARD_HEIGHT - 20);
        }
    }
}

// Draw empty foundation slot
function drawEmptyFoundation(x, y, suit) {
    ctx.fillStyle = COLORS.foundation;
    ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.strokeStyle = COLORS.cardBorder;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, CARD_WIDTH, CARD_HEIGHT);
    ctx.setLineDash([]);

    if (suit) {
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = (suit === '♥' || suit === '♦') ? COLORS.redSuit : COLORS.blackSuit;
        ctx.globalAlpha = 0.3;
        ctx.fillText(suit, x + CARD_WIDTH / 2 - 15, y + CARD_HEIGHT / 2 + 15);
        ctx.globalAlpha = 1;
    }
}

// Render the game
function render() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw deck
    const deckX = 20;
    const deckY = 20;
    if (gameState.deck.length > 0) {
        drawCard(deckX, deckY, { faceUp: false });
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(gameState.deck.length, deckX + CARD_WIDTH / 2 - 8, deckY + CARD_HEIGHT / 2 + 6);
    } else {
        drawEmptyFoundation(deckX, deckY);
        ctx.fillStyle = COLORS.green;
        ctx.font = 'bold 20px monospace';
        ctx.fillText('↻', deckX + CARD_WIDTH / 2 - 8, deckY + CARD_HEIGHT / 2 + 8);
    }

    // Draw waste pile (show top 3 cards)
    const wasteX = deckX + CARD_WIDTH + CARD_SPACING;
    if (gameState.waste.length > 0) {
        const showCount = Math.min(3, gameState.waste.length);
        for (let i = 0; i < showCount; i++) {
            const card = gameState.waste[gameState.waste.length - showCount + i];
            const isSelected = gameState.selected && gameState.selected[0] === card;
            drawCard(wasteX + i * 15, deckY, card, isSelected);
        }
    }

    // Draw foundations
    const foundationY = 20;
    const foundationStartX = canvas.width - (4 * (CARD_WIDTH + CARD_SPACING));
    for (let i = 0; i < 4; i++) {
        const x = foundationStartX + i * (CARD_WIDTH + CARD_SPACING);
        const foundation = gameState.foundations[i];

        if (foundation.length > 0) {
            const card = foundation[foundation.length - 1];
            const isSelected = gameState.selected && gameState.selected[0] === card;
            drawCard(x, foundationY, card, isSelected);
        } else {
            drawEmptyFoundation(x, foundationY, SUITS[i]);
        }
    }

    // Draw tableau
    const tableauY = 140;
    for (let i = 0; i < 7; i++) {
        const x = 20 + i * (CARD_WIDTH + CARD_SPACING);
        const pile = gameState.tableau[i];

        if (pile.length === 0) {
            drawEmptyFoundation(x, tableauY);
        } else {
            for (let j = 0; j < pile.length; j++) {
                const card = pile[j];
                const y = tableauY + j * FOUNDATION_OFFSET;
                const isSelected = gameState.selected && gameState.selected.includes(card);
                drawCard(x, y, card, isSelected);
            }
        }
    }
}

// Event listeners
let lastClickTime = 0;
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    if (now - lastClickTime < 300) {
        handleDoubleClick(x, y);
        lastClickTime = 0;
    } else {
        lastClickTime = now;
        setTimeout(() => {
            if (lastClickTime !== 0) {
                handleClick(x, y);
            }
        }, 300);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'n') {
        initGame();
    }
});

// Start the game
initGame();
