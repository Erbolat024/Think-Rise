import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");

const previewTitle = document.getElementById("previewTitle");
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

classSelect.addEventListener("change", () => {
  loadSections(classSelect.value);
});

sectionSelect.addEventListener("change", () => {
  loadLessons(sectionSelect.value);
});

taskTitle.addEventListener("input", updatePreview);
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
  if (h1) h1.textContent = "True / False тапсырмасын өзгерту";

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

function addQuestion(questionValue = "", correctValue = true) {
  questionIndex++;

  const block = document.createElement("div");
  block.className = "tf-question-block";

  block.innerHTML = `
    <div class="question-top">
      <strong>Тұжырым ${questionIndex}</strong>
      <button type="button" class="remove-question-btn">Өшіру</button>
    </div>

    <textarea class="tf-question-input" placeholder="Мысалы: Жасуша — тірі ағзалардың құрылымдық бірлігі.">${questionValue}</textarea>

    <div class="tf-options">
      <label class="tf-option">
        <input type="radio" name="correctAnswer_${questionIndex}" value="true" ${correctValue === true ? "checked" : ""}>
        <span>Дұрыс</span>
      </label>

      <label class="tf-option">
        <input type="radio" name="correctAnswer_${questionIndex}" value="false" ${correctValue === false ? "checked" : ""}>
        <span>Бұрыс</span>
      </label>
    </div>
  `;

  block.querySelector(".tf-question-input").addEventListener("input", updatePreview);

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
  const blocks = document.querySelectorAll(".tf-question-block");

  blocks.forEach((block, index) => {
    block.querySelector(".question-top strong").textContent = `Тұжырым ${index + 1}`;

    block.querySelectorAll("input[type='radio']").forEach(radio => {
      radio.name = `correctAnswer_${index + 1}`;
    });
  });

  questionIndex = blocks.length;
}

function collectQuestions() {
  const blocks = document.querySelectorAll(".tf-question-block");

  return [...blocks]
    .map(block => {
      const question = block.querySelector(".tf-question-input").value.trim();
      const checkedRadio = block.querySelector("input[type='radio']:checked");
      const correct = checkedRadio ? checkedRadio.value === "true" : true;

      return {
        question,
        correct
      };
    })
    .filter(item => item.question);
}

function updatePreview() {
  previewTitle.textContent = taskTitle.value.trim() || "Тапсырма атауы";

  const questions = collectQuestions();

  if (!questions.length) {
    previewQuestions.innerHTML = `<p>Тұжырымдар осы жерде шығады</p>`;
    return;
  }

  previewQuestions.innerHTML = "";

  questions.forEach((item, index) => {
    previewQuestions.innerHTML += `
      <div class="preview-question-item">
        <p><b>${index + 1}.</b> ${item.question}</p>
        <div class="preview-answer">
          <span>Дұрыс жауап:</span>
          <strong>${item.correct ? "Дұрыс" : "Бұрыс"}</strong>
        </div>
      </div>
    `;
  });
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const questions = collectQuestions();

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!questions.length) return showToast("Кемінде 1 тұжырым жазыңыз", "error");

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  const payload = {
    lesson_id: Number(lessonId),
    type: "true_false",
    title,
    data: {
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
      ? "True / False тапсырмасы өзгертілді"
      : "True / False тапсырмасы сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";

  questionsContainer.innerHTML = "";
  questionIndex = 0;

  const questions = task.data?.questions || [];

  questions.forEach(q => {
    addQuestion(q.question || "", q.correct === false ? false : true);
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