import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { renderRichText } from "../../../src/lib/rich-text";

describe("renderRichText", () => {
  it("renders bold, italic, underline, link", () => {
    const out = renderRichText("**a** *b* <u>c</u> [d](https://x.dev)", {});
    expect(out).toContain("<strong>a</strong>");
    expect(out).toContain("<em>b</em>");
    expect(out).toContain("<u>c</u>");
    expect(out).toContain('<a href="https://x.dev">');
  });
  it("keeps colour span", () => {
    expect(renderRichText('<span class="c-accent">x</span>', {})).toContain('<span class="c-accent">x</span>');
  });
  it("strips pasted html to allowlist", () => {
    const out = renderRichText('<p style="color:red" onclick="x()">Hi</p><script>alert(1)</script><iframe src="x"></iframe><a href="javascript:alert(1)">l</a><span class="c-evil">z</span>', {});
    expect(out).not.toMatch(/style=|onclick|<script|<iframe|javascript:|c-evil/);
    expect(out).toContain("Hi");
    expect(out).toContain("z");
  });
  it("inline mode has no <p> wrapper", () => {
    expect(renderRichText("hello **w**", { inline: true })).toBe("hello <strong>w</strong>");
    expect(renderRichText("hello", {})).toContain("<p>");
  });
  it("target=_blank forces rel, other targets dropped, relative kept", () => {
    const out = renderRichText('<a href="https://a.b" target="_blank">a</a><a href="/x" target="_top">b</a>', { inline: true });
    expect(out).toContain('target="_blank" rel="noopener noreferrer"');
    expect(out).not.toContain("_top");
    expect(out).toContain('href="/x"');
  });
  it("block mode keeps h2 and h3 headings", () => {
    const out = renderRichText("## Hosting\n\ntext\n\n### Detail", {});
    expect(out).toContain("<h2>Hosting</h2>");
    expect(out).toContain("<h3>Detail</h3>");
  });
  it("block mode still drops other heading levels but keeps their text", () => {
    const out = renderRichText("# One\n\n#### Four", {});
    expect(out).not.toMatch(/<h[1-6]/);
    expect(out).toContain("One");
    expect(out).toContain("Four");
  });
  it("inline mode strips headings", () => {
    const out = renderRichText("<h2>Title</h2> and <h3>more</h3>", { inline: true });
    expect(out).not.toMatch(/<h[23]/);
    expect(out).toContain("Title");
    expect(out).toContain("more");
  });
  it("strikethrough (GFM ~~) renders as <s> in both modes", () => {
    expect(renderRichText("~~gone~~", { inline: true })).toBe("<s>gone</s>");
    expect(renderRichText("~~gone~~", {})).toBe("<p><s>gone</s></p>");
  });
  it("block mode renders bulleted and numbered lists", () => {
    const out = renderRichText("- a\n- b\n\n1. c", {});
    expect(out).toMatch(/<ul>\s*<li>a<\/li>/);
    expect(out).toMatch(/<ol>\s*<li>c<\/li>/);
  });
  it.each(["en", "de"] as const)("the real privacy policy (%s) keeps its section headings", (locale) => {
    const legal = parse(readFileSync("src/content/data/legal.yml", "utf8"));
    const out = renderRichText(legal.privacy.body[locale], {});
    const headings = [...out.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1]);
    const source = [...legal.privacy.body[locale].matchAll(/^## (.+)$/gm)].map((m: RegExpMatchArray) => m[1].trim());
    expect(source.length).toBeGreaterThan(0);
    expect(headings).toEqual(source);
    expect(out).not.toContain("## ");
  });
});

describe("links whose text is their address", () => {
  it("are marked so the PDF does not print the address twice", () => {
    expect(renderRichText("[https://expenger.vercel.app/](https://expenger.vercel.app/)")).toContain("data-bare-url");
    expect(renderRichText("[expenger.vercel.app](https://expenger.vercel.app/)", { inline: true })).toContain("data-bare-url");
  });
  it("other links are not", () => {
    expect(renderRichText("[Expenger](https://expenger.vercel.app/)")).not.toContain("data-bare-url");
  });
});
