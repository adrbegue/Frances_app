// ================================================================
// js/pronunciacion.js
// ================================================================

import { ejecutarTTS } from './audio.js';


// ================================================================
// VARIABLES
// ================================================================

let pronunciationData = null;
let dataPromise = null;
let initialized = false;


// ================================================================
// OBTENER ELEMENTOS DEL DOM
// ================================================================

function getElements() {

    return {
        overlay: document.getElementById('pronunciation-overlay'),
        container: document.getElementById('pronunciation-container'),
        btnHeader: document.getElementById('btn-pronunciation'),
        btnStudy: document.getElementById('btn-pronunciation-study'),
        btnClose: document.getElementById('btn-back-from-pronunciation')
    };

}


// ================================================================
// ESCAPAR HTML
// ================================================================

function escapeHTML(text) {

    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ================================================================
// CARGAR DATOS
// ================================================================

async function cargarPronunciacion() {

    // Si ya están cargados, no volvemos a hacer fetch.
    if (Array.isArray(pronunciationData)) {
        return pronunciationData;
    }

    // Si ya hay una petición en curso, esperamos esa misma.
    if (dataPromise) {
        return dataPromise;
    }

    dataPromise = (async () => {

        try {

            /*
             * Usamos import.meta.url para que funcione correctamente
             * también si la aplicación está publicada en una subcarpeta
             * de GitHub Pages.
             */
            const url = new URL(
                '../datos/pronunciacion.json',
                import.meta.url
            );

            const response = await fetch(
                url,
                {
                    cache: 'no-store'
                }
            );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }

            const data = await response.json();

            if (!Array.isArray(data)) {

                throw new Error(
                    'El JSON no contiene una lista de categorías.'
                );

            }

            pronunciationData = data;

            return pronunciationData;

        } catch (error) {

            console.error(
                'Error cargando pronunciacion.json:',
                error
            );

            pronunciationData = null;

            throw error;

        } finally {

            dataPromise = null;

        }

    })();

    return dataPromise;

}


// ================================================================
// MOSTRAR CARGANDO
// ================================================================

function mostrarCargando() {

    const { container } = getElements();

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="flex flex-col items-center justify-center
                    min-h-[300px] text-slate-400 gap-3">

            <div class="text-4xl">
                🔊
            </div>

            <p class="text-sm font-medium">
                Cargando pronunciación...
            </p>

        </div>

    `;

}


// ================================================================
// MOSTRAR ERROR
// ================================================================

function mostrarError(error) {

    const { container } = getElements();

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="max-w-xl mx-auto
                    bg-white
                    border border-red-200
                    rounded-2xl
                    shadow-sm
                    p-6
                    text-center">

            <div class="text-4xl mb-3">
                ⚠️
            </div>

            <h3 class="text-lg font-bold text-slate-800 mb-2">
                No se pudo cargar la pronunciación
            </h3>

            <p class="text-sm text-slate-500 mb-4">
                Comprueba que existe el archivo
                <strong>datos/pronunciacion.json</strong>.
            </p>

            <div class="text-xs font-mono
                        bg-red-50
                        text-red-600
                        rounded-lg
                        p-3
                        break-words">

                ${escapeHTML(
                    error?.message || 'Error desconocido'
                )}

            </div>

            <button
                id="btn-retry-pronunciation"
                type="button"
                class="mt-5
                       px-4 py-2
                       rounded-xl
                       bg-indigo-600
                       hover:bg-indigo-700
                       text-white
                       text-sm
                       font-semibold">

                Reintentar

            </button>

        </div>

    `;


    const retry =
        document.getElementById(
            'btn-retry-pronunciation'
        );


    if (retry) {

        retry.addEventListener(
            'click',
            async () => {

                pronunciationData = null;
                dataPromise = null;

                mostrarCargando();

                try {

                    await cargarPronunciacion();
                    renderPronunciation();

                } catch (err) {

                    mostrarError(err);

                }

            }
        );

    }

}


// ================================================================
// RENDER PRINCIPAL
// ================================================================

function renderPronunciation() {

    const { container } = getElements();

    if (!container) {

        console.error(
            'No existe #pronunciation-container en index.html'
        );

        return;

    }


    container.innerHTML = '';


    if (
        !Array.isArray(pronunciationData) ||
        pronunciationData.length === 0
    ) {

        container.innerHTML = `

            <div class="max-w-xl mx-auto
                        bg-white
                        border border-slate-200
                        rounded-2xl
                        p-6
                        text-center">

                <div class="text-4xl mb-3">
                    📭
                </div>

                <h3 class="font-bold text-slate-800 mb-2">
                    No hay datos de pronunciación
                </h3>

                <p class="text-sm text-slate-500">
                    El archivo de pronunciación está vacío.
                </p>

            </div>

        `;

        return;

    }


    pronunciationData.forEach(
        (categoria, index) => {

            const section =
                crearCategoria(
                    categoria,
                    index
                );

            container.appendChild(
                section
            );

        }
    );


    // Actualizar iconos Lucide si existen.
    if (window.lucide) {
        window.lucide.createIcons();
    }

}


// ================================================================
// CREAR CATEGORÍA
// ================================================================

function crearCategoria(
    categoria,
    index
) {

    const section =
        document.createElement('section');

    section.className =
        'mb-8';


    // ------------------------------------------------------------
    // TÍTULO
    // ------------------------------------------------------------

    const header =
        document.createElement('div');

    header.className =
        'mb-4';


    header.innerHTML = `

        <div class="flex items-center gap-3">

            <div class="h-px bg-slate-300 flex-1"></div>

            <h3 class="text-base sm:text-lg
                       font-bold
                       uppercase
                       tracking-wider
                       text-slate-700
                       text-center">

                ${escapeHTML(
                    categoria?.nombre ||
                    `Categoría ${index + 1}`
                )}

            </h3>

            <div class="h-px bg-slate-300 flex-1"></div>

        </div>

        ${
            categoria?.descripcion
                ? `
                    <p class="text-xs sm:text-sm
                              text-slate-400
                              text-center
                              mt-2">

                        ${escapeHTML(
                            categoria.descripcion
                        )}

                    </p>
                  `
                : ''
        }

    `;


    section.appendChild(
        header
    );


    // ------------------------------------------------------------
    // GRID
    // ------------------------------------------------------------

    const grid =
        document.createElement('div');

    grid.className =
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3';


    const sonidos =
        Array.isArray(categoria?.sonidos)
            ? categoria.sonidos
            : [];


    if (sonidos.length === 0) {

        const empty =
            document.createElement('div');

        empty.className =
            'col-span-full text-center text-sm text-slate-400 py-4';

        empty.textContent =
            'No hay sonidos en esta categoría.';

        grid.appendChild(
            empty
        );

    } else {

        sonidos.forEach(
            sonido => {

                grid.appendChild(
                    crearTarjetaSonido(
                        sonido
                    )
                );

            }
        );

    }


    section.appendChild(
        grid
    );


    return section;

}


// ================================================================
// CREAR TARJETA DE SONIDO
// ================================================================

function crearTarjetaSonido(
    sonido
) {

    const button =
        document.createElement('button');


    button.type =
        'button';


    button.className =
        'w-full min-h-[120px] ' +
        'bg-white ' +
        'border border-slate-200 ' +
        'rounded-2xl ' +
        'shadow-sm ' +
        'px-3 py-3 ' +
        'flex flex-col ' +
        'items-center ' +
        'justify-center ' +
        'gap-1 ' +
        'transition ' +
        'hover:border-indigo-300 ' +
        'hover:bg-indigo-50 ' +
        'active:scale-95';


    // ------------------------------------------------------------
    // IPA DEL SONIDO
    // ------------------------------------------------------------

    const ipa =
        document.createElement('div');

    ipa.className =
        'text-xl sm:text-2xl font-mono font-bold text-indigo-700';

    ipa.textContent =
        `/${sonido?.ipa || ''}/`;


    // ------------------------------------------------------------
    // EJEMPLO
    // ------------------------------------------------------------

    const ejemplo =
        document.createElement('div');

    ejemplo.className =
        'text-sm sm:text-base font-bold text-slate-800';

    ejemplo.textContent =
        sonido?.ejemplo || '';


    // ------------------------------------------------------------
    // IPA DEL EJEMPLO
    // ------------------------------------------------------------

    const ejemploIPA =
        document.createElement('div');

    ejemploIPA.className =
        'text-[10px] sm:text-xs font-mono italic text-emerald-600';

    ejemploIPA.textContent =
        sonido?.ejemplo_ipa || '';


    // ------------------------------------------------------------
    // ICONO AUDIO
    // ------------------------------------------------------------

    const audio =
        document.createElement('div');

    audio.className =
        'text-xs text-slate-400 mt-1';

    audio.textContent =
        '🔊';


    // ------------------------------------------------------------
    // MONTAR TARJETA
    // ------------------------------------------------------------

    button.appendChild(
        ipa
    );

    button.appendChild(
        ejemplo
    );

    button.appendChild(
        ejemploIPA
    );

    button.appendChild(
        audio
    );


    // ------------------------------------------------------------
    // REPRODUCIR EJEMPLO
    // ------------------------------------------------------------

    button.addEventListener(
        'click',
        () => {

            const texto =
                sonido?.ejemplo;

            if (!texto) {
                return;
            }

            try {

                // Reproduce la palabra/frase completa.
                ejecutarTTS(
                    texto
                );

            } catch (error) {

                console.error(
                    'Error reproduciendo audio:',
                    error
                );

            }

        }
    );


    return button;

}


// ================================================================
// ABRIR PRONUNCIACIÓN
// ================================================================

export async function abrirPronunciacion() {

    const {
        overlay,
        container
    } = getElements();


    if (!overlay) {

        console.error(
            'No existe #pronunciation-overlay en index.html'
        );

        return;

    }


    // ------------------------------------------------------------
    // MOSTRAR OVERLAY
    // ------------------------------------------------------------

    overlay.classList.remove(
        'hidden'
    );


    // Evita que la página de fondo haga scroll.
    document.body.classList.add(
        'overflow-hidden'
    );


    // ------------------------------------------------------------
    // MOSTRAR CARGANDO
    // ------------------------------------------------------------

    if (
        !Array.isArray(
            pronunciationData
        )
    ) {

        if (container) {
            mostrarCargando();
        }


        try {

            await cargarPronunciacion();

            renderPronunciation();

        } catch (error) {

            mostrarError(
                error
            );

        }

    } else {

        renderPronunciation();

    }

}


// ================================================================
// CERRAR PRONUNCIACIÓN
// ================================================================

export function cerrarPronunciacion() {

    const {
        overlay
    } = getElements();


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
// INICIALIZAR
// ================================================================

export function inicializarPronunciacion() {

    if (initialized) {
        return;
    }


    initialized =
        true;


    const {
        btnHeader,
        btnStudy,
        btnClose
    } = getElements();


    // ------------------------------------------------------------
    // BOTÓN PRONUNCIACIÓN DEL HEADER
    // ------------------------------------------------------------

    if (btnHeader) {

        btnHeader.addEventListener(
            'click',
            event => {

                event.preventDefault();

                abrirPronunciacion();

            }
        );

    }


    // ------------------------------------------------------------
    // BOTÓN PRONUNCIACIÓN DURANTE EL ESTUDIO
    // ------------------------------------------------------------

    if (btnStudy) {

        btnStudy.addEventListener(
            'click',
            event => {

                event.preventDefault();

                abrirPronunciacion();

            }
        );

    }


    // ------------------------------------------------------------
    // BOTÓN VOLVER DEL OVERLAY
    // ------------------------------------------------------------

    if (btnClose) {

        btnClose.addEventListener(
            'click',
            event => {

                event.preventDefault();
                event.stopPropagation();

                cerrarPronunciacion();

            }
        );

    }


    // ------------------------------------------------------------
    // TECLA ESCAPE
    // ------------------------------------------------------------

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key !== 'Escape'
            ) {
                return;
            }


            const {
                overlay
            } = getElements();


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


    // ------------------------------------------------------------
    // PRE-CARGAR DATOS
    // ------------------------------------------------------------
    //
    // Esto hace que cuando el usuario abra pronunciación,
    // normalmente los datos ya estén disponibles.
    //
    // Si falla, NO mostramos ningún error todavía porque el
    // usuario aún no ha abierto la ventana.
    // ------------------------------------------------------------

    cargarPronunciacion()
        .catch(
            error => {

                console.warn(
                    'No se pudo precargar pronunciacion.json:',
                    error
                );

            }
        );

}


// ================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ================================================================

if (
    document.readyState === 'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        inicializarPronunciacion,
        {
            once: true
        }
    );

} else {

    inicializarPronunciacion();

}