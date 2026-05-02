import { makeResult, escapeHtml } from "./helpers.js";

export function renderQuiz(data, container) {
  const questions = data.questions || [];

  if (questions.length === 0) {
    container.innerHTML = `<div class="empty-box">Сұрақтар табылмады</div>`;
    return;
  }

  container.innerHTML = questions.map((q, i) => `
    <div class="question">
      <h3>${i + 1}. ${escapeHtml(q.question || "")}</h3>

      <div class="options-list">
        ${(q.options || []).map((opt, j) => `
          <label class="option">
            <input type="radio" name="q_${i}" value="${j}">
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");
}

export function checkQuiz(data) {
  const questions = data.questions || [];
  let correct = 0;

  questions.forEach((q, i) => {
    const selected = document.querySelector(`input[name="q_${i}"]:checked`);
    if (!selected) return;

    const correctIndex = q.correctIndex ?? q.correct_index ?? q.answer;

    if (Number(selected.value) === Number(correctIndex)) {
      correct++;
    }
  });

  return makeResult(correct, questions.length);
}