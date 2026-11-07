import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const read = (p: string) => readFileSync(p, "utf8");
const load = (name: string) => parse(read(`.github/workflows/${name}`)) as any;

const ci = load("ci.yml");
const deploy = load("deploy.yml");
const scheduled = load("scheduled-rebuild.yml");
const adminConfig = parse(read("public/admin/config.yml")) as any;

const runs = (job: any): string[] => (job.steps ?? []).map((s: any) => s.run ?? s.uses ?? "");
const idx = (steps: string[], needle: string) => steps.findIndex((s) => s.includes(needle));
const triggers = (wf: any) => wf.on ?? wf[true as any];

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

describe("ci workflows", () => {
  it("deploy sets PUBLIC_DEPLOY_ENV=production and ci does not", () => {
    expect(read(".github/workflows/deploy.yml")).toContain("PUBLIC_DEPLOY_ENV: production");
    expect(read(".github/workflows/ci.yml")).not.toContain("PUBLIC_DEPLOY_ENV");
    expect(read(".github/workflows/scheduled-rebuild.yml")).not.toContain("PUBLIC_DEPLOY_ENV");
  });

  it("ci runs unit, pdf and e2e tests before any deploy step", () => {
    const steps = runs(ci.jobs.ci);
    const build = idx(steps, "npm run build");
    expect(idx(steps, "astro check")).toBeGreaterThan(-1);
    expect(idx(steps, "npm test")).toBeGreaterThan(-1);
    expect(idx(steps, "npm run test:pdf")).toBeGreaterThan(build);
    expect(idx(steps, "playwright test")).toBeGreaterThan(idx(steps, "npm run test:pdf"));
    expect(idx(steps, "playwright install --with-deps chromium")).toBeGreaterThan(-1);
    expect(steps.some((s) => s.includes("wrangler"))).toBe(false);
    expect(triggers(ci).pull_request).toBeDefined();
    expect(triggers(ci).push.branches).toEqual(["main"]);
  });

  it("the required check job is named ci", () => {
    expect(ci.jobs.ci.name).toBe("ci");
  });

  it("uploads the playwright report on failure", () => {
    const up = ci.jobs.ci.steps.find((s: any) => String(s.uses).startsWith("actions/upload-artifact") && s.if?.includes("failure()"));
    expect(up).toBeDefined();
  });

  it("preview posts the commit status context from the admin config", () => {
    const ctx = adminConfig.backend.preview_context;
    expect(ctx).toBe("preview/deploy");
    const text = read(".github/workflows/ci.yml");
    expect(text.split(`context=${ctx}`).length - 1).toBe(2);
    const preview = ci.jobs.preview;
    expect(preview.needs).toContain("ci");
    expect(preview.if).toContain("github.event.pull_request.head.repo.full_name == github.repository");
    expect(preview.permissions.statuses).toBe("write");
    const steps = runs(preview).join("\n");
    expect(steps).toContain("wrangler pages deploy dist");
    expect(steps).toContain("--branch=\"$HEAD_REF\"");
    expect(text).toContain("github.event.pull_request.head.sha");
    expect(text).toContain("target_url");
    // failure path posts failure on the same context
    expect(ci.jobs["preview-failed"].needs).toContain("ci");
    expect(ci.jobs["preview-failed"].permissions.statuses).toBe("write");
    expect(JSON.stringify(ci.jobs["preview-failed"])).toContain("failure");
  });

  it("statuses: write only on preview jobs; default is contents: read", () => {
    expect(ci.permissions).toEqual({ contents: "read" });
    expect(ci.jobs.ci.permissions).toBeUndefined();
    for (const wf of [deploy, scheduled]) {
      expect(JSON.stringify(wf)).not.toContain("statuses");
    }
    const withStatuses = Object.keys(ci.jobs).filter((j) => ci.jobs[j].permissions?.statuses);
    expect(withStatuses.sort()).toEqual(["preview", "preview-failed"]);
  });

  it("deploy only runs after tests, in the same job, on main", () => {
    expect(triggers(deploy).push.branches).toEqual(["main"]);
    expect(triggers(deploy).workflow_call).toBeDefined();
    const jobs = Object.values(deploy.jobs) as any[];
    expect(jobs).toHaveLength(1);
    const steps = runs(jobs[0]);
    const d = idx(steps, "wrangler pages deploy dist");
    expect(d).toBeGreaterThan(-1);
    for (const n of ["astro check", "npm test", "npm run build", "npm run test:pdf", "playwright test"]) {
      expect(idx(steps, n)).toBeGreaterThan(-1);
      expect(idx(steps, n)).toBeLessThan(d);
    }
    expect(steps[d]).toContain("--branch=main");
    expect(deploy.concurrency["cancel-in-progress"]).toBe(false);
  });

  it("scheduled rebuild is weekly and calls deploy.yml", () => {
    expect(triggers(scheduled).schedule).toEqual([{ cron: "0 5 * * 1" }]);
    expect(triggers(scheduled).workflow_dispatch).toBeDefined();
    const job = Object.values(scheduled.jobs)[0] as any;
    expect(job.uses).toBe("./.github/workflows/deploy.yml");
    expect(job.secrets).toBe("inherit");
  });

  it("uses Node 24 everywhere and a pinned wrangler", () => {
    for (const [name, wf] of [["ci", ci], ["deploy", deploy]] as const) {
      for (const job of Object.values(wf.jobs) as any[]) {
        for (const s of job.steps ?? []) {
          if (String(s.uses).startsWith("actions/setup-node")) {
            expect(s.with["node-version"], name).toBe(24);
            expect(s.with.cache).toBe("npm");
          }
        }
      }
    }
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.devDependencies.wrangler).toMatch(/^\d+\.\d+\.\d+$/);
    expect(read(".github/workflows/deploy.yml")).not.toMatch(/npm (i|install) -g/);
  });

  it("no secret values inline", () => {
    for (const f of ["ci.yml", "deploy.yml", "scheduled-rebuild.yml"]) {
      for (const s of allStrings(load(f))) {
        const stripped = s.replace(/\$\{\{[\s\S]*?\}\}/g, "");
        expect(stripped, f).not.toMatch(/[A-Za-z0-9_-]{30,}/);
      }
    }
    for (const f of ["ci.yml", "deploy.yml"]) {
      expect(read(`.github/workflows/${f}`)).toMatch(/secrets\.CLOUDFLARE_API_TOKEN/);
    }
  });
});
