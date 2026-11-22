import { flushSync } from "react-dom";
import { localize } from "./language";
import { original } from "./localized-element";
import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  ArrowLeft,
  Search,
  X,
  Download,
  Check,
  Clock,
  Users,
  MoreHorizontal,
  Flag,
  Pencil,
  Trash2,
  MessageCircle,
  Reply,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  Upload,
  RotateCcw,
  Server,
  RefreshCw,
  WifiOff,
  Send,
  AlertCircle,
  Shield,
} from "lucide-react";
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
const hostOf = (server) => {
  try { return new URL(server).host; } catch { return server; }
};
// First visible character of a name, used only as a decorative avatar.
const initial = (name) => [...String(name || "").trim()][0] || "·";
function Skeleton({ rows = 3 }) {
  return <div className="circle-skeleton" aria-hidden="true">
    {Array.from({ length: rows }, (_, n) => <span key={n}><i /><b /><b /></span>)}
  </div>;
}
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
  const library = section === "mine" && ["drafts", "published"].includes(id) ? id : "downloads";
  const [connection, setConnection] = useState(readConnection);
  const [loading, setLoading] = useState(false);
  const [actionError, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const error = actionError || loadError;
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
    setLoadError("");
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
        if (valid) setLoadError(e.message);
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
    <section className={`community community-page-${section}`}>
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
        {section === "detail" && <a href="#community/feed" className="circle-return"><ArrowLeft size={18} aria-hidden="true" />返回发现菜谱</a>}
        {section === "edit" && <a href="#community/mine" className="circle-return"><ArrowLeft size={18} aria-hidden="true" />我的菜谱</a>}
        {section === "admin" && <a href="#community/account" className="circle-return"><ArrowLeft size={18} aria-hidden="true" />账号与备份</a>}
        {(section === "feed" || section === "mine") && (
          <button
            className="primary circle-compose"
            onClick={() => {
              if (requireLogin("community/edit/new")) go("community/edit/new");
            }}
          >
            <Plus size={18} />
            {section === "mine" ? "写菜谱" : "发布菜谱"}
          </button>
        )}
      </div>
      {["feed", "mine"].includes(section) && <div className="community-tabs" aria-label="饭友圈栏目">
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
        <div ref={errorSummary} tabIndex={-1} role="alert" className="warning circle-alert">
          <AlertCircle size={20} aria-hidden="true" />
          <span>{error}</span>
          {loadError && !actionError && <button onClick={() => setRefresh((x) => x + 1)}><RefreshCw size={16} aria-hidden="true" />重试加载</button>}
        </div>
      )}
      {section !== "detail" && <p role="status" className="community-status">
        {busy ? "正在处理…" : loading ? "正在加载…" : notice}
      </p>}
      {section === "detail" && !remote && loading && <><p role="status" className="community-status">正在加载…</p><div className="circle-skeleton circle-skeleton-cover" aria-hidden="true" /></>}
      {!connection.server && section === "feed" && (
        <div className="community-connect">
          <WifiOff size={26} aria-hidden="true" />
          <h2>连接饭友圈</h2>
          <p>连接服务后，可以发现和分享菜谱。</p>
          <div><a href="#community/account"><Server size={18} aria-hidden="true" />设置服务地址</a><a href="#community/mine">查看已下载菜谱</a></div>
        </div>
      )}
      {section === "feed" && connection.server && (
        <>
          <div className="circle-search">
            <label htmlFor="circle-query">
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">搜索分享的菜谱</span>
            </label>
            <input
              id="circle-query"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={100}
              enterKeyHint="search"
              placeholder="搜饭友分享的菜名或食材"
            />
            {query && <button type="button" className="circle-search-clear" aria-label="清空饭友圈搜索"
              onClick={(e) => { setQuery(""); e.currentTarget.parentElement.querySelector("input")?.focus(); }}>
              <X size={18} aria-hidden="true" />
            </button>}
          </div>
          {loading && !items.length && !error && <Skeleton />}
          <div className={query.trim() ? "community-list" : "community-list community-discovery"}>
            {items.map((r) => (
              <button
                className="community-recipe"
                key={r.id}
                onClick={() => go("community/detail/" + r.id)}
              >
                <img src={connection.server + r.image} alt="" loading="lazy" />
                <span>
                  <strong>{original(r.name)}</strong>
                  <small className="circle-author">
                    <i aria-hidden="true">{original(initial(r.author))}</i>
                    {original(r.author)}
                  </small>
                  <small>
                    {r.minutes} 分钟 · {r.servings} 人份
                  </small>
                </span>
                <ChevronRight className="circle-row-arrow" size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          {!items.length && connection.server && !error && !loading && (
            <div className="empty circle-empty">
              {query.trim() ? <Search size={30} aria-hidden="true" /> : <Users size={30} aria-hidden="true" />}
              <p>{query.trim() ? "没有匹配的菜谱，换个菜名或食材试试。" : "还没有人分享菜谱。"}</p>
              {query.trim() && <button type="button" onClick={() => setQuery("")}>清空搜索</button>}
            </div>
          )}
          {more && (
            <button
              className="circle-more-button"
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
          <div className="circle-segments" aria-label="我的菜谱分类">
            {Object.entries({ downloads: "已下载", drafts: "草稿", published: "我发布的" }).map(([key, label]) =>
              <a key={key} href={key === "downloads" ? "#community/mine" : "#community/mine/" + key}
                aria-current={library === key ? "page" : undefined}>{label}</a>)}
          </div>
          {library === "drafts" && <>
          <h2 className="sr-only">我的草稿</h2>
          {!user ? (
            <div className="empty circle-empty">
              <Pencil size={28} aria-hidden="true" />
              <p>草稿按账号保存在这台设备上。</p>
              <button className="primary" onClick={() => requireLogin("community/mine/drafts")}>
                登录查看草稿
              </button>
            </div>
          ) : (
            <>
              {!drafts.length && !loading && <div className="empty circle-empty"><Pencil size={28} aria-hidden="true" /><p>暂无草稿。</p></div>}
              {drafts.map((d) => (
                <div className="community-local circle-draft" key={d.key}>
                  <button className="draft-open" aria-label="继续编辑" onClick={() => go("community/edit/" + d.id)}>
                    <span className="circle-draft-copy">
                      <strong>{d.value.name ? original(d.value.name) : "未命名菜谱"}</strong>
                      <small>
                        {d.value.remoteId ? "修改已发布菜谱 · " : ""}
                        {(d.value.ingredients || []).filter(i => i.name?.trim()).length} 样食材 · {(d.value.steps || []).filter(s => s.title?.trim()).length} 步
                      </small>
                    </span>
                    <span className="circle-draft-go">继续编辑<ChevronRight size={16} aria-hidden="true" /></span>
                  </button>
                  <button
                    className="circle-icon-button circle-danger"
                    aria-label="删除草稿"
                    title="删除草稿"
                    onClick={() =>
                      run(async () => {
                        if (window.confirm("删除这份本机草稿？")) {
                          await deleteDraft(d.key);
                          setRefresh((v) => v + 1);
                        }
                      })
                    }
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </>
          )}
          </>}
          {library === "published" && !user && <div className="empty circle-empty">
            <Upload size={28} aria-hidden="true" />
            <p>登录后查看这台设备发布过的菜谱。</p>
            <button className="primary" onClick={() => requireLogin("community/mine/published")}>登录查看发布记录</button>
          </div>}
          {library === "published" && user && <section><h2 className="sr-only">我发布的</h2>
            {publications(scope).length === 0 && <div className="empty circle-empty"><Upload size={28} aria-hidden="true" /><p className="hint">这里会记录你用这台设备发布的菜谱。</p></div>}
            {publications(scope).map(row => <article key={row.id} className="community-local circle-published">
              <strong>{original(row.name)}</strong>
              <button onClick={() => go("community/detail/" + row.id)}>查看公开菜谱<ChevronRight size={16} aria-hidden="true" /></button>
            </article>)}
          </section>}
          {library === "downloads" && <>
          <h2 className="sr-only">已下载 · 本机可用</h2>
          {!downloads.length && (
            <div className="empty circle-empty">
              <Download size={28} aria-hidden="true" />
              <p>尚未下载菜谱。去发现页选一道，下载后可以离线跟做。</p>
              <a className="circle-empty-link" href="#community/feed">看看饭友分享</a>
            </div>
          )}
          {downloads.map((r) => (
            <article className="community-local circle-download" key={r.id}>
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
                  <small className="circle-offline"><Check size={14} aria-hidden="true" />可离线跟做</small>
                </span>
              </button>
              <button className="circle-icon-button" aria-label={`更多操作：${r.name}`} title="更多" onClick={e => e.currentTarget.nextElementSibling.showModal()}><MoreHorizontal size={20} aria-hidden="true" /></button>
              <dialog className="library-sheet" aria-label={`管理：${r.name}`} onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (e.target === e.currentTarget && (e.clientY < rect.top || e.clientY > rect.bottom ||
                    e.clientX < rect.left || e.clientX > rect.right)) e.currentTarget.close();
              }}>
              <span className="sheet-grabber" aria-hidden="true" />
              <div className="sheet-title"><img src={r.imageData} alt="" /><span><h2>{original(r.name)}</h2><small>第 {r.community.version} 版 · 本机副本</small></span></div>
              {r.community.serverId === connection.session?.serverId ||
              r.community.server === connection.server ? (
                <button
                  onClick={() => go("community/detail/" + r.community.remoteId)}
                >
                  <RefreshCw size={18} aria-hidden="true" />
                  查看在线版本／更新
                </button>
              ) : (
                <small className="sheet-note">来自其他服务，离线副本仍可使用</small>
              )}
              <button disabled={busy} aria-label={`删除本机下载：${r.name}`} onClick={() => {
                if (window.confirm(`删除《${r.name}》的本机下载并从菜篮移除？收藏和饭友圈原作会保留。`)) {
                  document.querySelector(".library-sheet[open]")?.close();
                  run(async alive => {
                    await onDeleteDownload(r);
                    if (alive()) setNotice("已删除本机下载");
                  });
                }
              }}><Trash2 size={18} aria-hidden="true" />删除本机下载</button>
              <button className="sheet-cancel" onClick={e => e.currentTarget.closest("dialog").close()}>取消</button>
              </dialog>
            </article>
          ))}
          </>}
        </>
      )}
      {section === "detail" && remote && (
        <>
          <p className="circle-byline circle-detail-meta">
            <span className="circle-author"><i aria-hidden="true">{original(initial(remote.author))}</i>{original(remote.author)}</span> · <span><Clock size={15} aria-hidden="true" />{remote.minutes} 分钟</span> · <span><Users size={15} aria-hidden="true" />{remote.servings} 人份</span>
          </p>
          <img className="community-cover circle-cover" src={connection.server + remote.image} alt={remote.name + "成品图"} />
          <button className={"primary circle-download-action" + (download ? " is-downloaded" : "")} disabled={busy}
            onClick={() => download ? go("recipe/" + download.id) : run(downloadRemote)}>
            {download ? <Check size={18} aria-hidden="true" /> : <Download size={18} aria-hidden="true" />}
            {download ? "打开离线菜谱" : "下载到我的菜谱"}
          </button>
          <p role="status" className="community-status">{busy ? "正在处理…" : notice}</p>
          {publishResult?.id === remote.id && <p role="status" className="circle-publish-result">{publishResult.message}</p>}
          {download && download.community.version < remote.version &&
            <div className="circle-update">
              <span>本机是第 {download.community.version} 版，在线已更新到第 {remote.version} 版。</span>
              <button disabled={busy} onClick={() => run(downloadRemote)}><RefreshCw size={16} aria-hidden="true" />更新下载（第 {remote.version} 版）</button>
            </div>}
          <p className="circle-byline circle-unverified"><Shield size={15} aria-hidden="true" />用户分享，未经项目核对 · 第 {remote.version} 版</p>
          {remote.description && <p className="circle-description">{original(remote.description)}</p>}
          <div className="community-actions circle-detail-tools">
            <button className="circle-quiet" onClick={() => report("recipe", remote.id)}>
              <Flag size={16} aria-hidden="true" />
              举报菜谱
            </button>
            {user?.id === remote.authorId && (
              <>
                <button onClick={() => go("community/edit/" + remote.id)}>
                  <Pencil size={16} aria-hidden="true" />
                  编辑菜谱
                </button>
                <button
                  className="circle-danger"
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
                  <Trash2 size={16} aria-hidden="true" />
                  删除公开菜谱
                </button>
              </>
            )}
          </div>
          <div className="circle-section-head"><h2>食材与用量</h2><small>{remote.ingredients.length} 样</small></div>
          <ul className="circle-ingredients">
            {remote.ingredients.map((i, n) => (
              <li key={n} className={i.optional ? "optional" : undefined}>
                <span>{original(i.name)}</span><span className="circle-sep">：</span><b>{original(i.amount)}</b>
                {i.optional ? <small>（可省）</small> : ""}
              </li>
            ))}
          </ul>
          <div className="circle-section-head"><h2>做法</h2><small>{remote.steps.length} 步</small></div>
          <ol className="circle-steps">
            {remote.steps.map((s, n) => (
              <li key={n}>
                <strong>{original(s.title)}</strong>
                <p>{original(s.text)}</p>
                <p className="circle-guide circle-guide-amount"><b>用量：</b>{original(s.amount)}</p>
                {s.heat && <p className="circle-guide"><b>火力：</b>{original(s.heat)}</p>}
                {s.cue && <p className="circle-guide circle-guide-cue"><b>状态：</b>{original(s.cue)}</p>}
                {s.seconds > 0 && <p className="circle-guide"><b>计时：</b>{s.seconds >= 60 ? `${Math.floor(s.seconds / 60)} 分${s.seconds % 60 ? ` ${s.seconds % 60} 秒` : "钟"}` : `${s.seconds} 秒`}</p>}
              </li>
            ))}
          </ol>
          <p className="circle-attribution">来源／原创声明：{original(remote.attribution)}</p>
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
          <div className="empty circle-empty">
            <Pencil size={28} aria-hidden="true" />
            <p>发布和编辑需要账号；草稿只保存在这台设备。</p>
            <button className="primary" onClick={() => requireLogin(hash.slice(1))}>
              登录后编辑菜谱
            </button>
          </div>
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
          {!user && !connection.server ? <p className="hint circle-step-hint">先连接课堂服务，再登录或注册。</p> : !user ? (
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
              <div className="circle-account-card">
                <span className="circle-avatar" aria-hidden="true">{initial(user.username)}</span>
                <span className="circle-account-copy">
                  <h2>{user.username}</h2>
                  <small>{hostOf(connection.server)}{user.admin ? " · 管理员" : ""}</small>
                </span>
              </div>
              <p className="hint">
                登录不自动上传或恢复配置。退出后，本机食材和下载保留，账号草稿隐藏。
              </p>
              <button
                className="circle-logout"
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
                <LogOut size={18} aria-hidden="true" />
                退出登录
              </button>
              <section className="circle-backup" aria-labelledby="circle-backup-title">
              <h2 id="circle-backup-title">手动配置备份</h2>
              <p>
                范围：食材、常备调料、常用顺序、收藏、饮食偏好。不包含下载文件、当前一餐和计时器。
              </p>
              <p className={"circle-backup-time" + (backup?.updated ? " has-backup" : "")}>
                {backup?.updated ? <Check size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
                {backup?.updated
                  ? "云端备份：" + date(backup.updated)
                  : "尚未读取到云端备份"}
              </p>
              <div className="community-actions circle-backup-actions">
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
                  <Upload size={18} aria-hidden="true" />
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
                  <RotateCcw size={18} aria-hidden="true" />
                  恢复到本机
                </button>
              </div>
              </section>
              {user.admin && (
                <a className="circle-admin-link" href="#community/admin">
                  <Flag size={18} aria-hidden="true" />
                  <span>查看举报管理</span>
                  <ChevronRight size={18} aria-hidden="true" />
                </a>
              )}
            </>
          )}
        </>
      )}
      {section === "admin" && user?.admin && (
        <>
          {!reports.length && !loading && <div className="empty circle-empty"><Check size={28} aria-hidden="true" /><p>暂无未处理举报。</p></div>}
          {reports.map((r) => (
            <article className="community-local circle-report" key={r.id}>
              <h2>{r.kind === "recipe" ? "菜谱举报" : "评论举报"}</h2>
              <p className="circle-report-reason">{r.reason}</p>
              <details>
                <summary>查看被举报内容</summary>
                <p className="report-content">{reportContent(r)}</p>
              </details>
              <div className="community-actions">
                <button
                  className="circle-danger"
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
    <details className="circle-connection" open={!connection.server}>
      <summary>
        <Server size={20} aria-hidden="true" />
        <span>服务地址</span>
        <small className={connection.server ? "is-connected" : undefined}>
          {connection.server ? hostOf(connection.server) : "未连接"}
        </small>
        <ChevronDown className="circle-summary-chevron" size={18} aria-hidden="true" />
      </summary>
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
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://你的服务地址"
          />
        </label>
        <button className="primary" disabled={busy}>连接服务</button>
      </form>
    </details>
  );
}
function AuthForm({ busy, submit }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  return (
    <form
      className="circle-auth"
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
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <div className="circle-password">
        <label>
          密码
          <input
            required
            minLength={8}
            maxLength={128}
            type={reveal ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            autoCapitalize="none"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="button" className="circle-reveal" aria-pressed={reveal}
          aria-label={reveal ? "隐藏密码" : "显示密码"} onClick={() => setReveal(v => !v)}>
          {reveal ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
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
  const field = useRef(null);
  const render = (c) => (
    <div
      className={"community-comment" + (c.parentId ? " reply" : "") + (c.deleted ? " deleted" : "") + (parent?.id === c.id ? " replying" : "")}
      key={c.id}
    >
      <span className="circle-avatar" aria-hidden="true">{c.deleted ? "·" : original(initial(c.author))}</span>
      <div className="circle-comment-body">
      <strong>{original(c.author)}</strong>
      <p>{original(c.text)}</p>
      {!c.deleted && (
        <div className="community-actions">
          {!c.parentId && (
            <button
              aria-pressed={parent?.id === c.id}
              onClick={() => {
                if (login()) {
                  flushSync(() => setParent(c));
                  field.current?.focus({ preventScroll: true });
                  field.current?.scrollIntoView({ block: "center" });
                }
              }}
            >
              <Reply size={16} aria-hidden="true" />
              回复
            </button>
          )}
          {user?.id === c.authorId && (
            <button onClick={() => remove(c.id)}><Trash2 size={16} aria-hidden="true" />删除评论</button>
          )}
          <button onClick={() => report("comment", c.id)}><Flag size={16} aria-hidden="true" />举报评论</button>
        </div>
      )}
      </div>
    </div>
  );
  return (
    <section className="circle-discussion">
      <div className="circle-section-head"><h2>讨论</h2>{rows.length > 0 && <small>{rows.filter(c => !c.deleted).length} 条</small>}</div>
      {!rows.length && <p className="circle-no-comments"><MessageCircle size={18} aria-hidden="true" />暂无评论。</p>}
      {rows
        .filter((c) => !c.parentId)
        .map((c) => (
          <React.Fragment key={c.id}>
            {render(c)}
            {rows.filter((r) => r.parentId === c.id).map(render)}
          </React.Fragment>
        ))}
      {!user ? (
        <button className="circle-join" onClick={login}><MessageCircle size={18} aria-hidden="true" />登录参与讨论</button>
      ) : (
        <form
          className="circle-composer"
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
            <p className="circle-reply-target">
              <Reply size={16} aria-hidden="true" />
              <span>回复 {parent.author}</span>{" "}
              <button type="button" onClick={() => { setParent(null); field.current?.focus(); }}>
                <X size={16} aria-hidden="true" />
                取消回复
              </button>
            </p>
          )}
          <label>
            评论内容
            <textarea
              ref={field}
              required
              maxLength={1000}
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <div className="circle-composer-foot">
            <small aria-hidden="true" className={value.length > 900 ? "near-limit" : undefined}>{value.length} / 1000</small>
            <button className="primary" disabled={sending || !value.trim()}><Send size={16} aria-hidden="true" />{sending ? "发送中…" : "发送评论"}</button>
          </div>
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
  const [photoError, setPhotoError] = useState("");
  const photoInput = useRef(null);
  const key = scope + ":" + id;
  const panels = ["基本信息", "食材", "步骤"];
  const [panel, setPanel] = useState(() => {
    try { return panels.includes(sessionStorage.getItem(key)) ? sessionStorage.getItem(key) : panels[0]; }
    catch { return panels[0]; }
  });
  function selectPanel(next) {
    flushSync(() => setPanel(next));
    try { sessionStorage.setItem(key, next); } catch { /* Draft content is stored separately. */ }
    document.querySelector(".circle-editor-tabs")?.scrollIntoView({ block: "start" });
  }
  const [editingStep, setEditingStep] = useState(() => {
    try { return Number(sessionStorage.getItem(key + ":step")) || 0; } catch { return 0; }
  });
  const [removed, setRemoved] = useState(null);
  function openStep(index) {
    setEditingStep(index);
    try { sessionStorage.setItem(key + ":step", String(index)); } catch {}
  }
  const queue = useRef(Promise.resolve());
  const current = useRef(null);
  const alive = useRef(true);
  useEffect(() => {
    if (id === "new") {
      go("community/edit/draft-" + crypto.randomUUID(), { replace: true });
      return;
    }
    alive.current = true;
    let valid = true;
    (async () => {
      const drafts = await getDrafts();
      const saved = drafts.find((d) => d.key === key);
      let data = saved?.value;
      if (!data) {
        if (id.startsWith("draft-")) data = blank();
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
      .then(() => putDraft({ key, scope, id, value }));
    queue.current
      .then(() => {
        if (alive.current && current.current === value) {
          setStatus("草稿已保存到本机");
          setSaving(false);
        }
      })
      .catch(() => {
        if (alive.current && current.current === value) {
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
  function addIngredient() {
    if (value.ingredients.length >= 50) return;
    flushSync(() => change("ingredients", [...value.ingredients, { name: "", amount: "", optional: false }]));
    document.querySelector('[data-panel="食材"] .community-row:last-of-type input')?.focus();
  }
  function ingredientEnter(event, index, isAmount) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    const fields = event.currentTarget.closest("fieldset").querySelectorAll(".community-fields input");
    const next = fields[index * 2 + (isAmount ? 2 : 1)];
    if (next) next.focus();
    else if (event.currentTarget.value.trim()) addIngredient();
  }
  if (!value) return <p role="status">正在打开草稿…</p>;
  return (
    <form
      className="community-editor" noValidate onInput={e => e.target.setCustomValidity?.("")}
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        onError("");
        try {
          const draft = current.current;
          const payload = { ...draft, servings: Number(draft.servings), minutes: Number(draft.minutes),
            steps: draft.steps.map(step => ({ ...step, seconds: Number(step.seconds || 0) })) };
          const invalid = [...e.currentTarget.elements].find(control => control.willValidate &&
            (!control.validity.valid || (control.required && !control.value.trim())));
          if (invalid) {
            selectPanel(invalid.closest("fieldset").dataset.panel);
            if (invalid.closest("[data-step]")) flushSync(() => openStep(Number(invalid.closest("[data-step]").dataset.step)));
            invalid.closest("details")?.setAttribute("open", "");
            invalid.focus();
            if (invalid.validity.valid) invalid.setCustomValidity("请填写此项");
            invalid.reportValidity();
            return;
          }
          if (!draft.imageData && !draft.remoteId) {
            selectPanel("基本信息");
            setPhotoError("请添加成品图");
            photoInput.current?.focus();
            photoInput.current?.scrollIntoView({ block: "center" });
            return;
          }
          recipeInput(payload);
          setSubmitting(true);
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
      <div className="circle-segments circle-editor-tabs" aria-label="编辑分段">
        {panels.map(name => <button type="button" key={name} aria-pressed={panel === name}
          onClick={() => selectPanel(name)}>{name}</button>)}
      </div>
      <p role="status">{saving ? "正在保存草稿…" : status}</p>
      <fieldset disabled={submitting} data-panel="基本信息" hidden={panel !== "基本信息"}>
        <legend>基本信息</legend>
        <label className="photo-picker">
          {(value.imageData || value.image) && (
          <img
            className="community-cover"
            src={value.imageData || server + value.image}
            alt="成品图预览"
          />
        )}
          <span>{value.imageData || value.image ? "更换成品图" : "添加成品图"}</span>
          <input
            aria-label="成品图 *" ref={photoInput}
            aria-invalid={photoError ? true : undefined}
            aria-describedby={photoError ? "cover-error" : undefined}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = await preparePhoto(f);
                if (alive.current) { setPhotoError(""); change("imageData", data); }
              } catch (e) {
                if (alive.current) setPhotoError(e.message);
              }
            }}
          />
        </label>
        {photoError && <p className="warning" id="cover-error" role="alert">{photoError}</p>}
        <label>
          菜名 *
          <input
            required
            maxLength={60}
            value={value.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </label>
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
        <details><summary>简介与厨具（选填）</summary>
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
        </details>
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
      <fieldset disabled={submitting} data-panel="食材" hidden={panel !== "食材"}>
        <legend>食材和用量</legend>
        {value.ingredients.map((i, n) => (
          <div className="community-row" key={n}>
            <div className="community-fields">
              <label>
                食材 {n + 1} *
                <input
                  required
                  maxLength={30}
                  enterKeyHint="next" onKeyDown={e => ingredientEnter(e, n, false)} value={i.name}
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
                  enterKeyHint="next" onKeyDown={e => ingredientEnter(e, n, true)} value={i.amount}
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
            <div className="ingredient-controls"><label className="community-checkbox">
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
              hidden={value.ingredients.length === 1}
              onClick={() => { setRemoved({index:n, item:i}); change("ingredients", value.ingredients.filter((_, x) => x !== n)); }}
            >
              删除食材 {n + 1}
            </button></div>
          </div>
        ))}
        <button
          type="button"
          disabled={value.ingredients.length >= 50}
          onClick={addIngredient}
        >
          添加食材
        </button>
        {removed && <button type="button" disabled={value.ingredients.length >= 50} onClick={() => {
          const rows = [...value.ingredients];
          rows.splice(removed.index, 0, removed.item);
          change("ingredients", rows); setRemoved(null);
        }}>撤销删除</button>}
      </fieldset>
      <fieldset disabled={submitting} data-panel="步骤" hidden={panel !== "步骤"}>
        <legend>步骤</legend>
        {value.steps.map((s, n) => (
          <div className="community-row" key={n}>
            <button type="button" className="step-summary" aria-expanded={editingStep === n}
              onClick={e => {
                const header = e.currentTarget, top = header.getBoundingClientRect().top;
                flushSync(() => openStep(editingStep === n ? -1 : n));
                window.scrollBy(0, header.getBoundingClientRect().top - top);
              }}>第 {n + 1} 步　{original(s.title || "填写步骤")}</button>
            <div data-step={n} hidden={editingStep !== n}>
            {[
              ["title", "步骤标题", 60, true],
              ["text", "操作说明", 1500, true],
              ["amount", "本步用量", 300, true],
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
            <details><summary>火力、状态与计时</summary>
              {[["heat", "火力（有依据才填）", 100], ["cue", "状态（有依据才填）", 300]].map(([name, label, max]) =>
                <label key={name}>{label} {n + 1}
                  <textarea maxLength={max} value={s[name]} onChange={e => row("steps", n, name, e.target.value)} />
                </label>)}
            <DraftNumber label={`计时秒数 ${n + 1}（0 表示不计时）`} min={0} max={86400}
              value={s.seconds} onChange={next => row("steps", n, "seconds", next)} />
            </details>
            <button
              type="button"
              disabled={value.steps.length === 1}
              onClick={() => { openStep(Math.max(0, n-1)); change("steps", value.steps.filter((_, x) => x !== n)); }}
            >
              删除步骤 {n + 1}
            </button></div>
          </div>
        ))}
        <button
          type="button"
          disabled={value.steps.length >= 40}
          onClick={() => {
            flushSync(() => { openStep(value.steps.length); change("steps", [
              ...value.steps,
              {
                title: "",
                text: "",
                amount: "",
                heat: "",
                cue: "",
                seconds: 0,
              },
            ]); });
            document.querySelector(`[data-step="${value.steps.length}"] textarea`)?.focus();
          }}
        >
          添加步骤
        </button>
      </fieldset>
      {panel !== "步骤" ? <button type="button" className="primary circle-editor-next"
        onClick={() => selectPanel(panel === "基本信息" ? "食材" : "步骤")}>
        {panel === "基本信息" ? "下一步：食材" : "下一步：步骤"}
      </button> : <>
      <p className="hint">* 为必填。发布即公开；请使用有权分享的内容与图片。</p>
      <button className="primary" disabled={submitting || saving}>
        {submitting
          ? "正在发布…"
          : value.remoteId
            ? "保存公开修改"
            : "发布菜谱"}
      </button>
      </>}
    </form>
  );
}
