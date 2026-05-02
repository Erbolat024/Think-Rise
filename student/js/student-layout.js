import { supabase } from "../../js/supabase.js";

export function renderStudentLayout(activePage = "dashboard") {
  const layout = document.getElementById("studentLayout");

  layout.innerHTML = `
    <div class="mobile-toggle" id="menuToggle">☰</div>
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <aside class="student-sidebar" id="sidebar">
      <div class="sidebar-logo">
        <span class="logo-short">TR</span>
        <span class="logo-full">Think<span>Rise</span></span>
      </div>

      <nav class="sidebar-menu">
        <a href="./dashboard.html" class="${activePage === "dashboard" ? "active" : ""}">
          <span class="menu-icon">🏠</span>
          <span class="menu-text">Басты бет</span>
        </a>

        <a href="./lessons.html" class="${activePage === "lessons" ? "active" : ""}">
          <span class="menu-icon">📚</span>
          <span class="menu-text">Сабақтар</span>
        </a>

        <a href="./results.html" class="${activePage === "results" ? "active" : ""}">
          <span class="menu-icon">📊</span>
          <span class="menu-text">Нәтижелер</span>
        </a>

        <a href="./profile.html" class="${activePage === "profile" ? "active" : ""}">
          <span class="menu-icon">👤</span>
          <span class="menu-text">Профиль</span>
        </a>
      </nav>

      <button id="logoutBtn" class="logout-btn">
        <span class="logout-icon">🚪</span>
        <span class="logout-text">Шығу</span>
      </button>
    </aside>
  `;

  const sidebar = document.getElementById("sidebar");
  const main = document.querySelector(".main-content");
  const toggle = document.getElementById("menuToggle");
  const overlay = document.getElementById("mobileOverlay");

  sidebar.addEventListener("mouseenter", () => {
    sidebar.classList.add("expanded");
    if (main) main.classList.add("expanded");
  });

  sidebar.addEventListener("mouseleave", () => {
    sidebar.classList.remove("expanded");
    if (main) main.classList.remove("expanded");
  });

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../index.html";
  });
}