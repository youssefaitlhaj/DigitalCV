import type { Locale } from "../i18n/locales";
import type { Section } from "../content/schemas/registry";
import { pick } from "./localize";

/** True when a layout section has nothing to show. Fixed sections never are. */
function isEmpty(section: Section): boolean {
  switch (section.type) {
    case "timeline":
    case "cards":
    case "quotes":
      return section.items.length === 0;
    case "tags":
      return section.groups.every((g) => g.items.length === 0);
    case "text":
      return section.paragraphs.length === 0;
    default:
      return false;
  }
}

/** Sections to render: not hidden, and layout sections that have content. */
export function visibleSections(sections: Section[]): Section[] {
  return sections.filter((s) => s.visible && !isEmpty(s));
}

export function menuEntries(sections: Section[], locale: Locale): { id: string; label: string }[] {
  return visibleSections(sections)
    .filter((s) => s.inMenu && s.type !== "hero")
    .map((s) => ({ id: s.id, label: pick(s.title, locale) }));
}

export function pdfSections(sections: Section[]): Section[] {
  return visibleSections(sections).filter((s) => s.inPdf);
}

/** `slugId` already guarantees ids are safe as anchors. */
export function anchorFor(id: string): string {
  return id;
}
