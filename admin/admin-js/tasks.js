const tasksGrid = document.getElementById("tasksGrid");

const taskTypes = [
  {
    title: "Суретпен белгілеу",
    type: "image_labeling",
    icon: "🖼️",
    description: "Фото немесе схема қойып, нөмірлер бойынша жауап кестесін жасау.",
    page: "admin-tasks/image-labeling/index.html",
    ready: true
  },
  {
    title: "Сәйкестендіру",
    type: "matching",
    icon: "🔗",
    description: "Сол жақтағы ұғымдарды оң жақтағы жауаптармен сәйкестендіру.",
    page: "admin-tasks/matching/index.html",
    ready: true
  },
  {
    title: "True / False",
    type: "true_false",
    icon: "✅",
    description: "Берілген сөйлемдердің дұрыс немесе бұрыс екенін анықтау.",
    page: "admin-tasks/true-false/index.html",
    ready: true
  },
  {
    title: "Тест тапсырмасы",
    type: "cards",
    icon: "🃏",
    description: "Тест тапсырмаларын жасау",
    page: "admin-tasks/quiz/index.html",
    ready: true
  },
  {
    title: "Кроссворд",
    type: "crossword",
    icon: "🧩",
    description: "Тақырып бойынша сөзжұмбақ тапсырмасын жасау.",
    page: "admin-tasks/crossword/index.html",
    ready: true
  },
  {
    title: "Бос орынды толтыру",
    type: "fill_blank",
    icon: "✍️",
    description: "Мәтіндегі бос орындарға дұрыс жауап енгізу тапсырмасы.",
    page: "admin-tasks/fill-blank/index.html",
    ready: true
  }
];

document.addEventListener("DOMContentLoaded", renderTaskTypes);

function renderTaskTypes() {
  tasksGrid.innerHTML = "";

  taskTypes.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-type-card";

    card.innerHTML = `
      <div class="task-icon">${task.icon}</div>
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <span class="task-status ${task.ready ? "" : "soon"}">
        ${task.ready ? "Дайын" : "Жақында"}
      </span>
    `;

    card.addEventListener("click", () => {
      if (!task.ready) {
        showToast("Бұл тапсырма түрін кейін қосамыз", "error");
        return;
      }

      window.location.href = task.page;
    });

    tasksGrid.appendChild(card);
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}
