// ================================================================
// js/app.js
// ================================================================
//
// Aplicación principal:
// - carga de tarjetas
// - progreso
// - lobby
// - sesiones de estudio
// - tarjetas
// - respuestas
// - micrófono
//
// La teoría y la pronunciación están separadas en:
//   pdf-viewer.js
//   pronunciacion.js
//
// ================================================================

import {
    inicializarMicrofonoGlobal,
    ejecutarTTS
} from './audio.js';

import {
    abrirTeoria
} from './pdf-viewer.js';

import {
    inicializarPronunciacion
} from './pronunciacion.js';


// ================================================================
// VARIABLES
// ================================================================

let globalFlashcards = [];

let state = {
    cardsProgress: {},
    activeSessionCards: [],
    currentCardIndex: 0,
    isFlipped: false,
    currentMazo: null
};


// ================================================================
// ELEMENTOS PRINCIPALES
// ================================================================

const sectionLobby =
    document.getElementById('section-lobby');

const sectionStudy =
    document.getElementById('section-study');


// ================================================================
// NAVEGACIÓN
// ================================================================

const btnBackToLobby =
    document.getElementById('btn-back-to-lobby');

if (btnBackToLobby) {

    btnBackToLobby.onclick = () => {
        showLobbyView();
    };

}


const btnEmptyReturn =
    document.getElementById('btn-empty-return');

if (btnEmptyReturn) {

    btnEmptyReturn.onclick = () => {
        showLobbyView();
    };

}


// ================================================================
// BOTÓN TEORÍA DURANTE EL ESTUDIO
// ================================================================

const btnTheoryStudy =
    document.getElementById('btn-theory-study');

if (btnTheoryStudy) {

    btnTheoryStudy.onclick = () => {

        if (!state.currentMazo) {
            return;
        }

        abrirTeoria(
            state.currentMazo
        );

    };

}


// ================================================================
// MOSTRAR LOBBY
// ================================================================

function showLobbyView() {

    sectionStudy.classList.add('hidden');
    sectionStudy.classList.remove('flex');

    sectionLobby.classList.remove('hidden');

    const subtitle =
        document.getElementById('app-subtitle');

    if (subtitle) {

        subtitle.innerText =
            'Mis Temas de Francés';

    }

    renderLobby();

}


// ================================================================
// MOSTRAR ESTUDIO
// ================================================================

function showStudyView(nombreMazo) {

    state.currentMazo =
        nombreMazo;

    sectionLobby.classList.add('hidden');

    sectionStudy.classList.remove('hidden');
    sectionStudy.classList.add('flex');

    const subtitle =
        document.getElementById('app-subtitle');

    if (subtitle) {

        subtitle.innerText =
            'Sesión de Estudio';

    }

    startStudySession(
        nombreMazo
    );

}


// ================================================================
// CARGAR TODOS LOS MAZOS
// ================================================================

async function cargarTodosLosMazos() {

    globalFlashcards = [];

    let cargadosConExito = 0;

    try {

        const responseJson =
            await fetch(
                'tarjetas/temas.json',
                {
                    cache: 'no-store'
                }
            );

        if (!responseJson.ok) {

            throw new Error(
                'No se pudo acceder a tarjetas/temas.json'
            );

        }

        const indexArchivos =
            await responseJson.json();

        for (
            const nombreArchivo
            of indexArchivos
        ) {

            try {

                const responseTxt =
                    await fetch(
                        `tarjetas/${encodeURIComponent(nombreArchivo)}`,
                        {
                            cache: 'no-store'
                        }
                    );

                if (!responseTxt.ok) {
                    continue;
                }

                const text =
                    await responseTxt.text();

                parsearCSV(
                    text,
                    nombreArchivo
                );

                cargadosConExito++;

            } catch (error) {

                console.error(
                    `❌ Error al cargar el mazo "${nombreArchivo}":`,
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            '❌ Error crítico al leer temas.json:',
            error
        );

    }


    const statusBadge =
        document.getElementById('sync-status');

    const statusText =
        document.getElementById('sync-text');


    if (
        statusBadge &&
        statusText
    ) {

        if (cargadosConExito > 0) {

            statusBadge.className =
                'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm';

            statusText.innerText =
                `${cargadosConExito} Temas listos`;

        } else {

            statusBadge.className =
                'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium text-sm';

            statusText.innerText =
                '0 mazos cargados';

        }

    }


    renderLobby();

}


// ================================================================
// PARSEAR TARJETAS
// ================================================================

function parsearCSV(
    text,
    filename
) {

    const lines =
        text.split(/\r?\n/);

    let index = 0;

    lines.forEach(line => {

        line =
            line.trim();

        if (!line) {
            return;
        }

        const partes =
            line.split(';');

        if (
            partes.length >= 2
        ) {

            globalFlashcards.push({

                id:
                    `${filename}_${index}`,

                mazo:
                    filename,

                front:
                    partes[0].trim(),

                back:
                    partes[1].trim(),

                ipa:
                    partes[2]
                        ? partes[2].trim()
                        : ''

            });

            index++;

        }

    });

}


// ================================================================
// ESTADO DE TARJETA
// ================================================================

function getCardStatus(card) {

    const progreso =
        state.cardsProgress[card.id];

    if (!progreso) {
        return 'new';
    }

    if (progreso.status) {
        return progreso.status;
    }

    // Compatibilidad con progreso antiguo.

    if (
        progreso.easyBox === 3 ||
        progreso.hardMastered === true
    ) {

        return 'mastered';

    }

    if (
        progreso.easyBox === 1
    ) {

        return 'failed';

    }

    return 'new';

}


// ================================================================
// RENDERIZAR LOBBY
// ================================================================

function renderLobby() {

    const container =
        document.getElementById(
            'mazos-container'
        );

    if (!container) {
        return;
    }

    container.innerHTML = '';


    const nombresMazos =
        [
            ...new Set(
                globalFlashcards.map(
                    card => card.mazo
                )
            )
        ];


    nombresMazos.forEach(
        nombreMazo => {

            const tarjetasMazo =
                globalFlashcards.filter(
                    card =>
                        card.mazo === nombreMazo
                );


            const total =
                tarjetasMazo.length;


            const superadas =
                tarjetasMazo.filter(
                    card =>
                        getCardStatus(card)
                        === 'mastered'
                ).length;


            const incorrectas =
                tarjetasMazo.filter(
                    card =>
                        getCardStatus(card)
                        === 'failed'
                ).length;


            const nuevas =
                tarjetasMazo.filter(
                    card =>
                        getCardStatus(card)
                        === 'new'
                ).length;


            const porcentaje =
                total > 0
                    ? Math.round(
                        (
                            superadas /
                            total
                        ) * 100
                    )
                    : 0;


            const card =
                document.createElement('div');


            card.className =
                'bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4';


            const titulo =
                nombreMazo.replace(
                    /\.txt$/i,
                    ''
                );


            card.innerHTML = `

                <div>

                    <div
                        class="flex items-start
                               justify-between gap-3">

                        <h3
                            class="font-bold text-lg
                                   text-slate-900
                                   leading-tight">

                            ${escapeHTML(titulo)}

                        </h3>

                        <span
                            class="text-xs font-bold
                                   bg-indigo-50
                                   text-indigo-700
                                   px-2.5 py-1
                                   rounded-full
                                   whitespace-nowrap">

                            ${total} tarjetas

                        </span>

                    </div>

                </div>


                <div class="space-y-2">

                    <div
                        class="flex items-center
                               justify-between text-xs">

                        <span
                            class="font-bold
                                   text-emerald-600">

                            🟢 ${superadas}/${total} superadas

                        </span>

                        <span
                            class="font-semibold
                                   text-slate-500">

                            ${porcentaje}%

                        </span>

                    </div>


                    <div
                        class="w-full h-2
                               bg-slate-100
                               rounded-full
                               overflow-hidden">

                        <div
                            class="h-full
                                   bg-emerald-500
                                   rounded-full
                                   transition-all"
                            style="width: ${porcentaje}%">
                        </div>

                    </div>


                    <div
                        class="flex items-center
                               gap-3 text-[11px]
                               text-slate-400">

                        <span>
                            🔴 ${incorrectas} incorrectas
                        </span>

                        <span>
                            ⚪ ${nuevas} no estudiadas
                        </span>

                    </div>

                </div>


                <div
                    class="grid grid-cols-2
                           gap-2 mt-auto">

                    <button
                        class="btn-theory-mazo
                               flex items-center
                               justify-center gap-2
                               px-3 py-2.5
                               bg-amber-50
                               hover:bg-amber-100
                               text-amber-700
                               border border-amber-200
                               rounded-xl
                               font-semibold text-xs
                               transition">

                        <i
                            data-lucide="book-open"
                            class="w-4 h-4">
                        </i>

                        Teoría

                    </button>


                    <button
                        class="btn-cards-mazo
                               flex items-center
                               justify-center gap-2
                               px-3 py-2.5
                               bg-indigo-600
                               hover:bg-indigo-700
                               text-white
                               rounded-xl
                               font-semibold text-xs
                               transition
                               shadow-sm">

                        <i
                            data-lucide="layers-3"
                            class="w-4 h-4">
                        </i>

                        Tarjetas

                    </button>

                </div>

            `;


            const btnTheory =
                card.querySelector(
                    '.btn-theory-mazo'
                );

            if (btnTheory) {

                btnTheory.onclick = () => {

                    abrirTeoria(
                        nombreMazo
                    );

                };

            }


            const btnCards =
                card.querySelector(
                    '.btn-cards-mazo'
                );

            if (btnCards) {

                btnCards.onclick = () => {

                    showStudyView(
                        nombreMazo
                    );

                };

            }


            container.appendChild(card);

        }
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ================================================================
// INICIAR SESIÓN
// ================================================================

function startStudySession(
    filtroMazo
) {

    const cards =
        globalFlashcards.filter(
            card =>
                card.mazo === filtroMazo
        );


    const nuevas =
        cards.filter(
            card =>
                getCardStatus(card)
                === 'new'
        );


    const falladas =
        cards.filter(
            card =>
                getCardStatus(card)
                === 'failed'
        );


    state.activeSessionCards =
        [
            ...nuevas,
            ...falladas
        ];


    state.currentCardIndex =
        0;


    state.isFlipped =
        false;


    renderCard();

}


// ================================================================
// RENDERIZAR TARJETA
// ================================================================

function renderCard() {

    const activeContainer =
        document.getElementById(
            'active-card-container'
        );

    const emptyView =
        document.getElementById(
            'empty-deck-view'
        );


    if (
        state.currentCardIndex >=
        state.activeSessionCards.length
    ) {

        if (activeContainer) {

            activeContainer.classList.add(
                'hidden'
            );

            activeContainer.classList.remove(
                'flex'
            );

        }


        if (emptyView) {

            emptyView.classList.remove(
                'hidden'
            );

            emptyView.classList.add(
                'flex'
            );

        }


        renderLobby();

        return;

    }


    if (emptyView) {

        emptyView.classList.add(
            'hidden'
        );

        emptyView.classList.remove(
            'flex'
        );

    }


    if (activeContainer) {

        activeContainer.classList.remove(
            'hidden'
        );

        activeContainer.classList.add(
            'flex'
        );

    }


    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    state.isFlipped =
        false;


    const cardInner =
        document.getElementById(
            'card-inner'
        );

    if (cardInner) {

        cardInner.classList.remove(
            'rotate-y-180'
        );

    }


    const front =
        document.getElementById(
            'card-front-text'
        );

    if (front) {
        front.innerText = card.front;
    }


    const back =
        document.getElementById(
            'card-back-text'
        );

    if (back) {
        back.innerText = card.back;
    }


    const ipa =
        document.getElementById(
            'card-back-ipa'
        );

    if (ipa) {

        ipa.innerText =
            card.ipa
                ? `/${card.ipa}/`
                : '';

    }


    const badge =
        document.getElementById(
            'card-badge-deck'
        );

    if (badge) {

        badge.innerText =
            card.mazo.replace(
                /\.txt$/i,
                ''
            );

    }


    const progress =
        document.getElementById(
            'card-progress-indicator'
        );

    if (progress) {

        progress.innerText =
            `${state.currentCardIndex + 1} / ${state.activeSessionCards.length}`;

    }


    actualizarIndicadorEstado(
        card
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ================================================================
// INDICADOR DE ESTADO
// ================================================================

function actualizarIndicadorEstado(
    card
) {

    const indicator =
        document.getElementById(
            'card-status-indicator'
        );

    if (!indicator) {
        return;
    }


    const status =
        getCardStatus(card);


    indicator.className =
        'font-bold px-3 py-1.5 rounded-full uppercase tracking-wide';


    if (
        status === 'mastered'
    ) {

        indicator.innerText =
            '🟢 SUPERADA';

        indicator.classList.add(
            'bg-emerald-100',
            'text-emerald-700'
        );


    } else if (
        status === 'failed'
    ) {

        indicator.innerText =
            '🔴 INCORRECTA';

        indicator.classList.add(
            'bg-red-100',
            'text-red-700'
        );


    } else {

        indicator.innerText =
            '⚪ NO ESTUDIADA';

        indicator.classList.add(
            'bg-slate-100',
            'text-slate-600'
        );

    }

}


// ================================================================
// GIRAR TARJETA
// ================================================================

const wrapperNormalCard =
    document.getElementById(
        'wrapper-normal-card'
    );

if (wrapperNormalCard) {

    wrapperNormalCard.onclick =
        event => {

            if (
                event.target.closest(
                    '#btn-audio-speak'
                )
            ) {
                return;
            }


            state.isFlipped =
                !state.isFlipped;


            const cardInner =
                document.getElementById(
                    'card-inner'
                );


            if (cardInner) {

                cardInner.classList.toggle(
                    'rotate-y-180',
                    state.isFlipped
                );

            }

        };

}


// ================================================================
// AUDIO DE TARJETA
// ================================================================

const btnAudioSpeak =
    document.getElementById(
        'btn-audio-speak'
    );

if (btnAudioSpeak) {

    btnAudioSpeak.onclick =
        event => {

            event.stopPropagation();


            const card =
                state.activeSessionCards[
                    state.currentCardIndex
                ];


            if (!card) {
                return;
            }


            ejecutarTTS(
                card.back
            );

        };

}


// ================================================================
// RESPUESTA
// ================================================================

function responderNormal(
    resultado
) {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    if (!card) {
        return;
    }


    state.cardsProgress[
        card.id
    ] = {

        ...state.cardsProgress[
            card.id
        ],

        status:
            resultado

    };


    guardarProgreso();


    state.currentCardIndex++;

    state.isFlipped =
        false;


    renderCard();

}


// ================================================================
// INCORRECTA
// ================================================================

const btnScoreWrong =
    document.getElementById(
        'btn-score-wrong'
    );

if (btnScoreWrong) {

    btnScoreWrong.onclick =
        () => {

            responderNormal(
                'failed'
            );

        };

}


// ================================================================
// SUPERADA
// ================================================================

const btnScoreCorrect =
    document.getElementById(
        'btn-score-correct'
    );

if (btnScoreCorrect) {

    btnScoreCorrect.onclick =
        () => {

            responderNormal(
                'mastered'
            );

        };

}


// ================================================================
// FRASE ACTUAL PARA MICRÓFONO
// ================================================================

function obtenerFraseTarjetaActual() {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    if (!card) {
        return '';
    }


    return card.back;

}


// ================================================================
// LOCAL STORAGE
// ================================================================

const STORAGE_KEY =
    'petit_pont_local_prog_v2';


// ================================================================
// GUARDAR PROGRESO
// ================================================================

function guardarProgreso() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                state.cardsProgress
            )
        );

    } catch (error) {

        console.error(
            '❌ Error guardando progreso:',
            error
        );

    }

}


// ================================================================
// CARGAR PROGRESO
// ================================================================

function cargarProgreso() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            state.cardsProgress =
                {};

            return;

        }


        state.cardsProgress =
            JSON.parse(saved) || {};


    } catch (error) {

        console.error(
            '❌ Error cargando progreso:',
            error
        );

        state.cardsProgress =
            {};

    }

}


// ================================================================
// TECLADO
// ================================================================

document.addEventListener(
    'keydown',
    event => {

        if (
            sectionStudy.classList.contains(
                'hidden'
            )
        ) {
            return;
        }


        if (
            event.key === ' '
        ) {

            event.preventDefault();


            const cardInner =
                document.getElementById(
                    'card-inner'
                );


            if (!cardInner) {
                return;
            }


            state.isFlipped =
                !state.isFlipped;


            cardInner.classList.toggle(
                'rotate-y-180',
                state.isFlipped
            );

        }

    }
);


// ================================================================
// INICIALIZACIÓN
// ================================================================

async function inicializarApp() {

    cargarProgreso();

    await cargarTodosLosMazos();

    await inicializarPronunciacion();

    inicializarMicrofonoGlobal(
        obtenerFraseTarjetaActual
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ================================================================
// ESCAPAR HTML
// ================================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ================================================================
// START
// ================================================================

inicializarApp();