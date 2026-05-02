import { supabase } from "../../js/supabase.js";

const modal = document.getElementById("classModal");
const input = document.getElementById("classInput");
const saveBtn = document.getElementById("saveClassBtn");
const cancelBtn = document.getElementById("cancelClassBtn");
const addClassBtn = document.getElementById("addClassBtn");
const container = document.getElementById("classesList");

let editId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadClasses();
});

addClassBtn.addEventListener("click", () => {
  openModal();
});

saveBtn.addEventListener("click", saveClass);

cancelBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveClass();
});

function openModal(classData = null) {
  if (classData) {
    editId = classData.id;
    input.value = classData.name;
  } else {
    editId = null;
    input.value = "";
  }

  modal.classList.add("active");

  setTimeout(() => {
    input.focus();
  }, 100);
}

function closeModal() {
  modal.classList.remove("active");
  editId = null;
  input.value = "";
}

async function loadClasses() {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    showToast(error.message, "error");
    return;
  }

  container.innerHTML = "";

  if (!data || data.length === 0) {
    container.innerHTML = `<p class="empty-text">Әлі сынып қосылмаған</p>`;
    return;
  }

  data.forEach(cls => {
    const div = document.createElement("div");
    div.className = "class-card";

    div.innerHTML = `
      <h3>${cls.name}</h3>

      <div class="class-actions">
        <button class="edit-btn" data-id="${cls.id}" data-name="${cls.name}">Өңдеу</button>
        <button class="delete-btn" data-id="${cls.id}">Өшіру</button>
      </div>
    `;

    container.appendChild(div);
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      openModal({
        id: btn.dataset.id,
        name: btn.dataset.name
      });
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      if (!confirm("Осы сыныпты өшіресіз бе?")) return;

      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) {
        showToast(error.message, "error");
        return;
      }

      loadClasses();
    });
  });
}

async function saveClass() {
  const name = input.value.trim();

  if (!name) {
    showToast("Сынып атауын жазыңыз", "error");
    return;
  }

  // 🔍 тексеру
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  // егер edit емес және already бар болса
  if (existing && (!editId || existing.id != editId)) {
    showToast("Бұл сынып already бар ❗", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Сақталуда...";

  let result;

  if (editId) {
    result = await supabase
      .from("classes")
      .update({ name })
      .eq("id", editId);
  } else {
    result = await supabase
      .from("classes")
      .insert({ name });
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "Сақтау";

  if (result.error) {
    showToast(result.error.message, "error");
    return;
  }

  closeModal();
  loadClasses();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}