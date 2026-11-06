// TEMPORARY: the lenis package was removed in Task 7; this legacy file is deleted in Task 9.
// @ts-expect-error module no longer installed
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Smooth scrolling, driven by GSAP's ticker rather than its own rAF loop.
 *
 * Running two independent animation loops is the usual cause of ScrollTrigger
 * firing against stale scroll positions, so Lenis is stepped from the same
 * clock GSAP uses and told to update ScrollTrigger on every frame.
 */
export function initSmoothScroll(): Lenis {
  const lenis = new Lenis({
    lerp: 0.09,
    wheelMultiplier: 1,
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const step = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(step);
  gsap.ticker.lagSmoothing(0);

  // In-page anchors have to go through Lenis, or the browser's native jump
  // fights the smoothed position.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.2 });
    });
  });

  return lenis;
}
