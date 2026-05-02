import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("lessons");
  await loadSectionPage();
});

async function loadSectionPage() {
  const lessonsList = document.getElementById("lessonsList");
  const sectionId = getParam("id");

  if (!sectionId) {
    lessonsList.innerHTML = `<div class="empty-box">Бөлім ID табылмады</div>`;
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
    lessonsList.innerHTML = `<div class="empty-box">Профиль табылмады</div>`;
    return;
  }

  if (profile.role !== "student") {
    window.location.href = "../index.html";
    return;
  }

  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("id, title, description, class_id, is_active")
    .eq("id", sectionId)
    .single();

  if (sectionError || !section) {
    lessonsList.innerHTML = `<div class="empty-box">Бөлім табылмады</div>`;
    return;
  }

  if (section.class_id !== profile.class_id) {
    lessonsList.innerHTML = `<div class="empty-box">Бұл бөлім саған бекітілмеген</div>`;
    return;
  }

  if (section.is_active === false) {
    lessonsList.innerHTML = `<div class="empty-box">Бұл бөлім уақытша жабық</div>`;
    return;
  }

  setText("sectionTitle", section.title);
  setText("sectionDescription", section.description || "Осы бөлімге арналған сабақтар");

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title, content, video_url, sort_order, is_active")
    .eq("section_id", section.id)
    .order("sort_order", { ascending: true });

  if (lessonsError) {
    console.error(lessonsError);
    lessonsList.innerHTML = `<div class="empty-box">Сабақтарды жүктеу кезінде қате шықты</div>`;
    return;
  }

  const activeLessons = (lessons || []).filter(lesson => lesson.is_active !== false);

  if (activeLessons.length === 0) {
    lessonsList.innerHTML = `<div class="empty-box">Бұл бөлімде сабақтар әлі жоқ</div>`;
    return;
  }

  renderLessons(activeLessons);
}

function renderLessons(lessons) {
  const lessonsList = document.getElementById("lessonsList");

  lessonsList.innerHTML = lessons.map((lesson, index) => {
    const shortContent = lesson.content
      ? stripHtml(lesson.content).slice(0, 120) + "..."
      : "Сабақ материалын ашып көр";

    return `
      <div class="lesson-row">
        <div class="lesson-left">
          <div class="lesson-number">${index + 1}</div>

          <div class="lesson-info">
            <h3>${escapeHtml(lesson.title)}</h3>
            <p>${escapeHtml(shortContent)}</p>
          </div>
        </div>

        <a href="./lesson.html?id=${lesson.id}" class="open-lesson-btn">
          Сабақты ашу
        </a>
      </div>
    `;
  }).join("");
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}