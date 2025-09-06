const canvas = document.getElementById('voice-canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('animation-container');

let animationFrameId;
let currentState = 'idle'; // idle, listening, receiving, processing, successA, successB, fail

// --- Canvas Setup ---
function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// --- State Management ---
function setState(newState) {
    if (currentState === newState) return;
    currentState = newState;
    console.log("New state:", currentState);
    cancelAnimationFrame(animationFrameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hide snackbar when state changes
    const snackbar = document.getElementById('snackbar');
    snackbar.classList.add('hidden');

    switch (currentState) {
        case 'listening':
            startListeningAnimation();
            break;
        case 'receiving':
            startReceivingAnimation();
            break;
        case 'processing':
            startProcessingAnimation();
            break;
        case 'successA':
            startSuccessAAnimation();
            break;
        case 'successB':
            startSuccessBAnimation();
            break;
        case 'fail':
            startFailAnimation();
            break;
        case 'idle':
        default:
            // Clear canvas
            break;
    }
}

// --- Animation Implementations ---

// Step 1: Listening Standby
let waveOffset = 0;
function drawListeningWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#AEC6FF';

    const amplitude = 10;
    const frequency = 0.02;
    const yOffset = canvas.height / 2;

    for (let x = 0; x < canvas.width; x++) {
        const y = amplitude * Math.sin(x * frequency + waveOffset) + yOffset;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    waveOffset += 0.05;
    animationFrameId = requestAnimationFrame(drawListeningWave);
}

function startListeningAnimation() {
    waveOffset = 0;
    drawListeningWave();
}


// Step 2: Voice Input
function drawReceivingBars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barCount = 60;
    const barWidth = canvas.width / barCount / 2;
    const maxBarHeight = canvas.height * 0.8;
    const yCenter = canvas.height / 2;

    ctx.fillStyle = '#4285F4';

    for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * maxBarHeight;
        const x = (i * (barWidth * 2)) + (barWidth / 2);
        const y = yCenter - barHeight / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
    }

    animationFrameId = requestAnimationFrame(drawReceivingBars);
}

function startReceivingAnimation() {
    drawReceivingBars();
}


// Step 3: Processing
let dotScale = 1;
let dotScaleDirection = 1;
function drawProcessingDots() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dotCount = 3;
    const dotRadius = 8;
    const dotSpacing = 30;
    const totalWidth = (dotCount - 1) * dotSpacing;
    const startX = (canvas.width - totalWidth) / 2;
    const y = canvas.height / 2;

    ctx.fillStyle = '#4285F4';

    for (let i = 0; i < dotCount; i++) {
        ctx.beginPath();
        const currentRadius = (i === 1) ? dotRadius * dotScale : dotRadius; // Middle dot scales
        ctx.arc(startX + i * dotSpacing, y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    dotScale += 0.05 * dotScaleDirection;
    if (dotScale > 1.5 || dotScale < 0.5) {
        dotScaleDirection *= -1;
    }

    animationFrameId = requestAnimationFrame(drawProcessingDots);
}

function startProcessingAnimation() {
    // A more complex transition could be added here
    dotScale = 1;
    dotScaleDirection = 1;
    drawProcessingDots();
}


// Step 4A: Success (Text)
function startSuccessAAnimation() {
    const textOutput = document.getElementById('text-output-container');
    const text = "查询今天的天气";
    let i = 0;
    textOutput.innerHTML = '';
    
    const typingInterval = setInterval(() => {
        if (i < text.length) {
            textOutput.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(typingInterval);
            // Here you would add logic to move the text to an input field
            setTimeout(() => { textOutput.innerHTML = ''; }, 2000);
        }
    }, 100);
}


// Step 4B: Success (Command)
let checkProgress = 0;
function drawSuccessCheck() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 40;

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'green';
    ctx.beginPath();

    const firstLineProgress = Math.min(1, checkProgress / 0.4);
    const secondLineProgress = Math.max(0, (checkProgress - 0.4) / 0.6);

    // First part of the check
    ctx.moveTo(centerX - size / 2, centerY);
    ctx.lineTo(centerX - size / 2 + (size / 3) * firstLineProgress, centerY + (size / 3) * firstLineProgress);

    // Second part of the check
    if (secondLineProgress > 0) {
        ctx.lineTo(centerX - size / 6 + (size * 2 / 3) * secondLineProgress, centerY + size / 3 - size * secondLineProgress);
    }
    
    ctx.stroke();

    if (checkProgress < 1) {
        checkProgress += 0.05;
        animationFrameId = requestAnimationFrame(drawSuccessCheck);
    } else {
        setTimeout(() => {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             setState('idle');
        }, 500);
    }
}

function startSuccessBAnimation() {
    checkProgress = 0;
    drawSuccessCheck();
}


// Step 5: Fail
let shakeOffset = 0;
let shakeDirection = 1;
let shakeFrames = 0;
function drawFailCross() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 30;

    ctx.lineWidth = 5;
    ctx.strokeStyle = 'red';

    // Shake effect
    if (shakeFrames < 20) {
        shakeOffset += 2 * shakeDirection;
        if (Math.abs(shakeOffset) >= 10) {
            shakeDirection *= -1;
        }
        shakeFrames++;
    } else {
        shakeOffset = 0; // Reset position after shake
    }


    // Draw cross
    ctx.beginPath();
    ctx.moveTo(centerX - size + shakeOffset, centerY - size);
    ctx.lineTo(centerX + size + shakeOffset, centerY + size);
    ctx.moveTo(centerX + size + shakeOffset, centerY - size);
    ctx.lineTo(centerX - size + shakeOffset, centerY + size);
    ctx.stroke();

    if (shakeFrames < 20) {
        animationFrameId = requestAnimationFrame(drawFailCross);
    }
}

function startFailAnimation() {
    shakeOffset = 0;
    shakeDirection = 1;
    shakeFrames = 0;
    drawFailCross();

    const snackbar = document.getElementById('snackbar');
    snackbar.classList.remove('hidden');
    setTimeout(() => {
        snackbar.classList.add('hidden');
        setState('idle');
    }, 3000);
}


// --- Event Listeners for Controls ---
document.getElementById('startButton').addEventListener('click', () => setState('listening'));
document.getElementById('stopButton').addEventListener('click', () => setState('receiving'));
document.getElementById('processButton').addEventListener('click', () => setState('processing'));
document.getElementById('successAButton').addEventListener('click', () => setState('successA'));
document.getElementById('successBButton').addEventListener('click', () => setState('successB'));
document.getElementById('failButton').addEventListener('click', () => setState('fail'));

// Initial state
setState('idle');