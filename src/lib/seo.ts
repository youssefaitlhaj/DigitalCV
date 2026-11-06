import type { Content } from "../content/repository";
import type { Locale } from "../i18n/locales";
import { pick } from "./localize";

/**
 * schema.org Person for the home page, so search engines read the page as a
 * person. Deliberately carries no email, phone, street or postal code: only
 * the city from the site location.
 */
export function personJsonLd(content: Content, locale: Locale): Record<string, unknown> {
  const { site, page } = content;
  const hero = page.sections.find((s) => s.type === "hero");
  const city = pick(site.location, locale).split(",")[0].trim();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    ...(hero && { jobTitle: pick(hero.role, locale) }),
    url: site.siteUrl,
    sameAs: [site.linkedin],
    address: { "@type": "PostalAddress", addressLocality: city },
  };
}

/** JSON for an inline `<script>`: `<` is escaped so content can never close the element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
