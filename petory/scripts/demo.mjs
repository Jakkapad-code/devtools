import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const statePath = new URL("../.env.quick-demo", import.meta.url);

export function tunnelUrlFromLogs(logs) {
  const urls = logs.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com\b/g);
  return urls?.at(-1) ?? null;
}

export function demoDatabaseIsSafe(counts) {
  return /^\d+\|0$/.test(counts.trim());
}

async function main() {
  const action = process.argv[2] || "start";
  if (!["start", "stop", "status"].includes(action)) throw new Error("Usage: node scripts/demo.mjs start|stop|status");
  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (action !== "start") throw new Error("Demo has not been initialized. Run npm run demo:start first.");
    state = { dbPassword: randomBytes(24).toString("hex"), sessionSecret: randomBytes(48).toString("hex") };
    writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  }
  if (!/^[a-f0-9]{48}$/.test(state.dbPassword) || !/^[a-f0-9]{96}$/.test(state.sessionSecret)) {
    throw new Error("Invalid .env.quick-demo credentials. Do not delete this file while keeping the database volume.");
  }
  const compose = (args, capture = false) => {
    const result = spawnSync("docker", ["compose", "-p", "petory_quick_demo", "-f", "docker-compose.demo.yml", ...args], {
      cwd: root,
      env: {
        ...process.env,
        PETORY_DEMO_DB_PASSWORD: state.dbPassword,
        PETORY_DEMO_SESSION_SECRET: state.sessionSecret,
        PETORY_DEMO_URL: state.publicUrl || "https://demo.invalid",
      },
      encoding: "utf8",
      stdio: capture ? "pipe" : "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(capture ? result.stderr || "Docker Compose failed" : "Docker Compose failed; see output above.");
    return capture ? result.stdout + result.stderr : "";
  };

  if (action === "stop") {
    compose(["stop"]);
    console.log("Demo stopped. Database data and credentials are preserved.");
    return;
  }
  if (action === "status") {
    compose(["ps"]);
    console.log("Last demo URL (may be offline):", state.publicUrl || "Not started");
    return;
  }

  console.log("Starting isolated mock demo; existing project databases and .env.local are not used.");
  compose(["stop", "tunnel"]);
  compose(["up", "-d", "--wait", "database"]);
  compose(["build", "migrate", "seed"]);
  compose(["run", "--rm", "--no-deps", "migrate"]);
  const counts = compose(["exec", "-T", "database", "psql", "-U", "petory", "-d", "petory_demo", "-At", "-c",
    "SELECT COUNT(*), COUNT(*) FILTER (WHERE email NOT LIKE '%@petory.local') FROM accounts;"], true).trim();
  if (!demoDatabaseIsSafe(counts)) throw new Error("Refusing to publish: this demo DB contains non-demo accounts. Existing data was not deleted.");
  if (counts === "0|0") compose(["run", "--rm", "--no-deps", "seed"]);
  else console.log("Existing demo data preserved; seed will not run again.");

  try {
    compose(["up", "-d", "--no-deps", "--force-recreate", "tunnel"]);
    let publicUrl = null;
    for (let attempt = 0; attempt < 45 && !publicUrl; attempt++) {
      publicUrl = tunnelUrlFromLogs(compose(["logs", "--no-color", "--tail", "200", "tunnel"], true));
      if (!publicUrl) await delay(2_000);
    }
    if (!publicUrl) throw new Error("Cloudflare did not issue a URL. Check npm run demo:status and Docker tunnel logs.");
    state.publicUrl = publicUrl;
    writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", { mode: 0o600 });
    console.log("Cloudflare URL:", publicUrl, "\nBuilding the app for this exact origin...");
    compose(["up", "-d", "--no-deps", "--build", "--wait", "app"]);
    console.log("Checking the public HTTPS endpoint...");
    let ready = false;
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline && !ready) {
      try {
        const response = await fetch(`${publicUrl}/api/health`, { signal: AbortSignal.timeout(5_000) });
        ready = response.ok && (await response.json()).status === "ok";
      } catch { /* DNS and the tunnel can need a moment to become available. */ }
      if (!ready) await delay(2_000);
    }
    if (!ready) throw new Error("Public health check failed. Run npm run demo:start to create a fresh tunnel.");
    const login = await fetch(`${publicUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: publicUrl },
      body: JSON.stringify({ email: "aom@petory.local", password: "petory-demo-password-2026" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!login.ok) throw new Error(`Public demo login failed (${login.status}). Check the demo account credentials.`);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    if (!cookie) throw new Error("Login did not return a session cookie.");
    const logout = await fetch(`${publicUrl}/api/auth/logout`, {
      method: "POST", headers: { Origin: publicUrl, Cookie: cookie }, signal: AbortSignal.timeout(20_000),
    });
    if (!logout.ok) throw new Error(`Demo logout failed (${logout.status}).`);
    console.log(`\nREADY: ${publicUrl}/petory/login\nEmail: aom@petory.local\nPassword: petory-demo-password-2026\nStop: npm run demo:stop\nKeep Docker, your computer and internet on. Use mock data only.`);
  } catch (error) {
    compose(["stop", "tunnel"]);
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
