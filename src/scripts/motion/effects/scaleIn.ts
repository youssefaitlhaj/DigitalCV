import type { Effect } from "../types";

/** ⑦ Contact: the closing line scales up as its section enters, scrubbed. */
export const effect: Effect = {
  selector: "[data-scale-in]",
  init(line, { gsap }) {
    const section = line.closest("section") ?? line;
    gsap.fromTo(
      line,
      { scale: 0.86, opacity: 0.2 },
      { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: section, start: "top 85%", end: "center 60%", scrub: true } },
    );
  },
};
