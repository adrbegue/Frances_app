// js/app.js
import { inicializarMicrofonoGlobal, ejecutarTTS, inicializarIPAGuide, playIPASound } from './audio.js';

// Estado global de la aplicación
let globalFlashcards = [];
let globalTextos = [];
let state = {
    cardsProgress: {},
    activeSessionCards: [],
    currentCardIndex: 0,
    isFlipped: false,
    currentMazo: null,
    isHardModeActive: false,
    currentMode: 'ejercicios',
    teoriaVisible: false,
    textoExercise: null,
    textoAnswers: {},
    textoScore: 0,
    textoProgress: {}
};

// Elementos DOM
const DOM = {
    lobby: document.getElementById('section-lobby'),
    study: document.getElementById('section-study'),
    subtitle: document.getElementById('app-subtitle'),
    mazosContainer: document.getElementById('mazos-container'),
    activeCardContainer: document.getElementById('active-card-container'),
    emptyDeckView: document.getElementById('empty-deck-view'),
    cardBadgeDeck: document.getElementById('card-badge-deck'),
    cardProgressIndicator: document.getElementById('card-progress-indicator'),
    cardFrontText: document.getElementById('card-front-text'),
    cardBackText: document.getElementById('card-back-text'),
    cardBackIpa: document.getElementById('card-back-ipa'),
    cardInner: document.getElementById('card-inner'),
    wrapperNormalCard: document.getElementById('wrapper-normal-card'),
    wrapperHardCard: document.getElementById('wrapper-hard-card'),
    normalFeedbackButtons: document.getElementById('normal-feedback-buttons'),
    hardFrontText: document.getElementById('hard-front-text'),
    inputHardAnswer: document.getElementById('input-hard-answer'),
    hardActionsContainer: document.getElementById('hard-actions-container'),
    hardResultBox: document.getElementById('hard-result-box'),
    hardResultStatus: document.getElementById('hard-result-status'),
    hardCorrectSentence: document.getElementById('hard-correct-sentence'),
    hardCorrectIpa: document.getElementById('hard-correct-ipa'),
    btnHardCheck: document.getElementById('btn-hard-check'),
    btnHardRetry: document.getElementById('btn-hard-retry'),
    btnHardSkip: document.getElementById('btn-hard-skip'),
    btnHardNext: document.getElementById('btn-hard-next'),
    btnHardAudio: document.getElementById('btn-hard-audio'),
    btnAudioSpeak: document.getElementById('btn-audio-speak'),
    btnScoreAgain: document.getElementById('btn-score-again'),
    btnScoreHard: document.getElementById('btn-score-hard'),
    btnScoreEasy: document.getElementById('btn-score-easy'),
    btnBackToLobby: document.getElementById('btn-back-to-lobby'),
    btnEmptyReturn: document.getElementById('btn-empty-return'),
    toggleBtn: document.getElementById('toggle-hard-mode'),
    toggleCircle: document.getElementById('toggle-circle'),
    syncStatus: document.getElementById('sync-status'),
    syncText: document.getElementById('sync-text'),
    btnShowTeoria: document.getElementById('btn-show-teoria'),
    teoriaModal: document.getElementById('teoria-modal'),
    closeTeoriaModal: document.getElementById('close-teoria-modal'),
    teoriaTitle: document.getElementById('teoria-title'),
    teoriaContent: document.getElementById('teoria-content'),
    textoModal: document.getElementById('texto-modal'),
    closeTextoModal: document.getElementById('close-texto-modal'),
    textoTitle: document.getElementById('texto-title'),
    textoInstrucciones: document.getElementById('texto-instrucciones'),
    textoContenido: document.getElementById('texto-contenido'),
    opcionesContainer: document.getElementById('opciones-container'),
    checkTextoAnswers: document.getElementById('check-texto-answers'),
    resetTextoExercise: document.getElementById('reset-texto-exercise'),
    tabEjercicios: document.getElementById('tab-ejercicios'),
    tabTexto: document.getElementById('tab-texto'),
    tabTeoria: document.getElementById('tab-teoria'),
    voiceStatusIndicator: document.getElementById('voice-status-indicator'),
    voiceInterpretedText: document.getElementById('voice-interpreted-text')
};

// Event listeners
DOM.btnBackToLobby.onclick = () => showLobbyView();
DOM.btnEmptyReturn.onclick = () => showLobbyView();

DOM.toggleBtn.onclick = () => {
    state.isHardModeActive = !state.isHardModeActive;
    updateToggleUI();
    if (state.currentMode === 'ejercicios') {
        startStudySession(state.currentMazo);
    }
};

function updateToggleUI() {
    if (state.isHardModeActive) {
        DOM.toggleBtn.classList.replace('bg-slate-200', 'bg-indigo-600');
        DOM.toggleCircle.classList.add('translate-x-5');
    } else {
        DOM.toggleBtn.classList.replace('bg-indigo-600', 'bg-slate-200');
        DOM.toggleCircle.classList.remove('translate-x-5');
    }
}

function showLobbyView() {
    DOM.study.classList.add('hidden');
    DOM.lobby.classList.remove('hidden');
    DOM.subtitle.innerText = "Mis Temas de Francés";
    renderLobby();
}

function showStudyView(nombreMazo) {
    state.currentMazo = nombreMazo;
    DOM.lobby.classList.add('hidden');
    DOM.study.classList.remove('hidden');
    DOM.subtitle.innerText = "Sesión de Estudio";
    startStudySession(nombreMazo);
}

function setMode(mode) {
    state.currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.remove('active', 'bg-indigo-600', 'text-white');
        tab.classList.add('bg-slate-100', 'text-slate-700');
    });
    const activeTab = document.querySelector(`[data-mode="${mode}"]`);
    if (activeTab) {
        activeTab.classList.add('active', 'bg-indigo-600', 'text-white');
        activeTab.classList.remove('bg-slate-100', 'text-slate-700');
    }
    if (!DOM.study.classList.contains('hidden')) {
        startStudySession(state.currentMazo);
    }
}

DOM.tabEjercicios.onclick = () => setMode('ejercicios');
DOM.tabTexto.onclick = () => setMode('texto');
DOM.tabTeoria.onclick = () => setMode('teoria');

async function cargarTodosLosMazos() {
    globalFlashcards = [];
    globalTextos = [];
    let cargadosConExito = 0;

    try {
        const responseJson = await fetch('temas.json');
        if (!responseJson.ok) throw new Error("No se pudo acceder a temas.json");
        const indexArchivos = await responseJson.json();

        for (const nombreArchivo of indexArchivos) {
            try {
                const responseTxt = await fetch(`ejercicios/${nombreArchivo}`);
                if (!responseTxt.ok) continue;
                const text = await responseTxt.text();
                parsearCSV(text, nombreArchivo);
                cargadosConExito++;

                try {
                    const responseTexto = await fetch(`texto/${nombreArchivo}`);
                    if (responseTexto.ok) {
                        const textoContent = await responseTexto.text();
                        globalTextos.push({ mazo: nombreArchivo, content: textoContent });
                    }
                } catch (e) {
                    console.warn(`No se encontró archivo de texto para: ${nombreArchivo}`);
                }
            } catch (e) {
                console.error(`Error al cargar el mazo: "${nombreArchivo}"`, e);
            }
        }
    } catch (err) {
        console.error("Error crítico al leer temas.json:", err);
    }

    const statusBadge = DOM.syncStatus;
    if (cargadosConExito > 0) {
        statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm";
        DOM.syncText.innerText = `${cargadosConExito} Temas listos`;
    } else {
        statusBadge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium text-sm";
        DOM.syncText.innerText = "0 mazos cargados";
    }
    renderLobby();
}

function parsearCSV(text, filename) {
    const lines = text.split(/\r?\n/);
    let index = 0;
    lines.forEach((line) => {
        line = line.trim();
        if (!line) return;
        const partes = line.split(';');
        if (partes.length >= 2) {
            globalFlashcards.push({
                id: `${filename}_${index}`,
                mazo: filename,
                front: partes[0].trim(),
                back: partes[1].trim(),
                ipa: partes[2] ? partes[2].trim() : ""
            });
            index++;
        }
    });
}

function renderLobby() {
    DOM.mazosContainer.innerHTML = '';
    const nombresMazos = [...new Set(globalFlashcards.map(c => c.mazo))];

    nombresMazos.forEach((nombreMazo) => {
        const tarjetasMazo = globalFlashcards.filter(c => c.mazo === nombreMazo);
        const totalMazo = tarjetasMazo.length;

        // Progreso de ejercicios
        const facilesCompletados = tarjetasMazo.filter(c => state.cardsProgress[c.id]?.easyBox === 3).length;
        const dificilesCompletados = tarjetasMazo.filter(c => state.cardsProgress[c.id]?.hardMastered === true).length;
        const porcFacil = totalMazo > 0 ? Math.round((facilesCompletados / totalMazo) * 100) : 0;
        const porcDificil = totalMazo > 0 ? Math.round((dificilesCompletados / totalMazo) * 100) : 0;

        // Progreso de texto
        const textoProgress = state.textoProgress || {};
        const textoCompletado = textoProgress[nombreMazo]?.completed || false;

        const nombreSinExtension = nombreMazo.replace('.txt', '');
        let tituloTema = nombreSinExtension;
        let descripcionTema = "Práctica de vocabulario y estructuras.";
        if (tituloTema.includes('_')) {
            const partes = tituloTema.split('_');
            tituloTema = partes[0].trim();
            descripcionTema = partes[1].trim();
        }

        const box = document.createElement('div');
        box.className = "bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col gap-4";

        box.innerHTML = `
            <div>
                <h4 class="text-lg font-bold text-slate-800 truncate">${tituloTema}</h4>
                <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">${descripcionTema}</p>
            </div>

            <div class="space-y-2">
                <div class="space-y-1">
                    <div class="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>🟢 EJERCICIOS</span>
                        <span class="font-mono text-slate-700">${facilesCompletados}/${totalMazo}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                        <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${porcFacil}%"></div>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>📖 TEXTO</span>
                        <span class="font-mono text-slate-700">${textoCompletado ? '✅' : '❌'}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                        <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${textoCompletado ? '100' : '0'}%"></div>
                    </div>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between text-[11px] font-bold text-slate-500">
                        <span>💪 ESCRITURA</span>
                        <span class="font-mono text-slate-700">${dificilesCompletados}/${totalMazo}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                        <div class="bg-amber-500 h-1.5 rounded-full" style="width: ${porcDificil}%"></div>
                    </div>
                </div>
            </div>

            <!-- Botones directos para cada modo -->
            <div class="grid grid-cols-3 gap-2">
                <button
                    class="btn-modeEjercicios w-full py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold tracking-wide shadow-sm transition"
                    data-mazo="${nombreMazo}"
                    data-mode="ejercicios"
                >
                    <i data-lucide="book-open" class="w-4 h-4 inline-block mr-1"></i> EJERCICIOS
                </button>
                <button
                    class="btn-modeTexto w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold tracking-wide shadow-sm transition"
                    data-mazo="${nombreMazo}"
                    data-mode="texto"
                >
                    <i data-lucide="file-text" class="w-4 h-4 inline-block mr-1"></i> TEXTO
                </button>
                <button
                    class="btn-modeTeoria w-full py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-bold tracking-wide shadow-sm transition"
                    data-mazo="${nombreMazo}"
                    data-mode="teoria"
                >
                    <i data-lucide="book" class="w-4 h-4 inline-block mr-1"></i> TEORÍA
                </button>
            </div>
        `;

        DOM.mazosContainer.appendChild(box);
    });

    // Configurar los botones para cada modo
    document.querySelectorAll('.btn-modeEjercicios, .btn-modeTexto, .btn-modeTeoria').forEach(b => {
        b.onclick = (e) => {
            const mazo = e.target.getAttribute('data-mazo');
            const mode = e.target.getAttribute('data-mode');
            state.currentMazo = mazo;
            state.currentMode = mode;
            DOM.lobby.classList.add('hidden');
            DOM.study.classList.remove('hidden');
            DOM.subtitle.innerText = "Sesión de Estudio";
            startStudySession(mazo);
        };
    });
}

function startStudySession(filtroMazo) {
    if (state.currentMode === 'teoria') {
        showTeoria(filtroMazo);
        return;
    }

    if (state.currentMode === 'texto') {
        loadTextoExercise(filtroMazo);
        return;
    }

    // Modo por defecto: ejercicios
    let tarjetasMazo = globalFlashcards.filter(c => c.mazo === filtroMazo);
    tarjetasMazo.sort((a, b) => {
        const aProgress = state.cardsProgress[a.id] || { easyBox: 0, hardMastered: false };
        const bProgress = state.cardsProgress[b.id] || { easyBox: 0, hardMastered: false };
        const aPriority = aProgress.easyBox === 0 ? 0 : (aProgress.easyBox === 1 ? 1 : 2);
        const bPriority = bProgress.easyBox === 0 ? 0 : (bProgress.easyBox === 1 ? 1 : 2);
        return aPriority - bPriority;
    });

    state.activeSessionCards = tarjetasMazo;
    state.currentCardIndex = 0;
    resetFlip();
    renderCard();
}

function renderCard() {
    const container = DOM.activeCardContainer;
    const emptyView = DOM.emptyDeckView;

    if (state.activeSessionCards.length === 0 || state.currentCardIndex >= state.activeSessionCards.length) {
        container.classList.add('hidden');
        emptyView.classList.remove('hidden');
        emptyView.classList.add('flex');
        return;
    }

    container.classList.remove('hidden');
    emptyView.classList.add('hidden');
    container.classList.add('flex');

    const card = state.activeSessionCards[state.currentCardIndex];
    const nombreSinExtension = card.mazo.replace('.txt', '');
    const tituloLimpio = nombreSinExtension.includes('_') ? nombreSinExtension.split('_')[0].trim() : nombreSinExtension;
    DOM.cardBadgeDeck.innerText = tituloLimpio;
    DOM.cardProgressIndicator.innerText = `${state.currentCardIndex + 1} / ${state.activeSessionCards.length}`;

    if (state.isHardModeActive) {
        DOM.wrapperNormalCard.classList.add('hidden');
        DOM.normalFeedbackButtons.classList.add('hidden');
        DOM.wrapperHardCard.classList.remove('hidden');
        DOM.hardFrontText.innerText = card.front;
        DOM.inputHardAnswer.value = '';
        DOM.inputHardAnswer.disabled = false;
        DOM.inputHardAnswer.className = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors";
        DOM.hardResultBox.classList.add('hidden');
        DOM.btnHardCheck.classList.remove('hidden');
        DOM.btnHardRetry.classList.add('hidden');
    } else {
        DOM.wrapperHardCard.classList.add('hidden');
        DOM.wrapperNormalCard.classList.remove('hidden');
        DOM.normalFeedbackButtons.classList.remove('hidden');
        DOM.cardFrontText.innerText = card.front;
        DOM.cardBackText.innerText = card.back;
        DOM.cardBackIpa.innerText = card.ipa;
        resetFlip();
    }

    DOM.voiceStatusIndicator.innerText = "🎙️ PRÁCTICA DE ORAL (MANTÉN PULSADO EL MICRO)";
    DOM.voiceStatusIndicator.className = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5";
    DOM.voiceInterpretedText.innerText = "Listo para escuchar...";
    DOM.voiceInterpretedText.className = "text-sm font-medium text-slate-500 italic truncate";
}

function resetFlip() {
    state.isFlipped = false;
    DOM.cardInner.classList.remove('rotate-y-180');
}

DOM.wrapperNormalCard.onclick = (e) => {
    if (e.target.closest('#btn-audio-speak')) return;
    if (state.isHardModeActive) return;
    state.isFlipped = !state.isFlipped;
    DOM.cardInner.classList.toggle('rotate-y-180', state.isFlipped);
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

DOM.btnScoreAgain.onclick = (e) => { e.stopPropagation(); responderNormal('again'); };
DOM.btnScoreHard.onclick = (e) => { e.stopPropagation(); responderNormal('hard'); };
DOM.btnScoreEasy.onclick = (e) => { e.stopPropagation(); responderNormal('easy'); };

DOM.btnHardCheck.onclick = () => {
    const card = state.activeSessionCards[state.currentCardIndex];
    const limpiarTexto = (t) => t.trim().toLowerCase().replace(/[.,\/#!$%^&*;:{}=\-_`~()?¿]/g,"").replace(/\s+/g, " ");
    const userAnswer = limpiarTexto(DOM.inputHardAnswer.value);
    const correctSolution = limpiarTexto(card.back);
    DOM.hardResultBox.classList.remove('hidden');
    DOM.hardCorrectSentence.innerText = card.back;
    DOM.hardCorrectIpa.innerText = card.ipa;
    if (!state.cardsProgress[card.id]) state.cardsProgress[card.id] = { easyBox: 0, hardMastered: false };
    if (userAnswer === correctSolution) {
        DOM.hardResultStatus.innerText = "🎉 ¡EXCELENTE! PERFECTO";
        DOM.hardResultStatus.className = "font-bold text-sm text-emerald-600";
        DOM.hardResultBox.className = "p-4 rounded-xl flex flex-col gap-2 border border-emerald-200 bg-emerald-50/50";
        DOM.inputHardAnswer.className = "w-full px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-900 rounded-xl focus:outline-none text-lg transition-colors";
        DOM.inputHardAnswer.disabled = true;
        DOM.btnHardCheck.classList.add('hidden');
        DOM.btnHardRetry.classList.add('hidden');
        DOM.btnHardSkip.classList.add('hidden');
        state.cardsProgress[card.id].hardMastered = true;
        guardarProgreso();
    } else {
        DOM.hardResultStatus.innerText = "❌ CASI... COMPARA Y CORRIGE TU INPUT:";
        DOM.hardResultStatus.className = "font-bold text-sm text-amber-600";
        DOM.hardResultBox.className = "p-4 rounded-xl flex flex-col gap-2 border border-amber-200 bg-amber-50/50";
        DOM.inputHardAnswer.className = "w-full px-4 py-3 border border-amber-300 bg-amber-50 rounded-xl focus:outline-none text-lg transition-colors";
        DOM.btnHardCheck.classList.add('hidden');
        DOM.btnHardRetry.classList.remove('hidden');
        DOM.btnHardSkip.classList.remove('hidden');
    }
};

DOM.btnHardRetry.onclick = () => {
    DOM.inputHardAnswer.className = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors";
    DOM.hardResultBox.classList.add('hidden');
    DOM.btnHardRetry.classList.add('hidden');
    DOM.btnHardCheck.classList.remove('hidden');
    DOM.inputHardAnswer.focus();
};

DOM.btnHardNext.onclick = () => {
    state.currentCardIndex++;
    renderCard();
};

DOM.btnHardSkip.onclick = () => {
    const card = state.activeSessionCards[state.currentCardIndex];
    state.activeSessionCards.push(card);
    state.currentCardIndex++;
    renderCard();
};

function guardarProgreso() {
    localStorage.setItem('petit_pont_local_prog_v2', JSON.stringify(state.cardsProgress));
    localStorage.setItem('petit_pont_texto_prog_v2', JSON.stringify(state.textoProgress));
}

DOM.btnAudioSpeak.onclick = (e) => { e.stopPropagation(); ejecutarTTS(DOM.cardBackText.innerText); };
DOM.btnHardAudio.onclick = () => { ejecutarTTS(state.activeSessionCards[state.currentCardIndex].back); };

function obtenerFraseTarjetaActual() {
    const card = state.activeSessionCards[state.currentCardIndex];
    return card ? card.back : null;
}

// Funciones para teoría y texto
window.selectHueco = function(num) {
    state.selectedHueco = num;
    document.querySelectorAll('.hueco').forEach(hueco => {
        hueco.classList.remove('selected');
        hueco.style.background = '';
        hueco.style.borderColor = '';
    });
    const huecoElement = document.querySelector(`.hueco[data-num="${num}"]`);
    if (huecoElement) {
        huecoElement.classList.add('selected');
        huecoElement.style.background = '#dbeafe';
        huecoElement.style.borderColor = '#3b82f6';
    }
};

window.selectOpcion = function(opcion) {
    if (state.selectedHueco === undefined) {
        alert('Primero selecciona un hueco');
        return;
    }
    const used = Object.values(state.textoAnswers).includes(opcion);
    if (used) {
        alert('Esta opción ya ha sido usada');
        return;
    }
    state.textoAnswers[state.selectedHueco] = opcion;
    const huecoElement = document.querySelector(`.hueco[data-num="${state.selectedHueco}"]`);
    if (huecoElement) {
        huecoElement.innerHTML = opcion;
    }
    Array.from(DOM.opcionesContainer.children).forEach(btn => {
        if (btn.innerText === opcion) {
            btn.classList.add('used');
        }
    });
    state.selectedHueco = undefined;
};

function loadTextoExercise(mazo) {
    const textoMazo = globalTextos.find(t => t.mazo === mazo);
    if (!textoMazo) {
        alert('No se encontró ejercicio de texto para este tema');
        return;
    }

    const nombreSinExtension = mazo.replace('.txt', '');
    const tituloLimpio = nombreSinExtension.includes('_') ? nombreSinExtension.split('_')[0].trim() : nombreSinExtension;

    const lines = textoMazo.content.split('\n');
    let titulo = 'Texto con Huecos';
    let instrucciones = '';
    let textoContent = '';
    let opciones = [];
    let soluciones = {};

    let currentSection = '';
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('TÍTULO:')) {
            titulo = line.replace('TÍTULO:', '').trim();
        } else if (line.startsWith('INSTRUCCIONES:')) {
            instrucciones = line.replace('INSTRUCCIONES:', '').trim();
        } else if (line === '---TEXTO---') {
            currentSection = 'texto';
        } else if (line === '---OPCIONES---') {
            currentSection = 'opciones';
        } else if (line === '---SOLUCIONES---') {
            currentSection = 'soluciones';
        } else if (currentSection === 'texto') {
            textoContent += line + '\n';
        } else if (currentSection === 'opciones') {
            opciones = line.split('|');
        } else if (currentSection === 'soluciones') {
            const parts = line.split(':');
            if (parts.length >= 2) {
                soluciones[parts[0].trim()] = parts[1].trim();
            }
        }
    });

    state.textoExercise = { mazo, titulo, instrucciones, texto: textoContent, opciones, soluciones };
    state.textoAnswers = {};
    state.selectedHueco = undefined;

    DOM.textoTitle.innerText = `Texto: ${tituloLimpio}`;
    DOM.textoInstrucciones.innerHTML = `<p class="text-sm text-indigo-800">${instrucciones}</p>`;

    const huecosRegex = /\{(\d+)\}/g;
    let textoConHuecos = textoContent.replace(huecosRegex, (match, num) => {
        return `<span class="hueco" data-num="${num}" onclick="selectHueco(${num})">${state.textoAnswers[num] || '?'}</span>`;
    });

    DOM.textoContenido.innerHTML = `<div class="p-4 bg-white rounded-lg border border-slate-200">${textoConHuecos}</div>`;

    DOM.opcionesContainer.innerHTML = '';
    opciones.forEach(opcion => {
        const btn = document.createElement('button');
        btn.className = 'opcion-texto';
        btn.innerText = opcion;
        btn.onclick = () => selectOpcion(opcion);
        DOM.opcionesContainer.appendChild(btn);
    });

    DOM.checkTextoAnswers.onclick = checkTextoAnswers;
    DOM.resetTextoExercise.onclick = () => loadTextoExercise(mazo);
    DOM.textoModal.classList.add('active');
}

function checkTextoAnswers() {
    if (!state.textoExercise) return;
    let correctas = 0;
    const total = Object.keys(state.textoExercise.soluciones).length;

    Object.entries(state.textoExercise.soluciones).forEach(([num, solucion]) => {
        const respuesta = state.textoAnswers[num];
        const huecoElement = document.querySelector(`.hueco[data-num="${num}"]`);
        if (huecoElement) {
            if (respuesta && respuesta.toLowerCase() === solucion.toLowerCase()) {
                huecoElement.classList.add('correct');
                huecoElement.classList.remove('incorrect');
                correctas++;
            } else {
                huecoElement.classList.add('incorrect');
                huecoElement.classList.remove('correct');
                huecoElement.innerHTML = `<span style="text-decoration: line-through; color: #ef4444;">${respuesta || '?'}</span> / ${solucion}`;
            }
        }
    });

    state.textoScore = Math.round((correctas / total) * 100);
    alert(`¡Has acertado ${correctas} de ${total} respuestas! (${state.textoScore}%)`);

    state.textoProgress[state.textoExercise.mazo] = {
        completed: state.textoScore >= 80,
        score: state.textoScore,
        date: new Date().toISOString()
    };
    guardarProgreso();
}

function showTeoria(mazo) {
    const textoMazo = globalTextos.find(t => t.mazo === mazo);
    if (!textoMazo) {
        alert('No se encontró teoría para este tema');
        return;
    }

    const nombreSinExtension = mazo.replace('.txt', '');
    const tituloLimpio = nombreSinExtension.includes('_') ? nombreSinExtension.split('_')[0].trim() : nombreSinExtension;

    DOM.teoriaTitle.innerText = `Teoría: ${tituloLimpio}`;
    DOM.teoriaContent.innerHTML = `
        <div class="p-4 bg-white rounded-lg border border-slate-200 max-h-[600px] overflow-y-auto">
            <pre class="text-sm whitespace-pre-wrap">${escapeHtml(textoMazo.content)}</pre>
        </div>
    `;
    DOM.teoriaModal.classList.add('active');
}

DOM.btnShowTeoria.onclick = () => {
    if (state.currentMode === 'teoria') {
        showTeoria(state.currentMazo);
    } else {
        if (state.teoriaVisible) {
            DOM.btnShowTeoria.innerHTML = '<i data-lucide="book-open" class="w-5 h-5"></i><span>Mostrar Teoría</span>';
            state.teoriaVisible = false;
            DOM.teoriaModal.classList.remove('active');
        } else {
            showTeoria(state.currentMazo);
            DOM.btnShowTeoria.innerHTML = '<i data-lucide="book-open" class="w-5 h-5"></i><span>Ocultar Teoría</span>';
            state.teoriaVisible = true;
        }
    }
};

DOM.closeTeoriaModal.onclick = () => { DOM.teoriaModal.classList.remove('active'); };
DOM.closeTextoModal.onclick = () => { DOM.textoModal.classList.remove('active'); };
document.getElementById('teoria-modal').onclick = (e) => { if (e.target === DOM.teoriaModal) DOM.teoriaModal.classList.remove('active'); };
document.getElementById('texto-modal').onclick = (e) => { if (e.target === DOM.textoModal) DOM.textoModal.classList.remove('active'); };

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cargar progreso guardado
const saved = localStorage.getItem('petit_pont_local_prog_v2');
if (saved) state.cardsProgress = JSON.parse(saved);
const savedTexto = localStorage.getItem('petit_pont_texto_prog_v2');
if (savedTexto) state.textoProgress = JSON.parse(savedTexto);

// Inicializar
window.onload = () => {
    cargarTodosLosMazos();
    inicializarMicrofonoGlobal(obtenerFraseTarjetaActual);
    inicializarIPAGuide();
    lucide.createIcons();
};