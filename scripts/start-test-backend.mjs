import { spawn, spawnSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
const root = resolve("..");
// This database belongs exclusively to this browser suite. Never touch db.sqlite3 at the project root.
const isolatedRoot = resolve(root, "frontend", ".e2e-data");
const isolatedDb = resolve(isolatedRoot, "db.sqlite3");
if (dirname(isolatedDb) !== isolatedRoot)
  throw new Error("Invalid isolated test database path.");
if (existsSync(isolatedDb)) unlinkSync(isolatedDb);
const local = resolve(
  root,
  process.platform === "win32"
    ? "virtenv/Scripts/python.exe"
    : ".venv/bin/python",
);
const python = process.env.E2E_PYTHON || (existsSync(local) ? local : "python");
const env = {
  ...process.env,
  DEBUG: "True",
  USE_SQLITE: "True",
  DJANGO_SETTINGS_MODULE: "mattic_project.frontend_test_settings",
};
function run(args) {
  const result = spawnSync(python, ["manage.py", ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
run(["migrate", "--noinput"]);
run(["seed_store"]);
run(["seed_frontend_images"]);
run([
  "shell",
  "-c",
  "from accounts.models import User; u,_=User.objects.get_or_create(email='owner@e2e.example', defaults={'role':'ADMIN','is_staff':True,'is_superuser':True}); u.set_password('E2e-only-Owner-493!'); u.save()",
]);
run([
  "shell",
  "-c",
  "from PIL import Image; from django.conf import settings; Image.new('RGB',(100,150),'white').save(settings.E2E_ROOT / 'proof.png')",
]);
const child = spawn(
  python,
  ["manage.py", "runserver", "127.0.0.1:8001", "--noreload"],
  { cwd: root, env, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
