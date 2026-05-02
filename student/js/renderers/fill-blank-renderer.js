import { makeResult, escapeHtml, normalizeText } from "./helpers.js";

export function renderFillBlank(data, container) {
  const text = data.text || data.question || "";
  const answers = data.answers || data.answer || data.correctAnswers || [];
  const wordBank = data.words || data.wordBank || data.options || answers;

  const answerList = Array.isArray(answers) ? answers : [answers];
  const wordList = Array.isArray(wordBank) ? wordBank : [wordBank];

  if (!text) {
    container.innerHTML = `<div class="empty-box">Сұрақтар табылмады</div>`;
    return;
  }

  const htmlText = escapeHtml(text).replace(/\{([^}]+)\}/g, `
    <input
      type="text"
      class="fb-inline-input"
      data-index="0"
      placeholder="..."
      autocomplete="off"
      style="width: 8ch;"
    >
  `);

  container.innerHTML = `
    <div class="fb-card">
      <div class="fb-question">
        <span class="fb-number">1</span>
        <h3>${htmlText}</h3>
      </div>

      <div class="fb-word-bank">
        <div class="fb-word-title">Керекті сөздер:</div>
        <div class="fb-words">
          ${wordList.map(word => `
            <button type="button" class="fb-word-btn">
              ${escapeHtml(word)}
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector(".fb-inline-input");

  if (input) {
    input.addEventListener("input", () => autoResizeInput(input));

    container.querySelectorAll(".fb-word-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        input.value = btn.textContent.trim();
        autoResizeInput(input);
        input.focus();
      });
    });
  }
}

export function checkFillBlank(data) {
  const answers = data.answers || data.answer || data.correctAnswers || [];
  const answerList = Array.isArray(answers) ? answers : [answers];

  const input = document.querySelector(".fb-inline-input");

  if (!input) return makeResult(0, 1);

  const userAnswer = normalizeText(input.value);

  const isCorrect = answerList.some(answer => {
    return normalizeText(answer) === userAnswer;
  });

  if (isCorrect) {
    input.classList.add("correct");
    input.classList.remove("wrong");
    return makeResult(1, 1);
  }

  input.classList.add("wrong");
  input.classList.remove("correct");
  return makeResult(0, 1);
}

function autoResizeInput(input) {
  const valueLength = input.value.length || 3;

  const width = Math.min(
    Math.max(valueLength + 2, 8),
    30
  );

  input.style.width = `${width}ch`;
}