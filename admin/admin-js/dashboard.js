import { supabase } from "../../js/supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  await checkAdmin();
  await loadDashboardStats();
});

async function checkAdmin() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "../auth/login.html";
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    window.location.href = "../auth/login.html";
    return;
  }

  if (profile.role !== "admin") {
    alert("Бұл бетке тек админ кіре алады");
    window.location.href = "../student/dashboard.html";
  }
}

async function getCount(tableName, filter = null) {
  let query = supabase
    .from(tableName)
    .select("*", { count: "exact", head: true });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;

  if (error) {
    console.error(`${tableName} count error:`, error.message);
    return 0;
  }

  return count || 0;
}

async function loadDashboardStats() {
  const subjectsCount = document.getElementById("subjectsCount");
  const sectionsCount = document.getElementById("sectionsCount");
  const lessonsCount = document.getElementById("lessonsCount");
  const studentsCount = document.getElementById("studentsCount");

  subjectsCount.textContent = "...";
  sectionsCount.textContent = "...";
  lessonsCount.textContent = "...";
  studentsCount.textContent = "...";

  const [subjects, sections, lessons, students] = await Promise.all([
    getCount("subjects"),
    getCount("sections"),
    getCount("lessons"),
    getCount("profiles", { column: "role", value: "student" }),
  ]);

  subjectsCount.textContent = subjects;
  sectionsCount.textContent = sections;
  lessonsCount.textContent = lessons;
  studentsCount.textContent = students;
}