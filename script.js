const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .'.split('');
const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
};
const initialSetup = {
    'a1': 'R', 'b1': 'N', 'c1': 'B', 'd1': 'Q', 'e1': 'K', 'f1': 'B', 'g1': 'N', 'h1': 'R',
    'a2': 'P', 'b2': 'P', 'c2': 'P', 'd2': 'P', 'e2': 'P', 'f2': 'P', 'g2': 'P', 'h2': 'P',
    'a7': 'p', 'b7': 'p', 'c7': 'p', 'd7': 'p', 'e7': 'p', 'f7': 'p', 'g7': 'p', 'h7': 'p',
    'a8': 'r', 'b8': 'n', 'c8': 'b', 'd8': 'q', 'e8': 'k', 'f8': 'b', 'g8': 'n', 'h8': 'r'
};

function getSeed(key) {
    let seed = 0;
    for (let i = 0; i < key.length; i++) {
        seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    }
    return seed;
}

function seededRandom(seed) {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    let state = seed % m;
    return function () {
        state = (a * state + c) % m;
        return state / m;
    };
}

function shuffleArray(array, seed) {
    const rand = seededRandom(seed);
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getMappings(key) {
    const squares = [];
    for (let r = 1; r <= 8; r++) {
        for (let f = 0; f < 8; f++) {
            squares.push(String.fromCharCode(97 + f) + r);
        }
    }
    let shuffledSquares = squares.slice();
    if (key) {
        const seed = getSeed(key);
        shuffledSquares = shuffleArray(squares, seed);
    }
    const charToSquare = {};
    const squareToChar = {};
    for (let i = 0; i < alphabet.length; i++) {
        const ch = alphabet[i];
        const sq = shuffledSquares[i];
        charToSquare[ch] = sq;
        squareToChar[sq] = ch;
    }
    return { charToSquare, squareToChar };
}

function encode(message, key) {
    const { charToSquare } = getMappings(key);
    const squareSeq = [];
    for (let ch of message) {
        if (charToSquare[ch]) {
            squareSeq.push(charToSquare[ch]);
        }
    }
    if (squareSeq.length % 2 === 1) {
        squareSeq.push(charToSquare[' ']);
    }
    const moves = [];
    for (let i = 0; i < squareSeq.length; i += 2) {
        moves.push(squareSeq[i] + squareSeq[i + 1]);
    }
    return moves.join(' ');
}

function decode(movesStr, key) {
    const { squareToChar } = getMappings(key);
    const moves = movesStr.trim().split(/\s+/);
    let message = '';
    for (let move of moves) {
        if (move.length !== 4) continue;
        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        if (squareToChar[from] && squareToChar[to]) {
            message += squareToChar[from] + squareToChar[to];
        }
    }
    return message;
}

function createPiece(symbol) {
    const piece = document.createElement('span');
    piece.className = 'piece';
    piece.draggable = true;
    piece.textContent = symbol;
    piece.addEventListener('dragstart', (event) => {
        if (mode !== 'decode') return;
        const fromSquare = piece.parentElement.id.slice(7);
        event.dataTransfer.setData('from', fromSquare);
        const ghost = document.getElementById('drag-ghost');
        ghost.textContent = piece.textContent;
        event.dataTransfer.setDragImage(ghost, 15, 15);
        event.dataTransfer.effectAllowed = 'move';
        piece.parentElement.classList.add('selected');
    });
    piece.addEventListener('dragend', (event) => {
        piece.parentElement.classList.remove('selected');
    });
    return piece;
}

// Generate chessboard with pieces
const board = document.getElementById('chessboard');
for (let r = 8; r >= 1; r--) {
    for (let f = 0; f < 8; f++) {
        const file = String.fromCharCode(97 + f);
        const rank = r;
        const square = document.createElement('div');
        square.id = 'square-' + file + rank;
        square.className = 'square ' + ((f + r) % 2 === 1 ? 'dark' : 'light');
        const pos = file + rank;
        if (initialSetup[pos]) {
            const piece = createPiece(pieces[initialSetup[pos]]);
            square.appendChild(piece);
        }
        square.addEventListener('dragover', (event) => {
            if (mode !== 'decode') return;
            event.preventDefault();
        });
        square.addEventListener('drop', (event) => {
            if (mode !== 'decode') return;
            event.preventDefault();
            const from = event.dataTransfer.getData('from');
            const to = square.id.slice(7);
            if (from && from !== to) {
                const fromSquare = document.getElementById('square-' + from);
                const toSquare = document.getElementById('square-' + to);
                const piece = fromSquare.querySelector('.piece');
                if (piece && !toSquare.querySelector('.piece')) {
                    const fromRect = fromSquare.getBoundingClientRect();
                    const toRect = toSquare.getBoundingClientRect();
                    document.body.appendChild(piece);
                    piece.style.position = 'absolute';
                    piece.style.left = `${fromRect.left}px`;
                    piece.style.top = `${fromRect.top}px`;
                    piece.style.width = `${fromRect.width}px`;
                    piece.style.height = `${fromRect.height}px`;
                    piece.style.display = 'flex';
                    piece.style.alignItems = 'center';
                    piece.style.justifyContent = 'center';
                    piece.style.zIndex = '1000';
                    piece.style.transition = 'left 0.5s ease, top 0.5s ease';
                    piece.offsetWidth;
                    piece.style.left = `${toRect.left}px`;
                    piece.style.top = `${toRect.top}px`;
                    setTimeout(() => {
                        piece.style = '';
                        toSquare.appendChild(piece);
                        inputText.value += (inputText.value.trim() ? ' ' : '') + from + to;
                        compute();
                    }, 500);
                }
            }
        });
        board.appendChild(square);
    }
}

// UI elements
const encodeBtn = document.getElementById('encode-btn');
const decodeBtn = document.getElementById('decode-btn');
const useKey = document.getElementById('use-key');
const keyInput = document.getElementById('key-input');
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const validationMessage = document.getElementById('validation-message');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');

let mode = 'encode';
let animationFrameId = null;

function isMovesInput(value) {
    if (!value.trim()) return false;
    const moves = value.trim().split(/\s+/);
    return moves.every(m => m.length === 4 && /^[a-h][1-8][a-h][1-8]$/.test(m));
}

function updateUI() {
    if (mode === 'encode') {
        encodeBtn.classList.add('active');
        decodeBtn.classList.remove('active');
        inputText.placeholder = 'Type your message here';
        if (inputText.value && isMovesInput(inputText.value)) {
            inputText.value = '';
        }
    } else {
        decodeBtn.classList.add('active');
        encodeBtn.classList.remove('active');
        inputText.placeholder = 'Enter chess moves here, e.g. e2e4 d2d4 or drag pieces on the board';
        if (inputText.value && !isMovesInput(inputText.value)) {
            inputText.value = '';
        }
    }
    compute();
}

encodeBtn.onclick = () => {
    mode = 'encode';
    updateUI();
};

decodeBtn.onclick = () => {
    mode = 'decode';
    updateUI();
};

useKey.onclick = () => {
    keyInput.disabled = !useKey.checked;
    compute();
};

keyInput.oninput = compute;
inputText.oninput = compute;

function clearHighlights() {
    document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.piece').forEach(piece => piece.classList.remove('moving'));
}

function animatePiece(from, to, duration = 500) {
    const fromSquare = document.getElementById('square-' + from);
    const toSquare = document.getElementById('square-' + to);
    const piece = fromSquare.querySelector('.piece');
    if (piece && !toSquare.querySelector('.piece')) {
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect = toSquare.getBoundingClientRect();
        document.body.appendChild(piece);
        piece.style.position = 'absolute';
        piece.style.left = `${fromRect.left}px`;
        piece.style.top = `${fromRect.top}px`;
        piece.style.width = `${fromRect.width}px`;
        piece.style.height = `${fromRect.height}px`;
        piece.style.display = 'flex';
        piece.style.alignItems = 'center';
        piece.style.justifyContent = 'center';
        piece.style.zIndex = '1000';
        piece.style.transition = `left ${duration}ms ease, top ${duration}ms ease, transform ${duration}ms ease`;
        piece.classList.add('moving');
        piece.offsetWidth;
        piece.style.left = `${toRect.left}px`;
        piece.style.top = `${toRect.top}px`;
        piece.style.transform = 'scale(1.2)';
        setTimeout(() => {
            piece.style.transform = 'scale(1)';
            piece.classList.remove('moving');
            piece.style = '';
            toSquare.appendChild(piece);
        }, duration);
    }
}

function compute() {
    cancelAnimationFrame(animationFrameId);
    const key = useKey.checked ? keyInput.value : '';
    clearHighlights();
    let squaresUsed = new Set();
    let validationMsg = '';
    if (mode === 'encode') {
        const message = inputText.value;
        const invalidChars = new Set();
        for (let ch of message) {
            if (!alphabet.includes(ch)) {
                invalidChars.add(ch);
            }
        }
        if (invalidChars.size > 0) {
            validationMsg = 'Ignored invalid characters: ' + Array.from(invalidChars).join(', ');
        }
        const { charToSquare } = getMappings(key);
        for (let ch of message) {
            if (charToSquare[ch]) {
                squaresUsed.add(charToSquare[ch]);
            }
        }
        const filteredLength = message.split('').filter(ch => alphabet.includes(ch)).length;
        if (filteredLength % 2 === 1) {
            squaresUsed.add(charToSquare[' ']);
        }
        outputText.value = encode(message, key);
        let index = 0;
        function animateEncode() {
            const moves = outputText.value.trim().split(' ');
            if (index < moves.length) {
                const move = moves[index];
                if (move.length === 4) {
                    const from = move.slice(0, 2);
                    const to = move.slice(2, 4);
                    animatePiece(from, to, 500 / (index + 1));
                }
                index++;
            }
            animationFrameId = requestAnimationFrame(animateEncode);
        }
        animateEncode();
    } else {
        const movesStr = inputText.value;
        const moves = movesStr.trim().split(/\s+/);
        const invalidMoves = [];
        for (let move of moves) {
            if (move.length !== 4 || !/^[a-h][1-8][a-h][1-8]$/.test(move)) {
                invalidMoves.push(move);
            }
        }
        if (invalidMoves.length > 0) {
            validationMsg = 'Invalid moves: ' + invalidMoves.join(', ');
        }
        outputText.value = decode(movesStr, key);
        let index = 0;
        function animateDecode() {
            if (index < moves.length) {
                const move = moves[index];
                if (move.length === 4) {
                    const from = move.slice(0, 2);
                    const to = move.slice(2, 4);
                    animatePiece(from, to, 500 / (index + 1));
                }
                index++;
            }
            animationFrameId = requestAnimationFrame(animateDecode);
        }
        animateDecode();
        for (let move of moves) {
            if (move.length === 4) {
                const from = move.slice(0, 2);
                const to = move.slice(2, 4);
                squaresUsed.add(from);
                squaresUsed.add(to);
            }
        }
    }
    validationMessage.textContent = validationMsg;
    for (let sq of squaresUsed) {
        const el = document.getElementById('square-' + sq);
        if (el) el.classList.add('highlighted');
    }
}

function resetBoard() {
    document.querySelectorAll('.square').forEach(square => {
        const pos = square.id.slice(7);
        square.innerHTML = '';
        if (initialSetup[pos]) {
            const piece = createPiece(pieces[initialSetup[pos]]);
            square.appendChild(piece);
        }
    });
}

copyBtn.onclick = () => {
    navigator.clipboard.writeText(outputText.value);
};

downloadBtn.onclick = () => {
    const blob = new Blob([outputText.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'moves.txt' : 'message.txt';
    a.click();
    URL.revokeObjectURL(url);
};

clearBtn.onclick = () => {
    inputText.value = '';
    outputText.value = '';
    validationMessage.textContent = '';
    clearHighlights();
    resetBoard();
    cancelAnimationFrame(animationFrameId);
};

updateUI();