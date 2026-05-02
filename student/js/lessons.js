import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("lessons");
  await loadSectionsPage();
});

async function loadSectionsPage() {
  const container = document.getElementById("lessonsContainer");

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    window.location.href = "../index.html";
    return;
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, role, class_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error(profileError);
    container.innerHTML = `<div class="empty-box">Профиль табылмады</div>`;
    return;
  }

  if (profile.role !== "student") {
    window.location.href = "../index.html";
    return;
  }

  setText("studentName", profile.name || "Оқушы");

  if (!profile.class_id) {
    setText("studentClass", "Сынып бекітілмеген");
    container.innerHTML = `<div class="empty-box">Саған әлі сынып бекітілмеген</div>`;
    return;
  }

  const { data: classData } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", profile.class_id)
    .single();

  setText("studentClass", classData?.name || "Сынып табылмады");

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("id, title, description, sort_order, is_active")
    .eq("class_id", profile.class_id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    console.error(sectionsError);
    container.innerHTML = `<div class="empty-box">Бөлімдерді жүктеу кезінде қате шықты</div>`;
    return;
  }

  const activeSections = (sections || []).filter(section => section.is_active !== false);

  if (activeSections.length === 0) {
    container.innerHTML = `<div class="empty-box">Бұл сыныпқа бөлімдер әлі қосылмаған</div>`;
    return;
  }

  renderSections(activeSections);
}

function renderSections(sections) {
  const container = document.getElementById("lessonsContainer");

  container.innerHTML = `
    <div class="sections-grid">
      ${sections.map((section, index) => `
        <div class="section-card">
          <div class="section-number">${index + 1}</div>
          <h2>${escapeHtml(section.title)}</h2>
          <p>${escapeHtml(section.description || "Бұл бөлімге арналған сабақтар")}</p>
          <a href="./section.html?id=${section.id}" class="open-section-btn">
            Бөлімді ашу
          </a>
        </div>
      `).join("")}
    </div>
  `;
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