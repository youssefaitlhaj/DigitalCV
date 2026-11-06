/**
 * Theme switching.
 *
 * The initial resolution happens in an inline script in `Base.astro` — it has
 * to run before first paint or the page flashes the wrong palette. This module
 * only handles what comes after: the toggle, persistence, and following the
 * system preference for as long as the visitor has not overridden it.
 */

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function current(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function apply(theme: Theme, animate: boolean): void {
  const root = document.documentElement;

  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-changing");
    window.setTimeout(() => root.classList.remove("theme-changing"), 320);
  }

  root.dataset.theme = theme;

  for (const button of document.querySelectorAll<HTMLElement>("[data-theme-toggle]")) {
    // The control is a switch: pressed means dark is on.
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

export function initTheme(): void {
  // Reflect whatever the inline script resolved into the button state.
  apply(current(), false);

  for (const button of document.querySelectorAll<HTMLElement>("[data-theme-toggle]")) {
    button.addEventListener("click", () => {
      const next: Theme = current() === "dark" ? "light" : "dark";
      apply(next, true);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode — the choice simply will not survive a reload.
      }
    });
  }

  // Keep following the OS until an explicit choice has been stored.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", (event) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* treat as unset */
    }
    if (stored === "light" || stored === "dark") return;
    apply(event.matches ? "dark" : "light", true);
  });
}
