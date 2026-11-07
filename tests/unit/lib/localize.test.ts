import { expect, test } from "vitest";
import { pick } from "../../../src/lib/localize";

test("pick returns the locale's value", () => {
  expect(pick({ en: "Experience", de: "Erfahrung" }, "de")).toBe("Erfahrung");
  expect(pick({ en: "Experience", de: "Erfahrung" }, "en")).toBe("Experience");
});
