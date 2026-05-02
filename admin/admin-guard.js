import { supabase } from "../js/supabase.js";

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
    return;
  }
}

checkAdmin();