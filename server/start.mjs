import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { createApp } from "./app.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "server-config.json");
const config = existsSync(configPath)
  ? JSON.parse(readFileSync(configPath, "utf8"))
  : {};
const app = createApp({
  dataDir: resolve(root, process.env.DATA_DIR || "server-data"),
  webDir: resolve(root, "dist"),
  adminUser: config.adminUser || process.env.ADMIN_USER || "",
});
const port = Number(process.env.PORT || config.port || 8787);
app.server.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(
    `小灶服务已启动：http://127.0.0.1:${port}\n保持窗口打开。数据位于 server-data，停止后仍保留。`,
  ),
);
app.server.on("error", (e) => {
  console.error("服务启动失败：", e.message);
  process.exit(1);
});
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, async () => {
    await app.close();
    process.exit(0);
  });
