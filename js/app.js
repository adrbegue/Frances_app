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
// VISOR PDF
// ================================================================

let theoryPdfDocument = null;
let theoryZoom = 1.0;


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

async function abrirTeoria(nombreMazo) {

    if (!nombreMazo) {
        return;
    }

    const nombrePdf =
        nombreMazo.replace(/\.txt$/i, '.pdf');

    const rutaPdf =
        `teoria/${encodeURIComponent(nombrePdf)}`;

    const titulo =
        nombreMazo.replace(/\.txt$/i, '');

    document
        .getElementById('theory-title')
        .innerText = titulo;

    theoryOverlay.classList.remove('hidden');

    document.body.classList.add('overflow-hidden');

    theoryZoom = 1.0;

    actualizarBotonZoom();

    await cargarPDFTeoria(rutaPdf);

}


async function cargarPDFTeoria(rutaPdf) {

    const container =
        document.getElementById(
            'theory-pdf-container'
        );

    container.innerHTML = `
        <div
            id="theory-pdf-loading"
            class="pdf-loading">

            <div class="flex flex-col items-center gap-4 px-6 text-center">

                <div
                    class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin">
                </div>

                <p class="font-semibold">
                    Cargando teoría...
                </p>

            </div>

        </div>
    `;

    theoryPdfDocument = null;

    if (!window.pdfjsLib) {

        container.innerHTML = `
            <div class="min-h-full flex items-center justify-center p-6">

                <div class="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">

                    <div class="text-4xl mb-3">
                        ⚠️
                    </div>

                    <h3 class="font-bold text-slate-900 mb-2">
                        No se pudo cargar el visor PDF
                    </h3>

                    <p class="text-sm text-slate-500">
                        El visor PDF no está disponible en este navegador.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    try {

        const loadingTask =
            pdfjsLib.getDocument({
                url: rutaPdf
            });

        theoryPdfDocument =
            await loadingTask.promise;


        container.innerHTML = '';


        for (
            let pageNumber = 1;
            pageNumber <= theoryPdfDocument.numPages;
            pageNumber++
        ) {

            await renderPDFPage(
                pageNumber
            );

        }


    } catch (error) {

        console.error(
            '❌ Error cargando PDF:',
            error
        );

        container.innerHTML = `
            <div class="min-h-full flex items-center justify-center p-6">

                <div class="bg-white rounded-3xl p-8 max-w-md text-center shadow-xl">

                    <div class="text-4xl mb-3">
                        ⚠️
                    </div>

                    <h3 class="font-bold text-slate-900 mb-2">
                        No se pudo cargar la teoría
                    </h3>

                    <p class="text-sm text-slate-500 mb-4">
                        Comprueba que existe el archivo PDF en la carpeta
                        <span class="font-mono">
                            teoria/
                        </span>.
                    </p>

                    <p class="text-xs text-slate-400 break-all">
                        ${rutaPdf}
                    </p>

                </div>

            </div>
        `;

    }

}


async function renderPDFPage(pageNumber) {

    if (!theoryPdfDocument) {
        return;
    }

    const page =
        await theoryPdfDocument.getPage(
            pageNumber
        );


    const container =
        document.getElementById(
            'theory-pdf-container'
        );


    const wrapper =
        document.createElement('div');

    wrapper.className =
        'pdf-page-wrapper';

    wrapper.dataset.page =
        pageNumber;


    const canvas =
        document.createElement('canvas');

    canvas.className =
        'pdf-page';


    wrapper.appendChild(canvas);

    container.appendChild(wrapper);


    const baseViewport =
        page.getViewport({
            scale: 1
        });


    const containerWidth =
        Math.max(
            container.clientWidth,
            300
        );


    const horizontalPadding =
        window.innerWidth <= 640
            ? 0
            : 24;


    const fitScale =
        (containerWidth - horizontalPadding) /
        baseViewport.width;


    const scale =
        fitScale * theoryZoom;


    const viewport =
        page.getViewport({
            scale
        });


    canvas.width =
        Math.floor(viewport.width);

    canvas.height =
        Math.floor(viewport.height);


    canvas.style.width =
        `${viewport.width}px`;

    canvas.style.height =
        `${viewport.height}px`;


    const context =
        canvas.getContext('2d');


    await page.render({
        canvasContext: context,
        viewport
    }).promise;

}


async function rerenderPDF() {

    if (!theoryPdfDocument) {
        return;
    }

    const container =
        document.getElementById(
            'theory-pdf-container'
        );

    container.innerHTML = '';


    for (
        let pageNumber = 1;
        pageNumber <= theoryPdfDocument.numPages;
        pageNumber++
    ) {

        await renderPDFPage(
            pageNumber
        );

    }

}


function actualizarBotonZoom() {

    const resetButton =
        document.getElementById(
            'btn-theory-zoom-reset'
        );

    if (!resetButton) {
        return;
    }

    resetButton.innerText =
        `${Math.round(theoryZoom * 100)}%`;

}


document
    .getElementById('btn-theory-zoom-in')
    .onclick = async () => {

        theoryZoom =
            Math.min(
                theoryZoom + 0.15,
                2.5
            );

        actualizarBotonZoom();

        await rerenderPDF();

    };


document
    .getElementById('btn-theory-zoom-out')
    .onclick = async () => {

        theoryZoom =
            Math.max(
                theoryZoom - 0.15,
                0.6
            );

        actualizarBotonZoom();

        await rerenderPDF();

    };


document
    .getElementById('btn-theory-zoom-reset')
    .onclick = async () => {

        theoryZoom = 1.0;

        actualizarBotonZoom();

        await rerenderPDF();

    };


function closeTheory() {

    theoryOverlay.classList.add('hidden');

    theoryPdfDocument = null;

    const container =
        document.getElementById(
            'theory-pdf-container'
        );

    if (container) {
        container.innerHTML = '';
    }

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


    pronunciationData.forEach(
        categoria => {

            const categorySection =
                document.createElement(
                    'section'
                );

            categorySection.className =
                'flex flex-col gap-3';


            const categoryHeader =
                document.createElement(
                    'div'
                );


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
                document.createElement(
                    'div'
                );

            grid.className =
                'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3';


            const sonidos =
                categoria.sonidos || [];


            sonidos.forEach(
                sonido => {

                    grid.appendChild(
                        crearTarjetaPronunciacion(
                            sonido
                        )
                    );

                }
            );


            categorySection.appendChild(
                grid
            );

            container.appendChild(
                categorySection
            );

        }
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ================================================================
// TARJETA DE PRONUNCIACIÓN
// ================================================================

function crearTarjetaPronunciacion(
    sonido
) {

    const card =
        document.createElement(
            'button'
        );

    card.type = 'button';

    card.className =
        'pronunciation-card bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm flex flex-col items-center justify-center gap-1 min-h-[105px] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 active:scale-95 transition';


    const ipaText =
        document.createElement(
            'div'
        );

    ipaText.className =
        'text-xl sm:text-2xl font-mono font-bold text-indigo-700 leading-tight text-center';

    ipaText.innerText =
        `/${sonido.ipa}/`;


    const wordText =
        document.createElement(
            'div'
        );

    wordText.className =
        'text-sm sm:text-base font-bold text-slate-800 leading-tight text-center break-words';

    wordText.innerText =
        sonido.ejemplo;


    const wordIPA =
        document.createElement(
            'div'
        );

    wordIPA.className =
        'text-[10px] sm:text-xs font-mono italic text-emerald-600 leading-tight text-center break-words';

    wordIPA.innerText =
        sonido.ejemplo_ipa || '';


    const audioIcon =
        document.createElement(
            'div'
        );

    audioIcon.className =
        'text-[10px] text-slate-400 mt-1';

    audioIcon.innerText =
        '🔊';


    card.appendChild(
        ipaText
    );

    card.appendChild(
        wordText
    );

    card.appendChild(
        wordIPA
    );

    card.appendChild(
        audioIcon
    );


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


    if (progreso.status) {
        return progreso.status;
    }


    // Compatibilidad con el sistema anterior.
    if (
        progreso.easyBox === 3 ||
        progreso.hardMastered === true
    ) {
        return 'mastered';
    }


    if (progreso.easyBox === 1) {
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
                        getCardStatus(card) === 'mastered'
                ).length;


            const incorrectas =
                tarjetasMazo.filter(
                    card =>
                        getCardStatus(card) === 'failed'
                ).length;


            const nuevas =
                tarjetasMazo.filter(
                    card =>
                        getCardStatus(card) === 'new'
                ).length;


            const porcentaje =
                total > 0
                    ? Math.round(
                        (superadas / total) * 100
                    )
                    : 0;


            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4';


            const titulo =
                nombreMazo.replace(
                    /\.txt$/i,
                    ''
                );


            card.innerHTML = `

                <div>

                    <div class="flex items-start justify-between gap-3">

                        <h3 class="font-bold text-lg text-slate-900 leading-tight">
                            ${titulo}
                        </h3>

                        <span class="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                            ${total} tarjetas
                        </span>

                    </div>

                </div>


                <div class="space-y-2">

                    <div class="flex items-center justify-between text-xs">

                        <span class="font-bold text-emerald-600">
                            🟢 ${superadas}/${total} superadas
                        </span>

                        <span class="font-semibold text-slate-500">
                            ${porcentaje}%
                        </span>

                    </div>


                    <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                        <div
                            class="h-full bg-emerald-500 rounded-full transition-all"
                            style="width: ${porcentaje}%">
                        </div>

                    </div>


                    <div class="flex items-center gap-3 text-[11px] text-slate-400">

                        <span>
                            🔴 ${incorrectas} incorrectas
                        </span>

                        <span>
                            ⚪ ${nuevas} no estudiadas
                        </span>

                    </div>

                </div>


                <div class="grid grid-cols-2 gap-2 mt-auto">

                    <button
                        class="btn-theory-mazo flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-semibold text-xs transition">

                        <i data-lucide="book-open" class="w-4 h-4"></i>

                        Teoría

                    </button>


                    <button
                        class="btn-cards-mazo flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition shadow-sm">

                        <i data-lucide="layers-3" class="w-4 h-4"></i>

                        Tarjetas

                    </button>

                </div>

            `;


            card
                .querySelector(
                    '.btn-theory-mazo'
                )
                .onclick = () => {

                    abrirTeoria(
                        nombreMazo
                    );

                };


            card
                .querySelector(
                    '.btn-cards-mazo'
                )
                .onclick = () => {

                    showStudyView(
                        nombreMazo
                    );

                };


            container.appendChild(
                card
            );

        }
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


// ================================================================
// INICIAR SESIÓN DE ESTUDIO
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
                getCardStatus(card) === 'new'
        );


    const falladas =
        cards.filter(
            card =>
                getCardStatus(card) === 'failed'
        );


    /*
     * ORDEN DE LA SESIÓN:
     *
     * 1. NO ESTUDIADA
     * 2. INCORRECTA
     *
     * Las SUPERADAS no vuelven a aparecer.
     */

    state.activeSessionCards =
        [
            ...nuevas,
            ...falladas
        ];


    state.currentCardIndex = 0;

    state.isFlipped = false;


    renderCard();

}


// ================================================================
// RENDERIZAR TARJETA ACTUAL
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

        activeContainer.classList.add(
            'hidden'
        );

        activeContainer.classList.remove(
            'flex'
        );


        emptyView.classList.remove(
            'hidden'
        );

        emptyView.classList.add(
            'flex'
        );


        renderLobby();

        return;

    }


    emptyView.classList.add(
        'hidden'
    );

    emptyView.classList.remove(
        'flex'
    );


    activeContainer.classList.remove(
        'hidden'
    );

    activeContainer.classList.add(
        'flex'
    );


    const card =
        state.activeSessionCards[
            state.currentCardIndex
        ];


    state.isFlipped = false;


    const cardInner =
        document.getElementById(
            'card-inner'
        );

    cardInner.classList.remove(
        'rotate-y-180'
    );


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
        card.ipa
            ? `/${card.ipa}/`
            : '';


    document.getElementById(
        'card-badge-deck'
    ).innerText =
        card.mazo.replace(
            /\.txt$/i,
            ''
        );


    document.getElementById(
        'card-progress-indicator'
    ).innerText =
        `${state.currentCardIndex + 1} / ${state.activeSessionCards.length}`;


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


    const status =
        getCardStatus(card);


    indicator.className =
        'font-bold px-3 py-1.5 rounded-full uppercase tracking-wide';


    if (status === 'mastered') {

        indicator.innerText =
            '🟢 SUPERADA';

        indicator.classList.add(
            'bg-emerald-100',
            'text-emerald-700'
        );


    } else if (status === 'failed') {

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

document
    .getElementById('wrapper-normal-card')
    .onclick = event => {

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


        cardInner.classList.toggle(
            'rotate-y-180',
            state.isFlipped
        );

    };


// ================================================================
// AUDIO DE TARJETA
// ================================================================

document
    .getElementById('btn-audio-speak')
    .onclick = event => {

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


// ================================================================
// RESPUESTA NORMAL
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


    /*
     * IMPORTANTE:
     *
     * No volvemos a meter la tarjeta
     * en la sesión actual.
     *
     * Si es incorrecta:
     * aparecerá en la siguiente sesión.
     *
     * Si es superada:
     * no volverá a aparecer.
     */

    state.currentCardIndex++;

    state.isFlipped = false;


    renderCard();

}


// ================================================================
// BOTÓN INCORRECTA
// ================================================================

document
    .getElementById('btn-score-wrong')
    .onclick = () => {

        responderNormal(
            'failed'
        );

    };


// ================================================================
// BOTÓN SUPERADA
// ================================================================

document
    .getElementById('btn-score-correct')
    .onclick = () => {

        responderNormal(
            'mastered'
        );

    };


// ================================================================
// OBTENER FRASE ACTUAL PARA EL MICRÓFONO
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


function cargarProgreso() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            state.cardsProgress = {};

            return;

        }


        state.cardsProgress =
            JSON.parse(saved) || {};


    } catch (error) {

        console.error(
            '❌ Error cargando progreso:',
            error
        );

        state.cardsProgress = {};

    }

}


// ================================================================
// TECLADO
// ================================================================

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Escape'
        ) {

            if (
                !theoryOverlay.classList.contains(
                    'hidden'
                )
            ) {

                closeTheory();

                return;

            }


            if (
                !pronunciationOverlay.classList.contains(
                    'hidden'
                )
            ) {

                closePronunciation();

                return;

            }

        }


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

    await cargarPronunciacion();


    inicializarMicrofonoGlobal(
        obtenerFraseTarjetaActual
    );


    if (window.lucide) {
        lucide.createIcons();
    }

}


inicializarApp();