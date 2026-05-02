import { supabase } from "../../js/supabase.js";
import { renderStudentLayout } from "./student-layout.js";

document.addEventListener("DOMContentLoaded", async () => {
  renderStudentLayout("profile");
  await loadProfile();
});

const nameInput = document.getElementById("profileName");
const emailEl = document.getElementById("profileEmail");
const idEl = document.getElementById("profileId");
const classEl = document.getElementById("profileClass");

const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

async function loadProfile() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    window.location.href = "../index.html";
    return;
  }

  const user = data.user;
  currentUser = user;

  emailEl.textContent = user.email;
  idEl.textContent = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, class_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("PROFILE ERROR:", profileError);
    return;
  }

  nameInput.value = profile?.name || "";

  if (!profile?.class_id) {
    classEl.textContent = "-";
    return;
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("name")
    .eq("id", profile.class_id)
    .single();

  if (classError) {
    console.error("CLASS ERROR:", classError);
    classEl.textContent = "-";
    return;
  }

  classEl.textContent = classData?.name || "-";
}

saveBtn.onclick = async () => {
  const newName = nameInput.value.trim();

  if (!newName) {
    showToast("Атыңды енгіз", "error");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name: newName })
    .eq("id", currentUser.id);

  if (error) {
    console.error("SAVE ERROR:", error);
    showToast("Сақтау кезінде қате шықты", "error");
    return;
  }

  showToast("Сақталды", "success");
};

logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "../index.html";
};

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}