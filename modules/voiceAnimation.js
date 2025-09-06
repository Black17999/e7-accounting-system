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

    setState(newState) {
        if (this.currentState === newState) return;
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
                // Clear canvas and hide overlay
                setTimeout(() => this.hideOverlay(), 500);
                break;
        }
    }

    // Step 1: Listening Standby
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

    // Step 2: Voice Input
    drawReceivingBars() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const barCount = 60;
        const barWidth = this.canvas.width / barCount / 2;
        const maxBarHeight = this.canvas.height * 0.8;
        const yCenter = this.canvas.height / 2;

        this.ctx.fillStyle = '#4285F4';

        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * maxBarHeight;
            const x = (i * (barWidth * 2)) + (barWidth / 2);
            const y = yCenter - barHeight / 2;
            this.ctx.fillRect(x, y, barWidth, barHeight);
        }

        this.animationFrameId = requestAnimationFrame(this.drawReceivingBars.bind(this));
    }

    startReceivingAnimation() {
        this.drawReceivingBars();
    }

    // Step 3: Processing
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

    // Step 4A: Success (Text) - This will be handled by the main app logic
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

    // Step 4B: Success (Command)
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

    // Step 5: Fail (New Design)
    drawFailureExclamation(scale = 1, opacity = 1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const color = `rgba(255, 107, 107, ${opacity})`; // 柔和的橘红色

        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';

        // --- 绘制感叹号 ---
        const dotRadius = 4 * scale;
        const barHeight = 25 * scale;
        const barWidth = 7 * scale;
        const gap = 8 * scale;

        // 绘制上方的竖条
        this.ctx.fillRect(centerX - barWidth / 2, centerY - dotRadius - gap - barHeight, barWidth, barHeight);

        // 绘制下方的圆点
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // --- 绘制文字 ---
        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.fillText('请重试', centerX, centerY + 35);
    }

    startFailAnimation() {
        cancelAnimationFrame(this.animationFrameId);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.snackbar.classList.add('snackbar-hidden'); // 确保旧的snackbar是隐藏的
        this.showOverlay(true); // 显示带背景的浮层

        let startTime = null;
        const duration = 2000; // 总动画时长 2s

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            const progress = elapsedTime / duration;

            // 脉冲闪烁效果 (使用sin函数)
            // 动画的前半部分执行脉冲
            const pulseDuration = 800;
            const scale = elapsedTime < pulseDuration
                ? 1 + 0.1 * Math.sin(elapsedTime / 50) // 轻微弹性震动
                : 1;

            // 淡出效果 (动画的后半部分)
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
}