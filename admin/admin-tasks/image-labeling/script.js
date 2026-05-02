import { supabase } from "../../../js/supabase.js";

const urlParams = new URLSearchParams(window.location.search);
const editTaskId = urlParams.get("edit");
const isEditMode = !!editTaskId;

const classSelect = document.getElementById("classSelect");
const sectionSelect = document.getElementById("sectionSelect");
const lessonSelect = document.getElementById("lessonSelect");

const taskTitle = document.getElementById("taskTitle");
const taskInstruction = document.getElementById("taskInstruction");
const imageFile = document.getElementById("imageFile");
const labelCount = document.getElementById("labelCount");

const generateRowsBtn = document.getElementById("generateRowsBtn");
const answerRows = document.getElementById("answerRows");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const previewTitle = document.getElementById("previewTitle");
const previewInstruction = document.getElementById("previewInstruction");
const previewImage = document.getElementById("previewImage");
const previewTable = document.getElementById("previewTable");

let uploadedImageUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
  await loadClasses();

  if (isEditMode) {
    const task = await loadTaskForEdit();

    if (task) {
      await fillFormForEdit(task);
      setEditTitle();
    }
  } else {
    generateRows();
  }

  updatePreview();
});

classSelect.addEventListener("change", () => {
  loadSections(classSelect.value);
});

sectionSelect.addEventListener("change", () => {
  loadLessons(sectionSelect.value);
});

generateRowsBtn.addEventListener("click", generateRows);
saveTaskBtn.addEventListener("click", saveTask);

taskTitle.addEventListener("input", updatePreview);
taskInstruction.addEventListener("input", updatePreview);
imageFile.addEventListener("change", previewSelectedImage);

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
  if (h1) h1.textContent = "Суретпен белгілеу тапсырмасын өзгерту";

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

function previewSelectedImage() {
  const file = imageFile.files[0];

  if (!file) {
    if (!uploadedImageUrl) {
      previewImage.style.display = "none";
      previewImage.src = "";
    }
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
  };

  reader.readAsDataURL(file);
}

function generateRows(existingLabels = null) {
  const count = existingLabels ? existingLabels.length : Number(labelCount.value);

  if (!count || count < 1) {
    showToast("Жауаптар санын дұрыс енгізіңіз", "error");
    return;
  }

  answerRows.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const oldLabel = existingLabels?.find(item => Number(item.number) === i);

    const row = document.createElement("div");
    row.className = "answer-row";

    row.innerHTML = `
      <span>${i}</span>
      <input class="answer-input" data-number="${i}" placeholder="${i}-нөмірдің жауабы" value="${oldLabel?.answer || ""}">
    `;

    row.querySelector("input").addEventListener("input", updatePreview);
    answerRows.appendChild(row);
  }

  updatePreview();
}

function updatePreview() {
  previewTitle.textContent = taskTitle.value.trim() || "Тапсырма атауы";
  previewInstruction.textContent =
    taskInstruction.value.trim() || "Нұсқаулық осы жерде шығады";

  const answers = document.querySelectorAll(".answer-input");

  previewTable.innerHTML = "";

  answers.forEach(input => {
    previewTable.innerHTML += `
      <tr>
        <td>${input.dataset.number}</td>
        <td>${input.value || "..."}</td>
      </tr>
    `;
  });
}

async function uploadImage(file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from("task-images")
    .upload(fileName, file);

  if (error) {
    console.error(error);
    showToast("Сурет жүктеу қатесі", "error");
    return null;
  }

  const { data } = supabase.storage
    .from("task-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

async function saveTask() {
  const lessonId = lessonSelect.value;
  const title = taskTitle.value.trim();
  const instruction = taskInstruction.value.trim();
  const file = imageFile.files[0];

  if (!lessonId) return showToast("Сабақ таңдаңыз", "error");
  if (!title) return showToast("Тапсырма атауын жазыңыз", "error");
  if (!instruction) return showToast("Нұсқаулық жазыңыз", "error");

  if (!file && !uploadedImageUrl) {
    return showToast("Сурет жүктеңіз", "error");
  }

  const inputs = document.querySelectorAll(".answer-input");

  if (!inputs.length) {
    return showToast("Алдымен кесте жасаңыз", "error");
  }

  const labels = [...inputs]
    .map(input => ({
      number: Number(input.dataset.number),
      answer: input.value.trim()
    }))
    .filter(item => item.answer);

  if (!labels.length) {
    return showToast("Кемінде бір жауап енгізіңіз", "error");
  }

  saveTaskBtn.disabled = true;
  saveTaskBtn.textContent = "Сақталуда...";

  let imageUrl = uploadedImageUrl;

  if (file) {
    imageUrl = await uploadImage(file);

    if (!imageUrl) {
      saveTaskBtn.disabled = false;
      saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";
      return;
    }
  }

  const payload = {
    lesson_id: Number(lessonId),
    type: "image_labeling",
    title,
    data: {
      instruction,
      image_url: imageUrl,
      labels
    },
    is_active: true
  };

  const success = await saveTaskToDB(payload);

  saveTaskBtn.disabled = false;
  saveTaskBtn.textContent = isEditMode ? "Өзгерістерді сақтау" : "Сақтау";

  if (!success) return;

  showToast(
    isEditMode
      ? "Тапсырма өзгертілді"
      : "Тапсырма сабаққа бекітілді",
    "success"
  );

  setTimeout(() => {
    window.location.href = "../../tasks.html";
  }, 700);
}

async function fillFormForEdit(task) {
  taskTitle.value = task.title || "";
  taskInstruction.value = task.data?.instruction || "";

  uploadedImageUrl = task.data?.image_url || "";

  if (uploadedImageUrl) {
    previewImage.src = uploadedImageUrl;
    previewImage.style.display = "block";
  }

  const labels = task.data?.labels || [];
  labelCount.value = labels.length || 1;
  generateRows(labels);

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