import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("lessons");
  await loadLessonPage();
});

async function loadLessonPage() {
  const lessonId = getParam("id");
  const tasksList = document.getElementById("tasksList");

  if (!lessonId) {
    showError("Сабақ ID табылмады");
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    window.location.href = "../index.html";
    return;
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, class_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    showError("Профиль табылмады");
    return;
  }

  if (profile.role !== "student") {
    window.location.href = "../index.html";
    return;
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      content,
      video_url,
      is_active,
      section_id,
      sections (
        id,
        title,
        class_id,
        is_active
      )
    `)
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    console.error("LESSON ERROR:", lessonError);
    showError("Сабақ табылмады");
    return;
  }

  if (lesson.is_active === false) {
    showError("Бұл сабақ уақытша жабық");
    return;
  }

  if (!lesson.sections || lesson.sections.class_id !== profile.class_id) {
    showError("Бұл сабақ саған бекітілмеген");
    return;
  }

  if (lesson.sections.is_active === false) {
    showError("Бұл бөлім уақытша жабық");
    return;
  }

  renderLesson(lesson);
  await loadTasks(lesson.id);
}

function renderLesson(lesson) {
  setText("lessonTitle", lesson.title);
  setText("lessonSection", lesson.sections?.title || "Бөлім");

  const contentBox = document.getElementById("lessonContent");
  contentBox.innerHTML = lesson.content
    ? lesson.content
    : `<p>Бұл сабаққа конспект әлі қосылмаған.</p>`;

  const videoBox = document.getElementById("lessonVideo");

  if (lesson.video_url) {
    videoBox.innerHTML = createVideoEmbed(lesson.video_url);
  } else {
    videoBox.innerHTML = `Видео қосылмаған`;
  }
}

async function loadTasks(lessonId) {
  const tasksList = document.getElementById("tasksList");

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("lesson_tasks")
    .select("id, title, type, sort_order, is_active")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true });

  if (tasksError) {
    console.error("TASKS ERROR:", tasksError);
    tasksList.innerHTML = `<div class="empty-box">Тапсырмаларды жүктеу кезінде қате шықты</div>`;
    return;
  }

  const activeTasks = (tasks || []).filter(task => task.is_active !== false);

  if (activeTasks.length === 0) {
    tasksList.innerHTML = `<div class="empty-box">Бұл сабаққа тапсырмалар әлі қосылмаған</div>`;
    return;
  }

  const taskIds = activeTasks.map(task => task.id);

  const { data: results, error: resultsError } = await supabase
    .from("task_results")
    .select("task_id, percent, score, total, updated_at")
    .eq("student_id", user.id)
    .in("task_id", taskIds);

  if (resultsError) {
    console.error("RESULTS ERROR:", resultsError);
  }

  const resultsMap = {};

  (results || []).forEach(result => {
    resultsMap[result.task_id] = result;
  });

  const completedCount = activeTasks.filter(task => resultsMap[task.id]).length;

  const averagePercent = completedCount
    ? Math.round(
        activeTasks.reduce((sum, task) => {
          return sum + Number(resultsMap[task.id]?.percent || 0);
        }, 0) / completedCount
      )
    : 0;

  tasksList.innerHTML = `
    <div class="lesson-task-summary">
      <div>
        <strong>${completedCount} / ${activeTasks.length}</strong>
        <span>тапсырма орындалды</span>
      </div>
      <div>
        <strong>${averagePercent}%</strong>
        <span>орташа нәтиже</span>
      </div>
    </div>

    ${activeTasks.map(task => {
      const result = resultsMap[task.id];
      const isDone = !!result;

      return `
        <div class="task-card">
          <div class="task-card-top">
            <span class="task-type">${getTaskTypeLabel(task.type)}</span>

            ${
              isDone
                ? `<span class="task-status done">${result.percent}%</span>`
                : `<span class="task-status pending">Орындалмаған</span>`
            }
          </div>

          <h3>${escapeHtml(task.title)}</h3>

          ${
            isDone
              ? `<p class="task-result-text">Соңғы нәтиже: ${result.score} / ${result.total}</p>`
              : `<p class="task-result-text muted">Бұл тапсырма әлі орындалмаған</p>`
          }

          <a href="./task.html?task_id=${task.id}&lesson_id=${lessonId}">
            ${isDone ? "Қайта орындау" : "Тапсырманы орындау"}
          </a>
        </div>
      `;
    }).join("")}
  `;
}

function createVideoEmbed(url) {
  const embedUrl = convertToEmbedUrl(url);

  if (!embedUrl) {
    return `
      <a href="${escapeHtml(url)}" target="_blank" class="video-link">
        Видео ашу
      </a>
    `;
  }

  return `
    <iframe 
      src="${embedUrl}" 
      allowfullscreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
    </iframe>
  `;
}

function convertToEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getTaskTypeLabel(type) {
  const labels = {
    quiz: "Тест",
    matching: "Сәйкестендіру",
    fill_blank: "Бос орынды толтыру",
    true_false: "Дұрыс / Бұрыс",
    crossword: "Кроссворд",
    image_labeling: "Суретпен тапсырма",
    cards: "Карточка"
  };

  return labels[type] || type;
}

function showError(message) {
  setText("lessonTitle", message);
  setText("lessonSection", "");
  document.getElementById("lessonContent").innerHTML = `<p>${message}</p>`;
  document.getElementById("lessonVideo").innerHTML = `Видео жоқ`;
  document.getElementById("tasksList").innerHTML = `<div class="empty-box">${message}</div>`;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}