/**
 * Assembles the contact address at runtime.
 *
 * The two halves ship in separate attributes so the built HTML never contains
 * `user@domain` as one string. This stops naive harvesters, which is all it
 * claims to do — a scraper running a real browser will still see it. The
 * trade-off is deliberate: no CAPTCHA, no contact form, no friction for humans.
 */
export function hydrateEmailLinks(root: ParentNode = document): void {
  const links = root.querySelectorAll<HTMLAnchorElement>("a[data-email]");

  for (const link of links) {
    const user = link.dataset.emailUser;
    const domain = link.dataset.emailDomain;
    if (!user || !domain) continue;

    const address = `${user}@${domain}`;
    link.href = `mailto:${address}`;

    const target = link.querySelector<HTMLElement>("[data-email-text]");
    if (target) target.textContent = address;

    // Only magnetic once it actually goes somewhere.
    link.setAttribute("data-magnetic", "");
  }
}
