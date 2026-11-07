import type { APIRoute } from "astro";
import { getContent } from "../../content/repository";

/** Lets the admin script (plain JS, no YAML parser) read the few site settings it needs. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      dashboardUrl: getContent().site.analytics.dashboardUrl ?? null,
      pullsUrl: "https://github.com/youssefaitlhaj/DigitalCV/pulls",
    }),
    { headers: { "content-type": "application/json" } },
  );
