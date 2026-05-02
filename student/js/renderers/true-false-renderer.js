import { makeResult, escapeHtml } from "./helpers.js";

export function renderTrueFalse(data, container) {
  const questions = data.questions || [];

  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-box">Сұрақтар табылмады</div>`;
    return;
  }

  container.innerHTML = questions.map((q, i) => `
    <div class="tf-card">
      <div class="tf-question">
        <span class="tf-number">${i + 1}</span>
        <h3>${escapeHtml(q.question || "")}</h3>
      </div>

      <div class="tf-actions">
        <button 
          type="button" 
          class="tf-btn" 
          data-name="tf_${i}" 
          data-value="true">
          ✓ Дұрыс
        </button>

        <button 
          type="button" 
          class="tf-btn" 
          data-name="tf_${i}" 
          data-value="false">
          ✕ Бұрыс
        </button>
      </div>

      <input type="hidden" name="tf_${i}" value="">
    </div>
  `).join("");

  // CLICK LOGIC
  container.querySelectorAll(".tf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const value = btn.dataset.value;

      // remove active from both
      container
        .querySelectorAll(`.tf-btn[data-name="${name}"]`)
        .forEach(el => el.classList.remove("selected"));

      // set active
      btn.classList.add("selected");

      // save answer
      const input = container.querySelector(`input[name="${name}"]`);
      if (input) input.value = value;
    });
  });
}

export function checkTrueFalse(data) {
  const questions = data.questions || [];
  let correct = 0;

  questions.forEach((q, i) => {
    const input = document.querySelector(`input[name="tf_${i}"]`);
    if (!input || input.value === "") return;

    const correctAnswer = q.correct ?? q.answer;

    if (String(input.value) === String(correctAnswer)) {
      correct++;
    }
  });

  return makeResult(correct, questions.length);
}