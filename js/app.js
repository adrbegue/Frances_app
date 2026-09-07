let themesList = [];
let currentTheme = null;

// Progreso cargado desde localStorage
let userProgress = JSON.parse(localStorage.getItem('french_app_progress')) || {};

let exerciseQueue = [];
let currentExIndex = 0;

// Variables para Texto con huecos
let selectedWord = null;
let currentGapAnswers = {};
let currentGapTarget = {};

document.addEventListener('DOMContentLoaded', () => {
  loadThemes();
});

// Cargar la lista de temas desde temas.json
async function loadThemes() {
  try {
    const res = await fetch('temas.json');
    themesList = await res.json();
    
    const select = document.getElementById('select-tema');
    select.innerHTML = '';
    themesList.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      select.appendChild(opt);
    });

    if (themesList.length > 0) {
      currentTheme = themesList[0];
      loadThemeData(currentTheme);
    }
  } catch (err) {
    console.error("Error al cargar temas.json", err);
  }
}

function onTemaChange() {
  const select = document.getElementById('select-tema');
  currentTheme = select.value;
  loadThemeData(currentTheme);
}

// Cargar contenido de la subsección actual
function loadThemeData(themeName) {
  loadExercises(themeName);
  loadTheoryPdf(themeName);
  loadGapText(themeName);
}

// 1. CARGA Y MEMORIA DE EJERCICIOS
async function loadExercises(themeName) {
  try {
    const res = await fetch(`ejercicios/${themeName}.txt`);
    const rawText = await res.text();
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    
    const allEx = lines.map((line, idx) => {
      const parts = line.split('|');
      return {
        id: `${themeName}_${idx}`,
        prompt: parts[0]?.trim(),
        answer: parts[1]?.trim()
      };
    });

    // Ordenar con memoria: Primero 'unseen' o 'hard', al final 'mastered'
    exerciseQueue = allEx.sort((a, b) => {
      const statusA = userProgress[a.id]?.status || 'unseen';
      const statusB = userProgress[b.id]?.status || 'unseen';

      const weight = { 'hard': 0, 'unseen': 1, 'mastered': 2 };
      return weight[statusA] - weight[statusB];
    });

    currentExIndex = 0;
    renderCurrentExercise();
  } catch (err) {
    console.error("Error cargando ejercicios", err);
  }
}

function renderCurrentExercise() {
  if (exerciseQueue.length === 0) return;
  const ex = exerciseQueue[currentExIndex];
  
  document.getElementById('ex-counter').innerText = `Ejercicio ${currentExIndex + 1}/${exerciseQueue.length}`;
  document.getElementById('ex-prompt').innerText = ex.prompt;
  document.getElementById('ex-input').value = '';
  document.getElementById('ex-feedback').innerText = '';

  const status = userProgress[ex.id]?.status || 'Pendiente';
  const badge = document.getElementById('ex-status');
  badge.innerText = status.toUpperCase();
}

function checkExerciseAnswer() {
  const ex = exerciseQueue[currentExIndex];
  const input = document.getElementById('ex-input').value.trim();

  if (input.toLowerCase() === ex.answer.toLowerCase()) {
    document.getElementById('ex-feedback').innerText = "¡Correcto! 🎉";
    document.getElementById('ex-feedback').style.color = "green";
    userProgress[ex.id] = { status: 'mastered' };
  } else {
    document.getElementById('ex-feedback').innerText = `Incorrecto. Respuesta: ${ex.answer}`;
    document.getElementById('ex-feedback').style.color = "red";
    userProgress[ex.id] = { status: 'hard' };
  }

  localStorage.setItem('french_app_progress', JSON.stringify(userProgress));
}

function markAsHard() {
  const ex = exerciseQueue[currentExIndex];
  userProgress[ex.id] = { status: 'hard' };
  localStorage.setItem('french_app_progress', JSON.stringify(userProgress));
  renderCurrentExercise();
}

function nextExercise() {
  if (currentExIndex < exerciseQueue.length - 1) {
    currentExIndex++;
    renderCurrentExercise();
  }
}

function prevExercise() {
  if (currentExIndex > 0) {
    currentExIndex--;
    renderCurrentExercise();
  }
}

// 2. TEORÍA PDF
function loadTheoryPdf(themeName) {
  const pdfPath = `teoria/${themeName}.pdf`;
  document.getElementById('main-pdf-viewer').src = pdfPath;
  document.getElementById('embedded-pdf-viewer').src = pdfPath;
}

function toggleEmbeddedTheory() {
  const container = document.getElementById('embedded-theory-container');
  const label = document.getElementById('theory-toggle-label');
  
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    label.innerText = "Ocultar Teoría del Tema";
  } else {
    container.classList.add('hidden');
    label.innerText = "Mostrar Teoría del Tema";
  }
}

// 3. TEXTO CON HUECOS
async function loadGapText(themeName) {
  try {
    const res = await fetch(`texto/${themeName}.txt`);
    const rawText = await res.text();
    
    // Extraer huecos marcados con [[palabra]]
    const regex = /\[\[(.*?)\]\]/g;
    let words = [];
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      words.push(match[1]);
    }

    // Mezclar palabras para la barra superior
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    // Renderizar banco de palabras
    const bank = document.getElementById('word-bank');
    bank.innerHTML = '';
    shuffledWords.forEach((word, i) => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.innerText = word;
      chip.onclick = () => selectWordChip(chip, word);
      bank.appendChild(chip);
    });

    // Renderizar texto reemplazando [[...]] por huecos interactivos
    let gapIndex = 0;
    currentGapTarget = {};
    currentGapAnswers = {};

    const renderedText = rawText.replace(regex, (m, p1) => {
      const id = `gap_${gapIndex}`;
      currentGapTarget[id] = p1;
      gapIndex++;
      return `<span id="${id}" class="gap-slot" onclick="placeWordInGap('${id}')"></span>`;
    });

    document.getElementById('text-passage').innerHTML = renderedText;
    document.getElementById('texto-feedback').innerText = '';
  } catch (err) {
    console.error("Error cargando texto", err);
  }
}

function selectWordChip(element, word) {
  document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('selected'));
  element.classList.add('selected');
  selectedWord = { element, word };
}

function placeWordInGap(gapId) {
  if (!selectedWord) return;
  const gap = document.getElementById(gapId);
  gap.innerText = selectedWord.word;
  currentGapAnswers[gapId] = selectedWord.word;
  
  selectedWord.element.style.opacity = '0.3';
  selectedWord.element.style.pointerEvents = 'none';
  selectedWord = null;
}

function checkFillText() {
  let correct = true;
  Object.keys(currentGapTarget).forEach(gapId => {
    const gapEl = document.getElementById(gapId);
    if (currentGapAnswers[gapId] === currentGapTarget[gapId]) {
      gapEl.style.color = 'green';
      gapEl.style.fontWeight = 'bold';
    } else {
      gapEl.style.color = 'red';
      correct = false;
    }
  });

  const feedback = document.getElementById('texto-feedback');
  if (correct) {
    feedback.innerText = "¡Excelente! Has completado el texto correctamente.";
    feedback.style.color = "green";
  } else {
    feedback.innerText = "Hay algunos huecos incorrectos o vacíos. Revisa e inténtalo de nuevo.";
    feedback.style.color = "red";
  }
}

function resetFillText() {
  loadGapText(currentTheme);
}

// Navegación de Sub-Pestañas
function switchSubTab(tabName) {
  document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sub-section').forEach(s => s.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(`section-${tabName}`).classList.add('active');
}