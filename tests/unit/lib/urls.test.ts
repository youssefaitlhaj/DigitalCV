import { describe, expect, it } from "vitest";
import { displayUrl } from "../../../src/lib/urls";

describe("displayUrl", () => {
  it("drops the scheme, www and the trailing slash", () => {
    expect(displayUrl("https://www.linkedin.com/in/youssefaitlhaj/")).toBe("linkedin.com/in/youssefaitlhaj");
  });
  it("keeps paths, queries and non-www hosts", () => {
    expect(displayUrl("http://github.com/a/b?x=1")).toBe("github.com/a/b?x=1");
  });
  it("leaves a bare host as the host", () => {
    expect(displayUrl("https://example.com/")).toBe("example.com");
  });
});
