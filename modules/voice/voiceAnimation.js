// 语音交互动画模块
export class VoiceAnimation {
    constructor() {
        this.overlay = document.getElementById('voice-animation-overlay');
        this.canvas = document.getElementById('voice-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('voice-animation-container');
        this.textOutput = document.getElementById('voice-text-output');
        this.snackbar = document.getElementById('voice-snackbar');

        this.animationFrameId = null;
        this.currentState = 'idle';

        // Web Audio API properties
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.smoothedDataArray = null;
        this.smoothingFactor = 0.1; // 阻尼系数，值越小越平滑

        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    showOverlay(showBackdrop = true) {
        this.overlay.classList.remove('voice-overlay-hidden');
        this.overlay.style.pointerEvents = 'auto';
        if (showBackdrop) {
            this.overlay.style.background = 'rgba(0, 0, 0, 0.3)';
        } else {
            this.overlay.style.background = 'transparent';
        }
    }

    hideOverlay() {
        this.overlay.classList.add('voice-overlay-hidden');
        this.overlay.style.pointerEvents = 'none';
        this.setState('idle');
    }

    // --- Audio Handling ---
    async initAudio() {
        if (this.audioContext) return true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256; // 频域样本数量
            this.analyser.smoothingTimeConstant = 0.8; // 音频数据平滑
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.smoothedDataArray = new Float32Array(bufferLength).fill(0);
            return true;
        } catch (err) {
            console.error('无法获取麦克风权限:', err);
            // 在这里可以向用户显示错误提示
            this.showSnackbar('无法获取麦克风权限');
            return false;
        }
    }

    stopAudio() {
        if (this.microphone && this.microphone.mediaStream) {
            this.microphone.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.microphone = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.smoothedDataArray = null;
    }

    setState(newState) {
        if (this.currentState === newState) return;

        // Clean up previous state
        if (this.currentState === 'receiving') {
            this.stopAudio();
        }
        this.currentState = newState;
        cancelAnimationFrame(this.animationFrameId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.textOutput.innerHTML = '';
        this.snackbar.classList.add('snackbar-hidden');

        switch (newState) {
            case 'listening':
                this.startListeningAnimation();
                break;
            case 'receiving':
                this.startReceivingAnimation();
                break;
            case 'processing':
                this.startProcessingAnimation();
                break;
            case 'successA':
                this.startSuccessAAnimation();
                break;
            case 'successB':
                this.startSuccessBAnimation();
                break;
            case 'fail':
                this.startFailAnimation();
                break;
            case 'idle':
            default:
                setTimeout(() => this.hideOverlay(), 500);
                break;
        }
    }

    // Step 1: Listening Standby (Unchanged)
    drawListeningWave(waveOffset = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#AEC6FF';

        const amplitude = 10;
        const frequency = 0.02;
        const yOffset = this.canvas.height / 2;

        for (let x = 0; x < this.canvas.width; x++) {
            const y = amplitude * Math.sin(x * frequency + waveOffset) + yOffset;
            x === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
        waveOffset += 0.05;
        this.animationFrameId = requestAnimationFrame(() => this.drawListeningWave(waveOffset));
    }

    startListeningAnimation() {
        this.drawListeningWave();
    }

    // Step 2: Voice Input (Rewritten with Web Audio API)
    async startReceivingAnimation() {
        const audioReady = await this.initAudio();
        if (audioReady) {
            this.drawRealtimeAudioBars();
        } else {
            // Fallback to idle or fail state if audio is not available
            this.setState('fail');
        }
    }

    drawRealtimeAudioBars() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.analyser || !this.dataArray || !this.smoothedDataArray) {
            // Draw a static line if audio is not ready yet
            this.ctx.fillStyle = 'rgba(174, 198, 255, 0.5)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 1, this.canvas.width, 2);
        } else {
            this.analyser.getByteFrequencyData(this.dataArray);

            const barCount = this.analyser.frequencyBinCount;
            // 忽略非常低频和非常高频的部分，让人声更敏感
            const relevantBarCount = Math.floor(barCount * 0.7);
            const barWidth = this.canvas.width / relevantBarCount;
            const canvasCenterY = this.canvas.height / 2;

            for (let i = 0; i < relevantBarCount; i++) {
                const targetHeight = Math.pow(this.dataArray[i] / 255, 2) * this.canvas.height * 0.8;

                // 应用平滑/阻尼算法
                this.smoothedDataArray[i] += (targetHeight - this.smoothedDataArray[i]) * this.smoothingFactor;
                const barHeight = this.smoothedDataArray[i];

                // 如果音量低于阈值，则绘制一条细线
                if (barHeight < 2) {
                    this.ctx.fillStyle = 'rgba(174, 198, 255, 0.5)';
                    this.ctx.fillRect(i * barWidth, canvasCenterY - 1, barWidth, 2);
                } else {
                    const g = 150 + (barHeight / this.canvas.height) * 105;
                    const b = 255;
                    this.ctx.fillStyle = `rgb(80, ${g}, ${b})`;
                    this.ctx.fillRect(i * barWidth, canvasCenterY - barHeight / 2, barWidth, barHeight);
                }
            }
        }

        this.animationFrameId = requestAnimationFrame(this.drawRealtimeAudioBars.bind(this));
    }


    // Step 3: Processing (Unchanged)
    drawProcessingDots(dotScale = 1, dotScaleDirection = 1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const dotCount = 3;
        const dotRadius = 8;
        const dotSpacing = 30;
        const totalWidth = (dotCount - 1) * dotSpacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = this.canvas.height / 2;

        this.ctx.fillStyle = '#4285F4';

        for (let i = 0; i < dotCount; i++) {
            this.ctx.beginPath();
            const currentRadius = (i === 1) ? dotRadius * dotScale : dotRadius;
            this.ctx.arc(startX + i * dotSpacing, y, currentRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        dotScale += 0.05 * dotScaleDirection;
        if (dotScale > 1.5 || dotScale < 0.5) {
            dotScaleDirection *= -1;
        }

        this.animationFrameId = requestAnimationFrame(() => this.drawProcessingDots(dotScale, dotScaleDirection));
    }

    startProcessingAnimation() {
        this.drawProcessingDots();
    }

    // Step 4A: Success (Text) (Unchanged)
    startSuccessAAnimation(text, callback) {
        let i = 0;
        this.textOutput.innerHTML = '';
        
        const typingInterval = setInterval(() => {
            if (i < text.length) {
                this.textOutput.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
                setTimeout(() => {
                    this.setState('idle');
                    if (callback) callback();
                }, 1000);
            }
        }, 100);
    }

    // Step 4B: Success (Command) (Unchanged)
    drawSuccessCheck(progress = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const size = 40;

        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = 'green';
        this.ctx.beginPath();

        const firstLineProgress = Math.min(1, progress / 0.4);
        const secondLineProgress = Math.max(0, (progress - 0.4) / 0.6);

        this.ctx.moveTo(centerX - size / 2, centerY);
        this.ctx.lineTo(centerX - size / 2 + (size / 3) * firstLineProgress, centerY + (size / 3) * firstLineProgress);

        if (secondLineProgress > 0) {
            this.ctx.lineTo(centerX - size / 6 + (size * 2 / 3) * secondLineProgress, centerY + size / 3 - size * secondLineProgress);
        }
        
        this.ctx.stroke();

        if (progress < 1) {
            progress += 0.05;
            this.animationFrameId = requestAnimationFrame(() => this.drawSuccessCheck(progress));
        } else {
            setTimeout(() => this.setState('idle'), 500);
        }
    }

    startSuccessBAnimation() {
        this.drawSuccessCheck();
    }

    // Step 5: Fail (Unchanged)
    drawFailureExclamation(scale = 1, opacity = 1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const color = `rgba(255, 107, 107, ${opacity})`;

        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';

        const dotRadius = 4 * scale;
        const barHeight = 25 * scale;
        const barWidth = 7 * scale;
        const gap = 8 * scale;

        this.ctx.fillRect(centerX - barWidth / 2, centerY - dotRadius - gap - barHeight, barWidth, barHeight);

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fillText('请重试', centerX, centerY + 35);
    }

    startFailAnimation() {
        cancelAnimationFrame(this.animationFrameId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.snackbar.classList.add('snackbar-hidden');
        this.showOverlay(true);

        let startTime = null;
        const duration = 2000;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            
            const pulseDuration = 800;
            const scale = elapsedTime < pulseDuration
                ? 1 + 0.1 * Math.sin(elapsedTime / 50)
                : 1;

            const fadeStartTime = 1500;
            const opacity = elapsedTime > fadeStartTime
                ? Math.max(0, 1 - (elapsedTime - fadeStartTime) / (duration - fadeStartTime))
                : 1;

            this.drawFailureExclamation(scale, opacity);

            if (elapsedTime < duration) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.hideOverlay();
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    // Utility to show messages
    showSnackbar(message) {
        this.snackbar.textContent = message;
        this.snackbar.classList.remove('snackbar-hidden');
        setTimeout(() => {
            this.snackbar.classList.add('snackbar-hidden');
        }, 3000);
    }
}