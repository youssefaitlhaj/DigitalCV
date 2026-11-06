import type { Effect } from "../types";

/**
 * ⑤ Timeline: the commit rail draws with scroll and each node lights when
 * reached. Text is never touched; only the rail and the node dots change.
 */
export const effect: Effect = {
  selector: "[data-rail]",
  init(log, { gsap, ScrollTrigger }) {
    const fill = log.querySelector("[data-rail-fill]");
    if (fill) {
      gsap.fromTo(
        fill,
        { scaleY: 0 },
        { scaleY: 1, ease: "none", scrollTrigger: { trigger: log, start: "top 70%", end: "bottom 70%", scrub: true } },
      );
    }
    for (const commit of log.querySelectorAll("[data-commit]")) {
      ScrollTrigger.create({
        trigger: commit,
        start: "top 70%",
        onEnter: () => commit.classList.add("lit"),
        onLeaveBack: () => commit.classList.remove("lit"),
      });
    }
  },
};
