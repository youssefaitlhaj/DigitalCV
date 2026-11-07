/**
 * The one place section types meet their components (open/closed: a new
 * layout is its schema in the registry plus one entry in `webComponents` and
 * one in `printComponents`). The unit test
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
import PrintCards from "../print/Cards.astro";
import PrintContact from "../print/Contact.astro";
import PrintHero from "../print/Hero.astro";
import PrintJourney from "../print/Journey.astro";
import PrintQuotes from "../print/Quotes.astro";
import PrintStatement from "../print/Statement.astro";
import PrintStats from "../print/Stats.astro";
import PrintTags from "../print/Tags.astro";
import PrintText from "../print/Text.astro";
import PrintTimeline from "../print/Timeline.astro";

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

/** The print route's components (the PDF CV). Journey and contact render nothing on paper. */
export const printComponents: SectionComponents = {
  hero: PrintHero,
  statement: PrintStatement,
  stats: PrintStats,
  journey: PrintJourney,
  contact: PrintContact,
  timeline: PrintTimeline,
  cards: PrintCards,
  tags: PrintTags,
  text: PrintText,
  quotes: PrintQuotes,
};

/**
 * The component for a section in a mode. TypeScript cannot correlate
 * `section.type` with the mapped entry, so the lookup is widened once here.
 */
export function componentFor(type: SectionType, mode: "web" | "print"): AstroComponent {
  const registry = (mode === "print" ? printComponents : webComponents) as Record<SectionType, AstroComponent>;
  return registry[type];
}
