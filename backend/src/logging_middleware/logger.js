"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = Log;
const TEST_SERVER_URL = "http://20.244.56.144/evaluation-service/logs";
async function Log(stack, level, pkg, message) {
    try {
        const res = await fetch(TEST_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stack, level, package: pkg, message }),
        });
        if (!res.ok) {
            console.error("Log failed:", await res.text());
        }
    }
    catch (err) {
        console.error("Log exception:", err);
    }
}
//# sourceMappingURL=logger.js.map