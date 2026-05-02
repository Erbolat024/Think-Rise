import { supabase } from "../../js/supabase.js";

const params = new URLSearchParams(window.location.search);
const lessonId = params.get("lesson_id");

const lessonTitle = document.getElementById("lessonTitle");
const tasksList = document.getElementById("tasksList");

document.addEventListener("DOMContentLoaded", () => {
  if (!lessonId) {
    tasksList.innerHTML = `<div class="empty-card">lesson_id табылмады</div>`;
    return;
  }

  loadLesson();
  loadTasks();
});

// =====================
// LOAD LESSON
// =====================
async function loadLesson() {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (error) {
    console.error(error);
    lessonTitle.textContent = "Сабақ табылмады";
    return;
  }

  lessonTitle.textContent = data.title;
}

// =====================
// LOAD TASKS
// =====================
async function loadTasks() {
  const { data, error } = await supabase
    .from("lesson_tasks")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    tasksList.innerHTML = `<div class="empty-card">${error.message}</div>`;
    return;
  }

  if (!data.length) {
    tasksList.innerHTML = `
      <div class="empty-card">
        Бұл сабаққа әлі тапсырма қосылмаған
      </div>
    `;
    return;
  }

  tasksList.innerHTML = data.map(task => renderTaskCard(task)).join("");
  bindEvents();
}

// =====================
// RENDER TASK CARD
// =====================
function renderTaskCard(task) {
  const info = getTaskInfo(task.type);

  return `
    <div class="task-card">
      <div class="task-icon">${info.icon}</div>

      <div class="task-content">
        <h3>${task.title}</h3>
        <p>${info.name}</p>
        <span class="task-type">${task.type}</span>
      </div>

      <div class="task-actions">
        <button 
          class="status-btn ${task.is_active ? "active" : "inactive"}"
          data-id="${task.id}"
        >
          ${task.is_active ? "Актив" : "Өшірулі"}
        </button>

        <button class="edit-btn" data-id="${task.id}">
          Өзгерту
        </button>

        <button class="delete-btn" data-id="${task.id}">
          Өшіру
        </button>
      </div>
    </div>
  `;
}

// =====================
// TASK INFO
// =====================
function getTaskInfo(type) {
  const map = {
    image_labeling: {
      name: "Суретпен белгілеу",
      icon: "🖼️"
    },
    true_false: {
      name: "True / False",
      icon: "✅"
    },
    matching: {
      name: "Сәйкестендіру",
      icon: "🔗"
    },
    quiz: {
      name: "Тест",
      icon: "📝"
    },
    crossword: {
      name: "Кроссворд",
      icon: "🧩"
    },
    fill_blank: {
      name: "Бос орынды толтыру",
      icon: "✍️"
    }
  };

  return map[type] || {
    name: "Белгісіз тапсырма",
    icon: "📌"
  };
}

// =====================
// EVENTS
// =====================
function bindEvents() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.id));
  });

  document.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", () => toggleTask(btn.dataset.id));
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => editTask(btn.dataset.id));
  });
}

// =====================
// DELETE TASK
// =====================
async function deleteTask(taskId) {
  const ok = confirm("Тапсырманы өшіреміз бе?");
  if (!ok) return;

  const { error } = await supabase
    .from("lesson_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Тапсырма өшірілді", "success");
  loadTasks();
}

// =====================
// TOGGLE ACTIVE
// =====================
async function toggleTask(taskId) {
  const { data, error: selectError } = await supabase
    .from("lesson_tasks")
    .select("is_active")
    .eq("id", taskId)
    .single();

  if (selectError) {
    showToast(selectError.message, "error");
    return;
  }

  const { error } = await supabase
    .from("lesson_tasks")
    .update({
      is_active: !data.is_active
    })
    .eq("id", taskId);

  if (error) {
    showToast(error.message, "error");
    return;
  }

  showToast("Статус өзгерді", "success");
  loadTasks();
}

// =====================
// EDIT TASK
// =====================
async function editTask(taskId) {
  const { data, error } = await supabase
    .from("lesson_tasks")
    .select("id, type")
    .eq("id", taskId)
    .single();

  if (error) {
    showToast(error.message, "error");
    return;
  }

  const routes = {
    image_labeling: "admin-tasks/image-labeling/index.html",
    true_false: "admin-tasks/true-false/index.html",
    matching: "admin-tasks/matching/index.html",
    quiz: "admin-tasks/quiz/index.html",
    crossword: "admin-tasks/crossword/index.html",
    fill_blank: "admin-tasks/fill-blank/index.html"
  };

  const page = routes[data.type];

  if (!page) {
    showToast("Бұл тапсырма түріне редактор табылмады", "error");
    return;
  }

  window.location.href = `${page}?edit=${data.id}&lesson_id=${lessonId}`;
}

// =====================
// TOAST
// =====================
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}