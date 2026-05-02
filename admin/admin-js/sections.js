import { supabase } from "../../js/supabase.js";

const classTabs = document.getElementById("classTabs");
const sectionToolbar = document.getElementById("sectionToolbar");
const selectedClassTitle = document.getElementById("selectedClassTitle");
const sectionsList = document.getElementById("sectionsList");

const addSectionBtn = document.getElementById("addSectionBtn");

const modal = document.getElementById("sectionModal");
const modalTitle = document.getElementById("modalTitle");
const titleInput = document.getElementById("sectionTitleInput");
const descInput = document.getElementById("sectionDescInput");
const saveBtn = document.getElementById("saveSectionBtn");
const cancelBtn = document.getElementById("cancelSectionBtn");

let selectedClassId = null;
let selectedClassName = "";
let editId = null;

document.addEventListener("DOMContentLoaded", loadClasses);

addSectionBtn.addEventListener("click", () => {
  openModal();
});

saveBtn.addEventListener("click", saveSection);
cancelBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveSection();
});

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  classTabs.innerHTML = "";

  if (!data || data.length === 0) {
    classTabs.innerHTML = `<p class="empty-text">Алдымен сынып қосыңыз</p>`;
    return;
  }

  data.forEach(cls => {
    const btn = document.createElement("button");
    btn.className = "class-tab";
    btn.textContent = cls.name;
    btn.dataset.id = cls.id;
    btn.dataset.name = cls.name;

    btn.addEventListener("click", () => {
      selectClass(cls.id, cls.name, btn);
    });

    classTabs.appendChild(btn);
  });
}

function selectClass(classId, className, btn) {
  selectedClassId = classId;
  selectedClassName = className;

  document.querySelectorAll(".class-tab").forEach(tab => {
    tab.classList.remove("active");
  });

  btn.classList.add("active");

  selectedClassTitle.textContent = `${className} бөлімдері`;
  sectionToolbar.style.display = "flex";

  loadSections();
}

async function loadSections() {
  if (!selectedClassId) return;

  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .eq("class_id", selectedClassId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    showToast(error.message, "error");
    return;
  }

  sectionsList.innerHTML = "";

  if (!data || data.length === 0) {
    sectionsList.innerHTML = `<p class="empty-text">Бұл сыныпта бөлім жоқ</p>`;
    return;
  }

  data.forEach(section => {
    const card = document.createElement("div");
    card.className = "section-card";

    card.innerHTML = `
      <h3>${section.title}</h3>
      <p>${section.description || "Сипаттама жоқ"}</p>

      <div class="section-actions">
        <button class="edit-btn" data-id="${section.id}">Өңдеу</button>
        <button class="delete-btn" data-id="${section.id}">Өшіру</button>
      </div>
    `;

    card.querySelector(".edit-btn").addEventListener("click", () => {
      openModal(section);
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      deleteSection(section.id);
    });

    sectionsList.appendChild(card);
  });
}

function openModal(section = null) {
  if (!selectedClassId) {
    showToast("Алдымен сынып таңдаңыз", "error");
    return;
  }

  if (section) {
    editId = section.id;
    modalTitle.textContent = "Бөлімді өңдеу";
    titleInput.value = section.title || "";
    descInput.value = section.description || "";
  } else {
    editId = null;
    modalTitle.textContent = "Бөлім қосу";
    titleInput.value = "";
    descInput.value = "";
  }

  modal.classList.add("active");

  setTimeout(() => titleInput.focus(), 100);
}

function closeModal() {
  modal.classList.remove("active");
  editId = null;
  titleInput.value = "";
  descInput.value = "";
}

async function saveSection() {
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) {
    showToast("Бөлім атауын жазыңыз", "error");
    return;
  }

  const { data: existing } = await supabase
    .from("sections")
    .select("id")
    .eq("class_id", selectedClassId)
    .eq("title", title)
    .maybeSingle();

  if (existing && (!editId || Number(existing.id) !== Number(editId))) {
    showToast("Бұл бөлім осы сыныпта бұрын қосылған", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Сақталуда...";

  let result;

  if (editId) {
    result = await supabase
      .from("sections")
      .update({ title, description })
      .eq("id", editId);
  } else {
    result = await supabase
      .from("sections")
      .insert({
        class_id: selectedClassId,
        title,
        description
      });
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "Сақтау";

  if (result.error) {
    showToast(result.error.message, "error");
    return;
  }

  showToast(editId ? "Бөлім жаңартылды" : "Бөлім қосылды", "success");
  closeModal();
  loadSections();
}

async function deleteSection(id) {
  if (!confirm("Осы бөлімді өшіресіз бе?")) return;

  const { error } = await supabase
    .from("sections")
    .delete()
    .eq("id", id);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Бөлім өшірілді", "success");
  loadSections();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}