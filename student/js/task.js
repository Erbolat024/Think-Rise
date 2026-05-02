import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";
import { renderTask, checkTask } from "./task-renderers.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("lessons");
  await initTask();
});

const params = new URLSearchParams(window.location.search);
const taskId = params.get("task_id");
const lessonId = params.get("lesson_id");

const titleEl = document.getElementById("taskTitle");
const instructionEl = document.getElementById("taskInstruction");
const contentEl = document.getElementById("taskContent");
const resultEl = document.getElementById("taskResult");
const typeEl = document.getElementById("taskType");

const checkBtn = document.getElementById("checkBtn");
const retryBtn = document.getElementById("retryBtn");
const backBtn = document.getElementById("backBtn");

let currentTask = null;

backBtn.onclick = () => {
  if (lessonId) {
    window.location.href = `lesson.html?id=${lessonId}`;
  } else {
    history.back();
  }
};

checkBtn.onclick = checkAnswers;

retryBtn.onclick = () => {
  if (!currentTask) return;

  try {
    renderTask(currentTask, contentEl);
  } catch (err) {
    console.error("RENDER ERROR:", err);
    showError("Тапсырманы қайта көрсету кезінде қате шықты");
  }

  resultEl.innerHTML = "";
  retryBtn.hidden = true;
  checkBtn.disabled = false;
};

async function initTask() {
  if (!taskId) {
    showError("Тапсырма ID табылмады");
    return;
  }

  const { data, error } = await supabase
    .from("lesson_tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error || !data) {
    console.error("TASK ERROR:", error);
    showError("Тапсырма табылмады");
    return;
  }

  if (data.is_active === false) {
    showError("Бұл тапсырма уақытша жабық");
    return;
  }

  currentTask = data;

  titleEl.textContent = data.title || "Тапсырма";
  instructionEl.textContent = data.instruction || "";

  if (typeEl) {
    typeEl.textContent = getTaskTypeLabel(data.type);
  }

  try {
    renderTask(currentTask, contentEl);
  } catch (err) {
    console.error("RENDER ERROR:", err);
    showError("Тапсырманы көрсету кезінде қате шықты");
  }
}

async function checkAnswers() {
  if (!currentTask) return;

  const result = checkTask(currentTask);

  resultEl.innerHTML = `
    <div class="result-box ${result.percent >= 70 ? "success" : "fail"}">
      <h3>${result.percent}%</h3>
      <p>Дұрыс жауап: ${result.correct} / ${result.total}</p>
    </div>
  `;

  await saveTaskResult(result);

  retryBtn.hidden = false;
  checkBtn.disabled = true;
}

async function saveTaskResult(result) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("USER ERROR:", userError);
      return;
    }

    const user = userData?.user;

    if (!user || !currentTask) return;

    const finalLessonId = currentTask.lesson_id || lessonId;

    if (!finalLessonId) {
      console.error("LESSON ID NOT FOUND");
      return;
    }

    const payload = {
      student_id: user.id,
      lesson_id: Number(finalLessonId),
      task_id: Number(currentTask.id),
      task_type: currentTask.type,
      score: Number(result.correct || 0),
      total: Number(result.total || 0),
      percent: Number(result.percent || 0),
      is_completed: true
    };

    const { error } = await supabase
      .from("task_results")
      .upsert(payload, {
        onConflict: "student_id,task_id"
      });

    if (error) {
      console.error("RESULT SAVE ERROR:", error);
      resultEl.innerHTML += `
        <div class="result-save-error">
          Нәтиже шықты, бірақ базаға сақталмады.
        </div>
      `;
      return;
    }

    resultEl.innerHTML += `
      <div class="result-save-success">
        Нәтиже сақталды
      </div>
    `;
  } catch (err) {
    console.error("SAVE RESULT ERROR:", err);
  }
}

function showError(msg) {
  if (titleEl) titleEl.textContent = "Қате";
  if (instructionEl) instructionEl.textContent = "";
  if (contentEl) contentEl.innerHTML = `<div class="empty-box">${msg}</div>`;
  if (checkBtn) checkBtn.disabled = true;
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