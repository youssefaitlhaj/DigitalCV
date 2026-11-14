import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { displayUrl } from "./urls";

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

/** A plain-text link in sanitised output: `<a href="…" …>text</a>`. */
const PLAIN_LINK = /<a href="([^"]+)"([^>]*)>([^<]*)<\/a>/g;

/**
 * Marks links whose text is their own address (`[expenger.vercel.app](https://expenger.vercel.app/)`)
 * with `data-bare-url`, so the PDF does not print the address a second time after them.
 */
function markBareUrls(html: string): string {
  return html.replace(PLAIN_LINK, (link, href: string, rest: string, text: string) =>
    displayUrl(text.trim()) === displayUrl(href) ? `<a href="${href}"${rest} data-bare-url>${text}</a>` : link,
  );
}

/** Markdown (with raw inline HTML tolerated) -> sanitised HTML. */
export function renderRichText(md: string, opts: { inline?: boolean } = {}): string {
  const raw = opts.inline ? marked.parseInline(md, { async: false }) : marked.parse(md, { async: false });
  return markBareUrls(sanitizeHtml(raw, opts.inline ? inlineOptions : blockOptions).trim());
}
