import { makeResult, escapeHtml } from "./helpers.js";

let connections = [];
let selectedLeft = null;

export function renderMatching(data, container) {
  const pairs = data.pairs || data.items || [];

  if (pairs.length === 0) {
    container.innerHTML = `<div class="empty-box">Сәйкестендіру сұрақтары табылмады</div>`;
    return;
  }

  connections = [];
  selectedLeft = null;

  const rightItems = shuffleArray(
    pairs.map((item, index) => ({
      text: item.right ?? item.answer ?? item.value ?? "",
      originalIndex: index
    }))
  );

  container.innerHTML = `
    <div class="line-match-wrapper">
      <svg class="line-svg"></svg>

      <div class="line-column">
        ${pairs.map((item, i) => `
          <button class="line-item left-item" data-index="${i}">
            ${escapeHtml(item.left ?? item.question ?? "")}
          </button>
        `).join("")}
      </div>

      <div class="line-column">
        ${rightItems.map((item, i) => `
          <button 
            class="line-item right-item" 
            data-value="${escapeHtml(item.text)}"
            data-original-index="${item.originalIndex}">
            ${escapeHtml(item.text)}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  const wrapper = container.querySelector(".line-match-wrapper");
  const svg = container.querySelector(".line-svg");

    container.querySelectorAll(".left-item").forEach(left => {
    left.addEventListener("click", () => {
        const leftIndex = left.dataset.index;

        const existingConnection = connections.find(
        conn => conn.leftIndex === leftIndex
        );

        if (existingConnection) {
        const oldRight = wrapper.querySelector(
            `.right-item[data-value="${CSS.escape(existingConnection.rightValue)}"]`
        );

        if (oldRight) {
            oldRight.disabled = false;
            oldRight.classList.remove("connected");
        }

        connections = connections.filter(
            conn => conn.leftIndex !== leftIndex
        );

        left.dataset.answer = "";
        left.classList.remove("connected", "selected", "correct", "wrong");

        selectedLeft = null;
        drawLines(wrapper, svg);
        return;
        }

        container.querySelectorAll(".left-item").forEach(el => {
        el.classList.remove("selected");
        });

        selectedLeft = left;
        left.classList.add("selected");
    });
    });

  container.querySelectorAll(".right-item").forEach(right => {
  right.addEventListener("click", () => {
    if (!selectedLeft) return;

    if (right.disabled) return;

    const leftIndex = selectedLeft.dataset.index;
    const rightValue = right.dataset.value;

    const oldConnection = connections.find(conn => conn.leftIndex === leftIndex);

    if (oldConnection) {
      const oldRight = wrapper.querySelector(
        `.right-item[data-value="${CSS.escape(oldConnection.rightValue)}"]`
      );

      if (oldRight) {
        oldRight.disabled = false;
        oldRight.classList.remove("connected");
      }
    }

    connections = connections.filter(conn => conn.leftIndex !== leftIndex);

    connections.push({
      leftIndex,
      rightValue
    });

    selectedLeft.dataset.answer = rightValue;

    selectedLeft.classList.remove("selected");
    selectedLeft.classList.add("connected");

    right.classList.add("connected");
    right.disabled = true;

    selectedLeft = null;

    drawLines(wrapper, svg);
  });
});
}

export function checkMatching(data) {
  const pairs = data.pairs || data.items || [];
  let correct = 0;

  pairs.forEach((item, i) => {
    const left = document.querySelector(`.left-item[data-index="${i}"]`);
    if (!left) return;

    const userAnswer = left.dataset.answer || "";
    const correctAnswer = String(item.right ?? item.answer ?? item.value ?? "").trim();

    if (userAnswer === correctAnswer) {
      correct++;
      left.classList.add("correct");
      left.classList.remove("wrong");
    } else {
      left.classList.add("wrong");
      left.classList.remove("correct");
    }
  });

  return makeResult(correct, pairs.length);
}

function drawLines(wrapper, svg) {
  svg.innerHTML = "";

  const wrapperRect = wrapper.getBoundingClientRect();

  connections.forEach(conn => {
    const left = wrapper.querySelector(`.left-item[data-index="${conn.leftIndex}"]`);
    const right = wrapper.querySelector(`.right-item[data-value="${CSS.escape(conn.rightValue)}"]`);

    if (!left || !right) return;

    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();

    const x1 = leftRect.right - wrapperRect.left;
    const y1 = leftRect.top + leftRect.height / 2 - wrapperRect.top;

    const x2 = rightRect.left - wrapperRect.left;
    const y2 = rightRect.top + rightRect.height / 2 - wrapperRect.top;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("class", "match-line");

    svg.appendChild(line);
  });
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}