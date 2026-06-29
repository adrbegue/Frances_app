// js/audio.js

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export let recognition = null;
let isListening = false;

// Variables globales para el Analizador de Audio
let audioCtx = null;
let analyser = null;
let audioStream = null;
let drawVisualId = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
}

export function ejecutarTTS(texto) {
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'fr-FR';
    window.speechSynthesis.speak(utterance);
}

export function limpiarCanvasConLineaBase() {
    const canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    const canvasCtx = canvas.getContext('2d');
    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = canvas.parentNode.offsetHeight;

    canvasCtx.fillStyle = 'rgb(15, 23, 42)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function iniciarVisualizadorDeOndas(stream) {
    const canvas = document.getElementById('wave-canvas');
    const canvasCtx = canvas.getContext('2d');

    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = canvas.parentNode.offsetHeight;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function dibujarOnda() {
        if (!isListening) return;
        drawVisualId = requestAnimationFrame(dibujarOnda);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgb(15, 23, 42)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 4;
            canvasCtx.fillStyle = `rgb(16, 185, 129)`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
    }
    dibujarOnda();
}

export function detenerVisualizadorDeOndas() {
    if (drawVisualId) {
        cancelAnimationFrame(drawVisualId);
    }
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
    }
}

export function inicializarMicrofonoGlobal(obtenerFraseCorrecta) {
    if (!recognition) {
        const errorMsg = "Tu navegador no soporta Speech Recognition.";
        const micBtn = document.getElementById('btn-global-mic');
        if (micBtn) micBtn.onclick = () => alert(errorMsg);
        return;
    }

    const micBtn = document.getElementById('btn-global-mic');
    const statusIndicator = document.getElementById('voice-status-indicator');
    const interpretedText = document.getElementById('voice-interpreted-text');

    recognition.onstart = () => {
        micBtn.classList.replace('bg-emerald-600', 'bg-red-600');
        micBtn.classList.add('ring-4', 'ring-red-200');

        statusIndicator.innerText = "🎙️ ESCUCHANDO EN FRANCÉS...";
        statusIndicator.className = "text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-0.5 animate-pulse";
        interpretedText.innerText = "Habla ahora...";
        interpretedText.className = "text-sm font-medium text-slate-400 italic truncate";
    };

    recognition.onresult = (event) => {
        let textAcumulado = '';
        let esFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            textAcumulado += event.results[i][0].transcript;
            if (event.results[i].isFinal) esFinal = true;
        }

        interpretedText.innerText = `"${textAcumulado}"`;
        interpretedText.className = "text-sm font-semibold text-indigo-600 italic truncate";

        if (esFinal) {
            const fraseCorrecta = obtenerFraseCorrecta();
            if (!fraseCorrecta) return;

            const limpiar = (t) => t.toLowerCase()
                                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿'’]/g," ")
                                    .replace(/\s+/g, " ").trim();

            if (limpiar(textAcumulado) === limpiar(fraseCorrecta)) {
                statusIndicator.innerText = "🟢 ¡PRONUNCIACIÓN EXCELENTE!";
                statusIndicator.className = "text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5";
                interpretedText.className = "text-sm font-bold text-emerald-700 truncate";
            } else {
                statusIndicator.innerText = "⚠️ REVISA LA FONÉTICA (¡INTÉNTALO OTRA VEZ!)";
                statusIndicator.className = "text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-0.5";
                interpretedText.className = "text-sm font-semibold text-slate-700 truncate";
            }
        }
    };

    recognition.onerror = (e) => {
        if (e.error !== 'aborted') {
            statusIndicator.innerText = "❌ ERROR DE CAPTURA";
            statusIndicator.className = "text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-0.5";
            interpretedText.innerText = `Error: ${e.error}. Comprueba permisos.`;
            interpretedText.className = "text-sm font-medium text-red-500 italic";
        }
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.replace('bg-red-600', 'bg-emerald-600');
        micBtn.classList.remove('ring-4', 'ring-red-200');
        detenerVisualizadorDeOndas();

        setTimeout(() => {
            if (!isListening) limpiarCanvasConLineaBase();
        }, 400);
    };

    const pulsarMicro = async (e) => {
        e.preventDefault();
        if (isListening) return;

        isListening = true;
        recognition.lang = 'fr-FR';

        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            iniciarVisualizadorDeOndas(audioStream);
            recognition.start();
        } catch(err) {
            console.error("No se pudo iniciar el canvas de audio", err);
            try { recognition.start(); } catch(e){}
        }
    };

    const soltarMicro = (e) => {
        e.preventDefault();
        setTimeout(() => {
            if (isListening) recognition.stop();
        }, 250);
    };

    micBtn.addEventListener('mousedown', pulsarMicro);
    micBtn.addEventListener('mouseup', soltarMicro);
    micBtn.addEventListener('mouseleave', soltarMicro);
    micBtn.addEventListener('touchstart', pulsarMicro, { passive: false });
    micBtn.addEventListener('touchend', soltarMicro, { passive: false });
}