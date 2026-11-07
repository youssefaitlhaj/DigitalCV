/**
 * Keep the reader's place when switching language.
 *
 * Section ids are the same in every locale, so the language links carry the
 * section currently under the sticky header as a `#hash` (shareable, and the
 * browser jumps there even without this script on the next page). The exact
 * position inside that section is handed over through sessionStorage, and is
 * re-applied after load, once fonts, images and the pinned journey's spacer
 * have settled the layout.
 */

const KEY = "locale-switch-position";

interface Position {
  id: string;
  /** How far the header line is into the section, 0–1. */
  progress: number;
}

function headerHeight(): number {
  return document.querySelector("header")?.getBoundingClientRect().height ?? 0;
}

function currentPosition(): Position | null {
  if (window.scrollY < 10) return null; // still at the top of the page
  const line = headerHeight() + 1;
  let found: { el: HTMLElement; rect: DOMRect } | null = null;
  for (const el of document.querySelectorAll<HTMLElement>("main section[id]")) {
    const rect = el.getBoundingClientRect();
    if (rect.top <= line) found = { el, rect };
  }
  if (!found) return null; // still at the top of the page
  const { el, rect } = found;
  const progress = rect.height > 0 ? Math.min(1, Math.max(0, (line - rect.top) / rect.height)) : 0;
  return { id: el.id, progress };
}

function restore(): void {
  let saved: Position | null = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable: fall back to the section top */
  }
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target || !target.matches("main section")) return;
  const progress = saved && saved.id === id ? saved.progress : 0;

  const go = () => {
    const rect = target.getBoundingClientRect();
    const top = window.scrollY + rect.top + progress * rect.height - headerHeight();
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  };
  const afterLayout = () => requestAnimationFrame(() => requestAnimationFrame(go));
  if (document.readyState === "complete") afterLayout();
  else window.addEventListener("load", afterLayout, { once: true });
}

export function initKeepSection(): void {
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-locale-link]")) {
    link.addEventListener("click", () => {
      const position = currentPosition();
      const url = new URL(link.href);
      url.hash = position ? position.id : "";
      link.href = url.toString();
      try {
        if (position) sessionStorage.setItem(KEY, JSON.stringify(position));
        else sessionStorage.removeItem(KEY);
      } catch {
        /* the #hash alone still lands on the right section */
      }
    });
  }
  restore();
}
