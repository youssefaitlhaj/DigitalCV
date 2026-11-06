import type { Effect } from "../types";

/**
 * Wraps every word of every text node in `<span class="w">`, in place, so the
 * parent `<strong>`, `<u>` and `<span class="c-…">` elements stay around their
 * words. Whitespace stays as plain text, so wrapping is unchanged.
 */
function splitWords(node: Node): void {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      splitWords(child);
      continue;
    }
    if (child.nodeType !== Node.TEXT_NODE) continue;
    const frag = document.createDocumentFragment();
    for (const part of (child.textContent ?? "").split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) frag.append(part);
      else frag.append(Object.assign(document.createElement("span"), { className: "w", textContent: part }));
    }
    child.replaceWith(frag);
  }
}

/** ② Statement: words go from ~14% to full opacity, scrubbed to scroll. */
export const effect: Effect = {
  selector: "[data-statement]",
  init(el, { gsap }) {
    splitWords(el);
    gsap.fromTo(
      el.querySelectorAll(".w"),
      { opacity: 0.14 },
      { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } },
    );
  },
};
