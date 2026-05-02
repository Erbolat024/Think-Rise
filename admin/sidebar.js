document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.createElement("aside");

  sidebar.className = "admin-sidebar collapsed";

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <span class="logo-icon">⚡</span>
      <div class="logo-text">
        <h2>ThinkRise</h2>
        <span>Admin</span>
      </div>
    </div>
    
    <nav class="sidebar-menu">
      <a href="/admin/dashboard.html">
        <span>🏠</span>
        <p>Dashboard</p>
      </a>

      <a href="/admin/classes.html">
      <span>🏫</span>
      <p>Сыныптар</p>
      </a>

      <a href="/admin/sections.html">
      <span>🧩</span>
      <p>Бөлімдер</p>
      </a>

      <a href="/admin/lessons.html">
        <span>📝</span>
        <p>Сабақтар</p>
      </a>

      <a href="/admin/tasks.html">
        <span>📋</span>
        <p>Тапсырмалар</p>
      </a>
    </nav>

    <div class="sidebar-bottom">
      <button id="logoutBtn">
        <span>🚪</span>
        <p>Шығу</p>
      </button>
    </div>
  `;

  document.body.prepend(sidebar);

  const menuBtn = document.createElement("button");
  menuBtn.className = "mobile-menu-btn";
  menuBtn.innerHTML = "☰";
  document.body.prepend(menuBtn);

  sidebar.addEventListener("mouseenter", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("collapsed");
    }
  });

  sidebar.addEventListener("mouseleave", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.add("collapsed");
    }
  });

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });

  document.querySelectorAll(".sidebar-menu a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("mobile-open");
      }
    });
  });

  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".sidebar-menu a").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });

  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "../auth/login.html";
  });
});