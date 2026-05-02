import { supabase } from "../../js/supabase.js";

// ================= REGISTER =================
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
      alert("Барлық өрісті толтыр");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Жіберілуде...";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      alert(error.message);
      registerBtn.disabled = false;
      registerBtn.textContent = "Зарегистрироваться";
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: name,
          email: email,
          role: "student"
        });

      if (profileError) {
        console.error(profileError);
        alert(profileError.message);
        registerBtn.disabled = false;
        registerBtn.textContent = "Зарегистрироваться";
        return;
      }
    }

    window.location.href = "../student/dashboard.html";
  });
}

// ================= LOGIN =================
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Email және пароль жаз");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Кіру...";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      loginBtn.disabled = false;
      loginBtn.textContent = "Войти";
      return;
    }

    const user = data.user;

    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
      alert(profileError.message);
      loginBtn.disabled = false;
      loginBtn.textContent = "Войти";
      return;
    }

    if (!profile) {
      const name = user.user_metadata?.name || "Оқушы";

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          name: name,
          email: user.email,
          role: "student"
        });

      if (insertError) {
        console.error(insertError);
        alert(insertError.message);
        loginBtn.disabled = false;
        loginBtn.textContent = "Войти";
        return;
      }

      profile = { role: "student" };
    }

    if (profile.role === "admin") {
      window.location.href = "../admin/dashboard.html";
    } else {
      window.location.href = "../student/dashboard.html";
    }
  });
}