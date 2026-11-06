import type { Effect } from "../types";

/** Nav: the thin "build progress" bar fills with the page scroll. */
export const effect: Effect = {
  selector: "[data-progress]",
  init(bar, { gsap }) {
    gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
  },
};
