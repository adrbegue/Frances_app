// ================================================================
// js/pdf-viewer.js
// ================================================================
//
// VISOR PDF INDEPENDIENTE
//
// Este archivo NO depende de:
// - app.js
// - pronunciation.js
// - elementos HTML del index.html
//
// Se encarga exclusivamente de:
// - crear el visor
// - cargar PDF.js
// - cargar PDFs
// - renderizar páginas
// - zoom
// - cerrar
//
// ================================================================

let pdfDocument = null;

let pdfZoom = 1.0;

let pdfJsLoadingPromise = null;

let currentRenderId = 0;


// ================================================================
// CDN PDF.JS
// ================================================================

const PDF_JS_PRIMARY =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

const PDF_JS_FALLBACK =
    'https://unpkg.com/pdfjs-dist@3.11.174/legacy/build/pdf.min.js';


// ================================================================
// CREAR VISOR
// ================================================================

function crearPDFViewer() {

    if (
        document.getElementById(
            'pdf-viewer-overlay'
        )
    ) {
        return;
    }


    const style =
        document.createElement('style');


    style.id =
        'pdf-viewer-styles';


    style.textContent = `

        #pdf-viewer-overlay {
            position: fixed;
            inset: 0;
            z-index: 200;
            background: #525659;
        }


        #pdf-viewer-header {
            height: 56px;
            min-height: 56px;
            background: white;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 0 12px;
            box-sizing: border-box;
            box-shadow: 0 1px 5px rgba(0,0,0,0.12);
            position: relative;
            z-index: 10;
        }


        #pdf-viewer-title {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 700;
            font-size: 15px;
            color: #1e293b;
        }


        .pdf-viewer-header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }


        .pdf-viewer-header-right {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
        }


        .pdf-viewer-button {
            border: none;
            background: #f1f5f9;
            color: #334155;
            height: 40px;
            min-width: 40px;
            padding: 0 10px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
        }


        .pdf-viewer-button:active {
            transform: scale(0.95);
        }


        #pdf-viewer-close {
            font-size: 19px;
        }


        #pdf-viewer-zoom-reset {
            min-width: 58px;
            font-size: 12px;
        }


        #pdf-viewer-container {
            position: absolute;
            left: 0;
            right: 0;
            top: 56px;
            bottom: 0;
            overflow-y: auto;
            overflow-x: hidden;
            background: #525659;
            -webkit-overflow-scrolling: touch;
        }


        .pdf-viewer-page-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            box-sizing: border-box;
            padding: 12px;
        }


        .pdf-viewer-page {
            display: block;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.30);
            max-width: none;
        }


        .pdf-viewer-loading {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 30px;
            box-sizing: border-box;
        }


        .pdf-viewer-loading-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }


        .pdf-viewer-spinner {
            width: 42px;
            height: 42px;
            border: 4px solid rgba(255,255,255,0.30);
            border-top-color: white;
            border-radius: 50%;
            animation: pdfViewerSpin 0.8s linear infinite;
        }


        @keyframes pdfViewerSpin {
            to {
                transform: rotate(360deg);
            }
        }


        .pdf-viewer-error {
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            box-sizing: border-box;
        }


        .pdf-viewer-error-box {
            background: white;
            border-radius: 24px;
            padding: 30px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.20);
            box-sizing: border-box;
        }


        .pdf-viewer-error-icon {
            font-size: 40px;
            margin-bottom: 10px;
        }


        .pdf-viewer-error-title {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 8px;
        }


        .pdf-viewer-error-text {
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }


        @media (max-width: 640px) {

            #pdf-viewer-header {
                padding: 0 6px;
            }

            .pdf-viewer-page-wrapper {
                padding: 6px 0;
            }

            .pdf-viewer-page {
                box-shadow: none;
            }

            #pdf-viewer-title {
                font-size: 13px;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    const overlay =
        document.createElement('div');


    overlay.id =
        'pdf-viewer-overlay';


    overlay.className =
        'hidden';


    overlay.innerHTML = `

        <div
            id="pdf-viewer-header">

            <div
                class="pdf-viewer-header-left">

                <button
                    id="pdf-viewer-close"
                    class="pdf-viewer-button"
                    type="button"
                    aria-label="Cerrar">

                    ✕

                </button>


                <div
                    id="pdf-viewer-title">

                    Teoría

                </div>

            </div>


            <div
                class="pdf-viewer-header-right">

                <button
                    id="pdf-viewer-zoom-out"
                    class="pdf-viewer-button"
                    type="button"
                    aria-label="Alejar">

                    −

                </button>


                <button
                    id="pdf-viewer-zoom-reset"
                    class="pdf-viewer-button"
                    type="button">

                    100%

                </button>


                <button
                    id="pdf-viewer-zoom-in"
                    class="pdf-viewer-button"
                    type="button"
                    aria-label="Acercar">

                    +

                </button>

            </div>

        </div>


        <div
            id="pdf-viewer-container">

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    // ------------------------------------------------------------
    // EVENTOS
    // ------------------------------------------------------------

    document
        .getElementById(
            'pdf-viewer-close'
        )
        .addEventListener(
            'click',
            cerrarPDFViewer
        );


    document
        .getElementById(
            'pdf-viewer-zoom-out'
        )
        .addEventListener(
            'click',
            () => {

                cambiarZoom(
                    -0.15
                );

            }
        );


    document
        .getElementById(
            'pdf-viewer-zoom-in'
        )
        .addEventListener(
            'click',
            () => {

                cambiarZoom(
                    0.15
                );

            }
        );


    document
        .getElementById(
            'pdf-viewer-zoom-reset'
        )
        .addEventListener(
            'click',
            () => {

                establecerZoom(
                    1.0
                );

            }
        );

}


// ================================================================
// CARGAR PDF.JS
// ================================================================

function cargarPDFJS() {

    if (window.pdfjsLib) {

        return Promise.resolve(
            window.pdfjsLib
        );

    }


    if (pdfJsLoadingPromise) {

        return pdfJsLoadingPromise;

    }


    pdfJsLoadingPromise =
        new Promise(
            (resolve, reject) => {

                const script =
                    document.createElement(
                        'script'
                    );


                script.src =
                    PDF_JS_PRIMARY;


                script.async = true;


                script.onload =
                    () => {

                        if (
                            window.pdfjsLib
                        ) {

                            resolve(
                                window.pdfjsLib
                            );

                            return;

                        }


                        cargarPDFJSFallback(
                            resolve,
                            reject
                        );

                    };


                script.onerror =
                    () => {

                        cargarPDFJSFallback(
                            resolve,
                            reject
                        );

                    };


                document.head.appendChild(
                    script
                );

            }
        );


    return pdfJsLoadingPromise;

}


// ================================================================
// FALLBACK
// ================================================================

function cargarPDFJSFallback(
    resolve,
    reject
) {

    const script =
        document.createElement(
            'script'
        );


    script.src =
        PDF_JS_FALLBACK;


    script.async = true;


    script.onload =
        () => {

            if (
                window.pdfjsLib
            ) {

                resolve(
                    window.pdfjsLib
                );

            } else {

                reject(
                    new Error(
                        'PDF.js no está disponible.'
                    )
                );

            }

        };


    script.onerror =
        () => {

            reject(
                new Error(
                    'No se pudo cargar PDF.js.'
                )
            );

        };


    document.head.appendChild(
        script
    );

}


// ================================================================
// ABRIR TEORÍA
// ================================================================

export async function abrirTeoria(
    nombreMazo
) {

    if (!nombreMazo) {
        return;
    }


    crearPDFViewer();


    const overlay =
        document.getElementById(
            'pdf-viewer-overlay'
        );


    const title =
        document.getElementById(
            'pdf-viewer-title'
        );


    const container =
        document.getElementById(
            'pdf-viewer-container'
        );


    const nombrePdf =
        nombreMazo.replace(
            /\.txt$/i,
            '.pdf'
        );


    const rutaPdf =
        `teoria/${encodeURIComponent(nombrePdf)}`;


    const titulo =
        nombreMazo.replace(
            /\.txt$/i,
            ''
        );


    title.innerText =
        titulo;


    overlay.classList.remove(
        'hidden'
    );


    document.body.classList.add(
        'overflow-hidden'
    );


    pdfZoom =
        1.0;


    actualizarBotonZoom();


    currentRenderId++;


    const renderId =
        currentRenderId;


    mostrarCargando(
        container
    );


    try {

        const pdfjs =
            await cargarPDFJS();


        // --------------------------------------------------------
        // Descargar el PDF primero.
        // --------------------------------------------------------

        const url =
            new URL(
                rutaPdf,
                window.location.href
            ).href;


        const response =
            await fetch(
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


        const arrayBuffer =
            await response.arrayBuffer();


        const pdfData =
            new Uint8Array(
                arrayBuffer
            );


        // --------------------------------------------------------
        // Worker desactivado.
        // --------------------------------------------------------

        const loadingTask =
            pdfjs.getDocument({

                data: pdfData,

                disableWorker: true

            });


        pdfDocument =
            await loadingTask.promise;


        if (
            renderId !== currentRenderId
        ) {

            return;

        }


        await renderizarPDF(
            renderId
        );


    } catch (error) {

        console.error(
            '❌ Error cargando PDF:',
            error
        );


        if (
            renderId !== currentRenderId
        ) {

            return;

        }


        mostrarError(
            container,
            rutaPdf,
            error
        );

    }

}


// ================================================================
// CARGANDO
// ================================================================

function mostrarCargando(
    container
) {

    container.innerHTML = `

        <div
            class="pdf-viewer-loading">

            <div
                class="pdf-viewer-loading-box">

                <div
                    class="pdf-viewer-spinner">
                </div>

                <div>
                    Cargando teoría...
                </div>

            </div>

        </div>

    `;

}


// ================================================================
// ERROR
// ================================================================

function mostrarError(
    container,
    rutaPdf,
    error
) {

    container.innerHTML = `

        <div
            class="pdf-viewer-error">

            <div
                class="pdf-viewer-error-box">

                <div
                    class="pdf-viewer-error-icon">

                    ⚠️

                </div>


                <div
                    class="pdf-viewer-error-title">

                    No se pudo cargar la teoría

                </div>


                <div
                    class="pdf-viewer-error-text">

                    Comprueba que existe el archivo PDF
                    correspondiente en la carpeta
                    <strong>teoria/</strong>.

                    <br><br>

                    ${escapeHTML(rutaPdf)}

                </div>

            </div>

        </div>

    `;


    console.error(
        'Detalles del error:',
        error
    );

}


// ================================================================
// RENDERIZAR PDF
// ================================================================

async function renderizarPDF(
    renderId
) {

    if (!pdfDocument) {
        return;
    }


    const container =
        document.getElementById(
            'pdf-viewer-container'
        );


    if (!container) {
        return;
    }


    container.innerHTML = '';


    for (
        let pageNumber = 1;
        pageNumber <= pdfDocument.numPages;
        pageNumber++
    ) {

        if (
            renderId !== currentRenderId
        ) {

            return;

        }


        await renderizarPagina(
            pageNumber,
            container,
            renderId
        );

    }

}


// ================================================================
// RENDERIZAR PÁGINA
// ================================================================

async function renderizarPagina(
    pageNumber,
    container,
    renderId
) {

    const page =
        await pdfDocument.getPage(
            pageNumber
        );


    if (
        renderId !== currentRenderId
    ) {

        return;

    }


    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'pdf-viewer-page-wrapper';


    const canvas =
        document.createElement(
            'canvas'
        );


    canvas.className =
        'pdf-viewer-page';


    wrapper.appendChild(
        canvas
    );


    container.appendChild(
        wrapper
    );


    const baseViewport =
        page.getViewport({
            scale: 1
        });


    const availableWidth =
        Math.max(
            container.clientWidth,
            280
        );


    const horizontalPadding =
        window.innerWidth <= 640
            ? 0
            : 24;


    const fitScale =
        Math.max(
            0.1,
            (
                availableWidth -
                horizontalPadding
            ) /
            baseViewport.width
        );


    const scale =
        fitScale *
        pdfZoom;


    const viewport =
        page.getViewport({
            scale
        });


    const devicePixelRatio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    canvas.width =
        Math.floor(
            viewport.width *
            devicePixelRatio
        );


    canvas.height =
        Math.floor(
            viewport.height *
            devicePixelRatio
        );


    canvas.style.width =
        `${viewport.width}px`;


    canvas.style.height =
        `${viewport.height}px`;


    const context =
        canvas.getContext(
            '2d',
            {
                alpha: false
            }
        );


    context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0
    );


    await page.render({

        canvasContext:
            context,

        viewport:
            viewport

    }).promise;

}


// ================================================================
// ZOOM
// ================================================================

async function cambiarZoom(
    cantidad
) {

    pdfZoom =
        Math.min(
            Math.max(
                pdfZoom + cantidad,
                0.6
            ),
            2.5
        );


    actualizarBotonZoom();


    await rerenderPDF();

}


async function establecerZoom(
    zoom
) {

    pdfZoom =
        Math.min(
            Math.max(
                zoom,
                0.6
            ),
            2.5
        );


    actualizarBotonZoom();


    await rerenderPDF();

}


// ================================================================
// ACTUALIZAR ZOOM
// ================================================================

function actualizarBotonZoom() {

    const button =
        document.getElementById(
            'pdf-viewer-zoom-reset'
        );


    if (!button) {
        return;
    }


    button.innerText =
        `${Math.round(pdfZoom * 100)}%`;

}


// ================================================================
// RE-RENDERIZAR
// ================================================================

async function rerenderPDF() {

    if (!pdfDocument) {
        return;
    }


    currentRenderId++;


    const renderId =
        currentRenderId;


    await renderizarPDF(
        renderId
    );

}


// ================================================================
// CERRAR
// ================================================================

export function cerrarPDFViewer() {

    const overlay =
        document.getElementById(
            'pdf-viewer-overlay'
        );


    if (!overlay) {
        return;
    }


    currentRenderId++;


    pdfDocument =
        null;


    overlay.classList.add(
        'hidden'
    );


    document.body.classList.remove(
        'overflow-hidden'
    );


    const container =
        document.getElementById(
            'pdf-viewer-container'
        );


    if (container) {

        container.innerHTML =
            '';

    }

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


        const overlay =
            document.getElementById(
                'pdf-viewer-overlay'
            );


        if (
            overlay &&
            !overlay.classList.contains(
                'hidden'
            )
        ) {

            cerrarPDFViewer();

        }

    }
);


// ================================================================
// ESCAPAR HTML
// ================================================================

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}