import { makeResult, escapeHtml, normalizeText } from "./helpers.js";

export function renderCrossword(data, container) {
  const grid = data.grid || [];
  const words = data.words || [];
  const instruction = data.instruction || "";

  if (!grid.length || !words.length) {
    container.innerHTML = `<div class="empty-box">Кроссворд деректері жоқ</div>`;
    return { check: () => makeResult(false, 0, 0) };
  }

  const startMap = {};

  words.forEach(word => {
    startMap[`${word.row}-${word.col}`] = word.number;
  });

  const activePositions = [];

  grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) activePositions.push({ r, c });
    });
  });

  if (!activePositions.length) {
    container.innerHTML = `<div class="empty-box">Кроссворд клеткалары жоқ</div>`;
    return { check: () => makeResult(false, 0, 0) };
  }

  const minRow = Math.min(...activePositions.map(p => p.r));
  const maxRow = Math.max(...activePositions.map(p => p.r));
  const minCol = Math.min(...activePositions.map(p => p.c));
  const maxCol = Math.max(...activePositions.map(p => p.c));

  const croppedGrid = grid
    .slice(minRow, maxRow + 1)
    .map(row => row.slice(minCol, maxCol + 1));

  container.innerHTML = `
    <div class="crossword-student">
      ${instruction ? `<p class="crossword-instruction">${escapeHtml(instruction)}</p>` : ""}

      <div class="crossword-layout">
        <div class="crossword-grid">
          ${croppedGrid.map((row, r) => `
            <div class="crossword-row">
              ${row.map((cell, c) => {
                const realRow = r + minRow;
                const realCol = c + minCol;

                if (!cell) {
                  return `<div class="crossword-cell blocked"></div>`;
                }

                const number = startMap[`${realRow}-${realCol}`] || "";

                return `
                  <div class="crossword-cell active">
                    ${number ? `<span class="crossword-number">${number}</span>` : ""}
                    <input
                      maxlength="1"
                      class="crossword-input"
                      data-row="${realRow}"
                      data-col="${realCol}"
                    >
                  </div>
                `;
              }).join("")}
            </div>
          `).join("")}
        </div>

        <div class="crossword-clues">
          <h4>Сұрақтар:</h4>
          <ul>
            ${words.map(word => `
              <li>
                <b>${word.number}.</b>
                ${escapeHtml(word.clue || "")}
                <small>${word.direction === "horizontal" ? "көлденең" : "тігінен"}</small>
              </li>
            `).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll(".crossword-input").forEach(input => {
    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase().slice(0, 1);
    });
  });

  return {
    check() {
      let correct = 0;
      let total = 0;

      grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (!cell) return;

          const input = container.querySelector(
            `.crossword-input[data-row="${r}"][data-col="${c}"]`
          );

          if (!input) return;

          const userAnswer = normalizeText(input.value);
          const correctAnswer = normalizeText(cell);

          input.classList.remove("correct", "wrong");

          if (userAnswer === correctAnswer) {
            correct++;
            input.classList.add("correct");
          } else {
            input.classList.add("wrong");
          }

          total++;
        });
      });

      return makeResult(correct === total, correct, total);
    }
  };
}