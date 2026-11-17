import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.mjs";
const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=";
const dish = () => ({
  requestId: crypto.randomUUID(),
  name: "番茄拌饭",
  description: "家常饭",
  servings: 2,
  minutes: 10,
  category: "staple",
  level: 1,
  tools: "锅",
  attribution: "原创",
  imageData: photo,
  ingredients: [{ name: "番茄", amount: "2 个" }],
  steps: [
    {
      title: "炒番茄",
      text: "加入番茄翻炒",
      amount: "番茄 2 个",
      heat: "中火",
      cue: "变软",
      seconds: 30,
    },
  ],
});
async function fixture(t, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), "xiaozao-api-"));
  let app = createApp({ dataDir: dir, ...options });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  let base = "http://127.0.0.1:" + app.server.address().port;
  t.after(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });
  const call = async (path, method = "GET", data, token) => {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
  const register = async (name) => {
    const r = await call("/api/auth/register", "POST", {
      username: name,
      password: "password123",
    });
    assert.equal(r.status, 201);
    return r.data;
  };
  return {
    call,
    register,
    promote: (id) => app.db.prepare("UPDATE users SET username=? WHERE id=?").run(options.adminUser, id),
    restart: async () => {
      await app.close();
      app = createApp({ dataDir: dir, ...options });
      await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
      base = "http://127.0.0.1:" + app.server.address().port;
    },
    base: () => base,
  };
}
test("community: publish, versions, ownership, idempotency, deletion and persistence", async (t) => {
  const { call, register, restart, base } = await fixture(t);
  const a = await register("alice");
  const b = await register("bobby");
  const input = dish();
  assert.equal((await call("/api/recipes", "POST", input)).status, 401);
  const created = await call("/api/recipes", "POST", input, a.token);
  assert.equal(created.status, 201);
  const r = created.data;
  assert.equal(
    (await call("/api/recipes", "POST", input, a.token)).data.id,
    r.id,
  );
  assert.equal(
    (
      await call(
        "/api/recipes/" + r.id,
        "PUT",
        { ...input, version: 1 },
        b.token,
      )
    ).status,
    403,
  );
  const image = await fetch(base() + r.image);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  const updated = await call(
    "/api/recipes/" + r.id,
    "PUT",
    { ...input, name: "新版番茄饭", version: 1 },
    a.token,
  );
  assert.equal(updated.data.version, 2);
  assert.equal(
    (
      await call(
        "/api/recipes/" + r.id,
        "PUT",
        { ...input, version: 1 },
        a.token,
      )
    ).status,
    409,
  );
  await restart();
  assert.equal((await call("/api/recipes/" + r.id)).data.version, 2);
  assert.equal(
    (await call("/api/recipes/" + r.id, "DELETE", null, b.token)).status,
    403,
  );
  assert.equal(
    (await call("/api/recipes/" + r.id, "DELETE", null, a.token)).status,
    200,
  );
  assert.equal((await call("/api/recipes/" + r.id)).status, 404);
  assert.equal((await fetch(base() + r.image)).status, 404);
});
test("community: private backups, revoked sessions, validation and reserved admin", async (t) => {
  const { call, register } = await fixture(t, { adminUser: "admin" });
  const a = await register("alice");
  const b = await register("bobby");
  const backup = {
    version: 1,
    pantry: ["番茄"],
    frequentIngredients: [],
    favorites: [],
    preferences: { allergens: [], avoid: [], avoidMode: "hide" },
  };
  assert.equal((await call("/api/backup", "PUT", backup, a.token)).status, 200);
  assert.equal(
    (await call("/api/backup", "GET", null, b.token)).data.data,
    null,
  );
  assert.deepEqual(
    (await call("/api/backup", "GET", null, a.token)).data.data.pantry,
    ["番茄"],
  );
  assert.equal(
    (
      await call(
        "/api/backup",
        "PUT",
        { ...backup, pantry: ["x".repeat(31)] },
        a.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("/api/admin/reports", "GET", null, b.token)).status,
    403,
  );
  assert.equal(
    (
      await call("/api/auth/register", "POST", {
        username: "admin",
        password: "password123",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        "/api/recipes",
        "POST",
        { ...dish(), imageData: "data:image/png;base64,AAAA" },
        a.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("/api/recipes", "POST", { ...dish(), steps: [] }, a.token))
      .status,
    400,
  );
  assert.equal(
    (
      await call("/api/auth/login", "POST", {
        username: "alice",
        password: "incorrect",
      })
    ).status,
    401,
  );
  await call("/api/auth/logout", "POST", {}, a.token);
  assert.equal((await call("/api/backup", "GET", null, a.token)).status, 401);
});
test("community: comment reply rules, deduplication, report access and moderation", async (t) => {
  const { call, register } = await fixture(t, { adminUser: "moderator" });
  const a = await register("alice");
  const b = await register("bobby");
  const r = (await call("/api/recipes", "POST", dish(), a.token)).data;
  const endpoint = "/api/recipes/" + r.id + "/comments";
  const data = { text: "好吃", requestId: crypto.randomUUID() };
  const c = (await call(endpoint, "POST", data, b.token)).data;
  assert.equal((await call(endpoint, "POST", data, b.token)).data.id, c.id);
  const reply = (
    await call(
      endpoint,
      "POST",
      { text: "谢谢", parentId: c.id, requestId: crypto.randomUUID() },
      a.token,
    )
  ).data;
  assert.equal(
    (
      await call(
        endpoint,
        "POST",
        { text: "嵌套", parentId: reply.id, requestId: crypto.randomUUID() },
        a.token,
      )
    ).status,
    400,
  );
  assert.equal(
    (await call("/api/comments/" + c.id, "DELETE", null, a.token)).status,
    403,
  );
  assert.equal(
    (
      await call(
        "/api/reports",
        "POST",
        { kind: "comment", target: c.id, reason: "测试举报" },
        a.token,
      )
    ).status,
    201,
  );
  await call("/api/comments/" + c.id, "DELETE", null, b.token);
  const comments = (await call(endpoint)).data.items;
  assert.equal(comments[0].text, "评论已删除");
  assert.equal(comments[1].text, "谢谢");
});
test("community: ten concurrent users can read, save and comment without data loss", async (t) => {
  const { call, register } = await fixture(t);
  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) => register("user" + i)),
  );
  const r = (await call("/api/recipes", "POST", dish(), users[0].token)).data;
  await Promise.all(
    users.map(async (u, i) => {
      assert.equal((await call("/api/recipes/" + r.id)).status, 200);
      assert.equal(
        (
          await call(
            "/api/recipes/" + r.id + "/comments",
            "POST",
            { text: "comment" + i, requestId: crypto.randomUUID() },
            u.token,
          )
        ).status,
        201,
      );
    }),
  );
  assert.equal(
    (await call("/api/recipes/" + r.id + "/comments")).data.items.length,
    10,
  );
});
test("community: authentication rate limiting", async (t) => {
  const { call } = await fixture(t, { rateLimit: 2 });
  const body = { username: "nobody", password: "password123" };
  await call("/api/auth/login", "POST", body);
  await call("/api/auth/login", "POST", body);
  assert.equal((await call("/api/auth/login", "POST", body)).status, 429);
});

test('community: administrator can resolve reports; concurrent edits cannot overwrite each other', async t => {
  const {call,register,promote}=await fixture(t,{adminUser:'moderator'});
  const a=await register('alice');const admin=await register('localadmin');promote(admin.user.id);
  const r=(await call('/api/recipes','POST',dish(),a.token)).data;
  const edits=await Promise.all([1,2].map(i=>call('/api/recipes/'+r.id,'PUT',{...dish(),version:1,name:'编辑'+i},a.token)));
  assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);
  await call('/api/reports','POST',{kind:'recipe',target:r.id,reason:'需要核查'},a.token);
  const reports=(await call('/api/admin/reports','GET',null,admin.token)).data.items;
  assert.equal(reports.length,1);
  assert.equal((await call('/api/admin/reports/'+reports[0].id,'PUT',{remove:true},a.token)).status,403);
  assert.equal((await call('/api/admin/reports/'+reports[0].id,'PUT',{remove:true},admin.token)).status,200);
  assert.equal((await call('/api/recipes/'+r.id)).status,404);
  assert.equal((await call('/api/admin/reports','GET',null,admin.token)).data.items.length,0);
});
