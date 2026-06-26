<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Le Petit Pont - Avanzado</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col font-sans antialiased">

    <header class="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div class="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-md flex items-center justify-center">
                    <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="font-bold text-xl text-slate-900 tracking-tight">Le Petit Pont</h1>
                    <p id="app-subtitle" class="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Mis Temas de Francés</p>
                </div>
            </div>
            <div id="sync-status" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span id="sync-text">Cargando...</span>
            </div>
        </div>
    </header>

    <main class="flex-grow max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">

        <section id="section-lobby" class="flex flex-col gap-6">
            <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 class="text-xl font-bold text-slate-900 mb-1">¡Bonjour! 👋</h3>
                    <p class="text-sm text-slate-500">Practica tus mazos en modo normal o ponte a prueba con el Modo Difícil de escritura.</p>
                </div>
            </div>

            <div id="mazos-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"></div>
        </section>

        <section id="section-study" class="hidden flex flex-col gap-6">

            <div class="flex items-center justify-between gap-4 flex-wrap">
                <button id="btn-back-to-lobby" class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm transition">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i>
                    <span>Volver a Temas</span>
                </button>

                <div class="flex items-center gap-3 bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-600">💪 Modo Dificil (Escribir)</span>
                    <button id="toggle-hard-mode" class="w-11 h-6 bg-slate-200 rounded-full relative inline-flex items-center transition-colors">
                        <span id="toggle-circle" class="w-4 h-4 bg-white rounded-full absolute left-1 transition-transform"></span>
                    </button>
                </div>
            </div>

            <div class="flex flex-col items-center justify-center py-2 w-full">

                <div id="empty-deck-view" class="hidden max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center flex-col items-center justify-center gap-4 py-12">
                    <div class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-2">🎉</div>
                    <h3 class="text-2xl font-bold text-slate-900">¡Mazo Terminado!</h3>
                    <p class="text-slate-600 text-sm">Has completado la sesión actual en este modo.</p>
                    <button id="btn-empty-return" class="mt-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl text-sm shadow-md">Volver al Inicio</button>
                </div>

                <div id="active-card-container" class="w-full max-w-xl hidden flex flex-col gap-5">
                    <div class="flex justify-between items-center text-xs text-slate-500 px-1">
                        <span id="card-badge-deck" class="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full uppercase">TEMA</span>
                        <span id="card-progress-indicator" class="font-mono">0 / 0</span>
                    </div>

                    <div id="wrapper-normal-card" class="perspective-1000 cursor-pointer w-full h-72 relative select-none">
                        <div id="card-inner" class="preserve-3d w-full h-full relative transition-transform duration-500 ease-out">
                            <div class="backface-hidden absolute inset-0 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-lg">
                                <span class="text-xs font-bold text-slate-400 uppercase">Frente (Español)</span>
                                <p id="card-front-text" class="text-2xl text-center font-semibold text-slate-800 my-auto px-4"></p>
                                <span class="text-center text-xs text-slate-400">Haz clic para dar la vuelta</span>
                            </div>
                            <div class="backface-hidden rotate-y-180 absolute inset-0 bg-indigo-900 text-white rounded-3xl p-8 flex flex-col justify-between shadow-xl">
                                <span class="text-xs font-bold text-indigo-300 uppercase">Dorso (Francés + IPA)</span>
                                <div class="text-center my-auto flex flex-col gap-3 px-2">
                                    <p id="card-back-text" class="text-2xl font-bold text-white leading-relaxed"></p>
                                    <p id="card-back-ipa" class="text-base text-emerald-300 font-mono italic"></p>
                                </div>
                                <div class="flex justify-center gap-3">
                                    <button id="btn-audio-speak" class="p-3 bg-indigo-800 hover:bg-indigo-700 rounded-full text-white shadow transition"><i data-lucide="volume-2" class="w-5 h-5"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="wrapper-hard-card" class="hidden w-full bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 shadow-lg">
                        <span class="text-xs font-bold text-slate-400 uppercase">Escribe en Francés (¡Ojo con los acentos!)</span>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[70px] flex items-center justify-center">
                            <p id="hard-front-text" class="text-xl text-center font-semibold text-slate-700"></p>
                        </div>

                        <input type="text" id="input-hard-answer" autocomplete="off" placeholder="Escribe la traducción aquí..." class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors">

                        <div id="hard-actions-container" class="flex flex-col gap-2">
                            <button id="btn-hard-check" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm tracking-wide transition shadow-sm">COMPROBAR RESPUESTA</button>
                            <button id="btn-hard-retry" class="hidden w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm tracking-wide transition shadow-sm">🔄 REINTENTAR FRASE</button>
                        </div>

                        <div id="hard-result-box" class="hidden p-4 rounded-xl flex flex-col gap-2 border">
                            <div class="flex justify-between items-center">
                                <span id="hard-result-status" class="font-bold text-sm"></span>
                                <button id="btn-hard-audio" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"><i data-lucide="volume-2" class="w-4 h-4"></i></button>
                            </div>
                            <p id="hard-correct-sentence" class="text-base font-bold tracking-wide"></p>
                            <p id="hard-correct-ipa" class="text-xs font-mono italic text-slate-500"></p>

                            <div class="grid grid-cols-2 gap-2 mt-2" id="hard-result-navigation">
                                <button id="btn-hard-skip" class="py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs tracking-wide transition">SALTAR FRASE</button>
                                <button id="btn-hard-next" class="py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs tracking-wide transition">SIGUIENTE TARJETA</button>
                            </div>
                        </div>
                    </div>

                    <div id="normal-feedback-buttons" class="grid grid-cols-3 gap-3">
                        <button id="btn-score-again" class="bg-red-50 text-red-700 py-3.5 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-100 transition">🔄 REPETIR</button>
                        <button id="btn-score-hard" class="bg-amber-50 text-amber-700 py-3.5 rounded-xl text-xs font-bold border border-amber-200 hover:bg-amber-100 transition">😐 DIFÍCIL</button>
                        <button id="btn-score-easy" class="bg-emerald-50 text-emerald-700 py-3.5 rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition">😎 FÁCIL</button>
                    </div>

                    <!-- MÓDULO DE PRONUNCIACIÓN INDEPENDIENTE CON CANVAS ONDAS -->
                    <div class="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col gap-3 shadow-sm select-none">
                        <div class="flex items-center gap-4">
                            <!-- Botón Micro Push-To-Talk -->
                            <button id="btn-global-mic" class="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex flex-shrink-0 items-center justify-center transition-all shadow-md active:scale-95 touch-none">
                                <i data-lucide="mic" class="w-6 h-6"></i>
                            </button>

                            <!-- Panel de visualización de estado -->
                            <div class="flex-grow min-w-0 bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col justify-center min-h-[56px]">
                                <span id="voice-status-indicator" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">🎙️ PRÁCTICA DE ORAL (MANTÉN PULSADO EL MICRO)</span>
                                <p id="voice-interpreted-text" class="text-sm font-medium text-slate-500 italic truncate">Listo para escuchar...</p>
                            </div>
                        </div>

                        <div id="canvas-container" class="w-full bg-slate-950 h-10 rounded-xl overflow-hidden border border-slate-800">
                            <canvas id="wave-canvas" class="w-full h-full"></canvas>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    </main>

    <script type="module">
        let globalFlashcards = [];
        let state = {
            cardsProgress: {},
            activeSessionCards: [],
            currentCardIndex: 0,
            isFlipped: false,
            currentMazo: null,
            isHardModeActive: false
        };

        // Instancia global del Reconocimiento de Voz
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition = null;
        let isListening = false;

        // Variables globales para el Analizador de Audio (Líneas de movimiento)
        let audioCtx = null;
        let analyser = null;
        let audioStream = null;
        let drawVisualId = null;

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true; // Habilitado para capturar texto en tiempo real
            recognition.maxAlternatives = 1;
        }

        document.getElementById('btn-back-to-lobby').onclick = () => showLobbyView();
        document.getElementById('btn-empty-return').onclick = () => showLobbyView();

        const toggleBtn = document.getElementById('toggle-hard-mode');
        toggleBtn.onclick = () => {
            state.isHardModeActive = !state.isHardModeActive;
            updateToggleUI();
            startStudySession(state.currentMazo);
        };

        function updateToggleUI() {
            const circle = document.getElementById('toggle-circle');
            if (state.isHardModeActive) {
                toggleBtn.classList.replace('bg-slate-200', 'bg-indigo-600');
                circle.classList.add('translate-x-5');
            } else {
                toggleBtn.classList.replace('bg-indigo-600', 'bg-slate-200');
                circle.classList.remove('translate-x-5');
            }
        }

        function showLobbyView() {
            document.getElementById('section-study').classList.add('hidden');
            document.getElementById('section-lobby').classList.remove('hidden');
            document.getElementById('app-subtitle').innerText = "Mis Temas de Francés";
            renderLobby();
        }

        function showStudyView(nombreMazo) {
            state.currentMazo = nombreMazo;
            document.getElementById('section-lobby').classList.add('hidden');
            document.getElementById('section-study').classList.remove('hidden');
            document.getElementById('app-subtitle').innerText = "Sesión de Estudio";
            startStudySession(nombreMazo);
        }

        async function cargarTodosLosMazos() {
            globalFlashcards = [];
            let cargadosConExito = 0;

            try {
                // Leemos el archivo índice centralizado temas.json
                const responseJson = await fetch('tarjetas/temas.json');
                if (!responseJson.ok) {
                    throw new Error("No se pudo acceder a tarjetas/temas.json");
                }

                const indexArchivos = await responseJson.json();

                for (const nombreArchivo of indexArchivos) {
                    try {
                        const responseTxt = await fetch(`tarjetas/${nombreArchivo}`);
                        if (!responseTxt.ok) {
                            console.error(`❌ No se encontró el archivo de mazo: "${nombreArchivo}".`);
                            continue;
                        }
                        const text = await responseTxt.text();

                        parsearCSV(text, nombreArchivo);
                        cargadosConExito++;
                    } catch (e) {
                        console.error(`❌ Error de red al cargar el mazo: "${nombreArchivo}"`, e);
                    }
                }
            } catch (err) {
                console.error("❌ Error crítico al leer el archivo temas.json:", err);
            }

            const statusBadge = document.getElementById('sync-status');
            if (cargadosConExito > 0) {
                statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm";
                document.getElementById('sync-text').innerText = `${cargadosConExito} Temas listos`;
            } else {
                statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium text-sm";
                document.getElementById('sync-text').innerText = "0 mazos cargados";
            }
            renderLobby();
        }

        function parsearCSV(text, filename) {
            const cleanText = text.replace(/\\n/g, '[[NEWLINE]]');
            const lines = cleanText.split(/\r?\n/);

            let index = 0;
            lines.forEach((line) => {
                line = line.trim();
                if (!line) return;

                const partes = line.split(';');
                if (partes.length >= 2) {
                    const frente = partes[0].trim();
                    const dorsoCompleto = partes[1].trim();

                    let frances = dorsoCompleto;
                    let ipa = "";

                    if (dorsoCompleto.includes('[[NEWLINE]]')) {
                        const partesDorso = dorsoCompleto.split('[[NEWLINE]]');
                        frances = partesDorso[0].trim();
                        ipa = partesDorso[1].trim();
                    }

                    globalFlashcards.push({
                        id: `${filename}_${index}`,
                        mazo: filename,
                        front: frente,
                        back: frances,
                        ipa: ipa
                    });
                    index++;
                }
            });
        }

        function renderLobby() {
            const container = document.getElementById('mazos-container');
            container.innerHTML = '';

            const nombresMazos = [...new Set(globalFlashcards.map(c => c.mazo))];

            nombresMazos.forEach((nombreMazo) => {
                const tarjetasMazo = globalFlashcards.filter(c => c.mazo === nombreMazo);
                const totalMazo = tarjetasMazo.length;

                const facilesCompletados = tarjetasMazo.filter(c => state.cardsProgress[c.id]?.easyBox === 3).length;
                const dificilesCompletados = tarjetasMazo.filter(c => state.cardsProgress[c.id]?.hardMastered === true).length;

                const porcFacil = totalMazo > 0 ? Math.round((facilesCompletados / totalMazo) * 100) : 0;
                const porcDificil = totalMazo > 0 ? Math.round((dificilesCompletados / totalMazo) * 100) : 0;

                const nombreSinExtension = nombreMazo.replace('.txt', '');
                let tituloTema = nombreSinExtension;
                let descripcionTema = "Práctica de vocabulario y estructuras.";

                if (tituloTema.includes('_')) {
                    const partes = tituloTema.split('_');
                    tituloTema = partes[0].trim();
                    descripcionTema = partes[1].trim();
                }

                const box = document.createElement('div');
                box.className = "bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4";
                box.innerHTML = `
                    <div>
                        <h4 class="text-lg font-bold text-slate-800 truncate">${tituloTema}</h4>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">${descripcionTema}</p>
                    </div>

                    <div class="space-y-3 my-2">
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>🟢 MODO TARJETAS</span>
                                <span class="font-mono text-slate-700">${facilesCompletados}/${totalMazo}</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${porcFacil}%"></div></div>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-bold text-slate-500">
                                <span>💪 MODO ESCRITURA</span>
                                <span class="font-mono text-slate-700">${dificilesCompletados}/${totalMazo}</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-indigo-600 h-1.5 rounded-full" style="width: ${porcDificil}%"></div></div>
                        </div>
                    </div>

                    <button class="btn-entrar-mazo w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl text-xs font-bold tracking-wide shadow-sm transition" data-mazo="${nombreMazo}">
                        ABRIR SESIÓN
                    </button>
                `;
                container.appendChild(box);
            });

            document.querySelectorAll('.btn-entrar-mazo').forEach(b => {
                b.onclick = (e) => showStudyView(e.target.getAttribute('data-mazo'));
            });
        }

        function startStudySession(filtroMazo) {
            state.activeSessionCards = globalFlashcards.filter(c => c.mazo === filtroMazo);
            state.currentCardIndex = 0;
            resetFlip();
            renderCard();
        }

        function renderCard() {
            const container = document.getElementById('active-card-container');
            const emptyView = document.getElementById('empty-deck-view');

            if (state.activeSessionCards.length === 0 || state.currentCardIndex >= state.activeSessionCards.length) {
                container.classList.add('hidden');
                emptyView.classList.remove('hidden'); emptyView.classList.add('flex');
                return;
            }

            container.classList.remove('hidden'); emptyView.classList.add('hidden');
            container.classList.add('flex');

            const card = state.activeSessionCards[state.currentCardIndex];

            const nombreSinExtension = card.mazo.replace('.txt', '');
            const tituloLimpio = nombreSinExtension.includes('_') ? nombreSinExtension.split('_')[0].trim() : nombreSinExtension;
            document.getElementById('card-badge-deck').innerText = tituloLimpio;
            document.getElementById('card-progress-indicator').innerText = `${state.currentCardIndex + 1} / ${state.activeSessionCards.length}`;

            if (state.isHardModeActive) {
                document.getElementById('wrapper-normal-card').classList.add('hidden');
                document.getElementById('normal-feedback-buttons').classList.add('hidden');
                document.getElementById('wrapper-hard-card').classList.remove('hidden');

                document.getElementById('hard-front-text').innerText = card.front;

                const inputElement = document.getElementById('input-hard-answer');
                inputElement.value = '';
                inputElement.disabled = false;
                inputElement.className = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors";

                document.getElementById('hard-result-box').classList.add('hidden');
                document.getElementById('btn-hard-check').classList.remove('hidden');
                document.getElementById('btn-hard-retry').classList.add('hidden');
            } else {
                document.getElementById('wrapper-hard-card').classList.add('hidden');
                document.getElementById('wrapper-normal-card').classList.remove('hidden');
                document.getElementById('normal-feedback-buttons').classList.remove('hidden');

                document.getElementById('card-front-text').innerText = card.front;
                document.getElementById('card-back-text').innerText = card.back;
                document.getElementById('card-back-ipa').innerText = card.ipa;
                resetFlip();
            }

            document.getElementById('voice-status-indicator').innerText = "🎙️ PRÁCTICA DE ORAL (MANTÉN PULSADO EL MICRO)";
            document.getElementById('voice-status-indicator').className = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5";
            document.getElementById('voice-interpreted-text').innerText = "Listo para escuchar...";
            document.getElementById('voice-interpreted-text').className = "text-sm font-medium text-slate-500 italic truncate";

            limpiarCanvasConLineaBase();
        }

        function limpiarCanvasConLineaBase() {
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

        function resetFlip() {
            state.isFlipped = false;
            document.getElementById('card-inner').classList.remove('rotate-y-180');
        }

        document.getElementById('wrapper-normal-card').onclick = (e) => {
            if (e.target.closest('#btn-audio-speak')) return;
            if (state.isHardModeActive) return;

            state.isFlipped = !state.isFlipped;
            document.getElementById('card-inner').classList.toggle('rotate-y-180', state.isFlipped);
        };

        function responderNormal(tipo) {
            const card = state.activeSessionCards[state.currentCardIndex];
            if (!state.cardsProgress[card.id]) state.cardsProgress[card.id] = { easyBox: 0, hardMastered: false };

            if (tipo === 'easy') state.cardsProgress[card.id].easyBox = 3;
            else if (tipo === 'hard') state.cardsProgress[card.id].easyBox = 1;

            guardarProgreso();
            if (tipo === 'again') state.activeSessionCards.push(card);

            state.currentCardIndex++;
            renderCard();
        }

        document.getElementById('btn-score-again').onclick = (e) => { e.stopPropagation(); responderNormal('again'); };
        document.getElementById('btn-score-hard').onclick = (e) => { e.stopPropagation(); responderNormal('hard'); };
        document.getElementById('btn-score-easy').onclick = (e) => { e.stopPropagation(); responderNormal('easy'); };

        document.getElementById('btn-hard-check').onclick = () => {
            const card = state.activeSessionCards[state.currentCardIndex];
            const limpiarTexto = (t) => t.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g, " ");

            const inputElement = document.getElementById('input-hard-answer');
            const userAnswer = limpiarTexto(inputElement.value);
            const correctSolution = limpiarTexto(card.back);

            const resultBox = document.getElementById('hard-result-box');
            const statusText = document.getElementById('hard-result-status');

            resultBox.classList.remove('hidden');
            document.getElementById('hard-correct-sentence').innerText = card.back;
            document.getElementById('hard-correct-ipa').innerText = card.ipa;

            if (!state.cardsProgress[card.id]) state.cardsProgress[card.id] = { easyBox: 0, hardMastered: false };

            if (userAnswer === correctSolution) {
                statusText.innerText = "🎉 ¡EXCELENTE! PERFECTO";
                statusText.className = "font-bold text-sm text-emerald-600";
                resultBox.className = "p-4 rounded-xl flex flex-col gap-2 border border-emerald-200 bg-emerald-50/50";
                inputElement.className = "w-full px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-900 rounded-xl focus:outline-none text-lg transition-colors";
                inputElement.disabled = true;

                document.getElementById('btn-hard-check').classList.add('hidden');
                document.getElementById('btn-hard-retry').classList.add('hidden');
                document.getElementById('btn-hard-skip').classList.add('hidden');

                state.cardsProgress[card.id].hardMastered = true;
                guardarProgreso();
            } else {
                statusText.innerText = "❌ CASI... COMPARA Y CORRIGE TU INPUT:";
                statusText.className = "font-bold text-sm text-amber-600";
                resultBox.className = "p-4 rounded-xl flex flex-col gap-2 border border-amber-200 bg-amber-50/50";
                inputElement.className = "w-full px-4 py-3 border border-amber-300 bg-amber-50 rounded-xl focus:outline-none text-lg transition-colors";

                document.getElementById('btn-hard-check').classList.add('hidden');
                document.getElementById('btn-hard-retry').classList.remove('hidden');
                document.getElementById('btn-hard-skip').classList.remove('hidden');
            }
        };

        document.getElementById('btn-hard-retry').onclick = () => {
            const inputElement = document.getElementById('input-hard-answer');
            inputElement.className = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors";

            document.getElementById('hard-result-box').classList.add('hidden');
            document.getElementById('btn-hard-retry').classList.add('hidden');
            document.getElementById('btn-hard-check').classList.remove('hidden');
            inputElement.focus();
        };

        document.getElementById('btn-hard-next').onclick = () => {
            state.currentCardIndex++;
            renderCard();
        };

        document.getElementById('btn-hard-skip').onclick = () => {
            const card = state.activeSessionCards[state.currentCardIndex];
            state.activeSessionCards.push(card);
            state.currentCardIndex++;
            renderCard();
        };

        function guardarProgreso() {
            localStorage.setItem('petit_pont_local_prog_v2', JSON.stringify(state.cardsProgress));
        }

        function ejecutarTTS(texto) {
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'fr-FR';
            window.speechSynthesis.speak(utterance);
        }

        document.getElementById('btn-audio-speak').onclick = (e) => {
            e.stopPropagation();
            ejecutarTTS(document.getElementById('card-back-text').innerText);
        };

        document.getElementById('btn-hard-audio').onclick = () => {
            ejecutarTTS(state.activeSessionCards[state.currentCardIndex].back);
        };

        // ========================================================
        //  SISTEMA DE ONDAS DE AUDIO NATIVAS (CANVAS)
        // ========================================================
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

        function detenerVisualizadorDeOndas() {
            if (drawVisualId) {
                cancelAnimationFrame(drawVisualId);
            }
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
        }

        // ========================================================
        //  SISTEMA DE MICRÓFONO GLOBAL OPTIMIZADO EN TIEMPO REAL
        // ========================================================
export function inicializarMicrofonoGlobal(recognition, state) {
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
        // Marcamos que está escuchando y cambiamos el botón a Rojo
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

        // Recorremos todos los fragmentos capturados por el micrófono
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            textAcumulado += event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                esFinal = true;
            }
        }

        // 🔥 AQUÍ ESTÁ EL TRUCO: Mostramos el texto en pantalla SEGÚN LO VAS DICIENDO
        interpretedText.innerText = `"${textAcumulado}"`;
        interpretedText.className = "text-sm font-semibold text-indigo-600 italic truncate";

        // Solo cuando el motor detecta que has terminado de hablar por completo, valida
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
                    // Primero pedimos el micro para la visualización
                    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    iniciarVisualizadorDeOndas(audioStream);
                    
                    // Pequeño delay de 100ms para asegurar que Android no bloquee el reconocimiento
                    setTimeout(() => {
                        recognition.start();
                    }, 100);
                    
                } catch(err) {
                    console.error("Error al acceder al micro", err);
                    isListening = false;
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

        const saved = localStorage.getItem('petit_pont_local_prog_v2');
        if (saved) state.cardsProgress = JSON.parse(saved);

        window.onload = () => {
            cargarTodosLosMazos();
            inicializarMicrofonoGlobal();
            lucide.createIcons();
        };
    </script>
</body>
</html>
