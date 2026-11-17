import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { resolve } from "node:path";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { createApp } from "./app.mjs";
const dataDir = resolve("server-data");
const config = existsSync("server-config.json")
  ? JSON.parse(readFileSync("server-config.json", "utf8"))
  : {};
if (config.adminUser) {
  console.log(
    "管理员已配置。若需重置，先备份数据，再运行 node server/admin.mjs reset。",
  );
  if (process.argv[2] !== "reset") process.exit(0);
}
const setup = createApp({ dataDir });
setup.db.close();
const db = new DatabaseSync(resolve(dataDir, "kitchen.sqlite"));
const username = config.adminUser || "xiaozao_admin";
const password = randomBytes(12).toString("base64url");
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
const old = db.prepare("SELECT id FROM users WHERE username=?").get(username);
if (old) {
  db.prepare("UPDATE users SET salt=?,hash=? WHERE id=?").run(
    salt,
    hash,
    old.id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(old.id);
} else
  db.prepare("INSERT INTO users VALUES (?,?,?,?)").run(
    randomUUID(),
    username,
    salt,
    hash,
  );
writeFileSync(
  "server-config.json",
  JSON.stringify(
    { ...config, adminUser: username, port: config.port || 8787 },
    null,
    2,
  ),
);
writeFileSync(
  "管理员账号.txt",
  `用户名：${username}\n密码：${password}\n请私下保管，不要发送给同学。\n`,
);
db.close();
console.log("管理员账号已写入 管理员账号.txt，请私下保管。");
