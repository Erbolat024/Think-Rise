import { supabase } from "../../js/supabase.js";

const sectionTabs = document.getElementById("sectionTabs");
const lessonToolbar = document.getElementById("lessonToolbar");
const selectedSectionTitle = document.getElementById("selectedSectionTitle");
const lessonsList = document.getElementById("lessonsList");

const addLessonBtn = document.getElementById("addLessonBtn");

const modal = document.getElementById("lessonModal");
const modalTitle = document.getElementById("modalTitle");

const titleInput = document.getElementById("lessonTitleInput");
const contentInput = document.getElementById("lessonContentInput");
const videoInput = document.getElementById("lessonVideoInput");

const saveBtn = document.getElementById("saveLessonBtn");
const cancelBtn = document.getElementById("cancelLessonBtn");

let selectedSectionId = null;
let selectedSectionName = "";
let editId = null;

document.addEventListener("DOMContentLoaded", loadSections);

addLessonBtn.addEventListener("click", () => openModal());
saveBtn.addEventListener("click", saveLesson);
cancelBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

async function loadSections() {
  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("id");

  if (error) return showToast(error.message, "error");

  sectionTabs.innerHTML = "";

  data.forEach(sec => {
    const btn = document.createElement("button");
    btn.className = "class-tab";
    btn.textContent = sec.title;

    btn.addEventListener("click", () => {
      selectSection(sec.id, sec.title, btn);
    });

    sectionTabs.appendChild(btn);
  });
}

function selectSection(id, name, btn) {
  selectedSectionId = id;
  selectedSectionName = name;

  document.querySelectorAll(".class-tab").forEach(tab => {
    tab.classList.remove("active");
  });

  btn.classList.add("active");

  selectedSectionTitle.textContent = `${name} сабақтары`;
  lessonToolbar.style.display = "flex";

  loadLessons();
}

async function loadLessons() {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("section_id", selectedSectionId)
    .order("sort_order");

  if (error) return showToast(error.message, "error");

  lessonsList.innerHTML = "";

  if (!data.length) {
    lessonsList.innerHTML = `<p class="empty-text">Сабақ жоқ</p>`;
    return;
  }

  data.forEach(lesson => {
    const card = document.createElement("div");
    card.className = "section-card";

    card.innerHTML = `
      <h3>${lesson.title}</h3>
      <p>${lesson.content?.slice(0, 80) || "Контент жоқ"}</p>

      <div class="section-actions">
        <button class="task-btn">Тапсырмалар</button>
        <button class="edit-btn">Өңдеу</button>
        <button class="delete-btn">Өшіру</button>
      </div>
    `;

    card.querySelector(".edit-btn").onclick = () => openModal(lesson);
    card.querySelector(".delete-btn").onclick = () => deleteLesson(lesson.id);
    card.querySelector(".task-btn").onclick = () => {
     window.location.href = `lesson-tasks.html?lesson_id=${lesson.id}`;
   };

    lessonsList.appendChild(card);
  });
}

function openModal(lesson = null) {
  if (!selectedSectionId) {
    showToast("Алдымен бөлім таңдаңыз", "error");
    return;
  }

  if (lesson) {
    editId = lesson.id;
    modalTitle.textContent = "Сабақты өңдеу";
    titleInput.value = lesson.title;
    contentInput.value = lesson.content || "";
    videoInput.value = lesson.video_url || "";
  } else {
    editId = null;
    modalTitle.textContent = "Сабақ қосу";
    titleInput.value = "";
    contentInput.value = "";
    videoInput.value = "";
  }

  modal.classList.add("active");
}

function closeModal() {
  modal.classList.remove("active");
}

async function saveLesson() {
  const title = titleInput.value.trim();

  if (!title) return showToast("Атау керек", "error");

  let result;

  if (editId) {
    result = await supabase
      .from("lessons")
      .update({
        title,
        content: contentInput.value,
        video_url: videoInput.value
      })
      .eq("id", editId);
  } else {
    result = await supabase
      .from("lessons")
      .insert({
        section_id: selectedSectionId,
        title,
        content: contentInput.value,
        video_url: videoInput.value
      });
  }

  if (result.error) return showToast(result.error.message, "error");

  showToast("Сақталды", "success");
  closeModal();
  loadLessons();
}

async function deleteLesson(id) {
  if (!confirm("Өшіреміз бе?")) return;

  const { error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", id);

  if (error) return showToast(error.message, "error");

  showToast("Өшірілді", "success");
  loadLessons();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}