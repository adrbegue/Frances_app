// ================================================================
// js/app.js
// ================================================================

import {
    inicializarMicrofonoGlobal,
    ejecutarTTS
} from './audio.js';


// ================================================================
// VARIABLES GLOBALES
// ================================================================

let globalFlashcards = [];
let pronunciationData = [];

let state = {

    cardsProgress: {},

    activeSessionCards: [],

    currentCardIndex: 0,

    isFlipped: false,

    currentMazo: null,

    isHardModeActive: false

};


// ================================================================
// ELEMENTOS PRINCIPALES
// ================================================================

const sectionLobby =
    document.getElementById('section-lobby');

const sectionStudy =
    document.getElementById('section-study');

const pronunciationOverlay =
    document.getElementById('pronunciation-overlay');

const theoryOverlay =
    document.getElementById('theory-overlay');

const theoryPdf =
    document.getElementById('theory-pdf');


// ================================================================
// NAVEGACIÓN
// ================================================================

document
    .getElementById('btn-back-to-lobby')
    .onclick = () => {

        showLobbyView();

    };


document
    .getElementById('btn-empty-return')
    .onclick = () => {

        showLobbyView();

    };


// ================================================================
// MOSTRAR LOBBY
// ================================================================

function showLobbyView() {

    closePronunciation();
    closeTheory();

    sectionStudy.classList.add('hidden');
    sectionStudy.classList.remove('flex');

    sectionLobby.classList.remove('hidden');

    document
        .getElementById('app-subtitle')
        .innerText = 'Mis Temas de Francés';

    renderLobby();

}


// ================================================================
// MOSTRAR ESTUDIO
// ================================================================

function showStudyView(nombreMazo) {

    state.currentMazo = nombreMazo;

    sectionLobby.classList.add('hidden');

    sectionStudy.classList.remove('hidden');
    sectionStudy.classList.add('flex');

    document
        .getElementById('app-subtitle')
        .innerText = 'Sesión de Estudio';

    startStudySession(nombreMazo);

}


// ================================================================
// PRONUNCIACIÓN
// ================================================================

document
    .getElementById('btn-pronunciation')
    .onclick = () => {

        openPronunciation();

    };


document
    .getElementById('btn-pronunciation-study')
    .onclick = () => {

        openPronunciation();

    };


function openPronunciation() {

    pronunciationOverlay.classList.remove('hidden');

    document.body.classList.add('overflow-hidden');

    renderPronunciation();

}


document
    .getElementById('btn-back-from-pronunciation')
    .onclick = () => {

        closePronunciation();

    };


function closePronunciation() {

    pronunciationOverlay.classList.add('hidden');

    document.body.classList.remove('overflow-hidden');

}


// ================================================================
// TEORÍA
// ================================================================

function abrirTeoria(nombreMazo) {

    if (!nombreMazo) {
        return;
    }

    const nombrePdf =
        nombreMazo.replace(/\.txt$/i, '.pdf');

    const rutaPdf =
        `teoria/${encodeURIComponent(nombrePdf)}`;

    theoryPdf.src = rutaPdf;

    const titulo =
        nombreMazo.replace(/\.txt$/i, '');

    document
        .getElementById('theory-title')
        .innerText = titulo;

    theoryOverlay.classList.remove('hidden');

    document.body.classList.add('overflow-hidden');

}


function closeTheory() {

    theoryOverlay.classList.add('hidden');

    theoryPdf.src = '';

    document.body.classList.remove('overflow-hidden');

}


document
    .getElementById('btn-close-theory')
    .onclick = () => {

        closeTheory();

    };


// ================================================================
// TEORÍA DESDE LA SESIÓN
// ================================================================

document
    .getElementById('btn-theory-study')
    .onclick = () => {

        if (state.currentMazo) {
            abrirTeoria(state.currentMazo);
        }

    };


// ================================================================
// CARGAR PRONUNCIACIÓN
// ================================================================

async function cargarPronunciacion() {

    try {

        const response =
            await fetch('datos/pronunciacion.json');

        if (!response.ok) {

            throw new Error(
                'No se pudo cargar datos/pronunciacion.json'
            );

        }

        pronunciationData =
            await response.json();

    } catch (error) {

        console.error(
            '❌ Error cargando pronunciación:',
            error
        );

        pronunciationData = [];

    }

}


// ================================================================
// RENDERIZAR PRONUNCIACIÓN
// ================================================================

function renderPronunciation() {

    const container =
        document.getElementById(
            'pronunciation-container'
        );

    container.innerHTML = '';


    if (!pronunciationData.length) {

        container.innerHTML = `
            <div class="bg-white rounded-3xl border border-red-200 p-8 text-center">

                <div class="text-4xl mb-3">
                    ⚠️
                </div>

                <h3 class="font-bold text-slate-900 mb-2">
                    No se ha podido cargar la fonética
                </h3>

                <p class="text-sm text-slate-500">
                    Comprueba que existe
                    <span class="font-mono">
                        datos/pronunciacion.json
                    </span>.
                </p>

            </div>
        `;

        return;
    }


    pronunciationData.forEach(categoria => {

        const categorySection =
            document.createElement('section');

        categorySection.className =
            'flex flex-col gap-3';


        const categoryHeader =
            document.createElement('div');


        categoryHeader.innerHTML = `
            <div class="flex items-center gap-3 mb-1">

                <div class="h-px flex-1 bg-slate-300"></div>

                <h3 class="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                    ${categoria.nombre || ''}
                </h3>

                <div class="h-px flex-1 bg-slate-300"></div>

            </div>

            ${
                categoria.descripcion
                    ? `
                        <p class="text-center text-xs sm:text-sm text-slate-400 mb-2">
                            ${categoria.descripcion}
                        </p>
                    `
                    : ''
            }
        `;


        categorySection.appendChild(
            categoryHeader
        );


        const grid =
            document.createElement('div');

        grid.className =
            'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3';


        const sonidos =
            categoria.sonidos || [];


        sonidos.forEach(sonido => {

            grid.appendChild(
                crearTarjetaPronunciacion(
                    sonido
                )
            );

        });


        categorySection.appendChild(grid);

        container.appendChild(
            categorySection
        );

    });


    lucide.createIcons();

}


// ================================================================
// TARJETA DE PRONUNCIACIÓN
// ================================================================

function crearTarjetaPronunciacion(sonido) {

    const card =
        document.createElement('button');

    card.type = 'button';

    card.className =
        'pronunciation-card bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm flex flex-col items-center justify-center gap-1 min-h-[105px] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 active:scale-95 transition';


    const ipaText =
        document.createElement('div');

    ipaText.className =
        'text-xl sm:text-2xl font-mono font-bold text-indigo-700 leading-tight text-center';

    ipaText.innerText =
        `/${sonido.ipa}/`;


    const wordText =
        document.createElement('div');

    wordText.className =
        'text-sm sm:text-base font-bold text-slate-800 leading-tight text-center break-words';

    wordText.innerText =
        sonido.ejemplo;


    const wordIPA =
        document.createElement('div');

    wordIPA.className =
        'text-[10px] sm:text-xs font-mono italic text-emerald-600 leading-tight text-center break-words';

    wordIPA.innerText =
        sonido.ejemplo_ipa || '';


    const audioIcon =
        document.createElement('div');

    audioIcon.className =
        'text-[10px] text-slate-400 mt-1';

    audioIcon.innerText =
        '🔊';


    card.appendChild(ipaText);
    card.appendChild(wordText);
    card.appendChild(wordIPA);
    card.appendChild(audioIcon);


    card.onclick = () => {

        if (sonido.ejemplo) {

            ejecutarTTS(
                sonido.ejemplo
            );

        }

    };


    return card;

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
                'tarjetas/temas.json'
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
                        `tarjetas/${nombreArchivo}`
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
                    `❌ Error al cargar el mazo: "${nombreArchivo}"`,
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
        document.getElementById(
            'sync-status'
        );


    if (cargadosConExito > 0) {

        statusBadge.className =
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm';


        document.getElementById(
            'sync-text'
        ).innerText =
            `${cargadosConExito} Temas listos`;


    } else {

        statusBadge.className =
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 font-medium text-sm';


        document.getElementById(
            'sync-text'
        ).innerText =
            '0 mazos cargados';

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


        if (partes.length >= 2) {

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
// RENDER LOBBY
// ================================================================

function renderLobby() {

    const container =
        document.getElementById(
            'mazos-container'
        );


    container.innerHTML = '';


    const nombresMazos =
        [
            ...new Set(
                globalFlashcards.map(
                    card => card.mazo
                )
            )
        ];


    nombresMazos.forEach(nombreMazo => {

        const tarjetasMazo =
            globalFlashcards.filter(
                card =>
                    card.mazo === nombreMazo
            );


        const totalMazo =
            tarjetasMazo.length;


        const facilesCompletados =
            tarjetasMazo.filter(
                card =>
                    state.cardsProgress[
                        card.id
                    ]?.easyBox === 3
            ).length;


        const dificilesCompletados =
            tarjetasMazo.filter(
                card =>
                    state.cardsProgress[
                        card.id
                    ]?.hardMastered === true
            ).length;


        const porcFacil =
            totalMazo > 0
                ? Math.round(
                    (
                        facilesCompletados /
                        totalMazo
                    ) * 100
                )
                : 0;


        const porcDificil =
            totalMazo > 0
                ? Math.round(
                    (
                        dificilesCompletados /
                        totalMazo
                    ) * 100
                )
                : 0;


        const nombreSinExtension =
            nombreMazo.replace(
                '.txt',
                ''
            );


        let tituloTema =
            nombreSinExtension;

        let descripcionTema =
            'Práctica de vocabulario y estructuras.';


        if (
            tituloTema.includes('_')
        ) {

            const partes =
                tituloTema.split('_');


            tituloTema =
                partes[0].trim();


            descripcionTema =
                partes[1].trim();

        }


        const box =
            document.createElement('div');


        box.className =
            'bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col gap-5';


        box.innerHTML = `

            <div>

                <h4 class="text-lg font-bold text-slate-800 truncate">
                    ${tituloTema}
                </h4>

                <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    ${descripcionTema}
                </p>

            </div>


            <div class="space-y-3">

                <div class="space-y-1">

                    <div class="flex justify-between text-[11px] font-bold text-slate-500">

                        <span>
                            🟢 MODO TARJETAS
                        </span>

                        <span class="font-mono text-slate-700">
                            ${facilesCompletados}/${totalMazo}
                        </span>

                    </div>

                    <div class="w-full bg-slate-100 rounded-full h-1.5">

                        <div
                            class="bg-emerald-500 h-1.5 rounded-full"
                            style="width: ${porcFacil}%">
                        </div>

                    </div>

                </div>


                <div class="space-y-1">

                    <div class="flex justify-between text-[11px] font-bold text-slate-500">

                        <span>
                            💪 MODO ESCRITURA
                        </span>

                        <span class="font-mono text-slate-700">
                            ${dificilesCompletados}/${totalMazo}
                        </span>

                    </div>

                    <div class="w-full bg-slate-100 rounded-full h-1.5">

                        <div
                            class="bg-indigo-600 h-1.5 rounded-full"
                            style="width: ${porcDificil}%">
                        </div>

                    </div>

                </div>

            </div>


            <!-- SECCIONES DEL TEMA -->

            <div class="grid grid-cols-2 gap-2 pt-1">

                <button
                    class="btn-theory-mazo flex items-center justify-center gap-2 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition"
                    data-mazo="${nombreMazo}">

                    <i data-lucide="book-open" class="w-4 h-4"></i>

                    TEORÍA

                </button>


                <button
                    class="btn-entrar-mazo flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                    data-mazo="${nombreMazo}">

                    <i data-lucide="layers-3" class="w-4 h-4"></i>

                    TARJETAS

                </button>

            </div>

        `;


        container.appendChild(box);

    });


    document
        .querySelectorAll('.btn-entrar-mazo')
        .forEach(button => {

            button.onclick = () => {

                showStudyView(
                    button.getAttribute(
                        'data-mazo'
                    )
                );

            };

        });


    document
        .querySelectorAll('.btn-theory-mazo')
        .forEach(button => {

            button.onclick = () => {

                abrirTeoria(
                    button.getAttribute(
                        'data-mazo'
                    )
                );

            };

        });


    lucide.createIcons();

}


// ================================================================
// INICIAR SESIÓN
// ================================================================

function startStudySession(
    filtroMazo
) {

    state.activeSessionCards =
        globalFlashcards.filter(
            card =>
                card.mazo === filtroMazo
        );


    state.currentCardIndex =
        0;


    resetFlip();

    renderCard();

}


// ================================================================
// RENDER TARJETA
// ================================================================

function renderCard() {

    const container =
        document.getElementById(
            'active-card-container'
        );


    const emptyView =
        document.getElementById(
            'empty-deck-view'
        );


    if (
        state.activeSessionCards.length === 0 ||
        state.currentCardIndex >=
        state.activeSessionCards.length
    ) {

        container.classList.add('hidden');

        emptyView.classList.remove('hidden');
        emptyView.classList.add('flex');

        return;

    }


    container.classList.remove('hidden');
    container.classList.add('flex');

    emptyView.classList.add('hidden');


    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    const nombreSinExtension =
        card.mazo.replace(
            '.txt',
            ''
        );


    const tituloLimpio =
        nombreSinExtension.includes('_')
            ? nombreSinExtension
                .split('_')[0]
                .trim()
            : nombreSinExtension;


    document.getElementById(
        'card-badge-deck'
    ).innerText =
        tituloLimpio;


    document.getElementById(
        'card-progress-indicator'
    ).innerText =
        `${state.currentCardIndex + 1} / ${state.activeSessionCards.length}`;


    if (
        state.isHardModeActive
    ) {

        document
            .getElementById(
                'wrapper-normal-card'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'normal-feedback-buttons'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'wrapper-hard-card'
            )
            .classList.remove('hidden');


        document.getElementById(
            'hard-front-text'
        ).innerText =
            card.front;


        const inputElement =
            document.getElementById(
                'input-hard-answer'
            );


        inputElement.value = '';
        inputElement.disabled = false;


        inputElement.className =
            'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors';


        document
            .getElementById(
                'hard-result-box'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'btn-hard-check'
            )
            .classList.remove('hidden');


        document
            .getElementById(
                'btn-hard-retry'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'btn-hard-skip'
            )
            .classList.remove('hidden');


    } else {

        document
            .getElementById(
                'wrapper-hard-card'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'wrapper-normal-card'
            )
            .classList.remove('hidden');


        document
            .getElementById(
                'normal-feedback-buttons'
            )
            .classList.remove('hidden');


        document.getElementById(
            'card-front-text'
        ).innerText =
            card.front;


        document.getElementById(
            'card-back-text'
        ).innerText =
            card.back;


        document.getElementById(
            'card-back-ipa'
        ).innerText =
            card.ipa;


        resetFlip();

    }


    document.getElementById(
        'voice-status-indicator'
    ).innerText =
        '🎙️ PRÁCTICA DE ORAL (MANTÉN PULSADO EL MICRO)';


    document.getElementById(
        'voice-status-indicator'
    ).className =
        'text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5';


    document.getElementById(
        'voice-interpreted-text'
    ).innerText =
        'Listo para escuchar...';


    document.getElementById(
        'voice-interpreted-text'
    ).className =
        'text-sm font-medium text-slate-500 italic truncate';

}


// ================================================================
// RESET FLIP
// ================================================================

function resetFlip() {

    state.isFlipped =
        false;


    document
        .getElementById(
            'card-inner'
        )
        .classList.remove(
            'rotate-y-180'
        );

}


// ================================================================
// CLICK EN TARJETA
// ================================================================

document
    .getElementById(
        'wrapper-normal-card'
    )
    .onclick =
    event => {

        if (
            event.target.closest(
                '#btn-audio-speak'
            )
        ) {

            return;

        }


        if (
            state.isHardModeActive
        ) {

            return;

        }


        state.isFlipped =
            !state.isFlipped;


        document
            .getElementById(
                'card-inner'
            )
            .classList.toggle(
                'rotate-y-180',
                state.isFlipped
            );

    };


// ================================================================
// RESPUESTA NORMAL
// ================================================================

function responderNormal(tipo) {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    if (
        !state.cardsProgress[
            card.id
        ]
    ) {

        state.cardsProgress[
            card.id
        ] = {

            easyBox: 0,

            hardMastered: false

        };

    }


    if (tipo === 'easy') {

        state.cardsProgress[
            card.id
        ].easyBox = 3;

    }

    else if (tipo === 'hard') {

        state.cardsProgress[
            card.id
        ].easyBox = 1;

    }


    guardarProgreso();


    if (tipo === 'again') {

        state.activeSessionCards.push(
            card
        );

    }


    state.currentCardIndex++;

    renderCard();

}


// ================================================================
// BOTONES NORMAL
// ================================================================

document
    .getElementById('btn-score-again')
    .onclick =
    event => {

        event.stopPropagation();

        responderNormal('again');

    };


document
    .getElementById('btn-score-hard')
    .onclick =
    event => {

        event.stopPropagation();

        responderNormal('hard');

    };


document
    .getElementById('btn-score-easy')
    .onclick =
    event => {

        event.stopPropagation();

        responderNormal('easy');

    };


// ================================================================
// MODO DIFÍCIL - COMPROBAR
// ================================================================

document
    .getElementById('btn-hard-check')
    .onclick = () => {

        const card =
            state.activeSessionCards[
                state.currentCardIndex
            ];


        const limpiarTexto = text => {

            return text
                .trim()
                .toLowerCase()
                .replace(
                    /[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,
                    ''
                )
                .replace(
                    /\s+/g,
                    ' '
                );

        };


        const inputElement =
            document.getElementById(
                'input-hard-answer'
            );


        const userAnswer =
            limpiarTexto(
                inputElement.value
            );


        const correctSolution =
            limpiarTexto(
                card.back
            );


        const resultBox =
            document.getElementById(
                'hard-result-box'
            );


        const statusText =
            document.getElementById(
                'hard-result-status'
            );


        resultBox.classList.remove(
            'hidden'
        );

        resultBox.classList.add(
            'flex'
        );


        document.getElementById(
            'hard-correct-sentence'
        ).innerText =
            card.back;


        document.getElementById(
            'hard-correct-ipa'
        ).innerText =
            card.ipa;


        if (
            !state.cardsProgress[
                card.id
            ]
        ) {

            state.cardsProgress[
                card.id
            ] = {

                easyBox: 0,

                hardMastered: false

            };

        }


        if (
            userAnswer ===
            correctSolution
        ) {

            statusText.innerText =
                '🎉 ¡EXCELENTE! PERFECTO';


            statusText.className =
                'font-bold text-sm text-emerald-600';


            resultBox.className =
                'p-4 rounded-xl flex flex-col gap-2 border border-emerald-200 bg-emerald-50/50';


            inputElement.className =
                'w-full px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-900 rounded-xl focus:outline-none text-lg transition-colors';


            inputElement.disabled = true;


            document
                .getElementById(
                    'btn-hard-check'
                )
                .classList.add('hidden');


            document
                .getElementById(
                    'btn-hard-retry'
                )
                .classList.add('hidden');


            document
                .getElementById(
                    'btn-hard-skip'
                )
                .classList.add('hidden');


            state.cardsProgress[
                card.id
            ].hardMastered = true;


            guardarProgreso();


        } else {

            statusText.innerText =
                '❌ CASI... COMPARA Y CORRIGE TU INPUT:';


            statusText.className =
                'font-bold text-sm text-amber-600';


            resultBox.className =
                'p-4 rounded-xl flex flex-col gap-2 border border-amber-200 bg-amber-50/50';


            inputElement.className =
                'w-full px-4 py-3 border border-amber-300 bg-amber-50 rounded-xl focus:outline-none text-lg transition-colors';


            document
                .getElementById(
                    'btn-hard-check'
                )
                .classList.add('hidden');


            document
                .getElementById(
                    'btn-hard-retry'
                )
                .classList.remove('hidden');


            document
                .getElementById(
                    'btn-hard-skip'
                )
                .classList.remove('hidden');

        }

    };


// ================================================================
// MODO DIFÍCIL - REINTENTAR
// ================================================================

document
    .getElementById('btn-hard-retry')
    .onclick = () => {

        const inputElement =
            document.getElementById(
                'input-hard-answer'
            );


        inputElement.value = '';

        inputElement.disabled = false;


        inputElement.className =
            'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg transition-colors';


        document
            .getElementById(
                'hard-result-box'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'hard-result-box'
            )
            .classList.remove('flex');


        document
            .getElementById(
                'btn-hard-check'
            )
            .classList.remove('hidden');


        document
            .getElementById(
                'btn-hard-retry'
            )
            .classList.add('hidden');


        document
            .getElementById(
                'btn-hard-skip'
            )
            .classList.remove('hidden');

    };


// ================================================================
// MODO DIFÍCIL - SIGUIENTE
// ================================================================

document
    .getElementById('btn-hard-next')
    .onclick = () => {

        state.currentCardIndex++;

        renderCard();

    };


// ================================================================
// MODO DIFÍCIL - SALTAR
// ================================================================

document
    .getElementById('btn-hard-skip')
    .onclick = () => {

        state.currentCardIndex++;

        renderCard();

    };


// ================================================================
// AUDIO TARJETA NORMAL
// ================================================================

document
    .getElementById('btn-audio-speak')
    .onclick =
    event => {

        event.stopPropagation();


        const texto =
            document.getElementById(
                'card-back-text'
            ).innerText;


        if (texto) {

            ejecutarTTS(texto);

        }

    };


// ================================================================
// AUDIO MODO DIFÍCIL
// ================================================================

document
    .getElementById('btn-hard-audio')
    .onclick = () => {

        const card =
            state.activeSessionCards[
                state.currentCardIndex
            ];


        if (card?.back) {

            ejecutarTTS(
                card.back
            );

        }

    };


// ================================================================
// OBTENER FRASE PARA EL MICRO
// ================================================================

function obtenerFraseTarjetaActual() {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    return card
        ? card.back
        : '';

}


// ================================================================
// GUARDAR PROGRESO
// ================================================================

function guardarProgreso() {

    try {

        localStorage.setItem(
            'petit_pont_local_prog_v2',
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

        const guardado =
            localStorage.getItem(
                'petit_pont_local_prog_v2'
            );


        if (guardado) {

            state.cardsProgress =
                JSON.parse(
                    guardado
                );

        }

    } catch (error) {

        console.error(
            '❌ Error cargando progreso:',
            error
        );

        state.cardsProgress = {};

    }

}


// ================================================================
// MODO DIFÍCIL
// ================================================================

const toggleBtn =
    document.getElementById(
        'toggle-hard-mode'
    );


toggleBtn.onclick = () => {

    state.isHardModeActive =
        !state.isHardModeActive;


    updateToggleUI();


    if (state.currentMazo) {

        renderCard();

    }

};


function updateToggleUI() {

    const circle =
        document.getElementById(
            'toggle-circle'
        );


    if (
        state.isHardModeActive
    ) {

        toggleBtn.classList.replace(
            'bg-slate-200',
            'bg-indigo-600'
        );


        circle.classList.add(
            'translate-x-5'
        );


    } else {

        toggleBtn.classList.replace(
            'bg-indigo-600',
            'bg-slate-200'
        );


        circle.classList.remove(
            'translate-x-5'
        );

    }

}


// ================================================================
// INICIALIZACIÓN
// ================================================================

window.addEventListener(
    'load',
    async () => {

        cargarProgreso();

        await cargarTodosLosMazos();

        await cargarPronunciacion();

        inicializarMicrofonoGlobal(
            obtenerFraseTarjetaActual
        );

        lucide.createIcons();

    }
);
