import type { Effect } from "../types";

/** Attributes that make the track wrapper a keyboard scroll region while it scrolls natively. */
const REGION_ATTRS = ["tabindex", "role", "aria-label"] as const;

/**
 * ④ Journey. Wide screens (≥761px): the section pins and the track scrubs
 * sideways while the accent rail fills. While pinned the wrapper no longer
 * scrolls itself, so it stops being a focusable scroll region; leaving the
 * breakpoint restores it. Narrow screens: the vertical stops reveal simply.
 */
export const effect: Effect = {
  selector: "[data-journey]",
  init(section, { gsap }) {
    const track = section.querySelector<HTMLElement>("[data-journey-track]");
    const rail = section.querySelector("[data-journey-rail]");
    const wrap = track?.parentElement;
    if (!track || !wrap) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      const saved = REGION_ATTRS.map((name) => [name, wrap.getAttribute(name)] as const);
      for (const name of REGION_ATTRS) wrap.removeAttribute(name);
      wrap.classList.add("pinned");

      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const scrub = (pin: boolean) => ({
        trigger: section,
        start: "top top",
        end: () => `+=${dist()}`,
        scrub: 0.6,
        pin,
        invalidateOnRefresh: true,
      });
      gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: scrub(true) });
      if (rail) gsap.fromTo(rail, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: scrub(false) });

      return () => {
        wrap.classList.remove("pinned");
        for (const [name, value] of saved) if (value !== null) wrap.setAttribute(name, value);
      };
    });
    mm.add("(max-width: 760px)", () => {
      for (const stop of section.querySelectorAll(".stop")) {
        gsap.from(stop, { opacity: 0, y: 20, duration: 0.5, scrollTrigger: { trigger: stop, start: "top 90%", once: true } });
      }
    });
  },
};
