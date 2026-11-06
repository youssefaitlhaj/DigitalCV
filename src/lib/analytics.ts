import type { Site } from "../content/repository";

/** Umami loads only on the production deploy, and only once a website id is configured. */
export function shouldLoadAnalytics(env: { PUBLIC_DEPLOY_ENV?: string }, site: Site): boolean {
  return env.PUBLIC_DEPLOY_ENV === "production" && Boolean(site.analytics.umamiWebsiteId);
}
