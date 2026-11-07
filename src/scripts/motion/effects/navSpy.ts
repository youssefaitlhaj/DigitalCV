import type { Effect } from "../types";

/**
 * Sections bar: the link of the section crossing the middle of the viewport
 * gets `aria-current` and the accent indicator slides behind it. A pinned
 * section (the journey) is measured by its pin spacer, which spans the whole
 * pinned scroll, so its link stays lit while it scrubs. On a phone, where the
 * strip scrolls, the active link is centred in it.
 */
export const effect: Effect = {
  selector: "[data-secnav]",
  init(nav, { gsap, ScrollTrigger }) {
    const list = nav.querySelector<HTMLElement>("[data-secnav-list]");
    const indicator = nav.querySelector<HTMLElement>("[data-secnav-indicator]");
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[data-secnav-link]")].flatMap((link) => {
      const section = document.getElementById(link.dataset.secnavLink ?? "");
      return section ? [{ link, section }] : [];
    });
    if (links.length === 0) return;

    let current: HTMLAnchorElement | null = null;

    const place = (link: HTMLAnchorElement | null, animate: boolean) => {
      if (!indicator) return;
      // offset* is relative to the scrolling strip, so this holds while it is scrolled.
      const to = link
        ? { x: link.offsetLeft, y: link.offsetTop, width: link.offsetWidth, height: link.offsetHeight, opacity: 1 }
        : { opacity: 0 };
      if (animate) gsap.to(indicator, { ...to, duration: 0.45, ease: "power3.out", overwrite: true });
      else gsap.set(indicator, to);
    };

    const centre = (link: HTMLAnchorElement) => {
      if (!list) return;
      const overflow = list.scrollWidth - list.clientWidth;
      if (overflow <= 0) return;
      const left = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, Math.min(left, overflow)), behavior: "smooth" });
    };

    const update = (refresh: boolean) => {
      const middle = innerHeight / 2;
      const active =
        links.find(({ section }) => {
          const { top, bottom } = (section.closest(".pin-spacer") ?? section).getBoundingClientRect();
          return top <= middle && bottom > middle;
        })?.link ?? null;
      if (active === current) {
        if (refresh) place(current, false); // layout may have moved the link
        return;
      }
      current?.removeAttribute("aria-current");
      active?.setAttribute("aria-current", "true");
      place(active, current !== null && active !== null);
      if (active) centre(active);
      current = active;
    };

    ScrollTrigger.create({ start: 0, end: "max", onUpdate: () => update(false), onRefresh: () => update(true) });
  },
};
