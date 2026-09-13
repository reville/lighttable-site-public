// Film samples viewer. film.html lists every image in a <noscript> fallback;
// this layer turns the data block into a comparison stage and detail loupe.
const dataNode = document.querySelector("#film-samples-data");
const viewer = document.querySelector("[data-film-viewer]");

if (dataNode && viewer) {
  const samples = JSON.parse(dataNode.textContent);
  const $ = (selector) => viewer.querySelector(selector);
  const frame = $("[data-frame]");
  const before = $("[data-before]");
  const after = $("[data-after]");
  const range = $("[data-range]");
  const picker = $("[data-picker]");
  const detail = $("[data-detail]");
  const cropBefore = $("[data-crop-before]");
  const cropAfter = $("[data-crop-after]");
  const marker = $("[data-focus-marker]");
  const hint = $("[data-hint]");
  const announce = $("[data-announce]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = { index: 0, split: 50, mode: "slide", zoom: 1, focus: [0.5, 0.5] };

  const setSplit = (value) => {
    state.split = Math.min(100, Math.max(0, value));
    frame.style.setProperty("--split", `${state.split}%`);
    range.value = String(Math.round(state.split));
    range.setAttribute("aria-valuetext", `${Math.round(state.split)}% film off visible`);
  };

  // The detail window shows the 2400px render at 1× (one image pixel per CSS
  // pixel) or 2×. Both crops share one transform so grain lines up exactly.
  const layoutDetail = () => {
    const sample = samples[state.index];
    const windowSize = cropAfter.parentElement.clientWidth;
    if (!windowSize) return;
    const scale = state.zoom;
    const width = sample.width * scale;
    const height = sample.height * scale;
    const maxX = Math.max(0, width - windowSize);
    const maxY = Math.max(0, height - windowSize);
    const x = Math.min(maxX, Math.max(0, state.focus[0] * width - windowSize / 2));
    const y = Math.min(maxY, Math.max(0, state.focus[1] * height - windowSize / 2));
    state.focus = [(x + windowSize / 2) / width, (y + windowSize / 2) / height];
    for (const img of [cropBefore, cropAfter]) {
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      img.style.transform = `translate(${-x}px, ${-y}px)`;
    }
    const frameWidth = frame.clientWidth || 1;
    const shownWidth = (windowSize / width) * 100;
    marker.style.setProperty("--focus-w", `${shownWidth}%`);
    marker.style.setProperty("--focus-x", `${state.focus[0] * 100}%`);
    marker.style.setProperty("--focus-y", `${state.focus[1] * 100}%`);
    marker.style.aspectRatio = `${(windowSize / width) * sample.width} / ${(windowSize / height) * sample.height}`;
    marker.hidden = frameWidth < 1;
  };

  const choose = (index, { focusPicker = false } = {}) => {
    state.index = (index + samples.length) % samples.length;
    const sample = samples[state.index];
    frame.style.setProperty("--ratio", `${sample.width} / ${sample.height}`);
    frame.classList.toggle("is-portrait", sample.height > sample.width);
    const sizes = "(max-width: 760px) 100vw, min(1320px, 100vw)";
    after.srcset = `${sample.afterMedium} 1200w, ${sample.after} 2400w`;
    before.srcset = `${sample.beforeMedium} 1200w, ${sample.before} 2400w`;
    after.sizes = before.sizes = sizes;
    after.src = sample.after;
    before.src = sample.before;
    after.alt = `${sample.alt}, rendered on ${sample.stock}`;
    before.alt = "";
    cropBefore.src = sample.before;
    cropAfter.src = sample.after;
    $("[data-after-label]").textContent = sample.stock;
    $("[data-crop-after-label]").textContent = sample.stock;
    $('[data-fact="stock"]').textContent = sample.stock;
    $('[data-fact="recipe"]').textContent = sample.recipe;
    $('[data-fact="metering"]').textContent = sample.metering;
    $('[data-fact="credit"]').href = sample.credit;
    picker.querySelectorAll("button").forEach((button, i) => {
      button.setAttribute("aria-pressed", String(i === state.index));
      if (focusPicker && i === state.index) button.focus();
    });
    state.focus = [...sample.focus];
    setSplit(50);
    layoutDetail();
    announce.textContent = `${sample.title}, ${sample.stock}`;
    // Warm the neighbours so switching feels instant.
    for (const offset of [1, -1]) {
      const next = samples[(state.index + offset + samples.length) % samples.length];
      new Image().src = next.afterMedium;
    }
  };

  samples.forEach((sample, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "film-pick";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<img alt="" loading="lazy" decoding="async" width="150" height="96"><span><strong></strong><span></span></span>`;
    button.querySelector("img").src = sample.thumb;
    button.querySelector("strong").textContent = sample.title;
    button.querySelector("span > span").textContent = sample.stock;
    button.addEventListener("click", () => choose(index));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") { event.preventDefault(); choose(index + 1, { focusPicker: true }); }
      if (event.key === "ArrowLeft") { event.preventDefault(); choose(index - 1, { focusPicker: true }); }
    });
    picker.append(button);
  });

  // Slide: the transparent range input covers the frame, so pointer drags,
  // touch, and arrow keys all work natively. Pointer events add a smooth drag
  // that follows the finger instead of snapping on the first move.
  range.addEventListener("input", () => setSplit(Number(range.value)));
  const fromPointer = (event) => {
    const rect = frame.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  };
  range.addEventListener("pointerdown", (event) => {
    frame.classList.add("is-dragging");
    setSplit(fromPointer(event)[0] * 100);
  });
  range.addEventListener("pointermove", (event) => {
    if (event.buttons) setSplit(fromPointer(event)[0] * 100);
  });
  addEventListener("pointerup", () => frame.classList.remove("is-dragging"));

  // Double-click, or double-tap, picks the spot shown in the detail view.
  let lastTap = 0;
  const pickFocus = (event) => {
    const [x, y] = fromPointer(event);
    state.focus = [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
    layoutDetail();
  };
  frame.addEventListener("dblclick", pickFocus);
  frame.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    const now = performance.now();
    if (now - lastTap < 320) pickFocus(event);
    lastTap = now;
  });

  // Flip: hold the frame, or Space, to see the original in place.
  const showOriginal = (on) => frame.classList.toggle("is-showing-original", on);
  frame.addEventListener("pointerdown", () => { if (state.mode === "flip") showOriginal(true); });
  addEventListener("pointerup", () => showOriginal(false));
  frame.addEventListener("pointerleave", () => showOriginal(false));

  viewer.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      frame.dataset.mode = state.mode;
      viewer.querySelectorAll("[data-mode]").forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)));
      hint.textContent = state.mode === "flip"
        ? "Press and hold the photo, or hold Space, to see it with film off."
        : "Drag to compare. Double-click a spot to inspect it below.";
      frame.tabIndex = state.mode === "flip" ? 0 : -1;
    });
  });
  addEventListener("keydown", (event) => {
    if (state.mode !== "flip" || event.code !== "Space" || event.repeat) return;
    if (!viewer.contains(document.activeElement) && document.activeElement !== document.body) return;
    event.preventDefault();
    showOriginal(true);
  });
  addEventListener("keyup", (event) => { if (event.code === "Space") showOriginal(false); });

  viewer.querySelectorAll("[data-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      state.zoom = Number(button.dataset.zoom);
      viewer.querySelectorAll("[data-zoom]").forEach((other) =>
        other.setAttribute("aria-pressed", String(other === button)));
      layoutDetail();
    });
  });

  // Pan the detail view by dragging either crop, or with arrow keys.
  let pan = null;
  detail.addEventListener("pointerdown", (event) => {
    const sample = samples[state.index];
    pan = { x: event.clientX, y: event.clientY, focus: [...state.focus],
            w: sample.width * state.zoom, h: sample.height * state.zoom };
    detail.setPointerCapture(event.pointerId);
    detail.classList.add("is-panning");
  });
  detail.addEventListener("pointermove", (event) => {
    if (!pan) return;
    state.focus = [pan.focus[0] - (event.clientX - pan.x) / pan.w,
                   pan.focus[1] - (event.clientY - pan.y) / pan.h];
    layoutDetail();
  });
  const endPan = () => { pan = null; detail.classList.remove("is-panning"); };
  detail.addEventListener("pointerup", endPan);
  detail.addEventListener("pointercancel", endPan);
  detail.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 0.08 : 0.02;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!moves[event.key]) return;
    event.preventDefault();
    state.focus = [state.focus[0] + moves[event.key][0], state.focus[1] + moves[event.key][1]];
    layoutDetail();
  });

  new ResizeObserver(layoutDetail).observe(detail);
  frame.dataset.mode = "slide";
  frame.tabIndex = -1;
  if (reduceMotion) viewer.classList.add("is-reduced-motion");
  viewer.hidden = false;
  choose(0);
}
