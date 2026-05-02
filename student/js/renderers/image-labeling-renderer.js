import { makeResult, escapeHtml, normalizeText } from "./helpers.js";

export function renderImageLabeling(data, container) {
  const imageUrl = data.image_url || data.imageUrl || data.image || "";
  const questions = data.labels || [];

  if (!imageUrl || questions.length === 0) {
    container.innerHTML = `<div class="empty-box">Дерек жоқ</div>`;
    return { check: () => makeResult(false, 0, 0) };
  }

  const words = questions
    .map(q => q.answer || "")
    .filter(Boolean)
    .sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <div class="image-labeling-task">

      <div class="image-labeling-top">
        <div class="image-box">
          <img src="${escapeHtml(imageUrl)}" class="image-labeling-img">
        </div>

        <table class="image-labeling-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Жауап</th>
            </tr>
          </thead>
          <tbody>
            ${questions.map((q, index) => `
              <tr>
                <td>${q.number || index + 1}</td>
                <td>
                  <select class="image-label-select" data-index="${index}">
                    <option value="">Таңдаңыз</option>
                    ${words.map(w => `
                      <option value="${escapeHtml(w)}">
                        ${escapeHtml(w)}
                      </option>
                    `).join("")}
                  </select>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return {
    check() {
      let correct = 0;

      questions.forEach((q, index) => {
        const select = container.querySelector(
          `.image-label-select[data-index="${index}"]`
        );

        const userAnswer = normalizeText(select.value);
        const correctAnswer = normalizeText(q.answer || "");

        select.classList.remove("correct", "wrong");

        if (userAnswer === correctAnswer) {
          correct++;
          select.classList.add("correct");
        } else {
          select.classList.add("wrong");
        }
      });

      return makeResult(correct === questions.length, correct, questions.length);
    }
  };
}