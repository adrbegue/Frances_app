// js/app.js
import { inicializarMicrofonoGlobal, ejecutarTTS, limpiarCanvasConLineaBase } from './audio.js';

let globalFlashcards = [];
let state = {
    cardsProgress: {},
    activeSessionCards: [],
    currentCardIndex: 0,
    isFlipped: false,
    currentMazo: null,
    isHardModeActive: false
};

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
        const responseJson = await fetch('tarjetas/temas.json');
        if (!responseJson.ok) throw new Error("No se pudo acceder a tarjetas/temas.json");

        const indexArchivos = await responseJson.json();

        for (const nombreArchivo of indexArchivos) {
            try {
                const responseTxt = await fetch(`tarjetas/${nombreArchivo}`);
                if (!responseTxt.ok) continue;
                const text = await responseTxt.text();

                parsearCSV(text, nombreArchivo);
                cargadosConExito++;
            } catch (e) {
                console.error(`❌ Error al cargar el mazo: "${nombreArchivo}"`, e);
            }
        }
    } catch (err) {
        console.error("❌ Error crítico al leer temas.json:", err);
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
    const lines = text.split(/\r?\n/);
    let index = 0;

    lines.forEach((line) => {
        line = line.trim();
        if (!line) return;

        // DIVIDIR POR PUNTO Y COMA (;)
        const partes = line.split(';');
        if (partes.length >= 2) {
            globalFlashcards.push({
                id: `${filename}_${index}`,
                mazo: filename,
                front: partes[0].trim(),
                back: partes[1].trim(),
                ipa: partes[2] ? partes[2].trim() : "" // <--- CORRECCIÓN CLAVE AQUÍ
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

document.getElementById('btn-audio-speak').onclick = (e) => {
    e.stopPropagation();
    ejecutarTTS(document.getElementById('card-back-text').innerText);
};

document.getElementById('btn-hard-audio').onclick = () => {
    ejecutarTTS(state.activeSessionCards[state.currentCardIndex].back);
};

function obtenerFraseTarjetaActual() {
    const card = state.activeSessionCards[state.currentCardIndex];
    return card ? card.back : null;
}

const saved = localStorage.getItem('petit_pont_local_prog_v2');
if (saved) state.cardsProgress = JSON.parse(saved);

window.onload = () => {
    cargarTodosLosMazos();
    inicializarMicrofonoGlobal(obtenerFraseTarjetaActual);
    lucide.createIcons();
};