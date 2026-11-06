import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initSmoothScroll } from "./lenis";
import { splitLines, type SplitResult } from "./split-lines";
import { hydrateEmailLinks } from "./email";
import { initTheme } from "./theme";

/**
 * The entire animation layer.
 *
 * Components never import GSAP. They declare intent with data attributes —
 * `data-reveal`, `data-reveal-text`, `data-magnetic` — and everything that
 * actually moves is wired up here. That keeps the motion vocabulary in one
 * readable place and stops per-component animation drift.
 *
 * Six behaviours, deliberately: smooth scroll, text unmask, staggered reveal,
 * magnetic hover, nav scroll-spy, and the timeline rail. Nothing else.
 */

const EASE = "expo.out";
const DURATION = 0.64;
const STAGGER = 0.06;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ reveals */

function initTextReveals(): SplitResult[] {
  const splits: SplitResult[] = [];

  document.querySelectorAll<HTMLElement>("[data-reveal-text]").forEach((element) => {
    const split = splitLines(element);
    splits.push(split);

    // The parent was hidden to avoid a flash of unsplit text; now that the
    // lines exist and are themselves hidden, it is safe to show it.
    gsap.set(element, { opacity: 1 });
    // 130%, not 100% — the clip box is padded to spare descenders, so the text
    // has to start further out to stay hidden. See `.line` in global.css.
    gsap.set(split.lines, { yPercent: 130, opacity: 1 });

    gsap.to(split.lines, {
      yPercent: 0,
      duration: 1,
      ease: EASE,
      stagger: STAGGER,
      scrollTrigger: { trigger: element, start: "top 88%", once: true },
    });
  });

  return splits;
}

function initReveals(): void {
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: DURATION,
        ease: EASE,
        stagger: STAGGER,
      }),
  });

  gsap.set("[data-reveal]", { y: 24 });
}

/* ----------------------------------------------------------------- magnetic */

function initMagnetic(): void {
  // Pointless and jittery on touch, where there is no cursor to attract to.
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((element) => {
    const strength = 8;
    const setX = gsap.quickTo(element, "x", { duration: 0.4, ease: "power3.out" });
    const setY = gsap.quickTo(element, "y", { duration: 0.4, ease: "power3.out" });

    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      setX((dx / rect.width) * strength * 2);
      setY((dy / rect.height) * strength * 2);
    });

    element.addEventListener("pointerleave", () => {
      setX(0);
      setY(0);
    });
  });
}

/* ---------------------------------------------------------------------- nav */

function initNav(): void {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const indicator = document.querySelector<HTMLElement>("[data-nav-indicator]");
  if (!nav) return;

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));

  // Reveal the nav only once the hero is behind us.
  ScrollTrigger.create({
    trigger: "#about",
    start: "top 80%",
    onEnter: () => nav.setAttribute("data-visible", ""),
    onLeaveBack: () => nav.removeAttribute("data-visible"),
  });

  const list = document.querySelector<HTMLElement>("[data-nav-list]");

  const moveIndicator = (link: HTMLAnchorElement) => {
    if (!indicator) return;

    gsap.to(indicator, {
      // `offset*` is already relative to the scrolling content, so this stays
      // correct while the list is mid-scroll — measuring viewport rects here
      // would drift during the smooth scroll below. Height and vertical offset
      // are driven too, so the pill sits concentric with the label rather than
      // spanning the full height of the list.
      x: link.offsetLeft,
      y: link.offsetTop,
      width: link.offsetWidth,
      height: link.offsetHeight,
      opacity: 1,
      duration: 0.45,
      ease: "power3.out",
    });
  };

  /**
   * Bring the active item into view inside the pill.
   *
   * On a phone the five labels plus the locale switcher are wider than the
   * pill, so without this the later sections — Education, Contact — are
   * scrolled past the right edge and the visitor never sees which section they
   * are in. Centring rather than merely revealing also hints that there is
   * more to either side.
   */
  const revealInPill = (link: HTMLAnchorElement) => {
    if (!list) return;
    const overflow = list.scrollWidth - list.clientWidth;
    if (overflow <= 0) return;

    const centred = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
    list.scrollTo({
      left: Math.max(0, Math.min(centred, overflow)),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const setActive = (id: string) => {
    for (const link of links) {
      const isActive = link.dataset.navLink === id;
      if (isActive) {
        link.setAttribute("aria-current", "true");
        moveIndicator(link);
        revealInPill(link);
      } else {
        link.removeAttribute("aria-current");
      }
    }
  };

  for (const link of links) {
    const id = link.dataset.navLink;
    if (!id) continue;
    const section = document.getElementById(id);
    if (!section) continue;

    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onEnter: () => setActive(id),
      onEnterBack: () => setActive(id),
    });
  }
}

/* ----------------------------------------------------------------- timeline */

function initTimelineRail(): void {
  const rail = document.querySelector<HTMLElement>("[data-timeline-rail]");
  const track = rail?.parentElement;
  const list = rail?.closest("ol");
  if (!rail || !track || !list) return;

  const nodes = Array.from(list.querySelectorAll<HTMLElement>("[data-timeline-node]"));

  /**
   * Where each node sits along the rail, as a fraction of the rail's height.
   * Measured rather than assumed, because entry heights differ per locale —
   * German descriptions wrap to more lines than English.
   */
  let marks: number[] = [];

  const measure = () => {
    const trackBox = track.getBoundingClientRect();
    if (trackBox.height === 0) return;
    marks = nodes.map((node) => {
      const box = node.getBoundingClientRect();
      return (box.top + box.height / 2 - trackBox.top) / trackBox.height;
    });
  };

  const paint = (progress: number) => {
    nodes.forEach((node, i) => {
      const mark = marks[i];
      // A node lights the moment the gold passes its centre.
      node.classList.toggle("is-reached", mark !== undefined && progress >= mark);
    });
  };

  measure();

  gsap.to(rail, {
    scaleY: 1,
    ease: "none",
    scrollTrigger: {
      trigger: list,
      start: "top 75%",
      // Ends when the list bottom reaches 45% of the viewport rather than 75%.
      // At 75% the gold reached full height while two roles were still below
      // the fold, so the indicator finished before the content it tracks.
      end: "bottom 45%",
      scrub: 0.6,
      // Driving the nodes from the rail's own progress keeps them exactly in
      // step with the gold, instead of a second set of triggers that could
      // fire slightly early or late.
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => {
        measure();
        paint(self.progress);
      },
    },
  });
}

/* --------------------------------------------------------------------- boot */

function start(): void {
  // Contact and theme are not animations — they must work regardless of motion
  // preference, so they are wired before the early return below.
  hydrateEmailLinks();
  initTheme();

  if (prefersReducedMotion()) {
    // The CSS already guarantees everything is visible. Binding nothing here is
    // the whole point: no Lenis, no ScrollTriggers, no magnetic listeners.
    return;
  }

  // Claim ownership before touching anything, so the failsafe timer in
  // Base.astro stands down and does not strip `js-motion` mid-setup.
  document.documentElement.setAttribute("data-motion-ready", "");

  try {
    gsap.registerPlugin(ScrollTrigger);
    initSmoothScroll();

    initTextReveals();
    initReveals();
    initMagnetic();
    initNav();
    initTimelineRail();

    ScrollTrigger.refresh();
  } catch (error) {
    // A failure in any one behaviour must not leave the rest of the page
    // hidden. Dropping the flag restores the CSS defaults, but a partially
    // applied tween may have left inline styles behind, so those are cleared
    // directly rather than through GSAP — which may be what just failed.
    document.documentElement.classList.remove("js-motion");
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal], [data-reveal-text], .line-inner",
    );
    for (const element of targets) {
      element.style.opacity = "1";
      element.style.transform = "none";
    }
    console.error("[motion] initialisation failed; revealing content", error);
  }
}

/**
 * Wait for fonts before splitting: line breaks measured against a fallback face
 * are wrong once the real face loads, and wrong line breaks mean visibly wrong
 * clip boundaries.
 */
if (document.fonts?.ready) {
  document.fonts.ready.then(start);
} else {
  window.addEventListener("load", start, { once: true });
}
