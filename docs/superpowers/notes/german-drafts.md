# German drafts for Youssef to review

Every German string below was written by the builder, not copied word for word from `src/i18n/de.ts`. Paths are relative to the YAML file named in each heading.

## src/content/data/page.yml

Section titles (only titles that did not exist in `de.ts`):
- `sections[hero].title.de`: "Start"
- `sections[statement].title.de`: "Leitgedanke"
- `sections[stats].title.de`: "In Zahlen"
- `sections[journey].title.de`: "Werdegang"
- `sections[projects].title.de`: "Projekte"

Hero:
- `hero.subtitle.de`: "Sieben Jahre an TestBench, einer Testmanagement-Plattform, zuerst neben meinem Informatikstudium, jetzt in Vollzeit."
- `hero.ctaPrimary.de`: "Lebenslauf herunterladen (PDF)"
- `hero.ctaSecondary.de`: "Kontakt aufnehmen" (reused from the old `hero.cta`, EN differs: "Contact me")
- `hero.jsonCard[location].values[0].de`: "Bamberg, Deutschland"
- `hero.jsonCard[stack]`: Java, C#, .NET, SQL are identical in both languages
- `hero.jsonCard[speaks].values.de`: "Arabisch", "Deutsch", "Französisch", "Englisch" (from `de.ts` skills)
- `hero.jsonCard[traits].values.de`: "gibt nie auf", "lernt schnell", "Teamplayer"
- `hero.jsonCard[*].key` and `hero.prompt` stay in English by design (code-like)

Statement:
- `statement.text.de`: "Sieben Jahre an einem Produkt. Ich bin bei Imbus als Student eingestiegen, <span class="c-accent">bin während meines ganzen Studiums geblieben</span> und nie gegangen. Heute entwickle ich es in Vollzeit."

Stats labels:
- `stats.items[0].label.de`: "Jahre an TestBench"
- `stats.items[1].label.de`: "Jahre seit meinem ersten professionellen Code"
- `stats.items[2].label.de`: "Abschlüsse in Informatik"
- `stats.items[3].label.de`: "gesprochene Sprachen"

Journey (all `text`, `heading` and `year` entries are drafts; the captions are plain proper-noun strings):
- `journey.stops[0].heading.de`: "Casablanca"
- `journey.stops[0].text.de`: "Fachtechnikerdiplom im Bereich Informatik an der OFPPT."
- `journey.stops[1].heading.de`: "Erster Commit"
- `journey.stops[1].text.de`: "Praktikum bei NT SOFT: eine Anwendung zur Ladenverwaltung in C# und MS SQL Server entwickelt."
- `journey.stops[2].heading.de`: "Bachelor und zwei weitere Praktika"
- `journey.stops[2].text.de`: "Informatik an der Université Hassan II. Eine Versicherungsanwendung ins Web gebracht, danach das Programm eines Vereins online gestellt."
- `journey.stops[3].heading.de`: "Bamberg"
- `journey.stops[3].text.de`: "Nach Deutschland gezogen und in Teilzeit bei Imbus AG eingestiegen, an TestBench."
- `journey.stops[4].heading.de`: "Zweites Studium, weiter am Bauen"
- `journey.stops[4].text.de`: "B.Sc. Software Systems Science an der Universität Bamberg, die ganze Zeit über neben der Arbeit bei Imbus."
- `journey.stops[5].heading.de`: "Vollzeit"
- `journey.stops[5].text.de`: "Softwareentwickler bei Imbus AG: neue Funktionen, Fehlerbehebung und die Erweiterung der Datenbank hinter TestBench."
- `journey.heading.de`: "Von Casablanca nach Bamberg." (EN "From Casablanca to Bamberg.")
- `journey.stops[5].year.de`: "2026" (the " · HEAD" marker is rendered from `head: true`, kept as a git term)

Contact:
- `contact.heading.de`: "Lass uns etwas bauen, das es wert ist."
- `contact.emailLabel.de`: "Schreib mir"
- `contact.cvLabel.de`: "Lebenslauf (PDF)"

## src/content/data/site.yml

- `labels.downloadCv.de`: "Lebenslauf herunterladen (PDF)"
- `labels.privacy.de`: "Datenschutz"
- `labels.impressum.de`: "Impressum"
- `labels.codeLink.de`: "Code"
- `labels.liveLink.de`: "Live"
- `labels.confidential.de`: "Vertraulich"
- `location.de`: "Bamberg, Bayern, Deutschland"

Other label strings (`present`, `year`, `years`, `month`, `months`, `employment.*`, `skipToContent`, `themeToggle`, `language`) and `meta` are word for word from `de.ts`.

## src/content/data/legal.yml

- `privacy.title.de` and the whole `privacy.body.de` (Datenschutzerklärung). **Needs Youssef's review; this is a plain-language draft and not legal advice.** It names Cloudflare Pages (hosting, server logs), Umami Cloud (cookieless analytics, no personal profiles, limited retention), says no cookies are set, lists the GDPR rights and points to the email address. It deliberately contains no postal address or phone number. The English counterpart is `privacy.body.en`. Check the data retention wording against the Umami plan actually used.
- `impressum.body.de`: "Diese Seite wird bewusst nicht veröffentlicht." (placeholder, `visible: false`)

## Notes

- The statement highlight uses `<span class="c-accent">...</span>` inside the Markdown, as the rich-text allowlist permits.
