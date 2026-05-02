import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("results");
  await loadResults();
});

const averagePercentEl = document.getElementById("averagePercent");
const completedCountEl = document.getElementById("completedCount");
const bestPercentEl = document.getElementById("bestPercent");
const resultsList = document.getElementById("resultsList");

async function loadResults() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    window.location.href = "../index.html";
    return;
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "student") {
    window.location.href = "../index.html";
    return;
  }

  const { data: results, error } = await supabase
    .from("task_results")
    .select(`
      id,
      task_id,
      lesson_id,
      task_type,
      score,
      total,
      percent,
      updated_at,
      lesson_tasks (
        id,
        title,
        type
      ),
      lessons (
        id,
        title,
        sections (
          id,
          title
        )
      )
    `)
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("RESULTS ERROR:", error);
    resultsList.innerHTML = `
      <div class="empty-box">Нәтижелерді жүктеу кезінде қате шықты</div>
    `;
    return;
  }

  renderStats(results || []);
  renderResults(results || []);
}

function renderStats(results) {
  const completed = results.length;

  const average = completed
    ? Math.round(results.reduce((sum, item) => sum + Number(item.percent || 0), 0) / completed)
    : 0;

  const best = completed
    ? Math.max(...results.map(item => Number(item.percent || 0)))
    : 0;

  averagePercentEl.textContent = `${average}%`;
  completedCountEl.textContent = completed;
  bestPercentEl.textContent = `${best}%`;
}

function renderResults(results) {
  if (!results.length) {
    resultsList.innerHTML = `
      <div class="empty-box">
        Әзірге орындалған тапсырма жоқ.
      </div>
    `;
    return;
  }

  resultsList.innerHTML = results.map(result => {
    const taskTitle = result.lesson_tasks?.title || "Тапсырма";
    const lessonTitle = result.lessons?.title || "Сабақ";
    const sectionTitle = result.lessons?.sections?.title || "Бөлім";
    const percent = Number(result.percent || 0);

    return `
      <div class="result-card">
        <div class="result-top">
          <span class="result-type">${getTaskTypeLabel(result.task_type)}</span>
          <span class="result-percent ${getPercentClass(percent)}">${percent}%</span>
        </div>

        <h3>${escapeHtml(taskTitle)}</h3>

        <p class="result-meta">
          ${escapeHtml(sectionTitle)} · ${escapeHtml(lessonTitle)}
        </p>

        <div class="result-bottom">
          <span>Дұрыс жауап: ${result.score} / ${result.total}</span>
          <span>${formatDate(result.updated_at)}</span>
        </div>

        <a href="./task.html?task_id=${result.task_id}&lesson_id=${result.lesson_id}">
          Қайта орындау
        </a>
      </div>
    `;
  }).join("");
}

function getPercentClass(percent) {
  if (percent >= 80) return "high";
  if (percent >= 50) return "middle";
  return "low";
}

function getTaskTypeLabel(type) {
  const labels = {
    quiz: "Тест",
    matching: "Сәйкестендіру",
    fill_blank: "Бос орынды толтыру",
    true_false: "Дұрыс / Бұрыс",
    crossword: "Кроссворд",
    image_labeling: "Суретпен тапсырма"
  };

  return labels[type] || type || "Тапсырма";
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString("kk-KZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}