let themesList = [];
let currentTheme = null;
let userProgress = JSON.parse(localStorage.getItem('french_app_progress')) || {};
let exerciseQueue = [];
let currentExIndex = 0;
let selectedWord = null;
let currentGapAnswers = {};
let currentGapTarget = {};

document.addEventListener('DOMContentLoaded', () => {
  loadThemes();
});

async function loadThemes() {
  try {
    const res = await fetch('temas.json');
    if (!res.ok) throw new Error("No se pudo cargar temas.json");
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
    alert("Error crítico: No se pueden leer los archivos locales. Si estás abriendo el index.html con doble clic, debes usar un servidor local (ej. python -m http.server).");
  }
}

function onTemaChange() {
  currentTheme = document.getElementById('select-tema').value;
  loadThemeData(currentTheme);
}

function loadThemeData(themeName) {
  loadExercises(themeName);
  loadTheoryTxt(themeName);
  loadGapText(themeName);
}

async function loadExercises(themeName) {
  try {
    const res = await fetch(`ejercicios/${themeName}.txt`);
    if (!res.ok) return;
    const rawText = await res.text();
    const lines = rawText.split('\n').filter(l => l.trim() !== '');
    
    const allEx = lines.map((line, idx) => {
      let parts = line.split('|');
      return {
        id: `${themeName}_${idx}`,
        prompt: parts[0]?.trim() || line,
        answer: parts[1]?.trim() || ""
      };
    });

    exerciseQueue = allEx.sort((a, b) => {
      const w = { 'hard': 0, 'unseen': 1, 'mastered': 2 };
      const statA = userProgress[a.id]?.status || 'unseen';
      const statB = userProgress[b.id]?.status || 'unseen';
      return w[statA] - w[statB];
    });

    currentExIndex = 0;
    renderCurrentExercise();
  } catch (err) { console.error("Error ejercicios:", err); }
}

function renderCurrentExercise() {
  if (exerciseQueue.length === 0) return;
  const ex = exerciseQueue[currentExIndex];
  document.getElementById('ex-counter').innerText = `${currentExIndex + 1}/${exerciseQueue.length}`;
  document.getElementById('ex-prompt').innerText = ex.prompt;
  document.getElementById('ex-input').value = '';
  document.getElementById('ex-feedback').innerText = '';
  document.getElementById('ex-status').innerText = (userProgress[ex.id]?.status || 'Pendiente').toUpperCase();
}

function checkExerciseAnswer() {
  const ex = exerciseQueue[currentExIndex];
  const input = document.getElementById('ex-input').value.trim();
  const feedback = document.getElementById('ex-feedback');

  if (input.toLowerCase() === ex.answer.toLowerCase()) {
    feedback.innerText = "¡Correcto!";
    feedback.style.color = "green";
    userProgress[ex.id] = { status: 'mastered' };
  } else {
    feedback.innerText = `Incorrecto. Respuesta: ${ex.answer}`;
    feedback.style.color = "red";
    userProgress[ex.id] = { status: 'hard' };
  }
  localStorage.setItem('french_app_progress', JSON.stringify(userProgress));
}

function markAsHard() {
  userProgress[exerciseQueue[currentExIndex].id] = { status: 'hard' };
  localStorage.setItem('french_app_progress', JSON.stringify(userProgress));
  renderCurrentExercise();
}

function nextExercise() { if (currentExIndex < exerciseQueue.length - 1) { currentExIndex++; renderCurrentExercise(); } }
function prevExercise() { if (currentExIndex > 0) { currentExIndex--; renderCurrentExercise(); } }

async function loadTheoryTxt(themeName) {
  try {
    const res = await fetch(`teoria/${themeName}.txt`);
    const text = res.ok ? await res.text() : "No hay teoría para este tema.";
    document.getElementById('main-theory-text').innerText = text;
    document.getElementById('embedded-theory-text').innerText = text;
  } catch (err) {}
}

function toggleEmbeddedTheory() {
  document.getElementById('embedded-theory-container').classList.toggle('hidden');
}

async function loadGapText(themeName) {
  try {
    const res = await fetch(`texto/${themeName}.txt`);
    if (!res.ok) return;
    const rawText = await res.text();
    
    const regex = /\[\[(.*?)\]\]/g;
    let words = [];
    let match;
    while ((match = regex.exec(rawText)) !== null) words.push(match[1]);

    const bank = document.getElementById('word-bank');
    bank.innerHTML = '';
    [...words].sort(() => Math.random() - 0.5).forEach((word) => {
      const chip = document.createElement('span');
      chip.className = 'word-chip';
      chip.innerText = word;
      chip.onclick = () => {
        document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedWord = { element: chip, word };
      };
      bank.appendChild(chip);
    });

    let gapIndex = 0;
    currentGapTarget = {};
    currentGapAnswers = {};

    document.getElementById('text-passage').innerHTML = rawText.replace(regex, (m, p1) => {
      const id = `gap_${gapIndex}`;
      currentGapTarget[id] = p1;
      gapIndex++;
      return `<span id="${id}" class="gap-slot" onclick="placeWordInGap('${id}')"></span>`;
    });
  } catch (err) {}
}

function placeWordInGap(gapId) {
  if (!selectedWord) return;
  const gap = document.getElementById(gapId);
  gap.innerText = selectedWord.word;
  currentGapAnswers[gapId] = selectedWord.word;
  selectedWord.element.style.display = 'none';
  selectedWord = null;
}

function checkFillText() {
  Object.keys(currentGapTarget).forEach(gapId => {
    const gapEl = document.getElementById(gapId);
    gapEl.style.color = (currentGapAnswers[gapId] === currentGapTarget[gapId]) ? 'green' : 'red';
  });
}

function switchSubTab(tabName, evt) {
  document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.sub-section').forEach(s => s.classList.remove('active'));
  if (evt) evt.target.classList.add('active');
  document.getElementById(`section-${tabName}`).classList.add('active');
}