import type { Effect } from "../types";

/** ⑥ Tags: each group's chips snap in, fast, once the group enters. */
export const effect: Effect = {
  selector: "[data-chips]",
  init(group, { gsap }) {
    gsap.from(group.children, {
      opacity: 0,
      y: 10,
      scale: 0.95,
      duration: 0.35,
      stagger: 0.03,
      ease: "back.out(2)",
      scrollTrigger: { trigger: group, start: "top 88%", once: true },
    });
  },
};
