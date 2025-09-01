// ------------------------------------------
// CONFIGURATION
// ------------------------------------------
const CONFIG = {
    canvas: { width: 480, height: 360 },
    animation: { baseSpeed: 0.045, activeBoost: 0.03 },
    colors: { primary: '#00c3ff' }
};

// ------------------------------------------
// GLOBAL STATE
// ------------------------------------------
const state = { 
    micActive: false, 
    t: 0,
    recognition: null,
    isListening: false
};

// ------------------------------------------
// AUDIO VISUALIZER CLASS
// ------------------------------------------
class AudioVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.initAudio();
    }

    async initAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            source.connect(this.analyser);
        } catch (err) {
            console.error("Mic access error:", err);
        }
    }

    getPower() {
        if (!this.analyser || !this.dataArray) return 0.3;
        this.analyser.getByteFrequencyData(this.dataArray);
        const sum = this.dataArray.reduce((acc, val) => acc + val, 0);
        return sum / (this.dataArray.length * 255);
    }

    draw(power = 0.5) {
        const { width, height } = CONFIG.canvas;
        const [cx, cy] = [width / 2, height / 2];
        
        this.ctx.clearRect(0, 0, width, height);

        const [radius, bars] = [80, 64];
        const angleStep = (2 * Math.PI) / bars;

        for (let i = 0; i < bars; i++) {
            const angle = i * angleStep;
            const val = this.dataArray ? this.dataArray[i] / 255 : power;
            const barHeight = 15 + val * 60;

            const [x1, y1] = [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
            const [x2, y2] = [cx + Math.cos(angle) * (radius + barHeight), cy + Math.sin(angle) * (radius + barHeight)];

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = `rgba(51, 51, 51, ${0.6 + val * 0.4})`;
            this.ctx.lineWidth = 2 + val * 3;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
            this.ctx.stroke();
        }
    }
}

// ------------------------------------------
// BUBBLE SYSTEM CLASS
// ------------------------------------------
class BubbleSystem {
    constructor(canvasId, count = 30) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.bubbles = [];
        this.count = count;
        
        this.resize();
        this.initBubbles();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    initBubbles() {
        this.bubbles = [];
        for (let i = 0; i < this.count; i++) {
            this.bubbles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 10 + Math.random() * 100,
                baseDx: (Math.random() - 1) * 1,
                baseDy: (Math.random() - 1) * 1,
                color: `hsla(${Math.random() * 360}, 80%, 60%, 0.7)`
            });
        }
    }

    animate(power = 0.3) {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';

        for (const b of this.bubbles) {
            const [dx, dy] = [b.baseDx * (0.5 + power * 3), b.baseDy * (0.5 + power * 3)];
            b.x += dx;
            b.y += dy;

            if (b.x - b.r < 0 || b.x + b.r > this.width) b.baseDx *= -1;
            if (b.y - b.r < 0 || b.y + b.r > this.height) b.baseDy *= -1;

            this.ctx.shadowColor = b.color;
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.fillStyle = b.color;
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.globalCompositeOperation = 'lighter';
    }
}

// ------------------------------------------
// WORD ACTIVATOR CLASS (IMPROVED)
// ------------------------------------------
class WordActivator {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.originalText = this.element.textContent;
        this.words = this.originalText.split(/\s+/);
        this.activatedWords = new Set();
        this.initDisplay();
    }

    initDisplay() {
        const spans = this.words.map(word => 
            `<span class="word-span" data-clean="${this.cleanWord(word)}">${word}</span>`
        ).join(' ');
        this.element.innerHTML = spans;
        this.spans = this.element.querySelectorAll('.word-span');
    }

    cleanWord(word) {
        return word.toLowerCase().replace(/[^\w]/g, ''); // removes punctuation
    }

    activateWord(spokenWord) {
        const cleanedSpoken = this.cleanWord(spokenWord);
        for (const span of this.spans) {
            const cleanedSpan = span.getAttribute('data-clean');
            if (cleanedSpoken === cleanedSpan && !span.classList.contains('active')) {
                span.classList.add('active');
                this.activatedWords.add(cleanedSpoken);
                break;
            }
        }
    }

    reset() {
        this.spans.forEach(span => span.classList.remove('active'));
        this.activatedWords.clear();
    }
}

// ------------------------------------------
// SPEECH RECOGNITION CLASS
// ------------------------------------------
class SpeechHandler {
    constructor(textElementId, wordActivator) {
        this.textElement = document.getElementById(textElementId);
        this.wordActivator = wordActivator;
        this.recognition = null;
        this.init();
    }

    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.textElement.textContent = 'Speech recognition not supported';
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        Object.assign(this.recognition, {
            continuous: true,
            interimResults: true,
            lang: 'en-US'
        });

        this.recognition.onstart = () => {
            state.isListening = true;
            this.textElement.textContent = 'Listening...';
            this.textElement.className = 'speech-display listening';
        };

        this.recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            const words = transcript.trim().split(/\s+/);
            if (words.length > 0) {
                const lastWord = words[words.length - 1];
                this.textElement.textContent = lastWord;
                this.textElement.className = 'speech-display speaking';
                
                // Activate word in display
                this.wordActivator.activateWord(lastWord);
            }
        };

        this.recognition.onerror = (event) => {
            this.textElement.textContent = event.error === 'not-allowed' ? 
                'Microphone access denied' : 'Recognition error occurred';
            this.textElement.className = 'speech-display';
        };

        this.recognition.onend = () => {
            state.isListening = false;
            if (state.micActive) {
                setTimeout(() => this.recognition.start(), 100);
            } else {
                this.textElement.textContent = 'Say something...';
                this.textElement.className = 'speech-display';
            }
        };

        state.recognition = this.recognition;
        return true;
    }
}

// ------------------------------------------
// MAIN APPLICATION CLASS
// ------------------------------------------
class VoiceVisualizerApp {
    constructor() {
        this.visualizer = new AudioVisualizer('visualizer');
        this.bubbles = new BubbleSystem('bubble-canvas');
        this.wordActivator = new WordActivator('user-side');
        this.speech = new SpeechHandler('speech-text', this.wordActivator);
        
        this.micBtn = document.getElementById('mic-toggle');
        this.micIcon = document.getElementById('mic-icon');
        this.micLabel = this.micBtn.querySelector('.label');
        
        this.init();
    }

    init() {
        this.micBtn.addEventListener('click', () => this.toggleMic());
        
        // Add reset functionality
        document.getElementById('user-side').addEventListener('dblclick', () => {
            this.wordActivator.reset();
        });
        
        if (!this.speech.recognition) {
            this.micBtn.disabled = true;
            this.micBtn.style.opacity = '0.5';
        }
        
        this.animate();
    }

    toggleMic() {
        state.micActive = !state.micActive;
        this.micBtn.classList.toggle('active', state.micActive);
        this.micBtn.setAttribute('aria-pressed', state.micActive);
        this.micIcon.textContent = state.micActive ? '🔇' : '🎤';
        this.micLabel.textContent = state.micActive ? 'Mute' : 'Listen';

        if (state.micActive && state.recognition) {
            try {
                state.recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        } else if (state.recognition) {
            state.recognition.stop();
        }
    }

    animate() {
        const power = this.visualizer.getPower();
        this.visualizer.draw(power);
        this.bubbles.animate(power);
        requestAnimationFrame(() => this.animate());
    }
}

// ------------------------------------------
// APPLICATION INITIALIZATION
// ------------------------------------------
new VoiceVisualizerApp();
