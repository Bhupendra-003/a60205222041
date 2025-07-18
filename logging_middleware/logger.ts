// logging-middleware/logger.ts
const TEST_SERVER_URL = "http://20.244.56.144/evaluation-service/logs";

export async function Log(
  stack: "backend" | "frontend",
  level: "debug" | "info" | "warn" | "error" | "fatal",
  pkg:
    | "cache" | "controller" | "cron_job" | "db"
    | "domain" | "handler" | "repository" | "route" | "service"
    | "auth" | "config" | "middleware" | "utils"
    | "api" | "component" | "hook" | "page" | "state" | "style",
  message: string
) {
  try {
    const res = await fetch(TEST_SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });

    if (!res.ok) {
      console.error("Log failed:", await res.text());
    }
  } catch (err) {
    console.error("Log exception:", err);
  }
}
