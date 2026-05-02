import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const taskInstruction = document.getElementById("taskInstruction");

const wordsContainer = document.getElementById("wordsContainer");
const addWordBtn = document.getElementById("addWordBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const previewTitle = document.getElementById("previewTitle");
const previewInstruction = document.getElementById("previewInstruction");
const previewWords = document.getElementById("previewWords");

let wordIndex = 0;
const GRID_SIZE = 18;

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  if (isEditMode) {
    const task = await loadTaskForEdit();

    if (task) {
      await fillFormForEdit(task);
      setEditTitle();
    }
  } else {
    addWord();
    addWord();
  }

  updatePreview();
});

classSelect.addEventListener("change", () => loadSections(classSelect.value));
sectionSelect.addEventListener("change", () => loadLessons(sectionSelect.value));

taskTitle.addEventListener("input", updatePreview);
taskInstruction.addEventListener("input", updatePreview);
addWordBtn.addEventListener("click", addWord);
saveTaskBtn.addEventListener("click", saveTask);

async function loadTaskForEdit() {
  const { data, error } = await supabase
    .from("lesson_tasks")
    .select("*")
    .eq("id", editTaskId)
    .single();

  if (error) {
    console.error(error);
    showToast("Тапсырманы жүктеу қатесі", "error");
    return null;
  }

  return data;
}

function setEditTitle() {
  const h1 = document.querySelector("h1");
  if (h1) h1.textContent = "Кроссвордты өзгерту";

  saveTaskBtn.textContent = "Өзгерістерді сақтау";
}

async function saveTaskToDB(payload) {
  if (isEditMode) {
    const { error } = await supabase
      .from("lesson_tasks")
      .update(payload)
      .eq("id", editTaskId);

    if (error) {
      console.error(error);
      showToast(error.message, "error");
      return false;
    }

    return true;
  }

  const { error } = await supabase
    .from("lesson_tasks")
    .insert(payload);

  if (error) {
    console.error(error);
    showToast(error.message, "error");
    return false;
  }

  return true;
}

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("id", { ascending: true });

  if (error) return showToast(error.message, "error");

  classSelect.innerHTML = `<option value="">Сынып таңдаңыз</option>`;

  data.forEach(cls => {
    classSelect.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
  });
}

async function loadSections(classId) {
  sectionSelect.disabled = true;
  lessonSelect.disabled = true;

  sectionSelect.innerHTML = `<option value="">Бөлім таңдаңыз</option>`;
  lessonSelect.innerHTML = `<option value="">Алдымен бөлім таңдаңыз</option>`;

  if (!classId) return;

  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("class_id", classId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) return showToast(error.message, "error");

  sectionSelect.disabled = false;

  data.forEach(section => {
    sectionSelect.innerHTML += `<option value="${section.id}">${section.title}</option>`;
  });
}

async function loadLessons(sectionId) {
  lessonSelect.disabled = true;
  lessonSelect.innerHTML = `<option value="">Сабақ таңдаңыз</option>`;

  if (!sectionId) return;

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) return showToast(error.message, "error");

  lessonSelect.disabled = false;

  data.forEach(lesson => {
    lessonSelect.innerHTML += `<option value="${lesson.id}">${lesson.title}</option>`;
  });
}

function addWord(clueValue = "", answerValue = "") {
  wordIndex++;

  const block = document.createElement("div");
  block.className = "word-block";

  block.innerHTML = `
    <div class="word-top">
      <strong>Сөз ${wordIndex}</strong>
      <button type="button" class="remove-word-btn">Өшіру</button>
    </div>

    <label>Сұрақ / сипаттама</label>
    <textarea class="clue-input" placeholder="Мысалы: Жасушаның энергия станциясы">${clueValue}</textarea>

    <label>Жауап сөзі</label>
    <input class="answer-input" placeholder="Мысалы: митохондрия" value="${answerValue}">
  `;

  block.querySelector(".clue-input").addEventListener("input", updatePreview);
  block.querySelector(".answer-input").addEventListener("input", updatePreview);

  block.querySelector(".remove-word-btn").addEventListener("click", () => {
    block.remove();
    renumberWords();
    updatePreview();
  });

  wordsContainer.appendChild(block);
  updatePreview();
}

function renumberWords() {
  document.querySelectorAll(".word-top strong").forEach((el, index) => {
    el.textContent = `Сөз ${index + 1}`;
  });
}

function normalizeAnswer(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, "")
    .replace(/[^а-яәіңғүұқөһa-z0-9]/gi, "");
}

function collectWords() {
  const blocks = document.querySelectorAll(".word-block");

  return [...blocks]
    .map(block => {
      const clue = block.querySelector(".clue-input").value.trim();
      const answer = normalizeAnswer(block.querySelector(".answer-input").value);
      return { clue, answer };
    })
    .filter(item => item.clue && item.answer);
}

function createEmptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function canPlaceWord(grid, word, row, col, direction) {
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;

    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const current = grid[r][c];

    if (current && current !== word[i]) return false;

    if (!current) {
      if (direction === "horizontal") {
        if (r > 0 && grid[r - 1][c]) return false;
        if (r < size - 1 && grid[r + 1][c]) return false;
      } else {
        if (c > 0 && grid[r][c - 1]) return false;
        if (c < size - 1 && grid[r][c + 1]) return false;
      }
    }
  }

  const beforeR = direction === "horizontal" ? row : row - 1;
  const beforeC = direction === "horizontal" ? col - 1 : col;
  const afterR = direction === "horizontal" ? row : row + word.length;
  const afterC = direction === "horizontal" ? col + word.length : col;

  if (beforeR >= 0 && beforeC >= 0 && beforeR < size && beforeC < size && grid[beforeR][beforeC]) {
    return false;
  }

  if (afterR >= 0 && afterC >= 0 && afterR < size && afterC < size && grid[afterR][afterC]) {
    return false;
  }

  return true;
}

function placeWord(grid, word, row, col, direction) {
  for (let i = 0; i < word.length; i++) {
    const r = direction === "horizontal" ? row : row + i;
    const c = direction === "horizontal" ? col + i : col;

    grid[r][c] = word[i];
  }
}

function findBestPlacement(grid, word, placedWords) {
  let best = null;
  let bestScore = -1;

  for (const placed of placedWords) {
    for (let i = 0; i < word.answer.length; i++) {
      for (let j = 0; j < placed.answer.length; j++) {
        if (word.answer[i] !== placed.answer[j]) continue;

        const direction = placed.direction === "horizontal" ? "vertical" : "horizontal";

        let row;
        let col;

        if (direction === "vertical") {
          row = placed.row - i;
          col = placed.col + j;
        } else {
          row = placed.row + j;
          col = placed.col - i;
        }

        if (canPlaceWord(grid, word.answer, row, col, direction)) {
          const score = 10 + word.answer.length;

          if (score > bestScore) {
            bestScore = score;
            best = { row, col, direction };
          }
        }
      }
    }
  }

  return best;
}

function findFreePlace(grid, word) {
  const size = grid.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (canPlaceWord(grid, word.answer, r, c, "horizontal")) {
        return { row: r, col: c, direction: "horizontal" };
      }

      if (canPlaceWord(grid, word.answer, r, c, "vertical")) {
        return { row: r, col: c, direction: "vertical" };
      }
    }
  }

  return null;
}

function generateCrosswordLayout(rawWords) {
  const grid = createEmptyGrid(GRID_SIZE);
  const placedWords = [];
  const unplacedWords = [];

  const words = rawWords
    .map(w => ({
      clue: w.clue,
      answer: normalizeAnswer(w.answer)
    }))
    .filter(w => w.clue && w.answer)
    .sort((a, b) => b.answer.length - a.answer.length);

  if (!words.length) {
    return { grid, placedWords, unplacedWords };
  }

  const first = words[0];
  const startRow = Math.floor(GRID_SIZE / 2);
  const startCol = Math.max(0, Math.floor((GRID_SIZE - first.answer.length) / 2));

  if (canPlaceWord(grid, first.answer, startRow, startCol, "horizontal")) {
    placeWord(grid, first.answer, startRow, startCol, "horizontal");

    placedWords.push({
      ...first,
      number: 1,
      row: startRow,
      col: startCol,
      direction: "horizontal"
    });
  } else {
    unplacedWords.push(first);
  }

  for (let i = 1; i < words.length; i++) {
    const word = words[i];

    let placement = findBestPlacement(grid, word, placedWords);

    if (!placement) {
      placement = findFreePlace(grid, word);
    }

    if (placement) {
      placeWord(grid, word.answer, placement.row, placement.col, placement.direction);

      placedWords.push({
        ...word,
        number: placedWords.length + 1,
        row: placement.row,
        col: placement.col,
        direction: placement.direction
      });
    } else {
      unplacedWords.push(word);
    }
  }

  return { grid, placedWords, unplacedWords };
}

function getWordStartMap(placedWords) {
  const map = {};

  placedWords.forEach(word => {
    map[`${word.row}-${word.col}`] = word.number;
  });

  return map;
}

function renderGrid(grid, placedWords) {
  const startMap = getWordStartMap(placedWords);

  return `
    <div class="crossword-grid">
      ${grid.map((row, r) => `
        <div class="crossword-row">
          ${row.map((cell, c) => {
            const number = startMap[`${r}-${c}`] || "";

            return `
              <div class="crossword-cell ${cell ? "active" : "empty"}">
                ${cell ? `<span class="cell-number">${number}</span>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderClues(placedWords) {
  if (!placedWords.length) return "";

  return `
    <div class="crossword-clues">
      <h4>Сұрақтар</h4>
      ${placedWords.map(word => `
        <div class="clue-item">
          <b>${word.number}.</b>
          <span>${word.clue}</span>
          <small>${word.direction === "horizontal" ? "көлденең" : "тігінен"}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function updatePreview() {
  previewTitle.textContent = taskTitle.value.trim() || "Тапсырма атауы";
  previewInstruction.textContent =
    taskInstruction.value.trim() || "Нұсқаулық осы жерде шығады";

  const words = collectWords();

  if (!words.length) {
    previewWords.innerHTML = `<p class="empty-text">Сөздер осы жерде шығады</p>`;
    return;
  }

  const { grid, placedWords, unplacedWords } = generateCrosswordLayout(words);

  if (!placedWords.length) {
    previewWords.innerHTML = `<p class="empty-text">Кроссворд құру үшін сөздерді дұрыстап енгізіңіз</p>`;
    return;
  }

  previewWords.innerHTML = `
    ${renderGrid(grid, placedWords)}
    ${renderClues(placedWords)}
    ${
      unplacedWords.length
        ? `<p class="warning-text">Орналаспай қалған сөздер: ${unplacedWords.map(w => w.answer).join(", ")}</p>`
        : ""
    }
  `;
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const instruction = taskInstruction.value.trim();
  const words = collectWords();

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!instruction) return showToast("Нұсқаулық жазыңыз", "error");
  if (words.length < 2) return showToast("Кемінде 2 сөз енгізіңіз", "error");

  const { grid, placedWords, unplacedWords } = generateCrosswordLayout(words);

  if (placedWords.length < 2) {
    return showToast("Кемінде 2 сөз кроссвордқа орналасуы керек", "error");
  }

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  const payload = {
    lesson_id: Number(lessonId),
    type: "crossword",
    title,
    data: {
      instruction,
      gridSize: GRID_SIZE,
      words: placedWords,
      unplacedWords,
      grid
    },
    is_active: true
  };

  const success = await saveTaskToDB(payload);

  saveTaskBtn.disabled = false;
  saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";

  if (!success) return;

  showToast(
    isEditMode
      ? "Кроссворд тапсырмасы өзгертілді"
      : "Кроссворд тапсырмасы сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";
  taskInstruction.value = task.data?.instruction || "";

  wordsContainer.innerHTML = "";
  wordIndex = 0;

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select("id, section_id, sections(id, class_id)")
    .eq("id", task.lesson_id)
    .single();

  if (!error && lesson) {
    const classId = lesson.sections?.class_id;
    const sectionId = lesson.section_id;
    const lessonId = lesson.id;

    if (classId) {
      classSelect.value = classId;
      await loadSections(classId);
    }

    if (sectionId) {
      sectionSelect.value = sectionId;
      await loadLessons(sectionId);
    }

    if (lessonId) {
      lessonSelect.value = lessonId;
    }
  }

  const words = task.data?.words || [];

  words.forEach(w => {
    addWord(w.clue || "", w.answer || "");
  });

  if (!words.length) {
    addWord();
    addWord();
  }

  updatePreview();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}