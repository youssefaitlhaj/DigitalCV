import type { Effect } from "../types";

const LETTER_S = 0.04;

/**
 * Splits the name into letters, per word in a `white-space: nowrap` span so a
 * word never breaks across lines. The visible letters are `aria-hidden`; a
 * visually hidden copy keeps the whole name for assistive tech. Returns the
 * letters and a function that reveals the first `n` of them with the cursor
 * right after the last one (at the start when `n` is 0).
 */
function splitName(nameEl: HTMLElement, cursor: HTMLElement) {
  const name = nameEl.textContent ?? "";
  const whole = Object.assign(document.createElement("span"), { className: "visually-hidden", textContent: name });
  const shown = document.createElement("span");
  shown.setAttribute("aria-hidden", "true");
  const letters: HTMLElement[] = [];
  for (const part of name.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      shown.append(part);
      continue;
    }
    const word = shown.appendChild(Object.assign(document.createElement("span"), { className: "wd" }));
    for (const ch of part) {
      letters.push(word.appendChild(Object.assign(document.createElement("span"), { className: "ch off", textContent: ch })));
    }
  }
  nameEl.replaceChildren(whole, shown);
  const reveal = (n: number) => {
    letters.forEach((l, i) => l.classList.toggle("off", i >= n));
    if (n > 0) letters[n - 1].after(cursor);
    else shown.prepend(cursor);
  };
  reveal(0);
  return { letters, reveal };
}

/**
 * ① Hero intro (prototype timings): `whoami` types, the name types letter by
 * letter with the cursor following, the rest fades up, the JSON lines appear
 * then `✓ valid`, the portrait reveals with a clip. The first scroll (or a page
 * that loads already scrolled) completes it at once.
 */
export const effect: Effect = {
  selector: '[data-section="hero"]',
  init(hero, { gsap }) {
    const q = (sel: string) => hero.querySelector<HTMLElement>(sel);
    const cmd = q('[data-intro="cmd"]');
    const nameEl = q('[data-intro="name"] [data-name]');
    const cursor = q('[data-intro="name"] .cur');
    const ok = q('[data-intro="ok"]');
    const photo = q('[data-intro="photo"]');
    const fades = hero.querySelectorAll('[data-intro="fade"]');
    const lines = hero.querySelectorAll('[data-intro="json"] .ln');

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (cmd) {
      const word = cmd.textContent ?? "";
      cmd.textContent = "";
      tl.to(
        {},
        {
          duration: 0.35,
          onUpdate(this: gsap.core.Tween) {
            cmd.textContent = word.slice(0, Math.ceil(this.progress() * word.length));
          },
        },
      );
    }
    if (nameEl && cursor) {
      const { letters, reveal } = splitName(nameEl, cursor);
      tl.to(
        {},
        {
          duration: letters.length * LETTER_S,
          ease: "none",
          onStart: () => cursor.classList.add("typing"),
          onUpdate(this: gsap.core.Tween) {
            reveal(Math.ceil(this.progress() * letters.length));
          },
          onComplete: () => cursor.classList.remove("typing"),
        },
        "+=.08",
      );
    }
    if (fades.length) tl.fromTo(fades, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07 }, "-=.35");
    if (lines.length) tl.fromTo(lines, { x: -8, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, stagger: 0.05 }, "-=.3");
    if (ok) {
      gsap.set(ok, { visibility: "hidden" });
      tl.set(ok, { visibility: "visible" });
    }
    if (photo) {
      tl.fromTo(
        photo,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power4.inOut" },
        0.1,
      );
    }

    // GSAP now owns every intro state, so the pre-paint CSS can step aside.
    hero.classList.add("intro-ready");

    const finish = () => tl.progress(1);
    if (window.scrollY > 0) finish();
    else addEventListener("scroll", finish, { once: true, passive: true });
  },
};
