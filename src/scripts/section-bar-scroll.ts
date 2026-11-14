/**
 * Lets a mouse scroll the sections bar sideways when its links do not all fit.
 *
 * Touch screens and trackpads already scroll the strip natively. A mouse can
 * not: its wheel only scrolls vertically and dragging selects or drags links.
 * So, while the strip overflows:
 *  - the vertical wheel over it scrolls it left/right, and hands the wheel
 *    back to the page once the strip is at that end;
 *  - dragging it with the mouse scrolls it, and the click that ends a drag
 *    does not follow the link under the pointer.
 * When everything fits, the bar behaves like any other element.
 */

/** Pixels the pointer must travel before a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 5;
/** Pixels per wheel "line" (Firefox reports lines for a mouse wheel). */
const LINE = 16;

const overflow = (list: HTMLElement) => list.scrollWidth - list.clientWidth;

function wheelDelta(e: WheelEvent, list: HTMLElement): number {
  const scale = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? list.clientWidth : 1;
  return e.deltaY * scale;
}

function enableWheel(list: HTMLElement): void {
  list.addEventListener(
    "wheel",
    (e) => {
      const max = overflow(list);
      // Sideways gestures (trackpads, tilt wheels) and pinch-zoom are left to the browser.
      if (max <= 0 || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const delta = wheelDelta(e, list);
      const atStart = list.scrollLeft <= 0;
      const atEnd = list.scrollLeft >= max - 1;
      if ((delta < 0 && atStart) || (delta > 0 && atEnd)) return; // let the page scroll
      e.preventDefault();
      list.scrollLeft = Math.max(0, Math.min(max, list.scrollLeft + delta));
    },
    { passive: false },
  );
}

function enableDrag(list: HTMLElement): void {
  let press: { id: number; x: number; left: number } | null = null;
  let dragged = false;

  list.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || overflow(list) <= 0) return;
    press = { id: e.pointerId, x: e.clientX, left: list.scrollLeft };
    dragged = false;
  });

  list.addEventListener("pointermove", (e) => {
    if (!press || e.pointerId !== press.id) return;
    const dx = e.clientX - press.x;
    if (!dragged) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      dragged = true;
      list.setPointerCapture(e.pointerId);
      list.classList.add("dragging");
    }
    list.scrollLeft = press.left - dx;
  });

  const release = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return;
    press = null;
    list.classList.remove("dragging");
    if (list.hasPointerCapture(e.pointerId)) list.releasePointerCapture(e.pointerId);
  };
  list.addEventListener("pointerup", release);
  list.addEventListener("pointercancel", release);

  // The click that ends a drag is not a click on the link under the pointer.
  list.addEventListener(
    "click",
    (e) => {
      if (!dragged) return;
      dragged = false;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );
  // Links are not dragged out of the bar as URLs.
  list.addEventListener("dragstart", (e) => e.preventDefault());
}

export function initSectionBarScroll(list: HTMLElement): void {
  enableWheel(list);
  enableDrag(list);
}
