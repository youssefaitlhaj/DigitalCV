import type { Effect } from "../types";

const TYPE_S = 0.35;

/**
 * Section labels (`// title`) type themselves once on entry. The `//` marker
 * stays; the title text moves into a visually hidden span for assistive tech
 * and is retyped into an `aria-hidden` copy, so headings are never empty.
 */
export const effect: Effect = {
  selector: "[data-typer]",
  init(label, { gsap, ScrollTrigger }) {
    const texts = [...label.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE);
    const text = texts
      .map((n) => n.textContent)
      .join("")
      .trim();
    if (!text) return;
    const whole = Object.assign(document.createElement("span"), { className: "visually-hidden", textContent: text });
    const typed = Object.assign(document.createElement("span"), { className: "typed" });
    typed.setAttribute("aria-hidden", "true");
    texts.forEach((n) => n.remove());
    label.append(" ", whole, typed);

    ScrollTrigger.create({
      trigger: label,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(
          {},
          {
            duration: TYPE_S,
            onUpdate(this: gsap.core.Tween) {
              typed.textContent = text.slice(0, Math.ceil(this.progress() * text.length));
            },
          },
        );
      },
    });
  },
};
