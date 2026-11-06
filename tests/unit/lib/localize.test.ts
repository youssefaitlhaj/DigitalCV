import { expect, test } from "vitest";
import { pick, pickText } from "../../../src/lib/localize";

test("pick returns the locale's value", () => {
  expect(pick({ en: "Experience", de: "Erfahrung" }, "de")).toBe("Erfahrung");
  expect(pick({ en: "Experience", de: "Erfahrung" }, "en")).toBe("Experience");
});

test("pickText passes plain strings through and picks localized ones", () => {
  expect(pickText("Java", "de")).toBe("Java");
  expect(pickText({ en: "German", de: "Deutsch" }, "de")).toBe("Deutsch");
});
