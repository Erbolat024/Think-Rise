import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const taskInstruction = document.getElementById("taskInstruction");
const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const previewTitle = document.getElementById("previewTitle");
const previewInstruction = document.getElementById("previewInstruction");
const previewQuestions = document.getElementById("previewQuestions");

let questionIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  if (isEditMode) {
    const task = await loadTaskForEdit();

    if (task) {
      await fillFormForEdit(task);
      setEditTitle();
    }
  } else {
    addQuestion();
  }

  updatePreview();
});

classSelect.addEventListener("change", () => loadSections(classSelect.value));
sectionSelect.addEventListener("change", () => loadLessons(sectionSelect.value));

taskTitle.addEventListener("input", updatePreview);
taskInstruction.addEventListener("input", updatePreview);
addQuestionBtn.addEventListener("click", () => addQuestion());
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
  if (h1) h1.textContent = "Тест тапсырмасын өзгерту";

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

function addQuestion(questionValue = "", optionsValue = ["", "", "", ""], correctIndexValue = 0) {
  questionIndex++;

  const block = document.createElement("div");
  block.className = "quiz-question-block";

  const options = [...optionsValue];

  while (options.length < 4) {
    options.push("");
  }

  block.innerHTML = `
    <div class="question-top">
      <strong>Сұрақ ${questionIndex}</strong>
      <button type="button" class="remove-question-btn">Өшіру</button>
    </div>

    <textarea class="question-input" placeholder="Сұрақ мәтінін жазыңыз">${questionValue}</textarea>

    <div class="options-list">
      ${[0, 1, 2, 3].map(i => `
        <div class="option-row">
          <input type="radio" name="correct_${questionIndex}" value="${i}" ${Number(correctIndexValue) === i ? "checked" : ""}>
          <input class="option-input" placeholder="${i + 1}-нұсқа" value="${options[i] || ""}">
        </div>
      `).join("")}
    </div>
  `;

  block.querySelector(".question-input").addEventListener("input", updatePreview);

  block.querySelectorAll(".option-input").forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  block.querySelectorAll("input[type='radio']").forEach(radio => {
    radio.addEventListener("change", updatePreview);
  });

  block.querySelector(".remove-question-btn").addEventListener("click", () => {
    block.remove();
    renumberQuestions();
    updatePreview();
  });

  questionsContainer.appendChild(block);
  updatePreview();
}

function renumberQuestions() {
  const blocks = document.querySelectorAll(".quiz-question-block");

  blocks.forEach((block, index) => {
    block.querySelector(".question-top strong").textContent = `Сұрақ ${index + 1}`;

    block.querySelectorAll("input[type='radio']").forEach(radio => {
      radio.name = `correct_${index + 1}`;
    });
  });

  questionIndex = blocks.length;
}

function collectQuestions() {
  const blocks = document.querySelectorAll(".quiz-question-block");

  return [...blocks]
    .map(block => {
      const question = block.querySelector(".question-input").value.trim();

      const options = [...block.querySelectorAll(".option-input")]
        .map(input => input.value.trim());

      const checkedRadio = block.querySelector("input[type='radio']:checked");
      const correctIndex = checkedRadio ? Number(checkedRadio.value) : 0;

      return {
        question,
        options,
        correctIndex
      };
    })
    .filter(item => {
      const filledOptions = item.options.filter(Boolean);
      return item.question && filledOptions.length >= 2 && item.options[item.correctIndex];
    });
}

function updatePreview() {
  previewTitle.textContent = taskTitle.value.trim() || "Тапсырма атауы";
  previewInstruction.textContent =
    taskInstruction.value.trim() || "Нұсқаулық осы жерде шығады";

  const questions = collectQuestions();

  if (!questions.length) {
    previewQuestions.innerHTML = `<p class="empty-text">Сұрақтар осы жерде шығады</p>`;
    return;
  }

  previewQuestions.innerHTML = "";

  questions.forEach((q, qIndex) => {
    const optionsHtml = q.options
      .filter(Boolean)
      .map((option, index) => {
        const isCorrect = index === q.correctIndex;
        return `
          <div class="preview-option ${isCorrect ? "correct" : ""}">
            ${option}
          </div>
        `;
      })
      .join("");

    previewQuestions.innerHTML += `
      <div class="preview-question-item">
        <p><b>${qIndex + 1}.</b> ${q.question}</p>
        <div class="preview-options">
          ${optionsHtml}
        </div>
      </div>
    `;
  });
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const instruction = taskInstruction.value.trim();
  const questions = collectQuestions();

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!instruction) return showToast("Нұсқаулық жазыңыз", "error");
  if (!questions.length) return showToast("Кемінде 1 толық сұрақ енгізіңіз", "error");

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  const payload = {
    lesson_id: Number(lessonId),
    type: "quiz",
    title,
    data: {
      instruction,
      questions
    },
    is_active: true
  };

  const success = await saveTaskToDB(payload);

  saveTaskBtn.disabled = false;
  saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";

  if (!success) return;

  showToast(
    isEditMode
      ? "Тест тапсырмасы өзгертілді"
      : "Тест тапсырмасы сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";
  taskInstruction.value = task.data?.instruction || "";

  questionsContainer.innerHTML = "";
  questionIndex = 0;

  const questions = task.data?.questions || [];

  questions.forEach(q => {
    addQuestion(q.question || "", q.options || ["", "", "", ""], q.correctIndex || 0);
  });

  if (!questions.length) {
    addQuestion();
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