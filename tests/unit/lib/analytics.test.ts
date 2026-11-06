import { expect, test } from "vitest";
import { shouldLoadAnalytics } from "../../../src/lib/analytics";
import type { Site } from "../../../src/content/repository";

const withId = { analytics: { umamiWebsiteId: "abc" } } as Site;
const noId = { analytics: {} } as Site;

test("analytics off in preview/dev, on in production with id", () => {
  expect(shouldLoadAnalytics({}, withId)).toBe(false);
  expect(shouldLoadAnalytics({ PUBLIC_DEPLOY_ENV: "preview" }, withId)).toBe(false);
  expect(shouldLoadAnalytics({ PUBLIC_DEPLOY_ENV: "production" }, noId)).toBe(false);
  expect(shouldLoadAnalytics({ PUBLIC_DEPLOY_ENV: "production" }, withId)).toBe(true);
});
