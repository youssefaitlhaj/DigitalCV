import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";
import { useFixtureSite } from "./helpers/fixture-site";

const site = parse(readFileSync("src/content/data/site.yml", "utf8"));

const l = (en: string, de = en) => ({ en, de });
const LONG_WORD = "Softwareentwicklungsprozessoptimierung";
const LONG_URL = ("https://example.com/" + "segment-".repeat(20)).slice(0, 120);
const IMAGE = { src: "/src/assets/uploads/portrait.jpg", alt: l("Screenshot", "Bildschirmfoto") };

/** Elements whose right edge passes the viewport without an ancestor that clips or scrolls them. */
async function overflowing(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== "visible") return true;
      }
      return false;
    };
    return [...document.body.querySelectorAll("*")]
      .filter((el) => el.getBoundingClientRect().right > width + 0.5 && !clipped(el))
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}: ${el.textContent?.slice(0, 40)}`);
  });
}

test.describe("layout sections on the real content", () => {
  test("experience shows 5 commits with HEAD on first", async ({ page }) => {
    await page.goto("/");
    const experience = page.locator('section#experience[data-section="timeline"]');
    await expect(experience.locator("h2.label")).toContainText("Experience");
    await expect(experience.locator("[data-rail]")).toHaveCount(1);
    const commits = experience.locator("[data-commit]");
    await expect(commits).toHaveCount(5);
    await expect(commits.first().locator(".ref")).toHaveText("HEAD");
    await expect(commits.last().locator(".ref")).toHaveText("first commit");
    await expect(experience.locator(".ref")).toHaveCount(2);
    await expect(commits.first().locator(".tag")).toHaveText("Full-time");
    await expect(commits.first().locator("time").first()).toHaveAttribute("datetime", "2026-02");
    await expect(commits.nth(1).locator(".h")).toContainText("Aug 2019 – Jan 2026 · 6 yrs 6 mos");
    await expect(commits.nth(1).locator(".tag")).toHaveText("Part-time");
    await expect(commits.nth(2).locator(".tag")).toHaveText("Internship");
    await expect(commits.first().locator(".desc")).toContainText("Full time on TestBench");
    const org = commits.first().locator(".org a");
    await expect(org).toHaveAttribute("href", "https://www.imbus.de/");
    await expect(org).toHaveAttribute("rel", /noopener/);
    await expect(commits.nth(2).locator(".org a")).toHaveCount(0);
  });

  test("experience is localised on /de/", async ({ page }) => {
    await page.goto("/de/");
    const commits = page.locator("section#experience [data-commit]");
    await expect(commits.nth(1).locator(".tag")).toHaveText("Teilzeit");
    await expect(commits.nth(1).locator(".h")).toContainText("6 Jahre 6 Mon.");
    await expect(commits.first().locator(".h")).toContainText("Heute");
  });

  test("education is compact: three entries, no descriptions", async ({ page }) => {
    await page.goto("/");
    const education = page.locator("section#education");
    await expect(education.locator("li")).toHaveCount(3);
    await expect(education.locator(".desc")).toHaveCount(0);
    await expect(education.locator("h3").first()).toHaveText("B.Sc. Software Systems Science");
    await expect(education.locator("li").first()).toContainText("2020 – 2025");
  });

  test("skills render groups of chips with levels", async ({ page }) => {
    await page.goto("/de/");
    const skills = page.locator('section#skills[data-section="tags"]');
    await expect(skills.locator("[data-chips]")).toHaveCount(5);
    await expect(skills.locator("h3")).toHaveText([
      "Sprachen & Frameworks",
      "Datenbanken",
      "Werkzeuge & Zusammenarbeit",
      "Praxis",
      "Sprachen",
    ]);
    const arabic = skills.locator(".chip").filter({ hasText: "Arabisch" });
    await expect(arabic.locator(".lvl")).toHaveText("Muttersprache");
    await expect(skills.locator(".chip").filter({ hasText: "Werkzeuge bauen, die IT-Arbeit erleichtern" })).toHaveCount(1);
  });

  test("about renders its paragraphs", async ({ page }) => {
    await page.goto("/");
    const about = page.locator('section#about[data-section="text"]');
    await expect(about.locator("p")).toHaveCount(5);
    await expect(about.locator("p").first()).toContainText("I build software at Imbus AG");
  });

  test("page renders every visible section in order", async ({ page }) => {
    await page.goto("/");
    // Not `main > section`: on wide screens the motion layer wraps the pinned journey in a `.pin-spacer`.
    const roots = page.locator("main section[data-section]");
    expect(await roots.evaluateAll((els) => els.map((e) => e.id))).toEqual([
      "hero",
      "statement",
      "stats",
      "journey",
      "about",
      "experience",
      "skills",
      "education",
      "contact",
    ]);
    await expect(page.locator("#projects")).toHaveCount(0);
  });

  test("person JSON-LD comes from content and holds no email", async ({ page, request }) => {
    for (const [path, jobTitle] of [
      ["/", "Software Developer at Imbus AG"],
      ["/de/", "Softwareentwickler bei Imbus AG"],
    ]) {
      await page.goto(path);
      const raw = await page.locator('script[type="application/ld+json"]').textContent();
      const ld = JSON.parse(raw!);
      expect(ld).toMatchObject({ "@type": "Person", name: site.name, jobTitle, sameAs: [site.linkedin] });
      expect(raw).not.toContain(site.email.domain);
      const html = await (await request.get(path)).text();
      expect(html).not.toContain(`${site.email.user}@${site.email.domain}`);
    }
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("every commit and chip is visible", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("[data-commit]")).toHaveCount(5);
      await expect(page.locator("#skills .chip")).toHaveCount(20);
      for (const el of await page.locator("[data-commit], .chip").all()) await expect(el).toBeVisible();
    });
  });
});

test.describe("hidden section", () => {
  const fixture = useFixtureSite("hidden-skills", ({ page }) => {
    page.sections.find((s) => s.id === "skills")!.visible = false;
  });

  test("hidden section absent from menu", async ({ page }) => {
    for (const path of ["/", "/de/"]) {
      await page.goto(fixture.url(path));
      await expect(page.locator("#experience")).toHaveCount(1);
      await expect(page.locator("#skills")).toHaveCount(0);
      await expect(page.locator('header a[href$="#experience"]')).toHaveCount(1);
      await expect(page.locator('header a[href$="#skills"]')).toHaveCount(0);
    }
  });
});

test.describe("layout extremes", () => {
  const fixture = useFixtureSite("layout-extremes", ({ page }) => {
    const byId = (id: string) => page.sections.find((s) => s.id === id)!;
    byId("about").paragraphs.push(l(`See ${LONG_URL} for ${LONG_WORD}.`, `Siehe ${LONG_URL} zur ${LONG_WORD}.`));
    byId("experience").items[0].title = l(LONG_WORD);
    byId("skills").groups.push({ title: l(LONG_WORD), items: [{ label: LONG_WORD, level: l("C1") }] });
    Object.assign(byId("projects"), {
      visible: true,
      items: [
        {
          name: l("Open Project", "Offenes Projekt"),
          description: l(`Public work on ${LONG_URL}`, `Öffentliche Arbeit an ${LONG_URL}`),
          role: l("Developer", "Entwickler"),
          tech: ["Astro", LONG_WORD],
          start: "2024-01",
          end: "present",
          links: { code: LONG_URL, live: "https://example.com/" },
          image: IMAGE,
        },
        {
          name: l("Secret Project", "Geheimes Projekt"),
          description: l("Internal work on TestBench.", "Interne Arbeit an TestBench."),
          role: l("Developer", "Entwickler"),
          tech: ["Java"],
          start: "2022",
          end: "2023",
          links: { code: "https://example.com/secret", live: "https://example.com/secret-live" },
          image: IMAGE,
          confidential: true,
        },
        {
          name: l(LONG_WORD),
          description: l(LONG_WORD),
          role: l(LONG_WORD),
          tech: [LONG_WORD],
        },
      ],
    });
    page.sections.splice(page.sections.length - 1, 0, {
      type: "quotes",
      id: "quotes",
      title: l("Recommendations", "Empfehlungen"),
      items: [
        { quote: l("A great teammate.", "Ein großartiger Kollege."), name: "Jane Doe", role: l("Lead", "Leitung"), photo: IMAGE },
        { quote: l(`${LONG_WORD} ${LONG_URL}`), name: "Max Mustermann", role: l(LONG_WORD) },
      ],
    });
  });

  test("confidential card shows no links or image", async ({ page }) => {
    await page.goto(fixture.url("/"));
    const cards = page.locator('section#projects[data-section="cards"] [data-card]');
    await expect(cards).toHaveCount(3);

    const secret = cards.filter({ hasText: "Secret Project" });
    await expect(secret.locator("a")).toHaveCount(0);
    await expect(secret.locator("img")).toHaveCount(0);
    await expect(secret).toContainText(site.labels.confidential.en);
    await expect(secret).toContainText("Internal work on TestBench.");

    const open = cards.filter({ hasText: "Open Project" });
    const links = open.locator('a[data-umami-event="project-link"]');
    await expect(links).toHaveCount(2);
    await expect(links.first()).toHaveAttribute("href", LONG_URL);
    await expect(links.first()).toHaveAttribute("rel", /noopener/);
    await expect(open.locator("img")).toHaveCount(1);
    await expect(open.locator(".chip")).toHaveText(["Astro", LONG_WORD]);
    await expect(open).not.toContainText(site.labels.confidential.en);
  });

  test("quotes show the quote, name, role and optional photo", async ({ page }) => {
    await page.goto(fixture.url("/de/"));
    const quotes = page.locator('section#quotes[data-section="quotes"] figure');
    await expect(quotes).toHaveCount(2);
    await expect(quotes.first().locator("blockquote")).toContainText("Ein großartiger Kollege.");
    await expect(quotes.first()).toContainText("Jane Doe");
    await expect(quotes.first()).toContainText("Leitung");
    await expect(quotes.first().locator("img")).toHaveCount(1);
    await expect(quotes.nth(1).locator("img")).toHaveCount(0);
  });

  test("no horizontal overflow at 320px", async ({ page }, info) => {
    test.skip(info.project.name !== "narrow", "runs in the 320px project");
    for (const path of ["/", "/de/"]) {
      await page.goto(fixture.url(path));
      await expect(page.getByText(LONG_WORD).first()).toBeAttached();
      await expect(page.getByText(LONG_URL).first()).toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      expect(await overflowing(page)).toEqual([]);
    }
  });
});
