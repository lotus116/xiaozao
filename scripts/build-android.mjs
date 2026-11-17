import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const toolRoots = [join(root, ".local-build/tools"), "/tmp/little-kitchen-android-tools"];
const env = { ...process.env };
for (const tools of toolRoots) {
  const javaPointer = join(tools, "jdk-home.txt");
  if (!env.JAVA_HOME && existsSync(javaPointer)) {
    const javaHome = resolve(tools, readFileSync(javaPointer, "utf8").trim());
    if (existsSync(join(javaHome, "bin/java"))) env.JAVA_HOME = javaHome;
  }
  const sdk = join(tools, "android-sdk");
  if (!env.ANDROID_HOME && existsSync(join(sdk, "platforms/android-36/android.jar")))
    env.ANDROID_HOME = sdk;
}
env.GRADLE_USER_HOME ||= join(root, ".local-build/gradle");
env.ANDROID_USER_HOME ||= join(root, ".local-build/android-user");
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, env, stdio: "inherit" });
mkdirSync(join(root, ".local-build"), { recursive: true });
const key = join(root, ".local-build/debug.keystore");
if (!existsSync(key))
  run(env.JAVA_HOME ? join(env.JAVA_HOME, "bin/keytool") : "keytool", [
    "-genkeypair",
    "-keystore",
    key,
    "-storepass",
    "android",
    "-alias",
    "androiddebugkey",
    "-keypass",
    "android",
    "-keyalg",
    "RSA",
    "-keysize",
    "2048",
    "-validity",
    "10000",
    "-dname",
    "CN=Android Debug,O=Android,C=US",
    "-noprompt",
  ]);
run("npm", ["run", "android:sync"]);
run(
  "./gradlew",
  ["assembleDebug", "lintDebug", "--no-daemon", "--console=plain"],
  join(root, "android"),
);
const version = JSON.parse(readFileSync(join(root, "package.json"))).version;
const output = join(root, "releases", `xiaozao-${version}-debug.apk`);
mkdirSync(dirname(output), { recursive: true });
copyFileSync(
  join(root, "android/app/build/outputs/apk/debug/app-debug.apk"),
  output,
);
const hash = createHash("sha256").update(readFileSync(output)).digest("hex");
writeFileSync(output + ".sha256", `${hash}  xiaozao-${version}-debug.apk\n`);
console.log(`\nAPK: ${output}\nSHA-256: ${hash}`);
