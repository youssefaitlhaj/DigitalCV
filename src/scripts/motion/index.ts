/**
 * The motion layer (spec §5.3). Pure enhancement: the server renders every
 * element in its final state, and the only CSS that hides anything lives under
 * `html.motion` (src/styles/motion.css). Base.astro adds that class before
 * first paint when reduced motion is off, and drops it again after ~3 s unless
 * this module has marked itself ready, so content never waits on this script.
 *
 * Adding an effect: one file in ./effects and one entry in `effects`.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Effect } from "./types";
import { effect as intro } from "./effects/intro";
import { effect as progress } from "./effects/progress";
import { effect as parallax } from "./effects/parallax";
import { effect as statement } from "./effects/statement";
import { effect as counters } from "./effects/counters";
import { effect as journey } from "./effects/journey";
import { effect as rail } from "./effects/rail";
import { effect as typer } from "./effects/typer";
import { effect as chips } from "./effects/chips";
import { effect as scaleIn } from "./effects/scaleIn";
import { effect as navSpy } from "./effects/navSpy";

const effects: Effect[] = [intro, progress, parallax, statement, counters, journey, rail, typer, chips, scaleIn, navSpy];

export function initMotion(): void {
  const root = document.documentElement;
  // No class: reduced motion, or the failsafe already gave up on this script.
  if (!root.classList.contains("motion")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.remove("motion");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const ctx = { gsap, ScrollTrigger };
  let failed = false;
  for (const { selector, init } of effects) {
    for (const el of document.querySelectorAll(selector)) {
      if (el.closest('[data-animate="false"]')) continue;
      try {
        init(el, ctx);
      } catch (error) {
        failed = true;
        console.error(`motion: ${selector} failed`, error);
      }
    }
  }
  // A broken effect must not leave its content hidden: fall back to the final state.
  if (failed) root.classList.remove("motion");
  else root.classList.add("motion-ready");
}
