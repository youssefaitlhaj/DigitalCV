import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const COLOUR_CLASS = /^c-(accent|muted|highlight|positive)$/;

const options: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "code", "a", "ul", "ol", "li", "span"],
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
  },
};

function cleanSpanClasses(html: string): string {
  // Second pass: keep span class only when every class is an approved colour class.
  return sanitizeHtml(html, {
    ...options,
    transformTags: {
      ...options.transformTags,
      span: (tagName, attribs) => {
        const classes = (attribs.class ?? "").split(/\s+/).filter(Boolean);
        const ok = classes.length > 0 && classes.every((c) => COLOUR_CLASS.test(c));
        const out: Record<string, string> = ok ? { class: classes.join(" ") } : {};
        return { tagName, attribs: out };
      },
    },
  });
}

/** Markdown (with raw inline HTML tolerated) -> sanitised HTML. */
export function renderRichText(md: string, opts: { inline?: boolean } = {}): string {
  const raw = opts.inline ? marked.parseInline(md, { async: false }) : marked.parse(md, { async: false });
  return cleanSpanClasses(raw).trim();
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function toPlainText(md: string): string {
  const html = renderRichText(md, {});
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}
