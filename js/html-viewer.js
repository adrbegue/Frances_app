// Visor de teoría HTML: texto seleccionable, ligero y sin dependencias externas.

let zoom = 1;
let currentRequest = 0;
let initialized = false;

const byId = (id) => document.getElementById(id);

function updateZoom() {
    const frame = byId('theory-html-frame');
    const reset = byId('btn-theory-zoom-reset');
    if (reset) reset.textContent = `${Math.round(zoom * 100)}%`;
    if (!frame || !frame.contentDocument) return;
    const root = frame.contentDocument.documentElement;
    root.style.zoom = String(zoom);
    root.style.width = `${100 / zoom}%`;
}

function initialize() {
    if (initialized) return;
    initialized = true;

    byId('btn-close-theory')?.addEventListener('click', cerrarTeoria);
    byId('btn-theory-zoom-out')?.addEventListener('click', () => {
        zoom = Math.max(0.7, Number((zoom - 0.1).toFixed(1)));
        updateZoom();
    });
    byId('btn-theory-zoom-in')?.addEventListener('click', () => {
        zoom = Math.min(1.6, Number((zoom + 0.1).toFixed(1)));
        updateZoom();
    });
    byId('btn-theory-zoom-reset')?.addEventListener('click', () => {
        zoom = 1;
        updateZoom();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !byId('theory-overlay')?.classList.contains('hidden')) {
            cerrarTeoria();
        }
    });
}

function showMessage(html) {
    const container = byId('theory-html-container');
    if (container) container.innerHTML = html;
}

export async function abrirTeoria(nombreMazo) {
    if (!nombreMazo) return;
    initialize();

    const overlay = byId('theory-overlay');
    const title = byId('theory-title');
    const nombreHtml = nombreMazo.replace(/\.txt$/i, '.html');
    const ruta = `teoria/${encodeURIComponent(nombreHtml)}`;
    const requestId = ++currentRequest;

    title.textContent = nombreMazo.replace(/\.txt$/i, '');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    zoom = 1;
    showMessage('<div class="theory-html-status"><div class="theory-html-spinner"></div><strong>Cargando teoría...</strong></div>');

    try {
        const response = await fetch(new URL(ruta, window.location.href), { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        if (requestId !== currentRequest) return;

        const container = byId('theory-html-container');
        container.innerHTML = '';
        const frame = document.createElement('iframe');
        frame.id = 'theory-html-frame';
        frame.title = `Teoría: ${title.textContent}`;
        frame.srcdoc = html;
        frame.addEventListener('load', updateZoom, { once: true });
        container.appendChild(frame);
    } catch (error) {
        if (requestId !== currentRequest) return;
        console.error('Error cargando teoría HTML:', error);
        showMessage(`<div class="theory-html-status theory-html-error"><strong>No se pudo cargar la teoría.</strong><span>Comprueba que existe <code>${ruta}</code>.</span></div>`);
    }
}

export function cerrarTeoria() {
    currentRequest++;
    byId('theory-overlay')?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    const container = byId('theory-html-container');
    if (container) container.innerHTML = '';
}
