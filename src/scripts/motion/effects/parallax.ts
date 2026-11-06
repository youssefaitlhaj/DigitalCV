import type { Effect } from "../types";

/** ① Subtle portrait parallax while the hero scrolls away (the image is 115% tall). */
export const effect: Effect = {
  selector: '[data-intro="photo"]',
  init(photo, { gsap }) {
    const img = photo.querySelector("img");
    const hero = photo.closest("section");
    if (!img || !hero) return;
    gsap.to(img, { yPercent: -12, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  },
};
