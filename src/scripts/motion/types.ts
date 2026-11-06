import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

/** What every effect gets: the GSAP instance and its registered ScrollTrigger plugin. */
export interface MotionContext {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
}

/**
 * One motion effect. `index.ts` calls `init` once for every element matching
 * `selector` that is not inside a section with `data-animate="false"`.
 */
export interface Effect {
  selector: string;
  init(el: Element, ctx: MotionContext): void;
}
