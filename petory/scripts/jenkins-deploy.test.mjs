import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";

const directories = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true });
});

async function runDeploy(extra = {}) {
  const directory = await mkdtemp(join(tmpdir(), "petory-jenkins-test-"));
  directories.push(directory);
  const log = join(directory, "docker.log");
  await writeFile(log, "");
  await writeFile(join(directory, "git"), `#!/bin/sh
case "$1" in
  rev-parse) echo commit123 ;;
  ls-remote) printf '%s\\trefs/heads/main\\n' "\${MOCK_REMOTE:-commit123}" ;;
esac
`, { mode: 0o755 });
  await writeFile(join(directory, "docker"), `#!/bin/sh
printf '%s\\n' "$*" >> "$MOCK_LOG"
case "$1 $2" in
  'volume inspect')
    if [ "\${MOCK_OCCUPIED:-0}" = 1 ]; then
      case "$3" in --format) echo another-owner ;; esac
      exit 0
    fi
    exit 1 ;;
  # A generic inspect finds the identically named image, even though no container exists.
  'inspect petory-jenkins-instructor') exit 0 ;;
  'inspect --format') echo '<no value>'; exit 0 ;;
  'container inspect') exit 1 ;;
esac
exit 0
`, { mode: 0o755 });
  const result = spawnSync("sh", ["scripts/jenkins-deploy.sh"], {
    cwd: process.cwd(), encoding: "utf8",
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, BUILD_NUMBER: "12", MOCK_LOG: log, ...extra },
  });
  return { ...result, log: await readFile(log, "utf8") };
}

describe("Jenkins demo deploy safety", () => {
  it("keeps Linux shell scripts in LF format", async () => {
    for (const script of ["scripts/jenkins-deploy.sh", "scripts/jenkins-integration.sh"]) {
      expect(await readFile(script, "utf8"), `${script} must use LF line endings`).not.toContain("\r");
    }
  });

  it("refuses a stale commit before invoking Docker", async () => {
    const result = await runDeploy({ MOCK_REMOTE: "newer" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not the current origin/main");
    expect(result.log).toBe("");
  });

  it("refuses a volume owned by another workload", async () => {
    const result = await runDeploy({ MOCK_OCCUPIED: "1" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not owned by this demo");
    expect(result.log).not.toContain("stop ");
    expect(result.log).not.toContain("run -dit");
  });

  it("ignores an image with the container's name and deploys with persistent volumes", async () => {
    const result = await runDeploy();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.log).toContain("--name petory-jenkins-instructor");
    expect(result.log).toContain("run -dit --name petory-jenkins-instructor");
    expect(result.log).toContain("container inspect petory-jenkins-instructor");
    expect(result.log).not.toContain("inspect --format");
    expect(result.log).toContain("petory-jenkins-docker-data:/var/lib/docker");
    expect(result.log).toContain("petory-jenkins-demo-state:/var/lib/petory-jenkins-state");
    expect(result.log).toContain("PETORY_DEMO_STATE_PATH=/var/lib/petory-jenkins-state/demo-state.json");
    expect(result.log).not.toContain("stop petory-instructor");
  });
});
