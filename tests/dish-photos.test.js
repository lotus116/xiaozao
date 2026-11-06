import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { recipes } from "../src/recipes.js";
import photos from "../src/dish-photos.json" with { type: "json" };

test("each recipe ships its own attributed offline image within the mobile storage budget", () => {
  const folder = new URL("../public/dishes/", import.meta.url);
  const files = new Set(readdirSync(folder));
  const fingerprints = new Set();
  const ids = recipes.map((r) => r.id).sort();
  assert.deepEqual(Object.keys(photos).sort(), ids);
  let total = 0;
  for (const id of ids) {
    const info = photos[id];
    assert.ok(info.title && info.credit && info.license && info.source.startsWith("https:") && info.licenseUrl.startsWith("https:"));
    if (info.publisher === "下厨房") {
      assert.ok(info.fullFrame && info.originalImage.startsWith("https://"), id);
      assert.match(info.source, /^https:\/\/(www\.|m\.)?xiachufang\.com\/(recipe|dish)\/\d+\/?$/);
    }
    const variants = info.asset
      ? [[id + "-photo.webp", 27]]
      : [[id + "-thumb.webp", 16], [id + "-view.webp", 80]];
    if (info.asset) assert.equal(info.asset, "/dishes/" + variants[0][0]);
    for (const [path, cap] of variants) {
      const bytes = readFileSync(new URL(path, folder));
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP", path);
      assert.ok(bytes.length <= cap * 1024, path);
      assert.ok(files.delete(path), path);
      const fingerprint = createHash("sha256").update(bytes).digest("hex");
      assert.ok(!fingerprints.has(fingerprint), "another image is identical to " + path);
      fingerprints.add(fingerprint);
      total += bytes.length;
    }
  }
  assert.equal(files.size, 0, "no unused images or originals in the app");
  assert.ok(total <= 3 * 1024 * 1024, "photo collection exceeds the 3 MiB mobile budget");
});
