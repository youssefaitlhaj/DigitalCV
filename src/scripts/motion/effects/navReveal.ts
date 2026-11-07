import type { Effect } from "../types";

/**
 * Sections bar: hidden (src/styles/motion.css) until the hero is scrolled
 * past, then it slides up; scrolling back to the hero tucks it away again.
 * A page without a hero (the legal pages) shows it straight away.
 */
export const effect: Effect = {
  selector: "[data-secnav]",
  init(nav, { ScrollTrigger }) {
    const hero = document.querySelector('[data-section="hero"]');
    const update = () => {
      const past = !hero || hero.getBoundingClientRect().bottom < innerHeight * 0.75;
      nav.toggleAttribute("data-visible", past);
    };
    update();
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: update });
  },
};
