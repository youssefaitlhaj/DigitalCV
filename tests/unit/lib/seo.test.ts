import { describe, expect, it } from "vitest";
import { loadContent } from "../../../src/content/repository";
import { personJsonLd, serializeJsonLd } from "../../../src/lib/seo";

const content = loadContent("src/content/data");

describe("personJsonLd", () => {
  it("describes the person from content", () => {
    const ld = personJsonLd(content, "en");
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: content.site.name,
      jobTitle: "Software Developer at Imbus AG",
      url: content.site.siteUrl,
      sameAs: [content.site.linkedin],
      address: { "@type": "PostalAddress", addressLocality: "Bamberg" },
    });
  });

  it("is localised", () => {
    expect(personJsonLd(content, "de").jobTitle).toBe("Softwareentwickler bei Imbus AG");
  });

  it("never carries the email, a street or a postal code", () => {
    const json = serializeJsonLd(personJsonLd(content, "en"));
    expect(json).not.toContain("@" + content.site.email.domain);
    expect(json).not.toContain(content.site.email.user);
    expect(json).not.toMatch(/streetAddress|postalCode|telephone|email/);
  });
});

describe("serializeJsonLd", () => {
  it("cannot close the script element", () => {
    expect(serializeJsonLd({ name: "</script><b>" })).not.toContain("</script>");
  });
});
