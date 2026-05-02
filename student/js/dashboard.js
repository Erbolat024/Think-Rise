import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("dashboard");
  await loadDashboard();
});

async function loadDashboard() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    window.location.href = "../index.html";
    return;
  }

  const user = authData.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, role, class_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("PROFILE ERROR:", profileError);
    alert("Профиль табылмады");
    return;
  }

  console.log("PROFILE:", profile);

  if (profile.role !== "student") {
    alert("Бұл бет тек оқушыға арналған");
    window.location.href = "../index.html";
    return;
  }

  const studentName = profile.name || "Оқушы";
  const studentEmail = profile.email || user.email || "";

  setText("studentName", studentName);
  setText("studentEmail", studentEmail);
  setText("headerStudentName", studentName);
  setText("studentAvatar", studentName.charAt(0).toUpperCase());

  if (!profile.class_id) {
    setText("studentClass", "Сынып бекітілмеген");
    setText("headerStudentClass", "Сынып жоқ");
    return;
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", profile.class_id)
    .single();

  if (classError || !classData) {
    console.error("CLASS ERROR:", classError);
    setText("studentClass", "Сынып табылмады");
    setText("headerStudentClass", "Сынып табылмады");
    return;
  }

  setText("studentClass", classData.name);
  setText("headerStudentClass", classData.name);

  await loadCounts(profile.class_id);
}

async function loadCounts(classId) {
  console.log("CLASS ID:", classId);

  const { data: sections, error: sectionsError } = await supabase
    .from("sections")
    .select("id, title, class_id, is_active")
    .eq("class_id", classId);

  if (sectionsError) {
    console.error("SECTIONS ERROR:", sectionsError);
    return;
  }

  console.log("SECTIONS:", sections);

  const activeSections = (sections || []).filter(section => section.is_active !== false);
  const sectionIds = activeSections.map(section => section.id);

  setText("sectionsCount", sectionIds.length);

  if (sectionIds.length === 0) {
    setText("lessonsCount", 0);
    setText("tasksCount", 0);
    return;
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title, section_id, is_active")
    .in("section_id", sectionIds);

  if (lessonsError) {
    console.error("LESSONS ERROR:", lessonsError);
    return;
  }

  console.log("LESSONS:", lessons);

  const activeLessons = (lessons || []).filter(lesson => lesson.is_active !== false);
  const lessonIds = activeLessons.map(lesson => lesson.id);

  setText("lessonsCount", lessonIds.length);

  if (lessonIds.length === 0) {
    setText("tasksCount", 0);
    return;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("lesson_tasks")
    .select("id, title, lesson_id, is_active")
    .in("lesson_id", lessonIds);

  if (tasksError) {
    console.error("TASKS ERROR:", tasksError);
    return;
  }

  console.log("TASKS:", tasks);

  const activeTasks = (tasks || []).filter(task => task.is_active !== false);

  setText("tasksCount", activeTasks.length);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}