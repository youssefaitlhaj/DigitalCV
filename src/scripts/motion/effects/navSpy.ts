import type { Effect } from "../types";

/**
 * Nav: the menu link of the section crossing the middle of the viewport is
 * highlighted. A pinned section (the journey) is measured by its pin spacer,
 * which spans the whole pinned scroll, so the link stays lit while it scrubs.
 */
export const effect: Effect = {
  selector: '.site-header nav a[href*="#"]',
  init(link, { ScrollTrigger }) {
    const id = decodeURIComponent((link.getAttribute("href") ?? "").split("#")[1] ?? "");
    const section = id ? document.getElementById(id) : null;
    if (!section) return;
    const update = () => {
      const { top, bottom } = (section.closest(".pin-spacer") ?? section).getBoundingClientRect();
      const middle = innerHeight / 2;
      link.classList.toggle("active", top <= middle && bottom > middle);
    };
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: update });
  },
};
