import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const COLOUR_CLASS = /^c-(accent|muted|highlight|positive)$/;

/** Tags allowed everywhere. Inline fields (statement, journey stop text) get only these. */
const INLINE_TAGS = ["p", "br", "strong", "em", "u", "s", "code", "a", "ul", "ol", "li", "span"];
/** Block fields (legal bodies, text paragraphs, descriptions) may also carry section headings. */
const BLOCK_TAGS = [...INLINE_TAGS, "h2", "h3"];

const baseOptions: sanitizeHtml.IOptions = {
  allowedAttributes: { a: ["href", "target", "rel"], span: ["class"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs };
      if (out.target === "_blank") out.rel = "noopener noreferrer";
      else { delete out.target; delete out.rel; }
      return { tagName, attribs: out };
    },
    // marked writes GFM strikethrough (the editor's strikethrough button) as <del>.
    del: () => ({ tagName: "s", attribs: {} }),
    span: (tagName, attribs) => {
      // Keep span class only when every class is an approved colour class.
      const classes = (attribs.class ?? "").split(/\s+/).filter(Boolean);
      const ok = classes.length > 0 && classes.every((c) => COLOUR_CLASS.test(c));
      const out: Record<string, string> = ok ? { class: classes.join(" ") } : {};
      return { tagName, attribs: out };
    },
  },
};

const inlineOptions: sanitizeHtml.IOptions = { ...baseOptions, allowedTags: INLINE_TAGS };
const blockOptions: sanitizeHtml.IOptions = { ...baseOptions, allowedTags: BLOCK_TAGS };

/** Markdown (with raw inline HTML tolerated) -> sanitised HTML. */
export function renderRichText(md: string, opts: { inline?: boolean } = {}): string {
  const raw = opts.inline ? marked.parseInline(md, { async: false }) : marked.parse(md, { async: false });
  return sanitizeHtml(raw, opts.inline ? inlineOptions : blockOptions).trim();
}
