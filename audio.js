// js/audio.js

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export let recognition = null;
let isListening = false;

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

// Ya no necesitamos funciones de canvas aquí.

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
        // Eliminada la detención del visualizador y limpieza de canvas.
    };

    const pulsarMicro = (e) => {
        if (e.cancelable) e.preventDefault();
        if (isListening) return;

        isListening = true;
        recognition.lang = 'fr-FR';

        try {
            // Eliminada la línea de iniciarVisualizadorSimulado();
            recognition.start();
        } catch(err) {
            console.error("Error al iniciar reconocimiento:", err);
        }
    };

    const soltarMicro = (e) => {
        if (e.cancelable) e.preventDefault();
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