import { describe, expect, it } from "vitest";
import { loadContent } from "../../../src/content/repository";
import { resolveStat } from "../../../src/lib/stats";

const now = new Date(Date.UTC(2026, 10, 6));
const { page } = loadContent();

describe("resolveStat", () => {
  it("yearsSince 2019-08 is 7", () => {
    expect(resolveStat({ value: { kind: "yearsSince", date: "2019-08" } }, page, now)).toBe(7);
  });
  it("yearsSince 2015-03 is 11", () => {
    expect(resolveStat({ value: { kind: "yearsSince", date: "2015-03" } }, page, now)).toBe(11);
  });
  it("count of education is 3", () => {
    expect(resolveStat({ value: { kind: "count", sectionId: "education" } }, page, now)).toBe(3);
  });
  it("override wins", () => {
    expect(resolveStat({ value: { kind: "number", n: 4 }, override: 9 }, page, now)).toBe(9);
  });
  it("number returns n", () => {
    expect(resolveStat({ value: { kind: "number", n: 4 } }, page, now)).toBe(4);
  });
  it("yearsSince future date is 0", () => {
    expect(resolveStat({ value: { kind: "yearsSince", date: "2030-01" } }, page, now)).toBe(0);
  });
  it("count of unknown section is 0", () => {
    expect(resolveStat({ value: { kind: "count", sectionId: "nope" } }, page, now)).toBe(0);
  });
});
