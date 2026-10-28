// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import semver from "semver";
import advisories from "./fixtures/advisories.json";

type Lockfile = { packages: Record<string, { version?: string }> };

// Tests run from the project root (npm test), so the lockfile sits at the root.
const lockPath = resolve(process.cwd(), "package-lock.json");
const lock = JSON.parse(readFileSync(lockPath, "utf8")) as Lockfile;

/** Every installed copy of a package: the top-level one plus any nested copies. */
function installedVersions(name: string): { path: string; version: string }[] {
  const suffix = `node_modules/${name}`;
  return Object.entries(lock.packages)
    .filter(([path, meta]) => (path === suffix || path.endsWith(`/${suffix}`)) && meta.version)
    .map(([path, meta]) => ({ path, version: meta.version as string }));
}

describe("dependency tree", () => {
  it("has a lockfile with installed packages", () => {
    expect(Object.keys(lock.packages).length).toBeGreaterThan(100);
  });

  it("installs no version inside a range npm audit reported as vulnerable", () => {
    const failures: string[] = [];

    for (const advisory of advisories.advisories) {
      for (const { path, version } of installedVersions(advisory.package)) {
        if (semver.satisfies(version, advisory.vulnerableRange, { includePrerelease: true })) {
          const label = advisory.id ? ` (${advisory.id})` : "";
          failures.push(
            `${path} is ${version}, inside vulnerable range "${advisory.vulnerableRange}"${label}: ${advisory.title}`,
          );
        }
      }
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });

  it("keeps the framework and editor on the patched releases", () => {
    // Minimum patched versions from the advisories above. Checked explicitly so a
    // downgrade shows up with a readable message, not just a range match.
    const minimums: Record<string, string> = {
      "@tiptap/core": "3.30.4",
      "@tiptap/react": "3.30.4",
      next: "16.4.2",
      postcss: "8.5.23",
      tailwindcss: "4.0.0",
    };

    for (const [name, min] of Object.entries(minimums)) {
      const top = installedVersions(name).find((v) => v.path === `node_modules/${name}`);
      expect(top, `${name} is not installed`).toBeDefined();
      expect(semver.gte(top!.version, min), `${name} ${top!.version} is older than ${min}`).toBe(true);
    }
  });
});
