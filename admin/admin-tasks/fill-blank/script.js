import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const taskText = document.getElementById("taskText");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const previewTitle = document.getElementById("previewTitle");
const previewText = document.getElementById("previewText");
const answersList = document.getElementById("answersList");

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  if (isEditMode) {
    const task = await loadTaskForEdit();

    if (task) {
      await fillFormForEdit(task);
      setEditTitle();
    }
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
taskText.addEventListener("input", updatePreview);
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
  if (h1) h1.textContent = "Бос орынды толтыру тапсырмасын өзгерту";

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
    classSelect.innerHTML += `
      <option value="${cls.id}">${cls.name}</option>
    `;
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
    sectionSelect.innerHTML += `
      <option value="${section.id}">${section.title}</option>
    `;
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
    lessonSelect.innerHTML += `
      <option value="${lesson.id}">${lesson.title}</option>
    `;
  });
}

function extractAnswers(text) {
  return [...text.matchAll(/\{(.*?)\}/g)]
    .map(match => match[1].trim())
    .filter(Boolean);
}

function buildPreviewHtml(text) {
  if (!text.trim()) {
    return "Мәтін осы жерде шығады";
  }

  return text.replace(/\{(.*?)\}/g, () => {
    return `<input class="blank-input" placeholder="Жауап">`;
  });
}

function updatePreview() {
  const title = taskTitle.value.trim();
  const text = taskText.value;

  previewTitle.textContent = title || "Тапсырма атауы";
  previewText.innerHTML = buildPreviewHtml(text);

  const answers = extractAnswers(text);

  if (!answers.length) {
    answersList.innerHTML = `
      <p class="empty-text">Әзірге бос орын белгіленбеді. Мысалы: {ядро}</p>
    `;
    return;
  }

  answersList.innerHTML = `
    <h4>Дұрыс жауаптар:</h4>
    <div>
      ${answers.map(answer => `
        <span class="answer-chip">${answer}</span>
      `).join("")}
    </div>
  `;
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const text = taskText.value.trim();
  const answers = extractAnswers(text);

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!text) return showToast("Мәтінді жазыңыз", "error");
  if (!answers.length) return showToast("Кемінде 1 бос орын белгілеңіз: {жауап}", "error");

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  const payload = {
    lesson_id: Number(lessonId),
    type: "fill_blank",
    title,
    data: {
      text,
      answers
    },
    is_active: true
  };

  const success = await saveTaskToDB(payload);

  saveTaskBtn.disabled = false;
  saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";

  if (!success) return;

  showToast(
    isEditMode
      ? "Бос орынды толтыру тапсырмасы өзгертілді"
      : "Бос орынды толтыру тапсырмасы сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";
  taskText.value = task.data?.text || "";

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