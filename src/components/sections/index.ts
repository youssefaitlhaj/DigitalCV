/**
 * The one place section types meet their components (open/closed: a new
 * layout is its schema in the registry plus one entry here and, once print
 * exists, one in `printComponents`). The unit test
 * `tests/unit/sections/registry-complete.test.ts` keeps this in step with
 * `sectionSchemas`.
 */
import type { Content } from "../../content/repository";
import type { SectionOf, SectionType } from "../../content/schemas/registry";
import type { Locale } from "../../i18n/locales";
import Cards from "./Cards.astro";
import Contact from "./Contact.astro";
import Hero from "./Hero.astro";
import Journey from "./Journey.astro";
import Quotes from "./Quotes.astro";
import Statement from "./Statement.astro";
import Stats from "./Stats.astro";
import Tags from "./Tags.astro";
import Text from "./Text.astro";
import Timeline from "./Timeline.astro";

/** The props every section component takes. */
export interface SectionProps<T extends SectionType = SectionType> {
  section: SectionOf<T>;
  locale: Locale;
  content: Content;
}

/** An Astro component rendering one section type. */
export type AstroComponent<T extends SectionType = SectionType> = (props: SectionProps<T>) => unknown;

/** `Record<SectionType, AstroComponent>`, with each entry checked against its own section type. */
export type SectionComponents = { [T in SectionType]: AstroComponent<T> };

export const webComponents: SectionComponents = {
  hero: Hero,
  statement: Statement,
  stats: Stats,
  journey: Journey,
  contact: Contact,
  timeline: Timeline,
  cards: Cards,
  tags: Tags,
  text: Text,
  quotes: Quotes,
};

/** Filled in by the print route (Task 12); until then no type has a print variant. */
export const printComponents: Partial<SectionComponents> = {};

/**
 * The component for a section in a mode. TypeScript cannot correlate
 * `section.type` with the mapped entry, so the lookup is widened once here.
 */
export function componentFor(type: SectionType, mode: "web" | "print"): AstroComponent | undefined {
  const registry = (mode === "print" ? printComponents : webComponents) as Partial<Record<SectionType, AstroComponent>>;
  return registry[type];
}
