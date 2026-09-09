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

    currentMazo: null

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

            abrirTeoria(
                state.currentMazo
            );

        }

    };


// ================================================================
// CARGAR PRONUNCIACIÓN
// ================================================================

async function cargarPronunciacion() {

    try {

        const response =
            await fetch(
                'datos/pronunciacion.json'
            );


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
// OBTENER ESTADO DE TARJETA
// ================================================================

function getCardStatus(card) {

    const progreso =
        state.cardsProgress[
            card.id
        ];


    if (!progreso) {

        return 'new';

    }


    // Nuevo formato

    if (progreso.status) {

        return progreso.status;

    }


    // Compatibilidad con el formato anterior

    if (
        progreso.easyBox === 3
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
// GUARDAR ESTADO DE TARJETA
// ================================================================

function setCardStatus(
    card,
    status
) {

    const progresoAnterior =
        state.cardsProgress[
            card.id
        ] || {};


    state.cardsProgress[
        card.id
    ] = {

        ...progresoAnterior,

        status: status

    };


    guardarProgreso();

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


        const superadas =
            tarjetasMazo.filter(
                card =>
                    getCardStatus(card) === 'mastered'
            ).length;


        const incorrectas =
            tarjetasMazo.filter(
                card =>
                    getCardStatus(card) === 'failed'
            ).length;


        const noEstudiadas =
            tarjetasMazo.filter(
                card =>
                    getCardStatus(card) === 'new'
            ).length;


        const porcentaje =
            totalMazo > 0
                ? Math.round(
                    (
                        superadas /
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

                <div class="flex justify-between items-center text-[11px] font-bold">

                    <span class="text-emerald-600">
                        🟢 ${superadas} superadas
                    </span>

                    <span class="font-mono text-slate-500">
                        ${superadas}/${totalMazo}
                    </span>

                </div>


                <div class="w-full bg-slate-100 rounded-full h-2">

                    <div
                        class="bg-emerald-500 h-2 rounded-full transition-all"
                        style="width: ${porcentaje}%">
                    </div>

                </div>


                <div class="flex justify-between text-[10px] font-semibold">

                    <span class="text-red-500">
                        🔴 ${incorrectas} incorrectas
                    </span>

                    <span class="text-slate-400">
                        ⚪ ${noEstudiadas} no estudiadas
                    </span>

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

    const tarjetasMazo =
        globalFlashcards.filter(
            card =>
                card.mazo === filtroMazo
        );


    const tarjetasNuevas =
        tarjetasMazo.filter(
            card =>
                getCardStatus(card) === 'new'
        );


    const tarjetasIncorrectas =
        tarjetasMazo.filter(
            card =>
                getCardStatus(card) === 'failed'
        );


    // Primero las no estudiadas y después
    // las que estaban incorrectas.

    state.activeSessionCards = [
        ...tarjetasNuevas,
        ...tarjetasIncorrectas
    ];


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


    // ============================================================
    // ESTADO DE LA TARJETA
    // ============================================================

    const status =
        getCardStatus(card);

    const statusElement =
        document.getElementById(
            'card-status-indicator'
        );


    if (status === 'new') {

        statusElement.innerText =
            '⚪ NO ESTUDIADA';

        statusElement.className =
            'font-bold px-3 py-1.5 rounded-full uppercase tracking-wide bg-slate-100 text-slate-500';


    } else if (status === 'failed') {

        statusElement.innerText =
            '🔴 INCORRECTA';

        statusElement.className =
            'font-bold px-3 py-1.5 rounded-full uppercase tracking-wide bg-red-50 text-red-600';


    } else {

        statusElement.innerText =
            '🟢 SUPERADA';

        statusElement.className =
            'font-bold px-3 py-1.5 rounded-full uppercase tracking-wide bg-emerald-50 text-emerald-600';

    }


    // ============================================================
    // CONTENIDO
    // ============================================================

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


    // ============================================================
    // PRÁCTICA ORAL
    // ============================================================

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
// RESPUESTA: INCORRECTA
// ================================================================

function marcarIncorrecta() {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    if (!card) {
        return;
    }


    setCardStatus(
        card,
        'failed'
    );


    state.currentCardIndex++;

    renderCard();

}


// ================================================================
// RESPUESTA: SUPERADA
// ================================================================

function marcarSuperada() {

    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    if (!card) {
        return;
    }


    setCardStatus(
        card,
        'mastered'
    );


    state.currentCardIndex++;

    renderCard();

}


// ================================================================
// BOTÓN INCORRECTA
// ================================================================

document
    .getElementById('btn-score-wrong')
    .onclick =
    event => {

        event.stopPropagation();

        marcarIncorrecta();

    };


// ================================================================
// BOTÓN SUPERADA
// ================================================================

document
    .getElementById('btn-score-correct')
    .onclick =
    event => {

        event.stopPropagation();

        marcarSuperada();

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
