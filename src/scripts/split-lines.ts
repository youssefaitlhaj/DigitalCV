/**
 * Splits an element's text into per-line wrappers so each line can rise from
 * behind a clip.
 *
 * Lines are grouped by measured vertical position rather than by character
 * count, so the split follows however the browser actually wrapped the text —
 * which is the only approach that survives fluid type, four different
 * breakpoints, and German compounds wrapping where English does not.
 *
 * Structure produced:  <span class="line"><span class="line-inner">…</span></span>
 * The outer span clips; the inner one is what gets animated.
 */
export interface SplitResult {
  lines: HTMLElement[];
  /** Puts the original text back, so the element can be re-split on resize. */
  revert(): void;
}

export function splitLines(element: HTMLElement): SplitResult {
  // Keep the original nodes themselves rather than serialised markup, so
  // reverting is a DOM operation with no HTML parsing anywhere in the path.
  const original = Array.from(element.childNodes).map((node) => node.cloneNode(true));
  const text = element.textContent ?? "";
  const words = text.split(/(\s+)/).filter((chunk) => chunk.length > 0);

  // Measure with each word in its own inline span.
  element.textContent = "";
  const wordSpans: HTMLElement[] = [];

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      element.appendChild(document.createTextNode(word));
      continue;
    }
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.textContent = word;
    element.appendChild(span);
    wordSpans.push(span);
  }

  // Group words into lines by their offset from the top.
  const rows = new Map<number, HTMLElement[]>();
  for (const span of wordSpans) {
    // Round to absorb sub-pixel differences between words on the same line.
    const top = Math.round(span.offsetTop);
    const bucket = rows.get(top);
    if (bucket) bucket.push(span);
    else rows.set(top, [span]);
  }

  const lines: HTMLElement[] = [];
  const fragment = document.createDocumentFragment();

  for (const [, spans] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    const outer = document.createElement("span");
    outer.className = "line";
    const inner = document.createElement("span");
    inner.className = "line-inner";
    inner.textContent = spans.map((s) => s.textContent).join(" ");

    outer.appendChild(inner);
    fragment.appendChild(outer);
    lines.push(inner);
  }

  element.textContent = "";
  element.appendChild(fragment);

  return {
    lines,
    revert() {
      element.replaceChildren(...original.map((node) => node.cloneNode(true)));
    },
  };
}
