import type { Effect } from "../types";

/** ③ Stats count up once as they enter, in under a second. The final number is server-rendered. */
export const effect: Effect = {
  selector: "[data-count]",
  init(el, { gsap }) {
    const target = Number(el.getAttribute("data-count"));
    if (!Number.isFinite(target)) return;
    const counter = { v: 0 };
    gsap.to(counter, {
      v: target,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = String(Math.round(counter.v));
      },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  },
};
