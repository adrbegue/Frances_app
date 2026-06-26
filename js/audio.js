// ========================================================
// VARIABLES GLOBALES DE AUDIO
// ========================================================
let audioCtx = null;
let analyser = null;
let audioStream = null;
let drawVisualId = null;

// ========================================================
// SISTEMA DE ONDAS DE AUDIO NATIVAS (CANVAS)
// ========================================================
export function iniciarVisualizadorDeOndas(stream) {
    const canvas = document.getElementById('wave-canvas');
    const canvasCtx = canvas.getContext('2d');

    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = canvas.parentNode.offsetHeight;

    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 🔴 FIX VITAL PARA ANDROID: Forzar el reanudado del contexto de audio
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function dibujarOnda() {
        // La animación corre sola, la cortamos en detenerVisualizadorDeOndas
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

// ========================================================
// SISTEMA DE MICRÓFONO GLOBAL OPTIMIZADO PARA PC Y ANDROID
// ========================================================
export function inicializarMicrofonoGlobal(recognition, state, isListeningObj) {
    if (!recognition) {
        const errorMsg = "Tu navegador no soporta Speech Recognition (Usa Chrome o Edge).";
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

        // 🔴 FIX ANDROID: Recorrer siempre todos los fragmentos
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            textAcumulado += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                esFinal = true;
            }
        }

        // Pintamos el texto en pantalla SEGÚN LO VAS DICIENDO
        interpretedText.innerText = `"${textAcumulado}"`;
        interpretedText.className = "text-sm font-semibold text-indigo-600 italic truncate";

        // Solo validamos cuando detecta el corte final de voz
        if (esFinal) {
            const currentCard = state.activeSessionCards[state.currentCardIndex];
            if (!currentCard) return;

            const limpiar = (t) => t.toLowerCase()
                                    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿'’]/g," ")
                                    .replace(/\s+/g, " ")
                                    .trim();

            if (limpiar(textAcumulado) === limpiar(currentCard.back)) {
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
            interpretedText.innerText = `Error: ${e.error}.`;
            interpretedText.className = "text-sm font-medium text-red-500 italic";
        }
    };

    recognition.onend = () => {
        isListeningObj.value = false;
        micBtn.classList.replace('bg-red-600', 'bg-emerald-600');
        micBtn.classList.remove('ring-4', 'ring-red-200');
        detenerVisualizadorDeOndas();

        setTimeout(() => {
            if (!isListeningObj.value) limpiarCanvasConLineaBase();
        }, 400);
    };

    const pulsarMicro = async (e) => {
        e.preventDefault();
        if (isListeningObj.value) return;

        isListeningObj.value = true;
        
        // 🔴 FIX ANDROID: Configuración estricta justo antes de arrancar
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = true; 

        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            iniciarVisualizadorDeOndas(audioStream);
            
            // 🔴 FIX ANDROID: Delay para no saturar los procesos paralelos de Chrome móvil
            setTimeout(() => {
                try { recognition.start(); } catch(err) {}
            }, 100);
            
        } catch(err) {
            console.error("Error al acceder al micro", err);
            isListeningObj.value = false;
        }
    };

    const soltarMicro = (e) => {
        e.preventDefault();
        setTimeout(() => {
            if (isListeningObj.value) {
                recognition.stop();
            }
        }, 250);
    };

    micBtn.addEventListener('mousedown', pulsarMicro);
    micBtn.addEventListener('mouseup', soltarMicro);
    micBtn.addEventListener('mouseleave', soltarMicro);

    micBtn.addEventListener('touchstart', pulsarMicro, { passive: false });
    micBtn.addEventListener('touchend', soltarMicro, { passive: false });
}