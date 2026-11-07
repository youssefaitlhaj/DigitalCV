import { describe, expect, it } from "vitest";
import { GET } from "../../../src/pages/admin/links.json";

describe("/admin/links.json", () => {
  it("emits dashboardUrl (or null) and the pull requests URL", async () => {
    const res = await GET({} as never);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["dashboardUrl", "pullsUrl"]);
    expect(body.pullsUrl).toBe("https://github.com/youssefaitlhaj/DigitalCV/pulls");
    expect(body.dashboardUrl === null || /^https?:\/\//.test(body.dashboardUrl)).toBe(true);
    expect(res.headers.get("content-type")).toMatch(/json/);
  });
});
