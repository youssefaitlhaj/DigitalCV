import type { Effect } from "../types";

/** ③ Stats count up once as they enter, in under a second. The final number is server-rendered. */
export const effect: Effect = {
  selector: "[data-count]",
  init(el, { gsap }) {
    const target = Number(el.getAttribute("data-count"));
    if (!Number.isFinite(target)) return;
    const final = el.textContent;
    // Count with the value's own decimals (2.5 counts 0.0 … 2.5), and end on the server text.
    const decimals = (String(target).split(".")[1] ?? "").length;
    const counter = { v: 0 };
    gsap.to(counter, {
      v: target,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = counter.v.toFixed(decimals);
      },
      onComplete: () => {
        el.textContent = final;
      },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  },
};
