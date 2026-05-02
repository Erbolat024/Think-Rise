import { renderQuiz, checkQuiz } from "./renderers/quiz-renderer.js";
import { renderTrueFalse, checkTrueFalse } from "./renderers/true-false-renderer.js";
import { renderFillBlank, checkFillBlank } from "./renderers/fill-blank-renderer.js";
import { renderMatching, checkMatching } from "./renderers/matching-renderer.js";
import { renderImageLabeling } from "./renderers/image-labeling-renderer.js";
import { renderCrossword } from "./renderers/crossword-renderer.js";
import { escapeHtml } from "./renderers/helpers.js";

let imageLabelingRenderer = null;
let crosswordRenderer = null;

export function renderTask(task, container) {
  const data = parseData(task.data);

  if (task.type === "quiz") {
    return renderQuiz(data, container);
  }

  if (task.type === "true_false") {
    return renderTrueFalse(data, container);
  }

  if (task.type === "fill_blank") {
    return renderFillBlank(data, container);
  }

  if (task.type === "matching") {
    return renderMatching(data, container);
  }

  if (task.type === "image_labeling") {
    imageLabelingRenderer = renderImageLabeling(data, container);
    return imageLabelingRenderer;
  }
  if (task.type === "crossword") {
  crosswordRenderer = renderCrossword(data, container);
  return crosswordRenderer;
  }

  container.innerHTML = `
    <div class="empty-box">
      Бұл тапсырма типі әзірге дайын емес: ${escapeHtml(task.type)}
    </div>
  `;
}

export function checkTask(task) {
  const data = parseData(task.data);

  if (task.type === "quiz") {
    return checkQuiz(data);
  }

  if (task.type === "true_false") {
    return checkTrueFalse(data);
  }

  if (task.type === "fill_blank") {
    return checkFillBlank(data);
  }

  if (task.type === "matching") {
    return checkMatching(data);
  }

  if (task.type === "image_labeling") {
    return imageLabelingRenderer.check();
  }
  if (task.type === "crossword") {
  return crosswordRenderer?.check();
  }

  return {
    correct: 0,
    total: 0,
    percent: 0
  };
}

function parseData(data) {
  try {
    if (!data) return {};
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    console.error("TASK DATA PARSE ERROR:", error);
    return {};
  }
}