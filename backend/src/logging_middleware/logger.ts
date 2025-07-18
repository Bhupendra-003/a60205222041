// logging-middleware/logger.ts
const TEST_SERVER_URL = "http://20.244.56.144/evaluation-service/logs";
const USE_LOCAL_LOGGING = true; // Set to true to avoid external logging server errors

/**
 * Logging function that can send logs to an external evaluation server or log locally
 *
 * @param stack - The application stack (backend or frontend)
 * @param level - Log level (debug, info, warn, error, fatal)
 * @param pkg - Package/module where the log originated
 * @param message - Log message
 */
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
  // Format the log message for console output
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${stack}] [${level.toUpperCase()}] [${pkg}] ${message}`;

  // Always log to console with appropriate formatting
  switch (level) {
    case "debug":
      console.debug(formattedMessage);
      break;
    case "info":
      console.info(formattedMessage);
      break;
    case "warn":
      console.warn(formattedMessage);
      break;
    case "error":
    case "fatal":
      console.error(formattedMessage);
      break;
  }

  // Skip external logging if USE_LOCAL_LOGGING is true
  if (USE_LOCAL_LOGGING) {
    return;
  }

  // Attempt to send to external logging service
  try {
    const res = await fetch(TEST_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization header if available in the future
        // "Authorization": "c14072c4-fa03-4279-9423-59e518a80d9b"
      },
      body: JSON.stringify({ stack, level, package: pkg, message }),
    });

    if (!res.ok) {
      console.error("External log failed:", await res.text());
    }
  } catch (err) {
    console.error("External log exception:", err);
  }
}
