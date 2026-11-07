import { z } from "zod";
import { cardsSchema } from "./sections/cards";
import { contactSchema } from "./sections/contact";
import { heroSchema } from "./sections/hero";
import { journeySchema } from "./sections/journey";
import { quotesSchema } from "./sections/quotes";
import { statementSchema } from "./sections/statement";
import { statsSchema } from "./sections/stats";
import { tagsSchema } from "./sections/tags";
import { textSchema } from "./sections/text";
import { timelineSchema } from "./sections/timeline";

export const sectionSchemas = {
  hero: heroSchema,
  statement: statementSchema,
  stats: statsSchema,
  journey: journeySchema,
  contact: contactSchema,
  timeline: timelineSchema,
  cards: cardsSchema,
  tags: tagsSchema,
  text: textSchema,
  quotes: quotesSchema,
};

export type SectionType = keyof typeof sectionSchemas;

export type Section = z.infer<(typeof sectionSchemas)[SectionType]>;
export type SectionOf<T extends SectionType> = z.infer<(typeof sectionSchemas)[T]>;

const sectionUnion = z.discriminatedUnion("type", [
  heroSchema,
  statementSchema,
  statsSchema,
  journeySchema,
  contactSchema,
  timelineSchema,
  cardsSchema,
  tagsSchema,
  textSchema,
  quotesSchema,
]);

/** Ids the page layout already uses: the skip-link target. Every hard-coded id attribute in src must be listed here (a unit test checks). */
export const RESERVED_SECTION_IDS = ["main"] as const;
/** Section headings get the id `<section id>-title`, so a section id with this suffix could clash with another section's heading. */
export const RESERVED_SECTION_ID_SUFFIX = "-title";

export const pageSchema = z
  .object({ sections: z.array(sectionUnion) })
  .superRefine((page, ctx) => {
    const seen = new Set<string>();
    page.sections.forEach((s, i) => {
      if (seen.has(s.id)) {
        ctx.addIssue({ code: "custom", message: `Duplicate section id "${s.id}"`, path: ["sections", i, "id"] });
      }
      seen.add(s.id);
      if ((RESERVED_SECTION_IDS as readonly string[]).includes(s.id)) {
        ctx.addIssue({ code: "custom", message: `Section id "${s.id}" is reserved by the page layout`, path: ["sections", i, "id"] });
      }
      if (s.id.endsWith(RESERVED_SECTION_ID_SUFFIX)) {
        ctx.addIssue({
          code: "custom",
          message: `Section id must not end in "${RESERVED_SECTION_ID_SUFFIX}" (reserved for section headings)`,
          path: ["sections", i, "id"],
        });
      }
    });
    for (const type of ["hero", "contact"] as const) {
      page.sections.forEach((s, i) => {
        if (s.type === type && page.sections.findIndex((o) => o.type === type) !== i) {
          ctx.addIssue({ code: "custom", message: `Only one ${type} section is allowed`, path: ["sections", i, "type"] });
        }
      });
    }
    page.sections.forEach((s, i) => {
      if (s.type !== "stats") return;
      s.items.forEach((item, j) => {
        if (item.value.kind === "count" && !seen.has(item.value.sectionId)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown section "${item.value.sectionId}"`,
            path: ["sections", i, "items", j, "value", "sectionId"],
          });
        }
      });
    });
  });
