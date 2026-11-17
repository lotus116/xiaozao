import {
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const version = JSON.parse(readFileSync("package.json")).version;
const source = resolve(".local-build/windows-runtime");
const hash = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
const expected = {
  "node-v24.21.0-win-x64.zip":
    "158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541",
  "cloudflared.exe":
    "341deda3db5ec498a0482254d6c38c0b7cf01a30c37bb5dd95d2216d08955e35",
};
for (const [name, digest] of Object.entries(expected))
  if (
    !existsSync(resolve(source, name)) ||
    hash(resolve(source, name)) !== digest
  )
    throw new Error("Missing or invalid official dependency: " + name);
const stage = resolve(".local-build/windows-package");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
const name = `xiaozao-${version}-windows-x64`;
const root = resolve(stage, name);
mkdirSync(resolve(root, "runtime"), { recursive: true });
for (const dir of ["server", "shared", "dist"])
  cpSync(dir, resolve(root, dir), { recursive: true });
cpSync("deployment/windows", root, { recursive: true });
cpSync(
  resolve(source, "cloudflared.exe"),
  resolve(root, "runtime/cloudflared.exe"),
);
execFileSync("unzip", [
  "-q",
  resolve(source, "node-v24.21.0-win-x64.zip"),
  "-d",
  resolve(stage, "node"),
]);
for (const file of ["node.exe", "LICENSE"])
  cpSync(
    resolve(stage, "node/node-v24.21.0-win-x64", file),
    resolve(root, "runtime", file === "LICENSE" ? "NODE-LICENSE.txt" : file),
  );
writeFileSync(
  resolve(root, "package.json"),
  JSON.stringify({ private: true, type: "module", version }, null, 2),
);
cpSync(
  resolve(source, "CLOUDFLARED-LICENSE.txt"),
  resolve(root, "runtime/CLOUDFLARED-LICENSE.txt"),
);
cpSync("docs/WINDOWS_SERVER.md", resolve(root, "使用教程.md"));
writeFileSync(
  resolve(root, "DEPENDENCIES.json"),
  JSON.stringify(
    { node: "24.21.0", cloudflared: "2026.11.1", sha256: expected },
    null,
    2,
  ),
);
// UTF-8 BOM lets Windows PowerShell 5.1 read Chinese messages correctly.
for (const file of ["Start-Tunnel.ps1", "Backup.ps1"]) {
  const p = resolve(root, file);
  writeFileSync(p, "\ufeff" + readFileSync(p, "utf8"));
}
const artifact = resolve("releases", name + ".zip");
mkdirSync("releases", { recursive: true });
rmSync(artifact, { force: true });
execFileSync("zip", ["-qr", artifact, name], { cwd: stage });
writeFileSync(artifact + ".sha256", `${hash(artifact)}  ${name}.zip\n`);
console.log(artifact);
