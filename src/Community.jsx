import { localize } from "./language";
import { original } from "./localized-element";
import React, { useEffect, useRef, useState } from "react";
import { Download, Plus } from "lucide-react";
import {
  request,
  fetchImage,
  readConnection,
  saveConnection,
  serverAddress,
} from "./community-api";
import {
  getDrafts,
  putDraft,
  deleteDraft,
  preparePhoto,
  toLocalRecipe,
  localRecipeId,
} from "./community-store";
import { recipeInput, backupInput } from "../shared/community-schema";
import { KEY, normalize, unique } from "./logic";
import { cleanPreferences } from "./preferences";
import { publications, rememberPublication, forgetPublication } from "./published-recipes";
import "./community.css";
const blank = () => ({
  requestId: crypto.randomUUID(),
  name: "",
  description: "",
  servings: 2,
  minutes: 20,
  category: "dish",
  level: 1,
  tools: "",
  attribution: "原创",
  imageData: "",
  ingredients: [{ name: "", amount: "", optional: false }],
  steps: [{ title: "", text: "", amount: "", heat: "", cue: "", seconds: 0 }],
});
const date = (s) => new Date(s).toLocaleString("zh-CN");
function reportContent(report) {
  if (report.kind !== "recipe") return report.content || "内容已不可用";
  try {
    const recipe = JSON.parse(report.content);
    return [recipe.name, recipe.description, ...recipe.ingredients.map(i => `${i.name}：${i.amount}`), ...recipe.steps.map((s,i) => `${i+1}. ${s.title}：${s.text}`)].filter(Boolean).join("\n");
  } catch { return "内容已不可用"; }
}
export default function Community({
  hash,
  go,
  downloads,
  onDownload,
  onDeleteDownload,
  state,
  setState,
}) {
  const [, section = "feed", id] = hash.slice(1).split("/");
  const [connection, setConnection] = useState(readConnection);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorSummary = useRef(null);
  useEffect(() => {
    if (error) errorSummary.current?.focus();
  }, [error]);
  const [publishResult, setPublishResult] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState(null);
  const [comments, setComments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [reports, setReports] = useState([]);
  const [backup, setBackup] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [returnTo, setReturnTo] = useState("community/feed");
  const latestState = useRef(state);
  latestState.current = state;
  const epoch = useRef(0);
  const controller = useRef(new AbortController());
  const lock = useRef(false);
  const user = connection.session?.user;
  const scope = `${connection.session?.serverId}:${user?.id}`;
  useEffect(() => () => { controller.current.abort(); epoch.current++; }, []);
  const requestSignal = controller.current.signal;
  const call = (path, options = {}) =>
    request(connection, path, {
      ...options,
      signal: requestSignal,
    });
  const run = async (fn) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const generation = epoch.current;
    try {
      await fn(() => generation === epoch.current);
    } catch (e) {
      if (generation === epoch.current) setError(e.message);
    } finally {
      if (generation === epoch.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  };
  function connect(next) {
    saveConnection(next);
    controller.current.abort();
    controller.current = new AbortController();
    epoch.current++;
    lock.current = false;
    setBusy(false);
    setConnection(next);
    setBackup(null);
    setRemote(null);
    setComments([]);
    setItems([]);
    setReports([]);
    setDrafts([]);
  }
  function requireLogin(target) {
    if (user) return true;
    setReturnTo(target);
    go("community/account");
    return false;
  }
  useEffect(() => {
    let cancelled = false;
    if (
      !connection.server &&
      /^https?:$/.test(location.protocol) &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      request({ server: location.origin }, "/api/health", { anonymous: true })
        .then(() => {
          if (!cancelled) connect({ server: location.origin, session: null });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    let valid = true;
    setError("");
    setLoading(true);
    const read = (path) => request(connection, path, { signal: abort.signal });
    const load = async () => {
      if (section === "mine") {
        const rows = await getDrafts();
        if (valid) setDrafts(rows.filter((d) => user && d.scope === scope));
        return;
      }
      if (!connection.server || section === "edit") return;
      if (section === "feed") {
        const r = await read("/api/recipes?q=" + encodeURIComponent(query));
        if (valid) {
          setItems(r.items);
          setMore(r.more);
        }
      }
      if (section === "detail") {
        setRemote(null);
        setComments([]);
        const r = await read("/api/recipes/" + id);
        if (valid) setRemote(r);
        const c = await read("/api/recipes/" + id + "/comments");
        if (valid) setComments(c.items);
      }
      if (section === "account" && user) {
        const me = await read("/api/me");
        if (valid && me.serverId !== connection.session.serverId)
          throw new Error("服务数据已更换，请退出后重新登录");
        const b = await read("/api/backup");
        if (valid) setBackup(b);
      }
      if (section === "admin" && user?.admin) {
        const r = await read("/api/admin/reports");
        if (valid) setReports(r.items);
      }
    };
    load()
      .catch((e) => {
        if (valid) setError(e.message);
      })
      .finally(() => {
        if (valid) setLoading(false);
      });
    return () => {
      valid = false;
      abort.abort();
    };
  }, [section, id, connection, refresh, query, scope]);
  useEffect(() => {
    setNotice("");
  }, [section, id]);
  const download =
    remote && downloads.find((d) => d.id === localRecipeId(remote));
  async function downloadRemote(alive) {
    const photo = await fetchImage(
      connection,
      remote.image,
      controller.current.signal,
    );
    if (!alive()) return;
    const local = toLocalRecipe(remote, photo, connection.server);
    await onDownload(local);
    if (alive()) setNotice("已完整下载，可断网跟做");
  }
  async function report(kind, target) {
    if (!requireLogin(hash.slice(1))) return;
    const reason = window.prompt("请说明举报原因（最多 500 字）");
    if (!reason) return;
    await run(async () => {
      await call("/api/reports", {
        method: "POST",
        data: { kind, target, reason },
      });
      setNotice("举报已提交");
    });
  }
  return (
    <section className="community">
      <div className="community-heading">
        <h1 tabIndex={-1}>
          {{
            feed: "饭友圈",
            detail: remote?.name ? original(remote.name) : "菜谱详情",
            mine: "我的菜谱",
            account: "账号与备份",
            edit: "编辑菜谱",
            admin: "举报管理",
          }[section] || "饭友圈"}
        </h1>
        {(section === "feed" || section === "mine") && (
          <button
            className="primary"
            onClick={() => {
              if (requireLogin("community/edit/new")) go("community/edit/new");
            }}
          >
            <Plus size={18} />
            {section === "mine" ? "写菜谱" : "发布菜谱"}
          </button>
        )}
      </div>
      {!["account", "admin"].includes(section) && <div className="community-tabs" aria-label="饭友圈栏目">
        {[
          ["feed", "发现菜谱"],
          ["mine", "我的菜谱"],
        ].map(([p, label]) => (
          <a
            key={p}
            href={`#community/${p}`}
            aria-current={section === p ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </div>}
      {error && (
        <p ref={errorSummary} tabIndex={-1} role="alert" className="warning">
          {error}{" "}
          <button onClick={() => setRefresh((x) => x + 1)}>重试加载</button>
        </p>
      )}
      <p role="status" className="community-status">
        {busy ? "正在处理…" : loading ? "正在加载…" : notice}
      </p>
      {!connection.server && section === "feed" && (
        <div className="community-connect">
          <h2>连接饭友圈</h2>
          <p>连接服务后，可以发现和分享菜谱。</p>
          <div><a href="#community/account">设置服务地址</a><a href="#community/mine">查看已下载菜谱</a></div>
        </div>
      )}
      {section === "feed" && connection.server && (
        <>
          <label>
            搜索分享的菜谱
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
              placeholder="菜名或食材"
            />
          </label>
          <div className="community-list">
            {items.map((r) => (
              <button
                className="community-recipe"
                key={r.id}
                onClick={() => go("community/detail/" + r.id)}
              >
                <img src={connection.server + r.image} alt="" loading="lazy" />
                <span>
                  <strong>{original(r.name)}</strong>
                  <small>
                    {original(r.author)} · 第 {r.version} 版
                  </small>
                  <small>
                    {r.minutes} 分钟 · {r.servings} 人份
                  </small>
                </span>
              </button>
            ))}
          </div>
          {!items.length && connection.server && !error && !loading && (
            <p>{query.trim() ? "没有匹配的菜谱，换个菜名或食材试试。" : "还没有人分享菜谱。"}</p>
          )}
          {more && (
            <button
              disabled={busy}
              onClick={() =>
                run(async (alive) => {
                  const r = await call(
                    `/api/recipes?q=${encodeURIComponent(query)}&offset=${items.length}`,
                  );
                  if (alive()) {
                    setItems((v) => [...v, ...r.items]);
                    setMore(r.more);
                  }
                })
              }
            >
              加载更多
            </button>
          )}
        </>
      )}
      {section === "mine" && (
        <>
          <h2>我的草稿</h2>
          {!user ? (
            <button onClick={() => go("community/account")}>
              登录查看草稿
            </button>
          ) : (
            <>
              {!drafts.length && <p>暂无草稿。</p>}
              {drafts.map((d) => (
                <div className="community-local" key={d.key}>
                  <strong>{d.value.name ? original(d.value.name) : "未命名菜谱"}</strong>
                  <div className="community-actions">
                    <button onClick={() => go("community/edit/" + d.id)}>
                      继续编辑
                    </button>
                    <button
                      onClick={() =>
                        run(async () => {
                          if (window.confirm("删除这份本机草稿？")) {
                            await deleteDraft(d.key);
                            setRefresh((v) => v + 1);
                          }
                        })
                      }
                    >
                      删除草稿
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
          {user && <section><h2>我发布的</h2>
            {publications(scope).length === 0 && <p className="hint">这里会记录你用这台设备发布的菜谱。</p>}
            {publications(scope).map(row => <article key={row.id} className="community-local">
              <strong>{original(row.name)}</strong>
              <button onClick={() => go("community/detail/" + row.id)}>查看公开菜谱</button>
            </article>)}
          </section>}
          <h2>已下载 · 本机可用</h2>
          <p className="hint">退出账号不会删除本机菜谱。收藏不等于下载。</p>
          {!downloads.length && (
            <p>尚未下载菜谱。去发现页选一道，下载后可以离线跟做。</p>
          )}
          {downloads.map((r) => (
            <article className="community-local" key={r.id}>
              <button
                className="community-recipe"
                onClick={() => go("recipe/" + r.id)}
              >
                <img src={r.imageData} alt="" />
                <span>
                  <strong>{original(r.name)}</strong>
                  <small>
                    {original(r.community.author)} · 已下载第 {r.community.version} 版
                  </small>
                </span>
              </button>
              {r.community.serverId === connection.session?.serverId ||
              r.community.server === connection.server ? (
                <button
                  onClick={() => go("community/detail/" + r.community.remoteId)}
                >
                  查看在线版本／更新
                </button>
              ) : (
                <small>来自其他服务，离线副本仍可使用</small>
              )}
              <button disabled={busy} aria-label={`删除本机下载：${r.name}`} onClick={() => {
                if (window.confirm(`删除《${r.name}》的本机下载并从菜篮移除？收藏和饭友圈原作会保留。`)) {
                  run(async alive => {
                    await onDeleteDownload(r);
                    if (alive()) setNotice("已删除本机下载");
                  });
                }
              }}>删除本机下载</button>
            </article>
          ))}
        </>
      )}
      {section === "detail" && remote && (
        <>
          {publishResult?.id === remote.id && <p role="status">{publishResult.message}</p>}
          <img
            className="community-cover"
            src={connection.server + remote.image}
            alt={remote.name + "成品图"}
          />
          <p>
            {original(remote.author)} · 第 {remote.version} 版 · {remote.servings} 人份 ·{" "}
            {remote.minutes} 分钟
          </p>
          <p className="warning">用户分享，未经项目核对</p>
          <p>{original(remote.description)}</p>
          <div className="community-actions">
            <button
              className="primary"
              disabled={busy || download?.community.version === remote.version}
              onClick={() => run(downloadRemote)}
            >
              <Download size={18} />
              {download
                ? download.community.version < remote.version
                  ? `更新下载（第 ${remote.version} 版）`
                  : "已下载"
                : "下载到我的菜谱"}
            </button>
            {download && (
              <button onClick={() => go("recipe/" + download.id)}>
                打开离线菜谱
              </button>
            )}
            <button onClick={() => report("recipe", remote.id)}>
              举报菜谱
            </button>
            {user?.id === remote.authorId && (
              <>
                <button onClick={() => go("community/edit/" + remote.id)}>
                  编辑菜谱
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      if (
                        !window.confirm("删除公开菜谱？已有下载副本仍会保留。")
                      )
                        return;
                      await call("/api/recipes/" + remote.id, {
                        method: "DELETE",
                      });
                      forgetPublication(scope, remote.id);
                      go("community/feed");
                    })
                  }
                >
                  删除公开菜谱
                </button>
              </>
            )}
          </div>
          <h2>食材与用量</h2>
          <ul>
            {remote.ingredients.map((i, n) => (
              <li key={n}>
                {original(i.name)}：{original(i.amount)}
                {i.optional ? "（可省）" : ""}
              </li>
            ))}
          </ul>
          <h2>做法</h2>
          <ol>
            {remote.steps.map((s, n) => (
              <li key={n}>
                <strong>{original(s.title)}</strong>
                <p>{original(s.text)}</p>
                <p>用量：{original(s.amount)}</p>
                {s.heat && <p>火力：{original(s.heat)}</p>}
                {s.cue && <p>状态：{original(s.cue)}</p>}
              </li>
            ))}
          </ol>
          <p>来源／原创声明：{original(remote.attribution)}</p>
          <Comments
            key={remote.id + scope}
            rows={comments}
            user={user}
            send={async (data) => {
              await call(`/api/recipes/${remote.id}/comments`, {
                method: "POST",
                data,
              });
              setRefresh((v) => v + 1);
            }}
            onError={setError}
            login={() => requireLogin(hash.slice(1))}
            report={report}
            remove={(cid) =>
              run(async () => {
                if (window.confirm("删除这条评论？")) {
                  await call("/api/comments/" + cid, { method: "DELETE" });
                  setRefresh((v) => v + 1);
                }
              })
            }
          />
        </>
      )}
      {section === "edit" &&
        (user ? (
          <Editor
            key={id + scope}
            id={id || "new"}
            scope={scope}
            call={call}
            server={connection.server}
            go={go}
            onError={setError}
            publish={async (value) => {
              const data = {
                ...recipeInput(value),
                imageData: value.imageData,
                requestId: value.requestId,
                version: value.version,
              };
              const r = await call(
                value.remoteId
                  ? "/api/recipes/" + value.remoteId
                  : "/api/recipes",
                { method: value.remoteId ? "PUT" : "POST", data },
              );
              let message = "已发布并保存到本机，可离线跟做。";
              try {
                const photo = value.imageData || await fetchImage(connection, r.image, requestSignal);
                await onDownload(toLocalRecipe(r, photo, connection.server));
              } catch (error) {
                message = "已发布，本机副本未更新。可在本页重试下载。" + error.message;
              }
              try { rememberPublication(scope, r); }
              catch { message += " 本机作品目录保存失败，请通过发现页查看。"; }
              setPublishResult({id: r.id, message});
              return r;
            }}
          />
        ) : (
          <button onClick={() => requireLogin(hash.slice(1))}>
            登录后编辑菜谱
          </button>
        ))}
      {section === "account" && (
        <>
          <ConnectionForm
            connection={connection}
            busy={busy}
            onSave={(value) =>
              run(async () => {
                const server = serverAddress(value);
                if (
                  connection.server &&
                  server !== connection.server &&
                  !window.confirm(
                    "切换服务将退出当前账号，保留本机菜谱与厨房配置。继续？",
                  )
                )
                  return;
                await request({ server }, "/api/health", { anonymous: true });
                connect({
                  server,
                  session:
                    server === connection.server ? connection.session : null,
                });
                setNotice("服务连接成功");
              })
            }
          />
          {!user ? (
            <AuthForm
              busy={busy}
              submit={(mode, username, password) =>
                run(async (alive) => {
                  const session = await call("/api/auth/" + mode, {
                    method: "POST",
                    data: { username, password },
                    anonymous: true,
                  });
                  if (alive()) {
                    connect({ ...connection, session });
                    go(returnTo);
                  }
                })
              }
            />
          ) : (
            <>
              <h2>{user.username}</h2>
              <p>
                登录不自动上传或恢复配置。退出后，本机食材和下载保留，账号草稿隐藏。
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    try {
                      await call("/api/auth/logout", {
                        method: "POST",
                        data: {},
                      });
                    } catch {}
                    connect({ ...connection, session: null });
                    setNotice("已退出，本机数据保留");
                  })
                }
              >
                退出登录
              </button>
              <h2>手动配置备份</h2>
              <p>
                范围：食材、常备调料、常用顺序、收藏、饮食偏好。不包含下载文件、当前一餐和计时器。
              </p>
              <p>
                {backup?.updated
                  ? "云端备份：" + date(backup.updated)
                  : "尚未读取到云端备份"}
              </p>
              <div className="community-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async (alive) => {
                      if (
                        !window.confirm(
                          `用当前本机配置覆盖 ${user.username} 的云端备份？共享设备请核对食材与收藏。`,
                        )
                      )
                        return;
                      const data = backupInput({
                        version: 1,
                        pantry: state.pantry,
                        customFoods: state.customFoods,
                        useFattyBeefForRolls: state.useFattyBeefForRolls,
                        frequentIngredients: state.frequentIngredients,
                        favorites: state.favorites,
                        preferences: state.preferences,
                      });
                      const b = await call("/api/backup", {
                        method: "PUT",
                        data,
                      });
                      if (alive()) {
                        setBackup({ ...b, data });
                        setNotice("配置已备份");
                      }
                    })
                  }
                >
                  备份本机配置
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async (alive) => {
                      const b = await call("/api/backup");
                      if (!alive()) return;
                      if (!b.data) throw new Error("该账号还没有备份");
                      const data = backupInput(b.data);
                      if (
                        !window.confirm(
                          `恢复 ${date(b.updated)} 的备份？将覆盖本机食材、常用顺序、收藏和饮食偏好；一餐、下载和计时器保留。`,
                        )
                      )
                        return;
                      const restored = {
                        pantry: unique(data.pantry),
                        customFoods: unique(data.customFoods),
                        useFattyBeefForRolls: data.useFattyBeefForRolls,
                        frequentIngredients: unique(data.frequentIngredients),
                        favorites: data.favorites,
                        preferences: cleanPreferences(data.preferences),
                      };
                      // Verify durable storage before changing the live kitchen state.
                      localStorage.setItem(
                        KEY,
                        JSON.stringify({ ...latestState.current, ...restored, version: 3 }),
                      );
                      setState((s) => ({ ...s, ...restored }));
                      setBackup(b);
                      setNotice("已恢复配置；社区收藏需要另行下载菜谱文件");
                    })
                  }
                >
                  恢复到本机
                </button>
              </div>
              {user.admin && (
                <p>
                  <a href="#community/admin">查看举报管理</a>
                </p>
              )}
            </>
          )}
        </>
      )}
      {section === "admin" && user?.admin && (
        <>
          {!reports.length && <p>暂无未处理举报。</p>}
          {reports.map((r) => (
            <article className="community-local" key={r.id}>
              <h2>{r.kind === "recipe" ? "菜谱举报" : "评论举报"}</h2>
              <p>{r.reason}</p>
              <details>
                <summary>查看被举报内容</summary>
                <p className="report-content">{reportContent(r)}</p>
              </details>
              <div className="community-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      if (window.confirm("移除这条公开内容？")) {
                        await call("/api/admin/reports/" + r.id, {
                          method: "PUT",
                          data: { remove: true },
                        });
                        setRefresh((v) => v + 1);
                      }
                    })
                  }
                >
                  移除内容
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await call("/api/admin/reports/" + r.id, {
                        method: "PUT",
                        data: { remove: false },
                      });
                      setRefresh((v) => v + 1);
                    })
                  }
                >
                  保留内容，结案
                </button>
              </div>
            </article>
          ))}
        </>
      )}
    </section>
  );
}
function ConnectionForm({ connection, busy, onSave }) {
  const [value, setValue] = useState(connection.server);
  useEffect(() => setValue(connection.server), [connection.server]);
  return (
    <details open={!connection.server}>
      <summary>服务地址</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value);
        }}
      >
        <label>
          HTTPS 服务地址
          <input
            type="url"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://你的服务地址"
          />
        </label>
        <button disabled={busy}>连接服务</button>
      </form>
    </details>
  );
}
function AuthForm({ busy, submit }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(mode, username, password);
      }}
    >
      <h2>{mode === "login" ? "登录" : "注册"}</h2>
      <label>
        用户名
        <input
          required
          minLength={3}
          maxLength={30}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <label>
        密码
        <input
          required
          minLength={8}
          maxLength={128}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="hint">用户名 3–30 位；密码至少 8 位。</p>
      <div className="community-actions">
        <button className="primary" disabled={busy}>
          {mode === "login" ? "登录" : "注册并登录"}
        </button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
        >
          {mode === "login" ? "没有账号，去注册" : "已有账号，去登录"}
        </button>
      </div>
    </form>
  );
}
function Comments({ rows, user, send, onError, login, report, remove }) {
  const [value, setValue] = useState("");
  const [parent, setParent] = useState(null);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const render = (c) => (
    <div
      className={"community-comment" + (c.parentId ? " reply" : "")}
      key={c.id}
    >
      <strong>{original(c.author)}</strong>
      <p>{original(c.text)}</p>
      {!c.deleted && (
        <div className="community-actions">
          {!c.parentId && (
            <button
              onClick={() => {
                if (login()) setParent(c);
              }}
            >
              回复
            </button>
          )}
          {user?.id === c.authorId && (
            <button onClick={() => remove(c.id)}>删除评论</button>
          )}
          <button onClick={() => report("comment", c.id)}>举报评论</button>
        </div>
      )}
    </div>
  );
  return (
    <section>
      <h2>讨论</h2>
      {!rows.length && <p>暂无评论。</p>}
      {rows
        .filter((c) => !c.parentId)
        .map((c) => (
          <React.Fragment key={c.id}>
            {render(c)}
            {rows.filter((r) => r.parentId === c.id).map(render)}
          </React.Fragment>
        ))}
      {!user ? (
        <button onClick={login}>登录参与讨论</button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (sendingRef.current) return;
            sendingRef.current = true;
            setSending(true);
            try {
              await send({
                text: value,
                parentId: parent?.id,
                requestId: requestId.current,
              });
              setValue("");
              setParent(null);
              requestId.current = crypto.randomUUID();
            } catch (e) {
              onError(e.message);
            } finally {
              sendingRef.current = false;
              setSending(false);
            }
          }}
        >
          {parent && (
            <p>
              回复 {parent.author}{" "}
              <button type="button" onClick={() => setParent(null)}>
                取消回复
              </button>
            </p>
          )}
          <label>
            评论内容
            <textarea
              required
              maxLength={1000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <button disabled={sending}>{sending ? "发送中…" : "发送评论"}</button>
        </form>
      )}
    </section>
  );
}
function DraftNumber({ label, value, min, max, required = false, onChange }) {
  const [touched, setTouched] = useState(false);
  const hintId = React.useId();
  const number = Number(value);
  const invalid = value === "" ? required : !Number.isInteger(number) || number < min || number > max;
  const hint = label + "需为 " + min + "–" + max + " 的整数";
  return <label>{label}
    <input type="number" min={min} max={max} required={required} value={value}
      aria-invalid={touched && invalid || undefined} aria-describedby={touched && invalid ? hintId : undefined}
      aria-label={label}
      onBlur={() => setTouched(true)} onInvalid={event => {
        setTouched(true);
        event.currentTarget.setCustomValidity(localize(hint));
      }}
      onChange={event => { event.currentTarget.setCustomValidity(""); onChange(event.target.value); }} />
    {touched && invalid && <small id={hintId} className="warning">{hint}</small>}
  </label>;
}
function Editor({ id, scope, call, server, go, onError, publish }) {
  const [value, setValue] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const localId = useRef(id === "new" ? crypto.randomUUID() : id);
  const key = scope + ":" + localId.current;
  const queue = useRef(Promise.resolve());
  const current = useRef(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    let valid = true;
    (async () => {
      const drafts = await getDrafts();
      const saved = drafts.find((d) => d.key === key);
      let data = saved?.value;
      if (!data) {
        if (id === "new") data = blank();
        else {
          const r = await call("/api/recipes/" + id);
          data = {
            ...r,
            remoteId: r.id,
            requestId: crypto.randomUUID(),
            imageData: "",
          };
        }
      }
      if (valid) {
        current.current = data;
        setValue(data);
      }
    })().catch((e) => onError(e.message));
    return () => {
      valid = false;
      alive.current = false;
    };
  }, []);
  const save = (value) => {
    setSaving(true);
    queue.current = queue.current
      .catch(() => {})
      .then(() => putDraft({ key, scope, id: localId.current, value }));
    queue.current
      .then(() => {
        if (alive.current) {
          setStatus("草稿已保存到本机");
          setSaving(false);
        }
      })
      .catch(() => {
        if (alive.current) {
          setStatus("草稿保存失败，请检查本机空间，暂勿离开");
          setSaving(false);
        }
      });
  };
  const change = (field, next) => {
    const updated = { ...current.current, [field]: next };
    current.current = updated;
    setValue(updated);
    save(updated);
  };
  const row = (field, index, name, next) =>
    change(
      field,
      current.current[field].map((v, i) =>
        i === index ? { ...v, [name]: next } : v,
      ),
    );
  if (!value) return <p role="status">正在打开草稿…</p>;
  return (
    <form
      className="community-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        onError("");
        try {
          const draft = current.current;
          const payload = { ...draft, servings: Number(draft.servings), minutes: Number(draft.minutes),
            steps: draft.steps.map(step => ({ ...step, seconds: Number(step.seconds || 0) })) };
          recipeInput(payload);
          if (!current.current.imageData && !current.current.remoteId)
            throw new Error("请添加成品图");
          await queue.current;
          if (!alive.current) return;
          const r = await publish(payload);
          try { await deleteDraft(key); }
          catch { if (alive.current) onError("已发布，旧草稿未能移除，请在草稿列表中删除。"); }
          if (alive.current) go("community/detail/" + r.id);
        } catch (e) {
          if (alive.current) onError(e.message);
        } finally {
          if (alive.current) setSubmitting(false);
        }
      }}
    >
      <p role="status">{saving ? "正在保存草稿…" : status}</p>
      <fieldset disabled={submitting}>
        <legend>基本信息</legend>
        <label>
          菜名 *
          <input
            required
            maxLength={60}
            value={value.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </label>
        <label>
          成品图 *
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = await preparePhoto(f);
                if (alive.current) change("imageData", data);
              } catch (e) {
                onError(e.message);
              }
            }}
          />
        </label>
        {(value.imageData || value.image) && (
          <img
            className="community-cover"
            src={value.imageData || server + value.image}
            alt="成品图预览"
          />
        )}
        <div className="community-fields">
          <DraftNumber label="份数 *" min={1} max={30} required value={value.servings}
            onChange={next => change("servings", next)} />
          <DraftNumber label="预计分钟 *" min={1} max={1440} required value={value.minutes}
            onChange={next => change("minutes", next)} />
        </div>
        <label>
          分类
          <select
            value={value.category}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="dish">菜肴</option>
            <option value="staple">主食</option>
            <option value="soup">汤羹</option>
          </select>
        </label>
        <label>
          简介
          <textarea
            maxLength={500}
            value={value.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </label>
        <label>
          厨具
          <input
            maxLength={200}
            value={value.tools}
            onChange={(e) => change("tools", e.target.value)}
          />
        </label>
        <label>
          原创／来源声明 *
          <textarea
            required
            maxLength={500}
            value={value.attribution}
            onChange={(e) => change("attribution", e.target.value)}
          />
        </label>
      </fieldset>
      <fieldset disabled={submitting}>
        <legend>食材和用量</legend>
        {value.ingredients.map((i, n) => (
          <div className="community-row" key={n}>
            <div className="community-fields">
              <label>
                食材 {n + 1} *
                <input
                  required
                  maxLength={30}
                  value={i.name}
                  onChange={(e) =>
                    row("ingredients", n, "name", e.target.value)
                  }
                />
              </label>
              <label>
                用量 {n + 1} *
                <input
                  required
                  maxLength={100}
                  value={i.amount}
                  onChange={(e) =>
                    row("ingredients", n, "amount", e.target.value)
                  }
                />
              </label>
            </div>
            {(normalize(i.name) !== i.name.trim() || i.name.trim() === "牛肉卷") && <button type="button"
              onClick={() => row("ingredients", n, "name", i.name.trim() === "牛肉卷" ? "肥牛片" : normalize(i.name))}>
              使用食材库名称：{i.name.trim() === "牛肉卷" ? "肥牛片" : normalize(i.name)}
            </button>}
            <label className="community-checkbox">
              <input
                type="checkbox"
                checked={i.optional}
                onChange={(e) =>
                  row("ingredients", n, "optional", e.target.checked)
                }
              />
              可省略
            </label>
            <button
              type="button"
              disabled={value.ingredients.length === 1}
              onClick={() =>
                change(
                  "ingredients",
                  value.ingredients.filter((_, x) => x !== n),
                )
              }
            >
              删除食材 {n + 1}
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={value.ingredients.length >= 50}
          onClick={() =>
            change("ingredients", [
              ...value.ingredients,
              { name: "", amount: "", optional: false },
            ])
          }
        >
          添加食材
        </button>
      </fieldset>
      <fieldset disabled={submitting}>
        <legend>步骤</legend>
        {value.steps.map((s, n) => (
          <div className="community-row" key={n}>
            <h3>第 {n + 1} 步</h3>
            {[
              ["title", "步骤标题", 60, true],
              ["text", "操作说明", 1500, true],
              ["amount", "本步用量", 300, true],
              ["heat", "火力（有依据才填）", 100, false],
              ["cue", "状态（有依据才填）", 300, false],
            ].map(([name, label, max, required]) => (
              <label key={name}>
                {label} {n + 1}
                {required ? " *" : ""}
                <textarea
                  required={required}
                  maxLength={max}
                  value={s[name]}
                  onChange={(e) => row("steps", n, name, e.target.value)}
                />
              </label>
            ))}
            <DraftNumber label={`计时秒数 ${n + 1}（0 表示不计时）`} min={0} max={86400}
              value={s.seconds} onChange={next => row("steps", n, "seconds", next)} />
            <button
              type="button"
              disabled={value.steps.length === 1}
              onClick={() =>
                change(
                  "steps",
                  value.steps.filter((_, x) => x !== n),
                )
              }
            >
              删除步骤 {n + 1}
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={value.steps.length >= 40}
          onClick={() =>
            change("steps", [
              ...value.steps,
              {
                title: "",
                text: "",
                amount: "",
                heat: "",
                cue: "",
                seconds: 0,
              },
            ])
          }
        >
          添加步骤
        </button>
      </fieldset>
      <p className="hint">* 为必填。发布即公开；请使用有权分享的内容与图片。</p>
      <button className="primary" disabled={submitting || saving}>
        {submitting
          ? "正在发布…"
          : value.remoteId
            ? "保存公开修改"
            : "发布菜谱"}
      </button>
    </form>
  );
}
