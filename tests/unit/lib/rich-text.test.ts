import { describe, expect, it } from "vitest";
import { renderRichText, toPlainText } from "../../../src/lib/rich-text";

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
  it("toPlainText strips tags and decodes entities", () => {
    expect(toPlainText("**a** &amp; <span class=\"c-accent\">b</span>\n\nc")).toBe("a & b c");
  });
});
