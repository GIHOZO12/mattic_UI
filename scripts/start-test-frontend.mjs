import { spawn } from "node:child_process";
const child = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    process.env.E2E_FRONTEND_PORT || "5175",
  ],
  {
    env: {
      ...process.env,
      STOREFRONT_E2E: "true",
      STOREFRONT_BACKEND_URL: "http://127.0.0.1:8001",
    },
    stdio: "inherit",
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
