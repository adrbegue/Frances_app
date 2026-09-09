// ================================================================
// js/pronunciacion.js
// ================================================================
//
// MÓDULO DE PRONUNCIACIÓN
//
// Se encarga exclusivamente de:
// - cargar datos/pronunciacion.json
// - abrir/cerrar el overlay de pronunciación
// - generar las tarjetas de sonidos
// - reproducir ejemplos mediante audio.js
//
// ================================================================

import {
    ejecutarTTS
} from './audio.js';


// ================================================================
// DATOS
// ================================================================

let pronunciationData = [];


// ================================================================
// ELEMENTOS
// ================================================================

const overlay =
    document.getElementById(
        'pronunciation-overlay'
    );

const container =
    document.getElementById(
        'pronunciation-container'
    );

const btnHeader =
    document.getElementById(
        'btn-pronunciation'
    );

const btnStudy =
    document.getElementById(
        'btn-pronunciation-study'
    );

const btnClose =
    document.getElementById(
        'btn-back-from-pronunciation'
    );


// ================================================================
// ABRIR
// ================================================================

function abrirPronunciacion() {

    if (!overlay) {

        console.error(
            '❌ No existe #pronunciation-overlay'
        );

        return;

    }


    overlay.classList.remove(
        'hidden'
    );


    document.body.classList.add(
        'overflow-hidden'
    );


    renderPronunciation();

}


// ================================================================
// CERRAR
// ================================================================

function cerrarPronunciacion() {

    if (!overlay) {
        return;
    }


    overlay.classList.add(
        'hidden'
    );


    document.body.classList.remove(
        'overflow-hidden'
    );

}


// ================================================================
// CARGAR JSON
// ================================================================

async function cargarPronunciacion() {

    try {

        const response =
            await fetch(
                'datos/pronunciacion.json',
                {
                    cache: 'no-store'
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        pronunciationData =
            await response.json();


    } catch (error) {

        console.error(
            '❌ Error cargando pronunciacion.json:',
            error
        );


        pronunciationData =
            [];

    }

}


// ================================================================
// RENDER
// ================================================================

function renderPronunciation() {

    if (!container) {
        return;
    }


    container.innerHTML =
        '';


    if (
        !pronunciationData.length
    ) {

        container.innerHTML = `

            <div
                class="bg-white rounded-3xl
                       border border-red-200
                       p-8 text-center">

                <div
                    class="text-4xl mb-3">

                    ⚠️

                </div>


                <h3
                    class="font-bold text-slate-900 mb-2">

                    No se ha podido cargar la fonética

                </h3>


                <p
                    class="text-sm text-slate-500">

                    Comprueba que existe

                    <span class="font-mono">
                        datos/pronunciacion.json
                    </span>

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


            // ----------------------------------------------------
            // CABECERA
            // ----------------------------------------------------

            const categoryHeader =
                document.createElement(
                    'div'
                );


            categoryHeader.innerHTML = `

                <div
                    class="flex items-center gap-3 mb-1">

                    <div
                        class="h-px flex-1
                               bg-slate-300">
                    </div>


                    <h3
                        class="text-base sm:text-lg
                               font-bold uppercase
                               tracking-wider
                               text-slate-700
                               whitespace-nowrap">

                        ${escapeHTML(
                            categoria.nombre || ''
                        )}

                    </h3>


                    <div
                        class="h-px flex-1
                               bg-slate-300">
                    </div>

                </div>


                ${
                    categoria.descripcion
                        ? `
                            <p
                                class="text-center
                                       text-xs sm:text-sm
                                       text-slate-400
                                       mb-2">

                                ${escapeHTML(
                                    categoria.descripcion
                                )}

                            </p>
                        `
                        : ''
                }

            `;


            categorySection.appendChild(
                categoryHeader
            );


            // ----------------------------------------------------
            // GRID
            // ----------------------------------------------------

            const grid =
                document.createElement(
                    'div'
                );


            grid.className =
                'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3';


            const sonidos =
                Array.isArray(
                    categoria.sonidos
                )
                    ? categoria.sonidos
                    : [];


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
// CREAR TARJETA
// ================================================================

function crearTarjetaPronunciacion(
    sonido
) {

    const card =
        document.createElement(
            'button'
        );


    card.type =
        'button';


    card.className =
        'pronunciation-card bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm flex flex-col items-center justify-center gap-1 min-h-[105px] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 active:scale-95 transition';


    // ------------------------------------------------------------
    // IPA
    // ------------------------------------------------------------

    const ipaText =
        document.createElement(
            'div'
        );


    ipaText.className =
        'text-xl sm:text-2xl font-mono font-bold text-indigo-700 leading-tight text-center';


    ipaText.innerText =
        `/${sonido.ipa || ''}/`;


    // ------------------------------------------------------------
    // EJEMPLO
    // ------------------------------------------------------------

    const wordText =
        document.createElement(
            'div'
        );


    wordText.className =
        'text-sm sm:text-base font-bold text-slate-800 leading-tight text-center break-words';


    wordText.innerText =
        sonido.ejemplo || '';


    // ------------------------------------------------------------
    // IPA EJEMPLO
    // ------------------------------------------------------------

    const wordIPA =
        document.createElement(
            'div'
        );


    wordIPA.className =
        'text-[10px] sm:text-xs font-mono italic text-emerald-600 leading-tight text-center break-words';


    wordIPA.innerText =
        sonido.ejemplo_ipa || '';


    // ------------------------------------------------------------
    // ICONO
    // ------------------------------------------------------------

    const audioIcon =
        document.createElement(
            'div'
        );


    audioIcon.className =
        'text-[10px] text-slate-400 mt-1';


    audioIcon.innerText =
        '🔊';


    // ------------------------------------------------------------
    // MONTAR
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // REPRODUCIR
    // ------------------------------------------------------------

    card.addEventListener(
        'click',
        () => {

            if (
                !sonido.ejemplo
            ) {
                return;
            }


            ejecutarTTS(
                sonido.ejemplo
            );

        }
    );


    return card;

}


// ================================================================
// EVENTOS
// ================================================================

if (btnHeader) {

    btnHeader.addEventListener(
        'click',
        abrirPronunciacion
    );

}


if (btnStudy) {

    btnStudy.addEventListener(
        'click',
        abrirPronunciacion
    );

}


if (btnClose) {

    btnClose.addEventListener(
        'click',
        cerrarPronunciacion
    );

}


// ================================================================
// ESCAPE
// ================================================================

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key !== 'Escape'
        ) {
            return;
        }


        if (
            overlay &&
            !overlay.classList.contains(
                'hidden'
            )
        ) {

            cerrarPronunciacion();

        }

    }
);


// ================================================================
// INICIALIZACIÓN PÚBLICA
// ================================================================

export async function inicializarPronunciacion() {

    await cargarPronunciacion();

}