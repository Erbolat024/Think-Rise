import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const taskInstruction = document.getElementById("taskInstruction");
const pairsContainer = document.getElementById("pairsContainer");
const addPairBtn = document.getElementById("addPairBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const previewTitle = document.getElementById("previewTitle");
const previewInstruction = document.getElementById("previewInstruction");
const previewPairs = document.getElementById("previewPairs");

let pairIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  if (isEditMode) {
    const task = await loadTaskForEdit();

    if (task) {
      await fillFormForEdit(task);
      setEditTitle();
    }
  } else {
    addPair();
    addPair();
  }

  updatePreview();
});

classSelect.addEventListener("change", () => {
  loadSections(classSelect.value);
});

sectionSelect.addEventListener("change", () => {
  loadLessons(sectionSelect.value);
});

taskTitle.addEventListener("input", updatePreview);
taskInstruction.addEventListener("input", updatePreview);
addPairBtn.addEventListener("click", () => addPair());
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
  if (h1) h1.textContent = "Сәйкестендіру тапсырмасын өзгерту";

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

function addPair(leftValue = "", rightValue = "") {
  pairIndex++;

  const row = document.createElement("div");
  row.className = "pair-row";

  row.innerHTML = `
    <div class="pair-number">${pairIndex}</div>

    <input class="left-input" placeholder="Ұғым / сұрақ" value="${leftValue}">

    <input class="right-input" placeholder="Жауап / сәйкесі" value="${rightValue}">

    <button type="button" class="remove-pair-btn">×</button>
  `;

  row.querySelector(".left-input").addEventListener("input", updatePreview);
  row.querySelector(".right-input").addEventListener("input", updatePreview);

  row.querySelector(".remove-pair-btn").addEventListener("click", () => {
    row.remove();
    renumberPairs();
    updatePreview();
  });

  pairsContainer.appendChild(row);
  updatePreview();
}

function renumberPairs() {
  document.querySelectorAll(".pair-number").forEach((el, index) => {
    el.textContent = index + 1;
  });

  pairIndex = document.querySelectorAll(".pair-row").length;
}

function collectPairs() {
  const rows = document.querySelectorAll(".pair-row");

  return [...rows]
    .map(row => {
      const left = row.querySelector(".left-input").value.trim();
      const right = row.querySelector(".right-input").value.trim();

      return { left, right };
    })
    .filter(item => item.left && item.right);
}

function updatePreview() {
  previewTitle.textContent = taskTitle.value.trim() || "Тапсырма атауы";
  previewInstruction.textContent =
    taskInstruction.value.trim() || "Нұсқаулық осы жерде шығады";

  const pairs = collectPairs();

  previewPairs.innerHTML = "";

  if (!pairs.length) {
    previewPairs.innerHTML = `
      <div class="preview-empty">Ұғымдар осы жерде шығады</div>
    `;
    return;
  }

  pairs.forEach(pair => {
    previewPairs.innerHTML += `
      <div class="preview-cell">${pair.left}</div>
      <div class="preview-cell">${pair.right}</div>
    `;
  });
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const instruction = taskInstruction.value.trim();
  const pairs = collectPairs();

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!instruction) return showToast("Нұсқаулық жазыңыз", "error");
  if (pairs.length < 2) return showToast("Кемінде 2 жұп енгізіңіз", "error");

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  const payload = {
    lesson_id: Number(lessonId),
    type: "matching",
    title,
    data: {
      instruction,
      pairs
    },
    is_active: true
  };

  const success = await saveTaskToDB(payload);

  saveTaskBtn.disabled = false;
  saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";

  if (!success) return;

  showToast(
    isEditMode
      ? "Сәйкестендіру тапсырмасы өзгертілді"
      : "Сәйкестендіру тапсырмасы сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";
  taskInstruction.value = task.data?.instruction || "";

  pairsContainer.innerHTML = "";
  pairIndex = 0;

  const pairs = task.data?.pairs || [];

  pairs.forEach(pair => {
    addPair(pair.left || "", pair.right || "");
  });

  if (!pairs.length) {
    addPair();
    addPair();
  }

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