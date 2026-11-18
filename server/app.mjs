import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomUUID,
  randomBytes,
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import {
  recipeInput,
  imageInput,
  backupInput,
  text,
  fail,
  IMAGE_LIMIT,
} from "../shared/community-schema.js";
const derive = promisify(scrypt);
const digest = (value) => createHash("sha256").update(value).digest("hex");
export function createApp({
  dataDir,
  webDir,
  adminUser = "",
  rateLimit = 120,
} = {}) {
  mkdirSync(resolve(dataDir, "images"), { recursive: true });
  const db = new DatabaseSync(resolve(dataDir, "kitchen.sqlite"));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS recipes (id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES users(id), version INTEGER NOT NULL, body TEXT NOT NULL, image TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, updated TEXT NOT NULL, request_id TEXT NOT NULL, UNIQUE(author_id,request_id));
    CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, recipe_id TEXT NOT NULL REFERENCES recipes(id), author_id TEXT NOT NULL REFERENCES users(id), parent_id TEXT, body TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, created TEXT NOT NULL, request_id TEXT NOT NULL, UNIQUE(author_id,request_id));
    CREATE TABLE IF NOT EXISTS backups (user_id TEXT PRIMARY KEY REFERENCES users(id), body TEXT NOT NULL, updated TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, target TEXT NOT NULL, reason TEXT NOT NULL, created TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, UNIQUE(user_id,kind,target));`);
  db.prepare("INSERT OR IGNORE INTO meta VALUES (?,?)").run(
    "serverId",
    randomUUID(),
  );
  const serverId = db
    .prepare("SELECT value FROM meta WHERE key=?")
    .get("serverId").value;
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const limits = new Map();
  const userView = (u) => ({
    id: u.id,
    username: u.username,
    admin: !!adminUser && u.username === adminUser,
  });
  const auth = (req) => {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(
      req.headers.authorization || "",
    )?.[1];
    const u =
      token &&
      one(
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
        digest(token),
        Date.now(),
      );
    if (!u) fail("登录已过期，请重新登录", 401);
    return userView(u);
  };
  const recipe = (id) => {
    const r = one(
      "SELECT r.*,u.username FROM recipes r JOIN users u ON r.author_id=u.id WHERE r.id=? AND r.deleted=0",
      id,
    );
    if (!r) fail("菜谱已删除或不存在", 404);
    return r;
  };
  const viewRecipe = (r) => ({
    ...JSON.parse(r.body),
    id: r.id,
    serverId,
    author: r.username,
    authorId: r.author_id,
    version: r.version,
    image: `/api/images/${r.image}`,
    updated: r.updated,
  });
  const saveImage = (value) => {
    imageInput(value);
    const data = Buffer.from(value.split(",")[1], "base64");
    const mime = value.slice(11, value.indexOf(";"));
    const valid =
      mime === "jpeg"
        ? data[0] === 255 && data[1] === 216 && data[2] === 255
        : mime === "png"
          ? data
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : data.toString("ascii", 0, 4) === "RIFF" &&
            data.toString("ascii", 8, 12) === "WEBP";
    if (!valid || data.length > IMAGE_LIMIT || data.length < 16)
      fail("图片内容或大小不正确");
    const name = `${digest(data)}.${mime}`;
    const dest = resolve(dataDir, "images", name);
    if (!existsSync(dest)) writeFileSync(dest, data);
    return name;
  };
  const session = (u) => {
    run("DELETE FROM sessions WHERE expires<?", Date.now());
    const token = randomBytes(32).toString("hex");
    run(
      "INSERT INTO sessions VALUES (?,?,?)",
      digest(token),
      u.id,
      Date.now() + 7 * 86400000,
    );
    return { token, user: userView(u), serverId };
  };
  const body = async (req) => {
    if (!String(req.headers["content-type"]).startsWith("application/json"))
      fail("需要 JSON 请求", 415);
    let size = 0;
    const chunks = [];
    for await (const part of req) {
      size += part.length;
      if (size > 2300000) fail("上传内容太大", 413);
      chunks.push(part);
    }
    try {
      return JSON.parse(Buffer.concat(chunks));
    } catch {
      fail("请求格式不正确");
    }
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    const send = (status, value) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(value));
    };
    try {
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      const method = req.method;
      if (path === "/api/health")
        return send(200, { ok: true, serverId, version: "1.8.0" });
      if (path.startsWith("/api/") && method !== "GET") {
        // Do not trust forwarded IP headers supplied by public clients.
        const key =
          (req.socket.remoteAddress || "local") +
          (path.startsWith("/api/auth/") ? ":auth" : ":write");
        const current = limits.get(key);
        const count =
          current && current.until > Date.now()
            ? current
            : { n: 0, until: Date.now() + 60000 };
        count.n++;
        limits.set(key, count);
        if (limits.size > 10000)
          for (const [k, v] of limits)
            if (v.until < Date.now()) limits.delete(k);
        if (count.n > (path.startsWith("/api/auth/") ? rateLimit : 600))
          fail("操作太频繁，请一分钟后再试", 429);
      }
      if (path === "/api/auth/register" && method === "POST") {
        const v = await body(req);
        const username = text(v.username, "用户名", 30).toLowerCase();
        if (!/^[a-z0-9_\u4e00-\u9fff]{3,30}$/.test(username))
          fail("用户名需为 3–30 位中文、字母、数字或下划线");
        const password = text(v.password, "密码", 128);
        if (password.length < 8) fail("密码至少 8 位");
        if (one("SELECT id FROM users WHERE username=?", username))
          fail("用户名已被使用", 409);
        // Admin is provisioned locally, never claimed through public registration.
        if (adminUser && username === adminUser)
          fail("该用户名保留给管理员", 409);
        const salt = randomBytes(16).toString("hex");
        const hash = (await derive(password, salt, 64)).toString("hex");
        const u = { id: randomUUID(), username };
        try {
          run("INSERT INTO users VALUES (?,?,?,?)", u.id, username, salt, hash);
        } catch (e) {
          if (e.code?.includes("SQLITE")) fail("用户名已被使用", 409);
          throw e;
        }
        return send(201, session(u));
      }
      if (path === "/api/auth/login" && method === "POST") {
        const v = await body(req);
        const username = text(v.username, "用户名", 30).toLowerCase();
        const password = text(v.password, "密码", 128);
        const u = one("SELECT * FROM users WHERE username=?", username);
        const key = await derive(password, u?.salt || "invalid-user-salt", 64);
        if (!u || !timingSafeEqual(key, Buffer.from(u.hash, "hex")))
          fail("用户名或密码不正确", 401);
        return send(200, session(u));
      }
      if (path === "/api/auth/logout" && method === "POST") {
        auth(req);
        run(
          "DELETE FROM sessions WHERE token=?",
          digest(req.headers.authorization.slice(7)),
        );
        return send(200, { ok: true });
      }
      if (path === "/api/me" && method === "GET")
        return send(200, { user: auth(req), serverId });
      if (path === "/api/recipes" && method === "GET") {
        const q = (url.searchParams.get("q") || "").slice(0, 100).toLowerCase();
        const offset = Math.max(
          0,
          Math.min(10000, Number(url.searchParams.get("offset")) || 0),
        );
        const rows = all(
          "SELECT r.*,u.username FROM recipes r JOIN users u ON r.author_id=u.id WHERE r.deleted=0 ORDER BY r.updated DESC",
        );
        const found = rows.filter((r) => {
          const b = JSON.parse(r.body);
          return (
            !q ||
            (b.name + " " + b.ingredients.map((i) => i.name).join(" "))
              .toLowerCase()
              .includes(q)
          );
        });
        return send(200, {
          items: found.slice(offset, offset + 30).map(viewRecipe),
          more: found.length > offset + 30,
        });
      }
      if (path === "/api/recipes" && method === "POST") {
        const u = auth(req);
        const v = await body(req);
        const requestId = text(v.requestId, "操作编号", 80);
        const existing = one(
          "SELECT r.*,u.username FROM recipes r JOIN users u ON u.id=r.author_id WHERE r.author_id=? AND r.request_id=?",
          u.id,
          requestId,
        );
        if (existing) {
          if (existing.deleted) fail("该次发布的菜谱已删除，请新建草稿", 409);
          return send(200, viewRecipe(existing));
        }
        const data = recipeInput(v);
        const image = saveImage(v.imageData);
        const id = randomUUID();
        run(
          "INSERT INTO recipes (id,author_id,version,body,image,updated,request_id) VALUES (?,?,1,?,?,?,?)",
          id,
          u.id,
          JSON.stringify(data),
          image,
          new Date().toISOString(),
          requestId,
        );
        return send(201, viewRecipe(recipe(id)));
      }
      let match = path.match(/^\/api\/recipes\/([a-f0-9-]+)$/);
      if (match) {
        const r = recipe(match[1]);
        if (method === "GET") return send(200, viewRecipe(r));
        const u = auth(req);
        if (r.author_id !== u.id) fail("只能管理自己的菜谱", 403);
        if (method === "DELETE") {
          run("UPDATE recipes SET deleted=1 WHERE id=?", r.id);
          return send(200, { ok: true });
        }
        if (method === "PUT") {
          const v = await body(req);
          const data = recipeInput(v);
          if (v.version !== r.version)
            fail("菜谱已更新，请重新打开再编辑", 409);
          const image = v.imageData ? saveImage(v.imageData) : r.image;
          const result = run(
            "UPDATE recipes SET version=version+1,body=?,image=?,updated=? WHERE id=? AND version=? AND deleted=0",
            JSON.stringify(data),
            image,
            new Date().toISOString(),
            r.id,
            v.version,
          );
          if (!result.changes) fail("菜谱已更新，请重新打开再编辑", 409);
          return send(200, viewRecipe(recipe(r.id)));
        }
      }
      match = path.match(/^\/api\/recipes\/([a-f0-9-]+)\/comments$/);
      if (match) {
        recipe(match[1]);
        if (method === "GET")
          return send(200, {
            items: all(
              "SELECT c.*,u.username FROM comments c JOIN users u ON c.author_id=u.id WHERE recipe_id=? ORDER BY created",
              match[1],
            ).map((c) => ({
              id: c.id,
              authorId: c.author_id,
              author: c.username,
              parentId: c.parent_id,
              text: c.deleted ? "评论已删除" : c.body,
              deleted: !!c.deleted,
              created: c.created,
            })),
          });
        if (method === "POST") {
          const u = auth(req);
          const v = await body(req);
          const comment = text(v.text, "评论", 1000);
          const requestId = text(v.requestId, "操作编号", 80);
          const parent = v.parentId
            ? one(
                "SELECT * FROM comments WHERE id=? AND recipe_id=?",
                v.parentId,
                match[1],
              )
            : null;
          if (v.parentId && (!parent || parent.parent_id))
            fail("只能回复这道菜的一级评论");
          const existing = one(
            "SELECT id FROM comments WHERE author_id=? AND request_id=?",
            u.id,
            requestId,
          );
          if (existing) return send(200, { id: existing.id });
          const id = randomUUID();
          run(
            "INSERT INTO comments (id,recipe_id,author_id,parent_id,body,created,request_id) VALUES (?,?,?,?,?,?,?)",
            id,
            match[1],
            u.id,
            parent?.id || null,
            comment,
            new Date().toISOString(),
            requestId,
          );
          return send(201, { id });
        }
      }
      match = path.match(/^\/api\/comments\/([a-f0-9-]+)$/);
      if (match && method === "DELETE") {
        const u = auth(req);
        const c = one("SELECT * FROM comments WHERE id=?", match[1]);
        if (!c) fail("评论不存在", 404);
        if (c.author_id !== u.id) fail("只能删除自己的评论", 403);
        run("UPDATE comments SET deleted=1 WHERE id=?", c.id);
        return send(200, { ok: true });
      }
      if (path === "/api/backup") {
        const u = auth(req);
        if (method === "GET") {
          const row = one("SELECT * FROM backups WHERE user_id=?", u.id);
          return send(
            200,
            row
              ? { data: JSON.parse(row.body), updated: row.updated }
              : { data: null },
          );
        }
        if (method === "PUT") {
          const data = backupInput(await body(req));
          const updated = new Date().toISOString();
          run(
            "INSERT INTO backups VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET body=excluded.body,updated=excluded.updated",
            u.id,
            JSON.stringify(data),
            updated,
          );
          return send(200, { updated });
        }
      }
      if (path === "/api/reports" && method === "POST") {
        const u = auth(req);
        const v = await body(req);
        const reason = text(v.reason, "举报原因", 500);
        if (!["recipe", "comment"].includes(v.kind)) fail("举报类型不正确");
        if (v.kind === "recipe") recipe(v.target);
        else if (
          !one("SELECT id FROM comments WHERE id=? AND deleted=0", v.target)
        )
          fail("评论不存在", 404);
        run(
          "INSERT INTO reports VALUES (?,?,?,?,?,?,0) ON CONFLICT(user_id,kind,target) DO UPDATE SET reason=excluded.reason,resolved=0",
          randomUUID(),
          u.id,
          v.kind,
          v.target,
          reason,
          new Date().toISOString(),
        );
        return send(201, { ok: true });
      }
      if (path.startsWith("/api/admin/")) {
        const u = auth(req);
        if (!u.admin) fail("需要管理员权限", 403);
        if (path === "/api/admin/reports" && method === "GET")
          return send(200, {
            items: all(
              "SELECT * FROM reports WHERE resolved=0 ORDER BY created",
            ).map((r) => ({
              ...r,
              content:
                r.kind === "recipe"
                  ? one("SELECT body FROM recipes WHERE id=?", r.target)?.body
                  : one("SELECT body FROM comments WHERE id=?", r.target)?.body,
            })),
          });
        match = path.match(/^\/api\/admin\/reports\/([a-f0-9-]+)$/);
        if (match && method === "PUT") {
          const v = await body(req);
          const r = one("SELECT * FROM reports WHERE id=?", match[1]);
          if (!r) fail("举报不存在", 404);
          if (v.remove === true)
            run(
              `UPDATE ${r.kind === "recipe" ? "recipes" : "comments"} SET deleted=1 WHERE id=?`,
              r.target,
            );
          run("UPDATE reports SET resolved=1 WHERE id=?", r.id);
          return send(200, { ok: true });
        }
      }
      match = path.match(/^\/api\/images\/([a-f0-9]{64}\.(jpeg|png|webp))$/);
      if (match && method === "GET") {
        // Images are public only while referenced by a published recipe.
        if (
          !one("SELECT id FROM recipes WHERE image=? AND deleted=0", match[1])
        )
          fail("图片不存在", 404);
        const bytes = readFileSync(resolve(dataDir, "images", match[1]));
        res.writeHead(200, { "Content-Type": `image/${match[2]}` });
        res.end(bytes);
        return;
      }
      if (webDir && method === "GET" && !path.startsWith("/api/")) {
        const root = resolve(webDir);
        const filename = resolve(
          root,
          "." + decodeURIComponent(path === "/" ? "/index.html" : path),
        );
        if (!filename.startsWith(root + sep)) fail("路径不可用", 404);
        const mime = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".png": "image/png",
          ".json": "application/json",
        };
        if (existsSync(filename)) {
          res.writeHead(200, {
            "Content-Type":
              mime[extname(filename)] || "application/octet-stream",
          });
          res.end(readFileSync(filename));
          return;
        }
      }
      fail("没有找到这个接口", 404);
    } catch (e) {
      if (!res.headersSent)
        send(e.status || 500, {
          error: e.status ? e.message : "服务暂时无法完成操作，请重试",
        });
      else res.end();
      if (!e.status) console.error(e);
    }
  });
  server.requestTimeout = 30000;
  return {
    server,
    db,
    serverId,
    close: async () => {
      await new Promise((r) => server.close(r));
      db.close();
    },
  };
}
