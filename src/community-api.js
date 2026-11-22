const KEY = "xiaozao-community-connection";
export function readConnection() {
  try {
    return (
      JSON.parse(localStorage.getItem(KEY)) || {
        server: document.querySelector('meta[name="xiaozao-community"][content="same-origin"]')
          ? serverAddress(location.origin)
          : "",
        session: null,
      }
    );
  } catch {
    return { server: "", session: null };
  }
}
export function saveConnection(c) {
  localStorage.setItem(KEY, JSON.stringify(c));
}
export function serverAddress(value) {
  const url = new URL(value.trim());
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  )
    throw new Error("请填写 HTTPS 服务地址，不含路径；本机开发可用 localhost");
  return url.origin;
}
export async function request(
  connection,
  path,
  { method = "GET", data, signal, anonymous = false } = {},
) {
  if (!connection.server) throw new Error("请先在账号页设置服务地址");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 20000);
  try {
    const response = await fetch(connection.server + path, {
      method,
      signal: controller.signal,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(!anonymous && connection.session?.token
          ? { Authorization: `Bearer ${connection.session.token}` }
          : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const value = await response.json();
    if (!response.ok)
      throw Object.assign(new Error(value.error || "服务请求失败"), {
        status: response.status,
      });
    return value;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("请求已取消或超时，请重试");
    if (e instanceof TypeError)
      throw new Error("连接失败，请检查网络与服务地址");
    throw e;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export async function fetchImage(connection, path, signal) {
  if (!/^\/api\/images\/[a-f0-9]{64}\.(jpeg|png|webp)$/.test(path))
    throw new Error("图片地址不正确");
  const response = await fetch(connection.server + path, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (!response.ok) throw new Error("图片下载失败，原有副本保留");
  const blob = await response.blob();
  if (blob.size > 1500000) throw new Error("图片太大");
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = async () => {
      try { const image = new Image(); image.src = r.result; await image.decode(); resolve(r.result); }
      catch { reject(new Error("图片损坏，下载未保存")); }
    };
    r.onerror = () => reject(new Error("图片无法保存"));
    r.readAsDataURL(blob);
  });
}
