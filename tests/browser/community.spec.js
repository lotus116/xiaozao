import { test, expect } from "@playwright/test";
import { createApp } from "../../server/app.mjs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
let app, dir, server;
const photo = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
  "base64",
);
test.beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "xiaozao-browser-"));
  app = createApp({ dataDir: dir, webDir: join(process.cwd(), "dist"), adminUser: "reviewmoderator" });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  server = "http://127.0.0.1:" + app.server.address().port;
});
test.afterAll(async () => {
  await app.close();
  await rm(dir, { recursive: true, force: true });
});
test("the community server opens its own feed for a first-time visitor", async ({ page }) => {
  const response = page.waitForResponse(r => r.url().startsWith(server + "/api/recipes?"));
  await page.goto(server + "/#community/feed");
  expect((await response).ok()).toBe(true);
  const search = page.getByRole("searchbox");
  await search.fill("没有这道菜");
  await page.getByRole("button", { name: "清空饭友圈搜索" }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await page.goto(server + "/#community/account");
  await expect(page.getByLabel("HTTPS 服务地址")).toHaveValue(server);
  await expect(page.getByRole("button", { name: "没有账号，去注册" })).toBeVisible();
  const password = page.getByLabel("密码", { exact: true });
  await password.fill("display-check");
  await page.getByRole("button", { name: "显示密码" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "隐藏密码" }).click();
  await expect(password).toHaveValue("display-check");
  await expect(password).toHaveAttribute("type", "password");
});

async function connect(page) {
  await page.goto("/#community/account");
  await expect(page.getByRole("button", { name: "没有账号，去注册" })).toHaveCount(0);
  await page.getByLabel("HTTPS 服务地址").fill(server);
  await page.getByRole("button", { name: "连接服务", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "服务连接成功" }),
  ).toBeVisible();
}
async function register(page, name) {
  await page.getByRole("button", { name: "没有账号，去注册" }).click();
  await page.getByLabel("用户名", { exact: true }).fill(name);
  await page.getByLabel("密码", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "注册并登录", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "饭友圈", exact: true }),
  ).toBeVisible();
}
async function publish(page, name, beef = false) {
  await page.getByRole("button", { name: "发布菜谱", exact: true }).click();
  await page.getByLabel("菜名 *", { exact: true }).fill(name);
  await page.getByRole("button", {name:"下一步：食材"}).click();
  await page.getByLabel("食材 1 *", { exact: true }).fill(beef ? "牛肉卷" : "番茄");
  await page.getByLabel("用量 1 *", { exact: true }).fill(beef ? "150 克" : "2 个");
  if (beef) {
    await page.getByRole("button", { name: "添加食材", exact: true }).click();
    await page.getByLabel("食材 2 *", { exact: true }).fill("熟米饭");
    await page.getByLabel("用量 2 *", { exact: true }).fill("1 碗");
  }
  await expect(page.getByText("草稿已保存到本机",{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button",{name:"食材",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(page.getByLabel("用量 1 *",{exact:true})).toHaveValue(beef ? "150 克" : "2 个");
  await page.getByRole("button", {name:"下一步：步骤"}).click();
  await page.getByLabel("步骤标题 1 *", { exact: true }).fill(beef ? "煮牛肉卷" : "炒番茄");
  await page
    .getByLabel("操作说明 1 *", { exact: true })
    .fill(beef ? "将牛肉卷煮熟，铺在热米饭上。" : "将番茄切块，放入锅中翻炒至变软。");
  await page.getByLabel("本步用量 1 *", { exact: true }).fill(beef ? "牛肉卷 150 克、熟米饭 1 碗" : "番茄 2 个");
  await page.getByText("火力、状态与计时", {exact:true}).click();
  await page.getByLabel("火力（有依据才填） 1", { exact: true }).fill("中火");
  await page
    .getByLabel("状态（有依据才填） 1", { exact: true })
    .fill(beef ? "肉片熟透" : "番茄变软");
  await page
    .getByLabel("计时秒数 1（0 表示不计时）", { exact: true })
    .fill("60");
  await expect(
    page.getByText("草稿已保存到本机", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "发布菜谱", exact: true }).click();
  await expect(page.getByLabel("成品图 *", { exact:true })).toBeFocused();
  await expect(page.getByRole("alert")).toHaveText("请添加成品图");
  await page
    .getByLabel("成品图 *", { exact: true })
    .setInputFiles({ name: "dish.png", mimeType: "image/png", buffer: photo });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button",{name:"步骤",exact:true}).click();
  await page.getByRole("button", { name: "发布菜谱", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  return page.url().split("/").pop();
}
test("two people publish/download; offline reload, basket, steps, quantities and floating timer", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await connect(page);
  await register(page, "author" + Date.now());
  const id = await publish(page, "饭友番茄");
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
  });
  const reader = await context.newPage();
  await connect(reader);
  await reader.goto("/#community/feed");
  const hero = reader.locator(".community-discovery .community-recipe").first();
  await expect(hero).toContainText("饭友番茄");
  const heroImage = await hero.locator("img").boundingBox();
  await reader.getByRole("searchbox").fill("饭友番茄");
  const result = reader.locator(".community-list:not(.community-discovery) .community-recipe").first();
  await expect(result).toContainText("饭友番茄");
  expect((await result.locator("img").boundingBox()).width).toBeLessThan(heroImage.width);
  await reader.getByRole("searchbox").fill("");
  await hero.click();
  const action = reader.locator(".circle-download-action");
  await expect(action).toBeVisible();
  const before = await action.boundingBox();
  const bottomNav = await reader.locator("nav").boundingBox();
  expect(before.y + before.height).toBeLessThanOrEqual(bottomNav.y);
  expect(await action.evaluate(el => {
    const r = el.getBoundingClientRect();
    return [r.left + 6, r.right - 6, r.left + r.width / 2].every(x =>
      el.contains(document.elementFromPoint(x, r.top + r.height / 2)));
  })).toBe(true);
  await reader
    .getByRole("button", { name: "下载到我的菜谱", exact: true })
    .click();
  await expect(
    reader.getByRole("status").filter({ hasText: "已完整下载" }),
  ).toBeVisible();
  expect(await action.boundingBox()).toEqual(before);
  await reader.route(server + "/**", (route) => route.abort());
  await reader
    .getByRole("button", { name: "打开离线菜谱", exact: true })
    .click();
  await expect(
    reader.getByRole("heading", { name: "饭友番茄", exact: true }),
  ).toBeVisible();
  await reader.reload();
  await expect(
    reader.getByRole("heading", { name: "饭友番茄", exact: true }),
  ).toBeVisible();
  const localImage = reader.locator(".dish-thumbnail").first();
  await expect(localImage).toHaveAttribute("src", /^data:image/);
  await reader
    .getByRole("button", { name: "加入今天的菜篮", exact: true })
    .click();
  await reader.getByRole("link", { name: /菜篮/ }).click();
  await expect(
    reader.getByText("饭友番茄", { exact: true }).first(),
  ).toBeVisible();
  await reader.goto("/#community/mine");
  await reader.getByRole("button", { name: /^饭友番茄/ }).click();
  await reader.getByRole("button", { name: "看备料", exact: true }).click();
  await reader
    .getByRole("button", { name: /开始做|开始跟做|开始第一步/ })
    .first()
    .click();
  await expect(
    reader.getByText("番茄 2 个", { exact: true }).first(),
  ).toBeVisible();
  await expect(reader.getByText("中火", { exact: true })).toBeVisible();
  await reader.screenshot({
    path: "/tmp/xiaozao-community-cooking.png",
    fullPage: true,
  });
  await expect(reader.locator(".step-guidance")).toBeVisible();
  await reader.getByRole("button", { name: "启动计时：炒番茄，1 分钟计时", exact: true }).click();
  const handle = reader.locator(".timer-handle");
  const box = await handle.boundingBox();
  await reader.mouse.move(box.x + 20, box.y + 20);
  await reader.mouse.down();
  await reader.waitForTimeout(800);
  await reader.mouse.up();
  await expect(handle).toHaveCount(0);
  await reader.goto("/#community/mine");
  const timerState = await reader.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1")));
  expect(timerState.timer.id).toMatch(/^community-/);
  expect(timerState.timerDock.hidden).toBe(true);
  await reader.reload();
  await expect(reader.getByRole("heading", { name: "我的菜谱", exact: true })).toBeVisible();
  expect(await reader.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1")).timerDock.hidden)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});
test("account backup restores only configuration, comments/replies and draft survive navigation", async ({
  page,
}) => {
  await connect(page);
  const username = "backup" + Date.now();
  await register(page, username);
  const id = await publish(page, "备份测试菜");
  await page.getByLabel("评论内容").fill("这道菜不错");
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByText("这道菜不错", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "回复", exact: true }).click();
  await page.getByLabel("评论内容").fill("谢谢分享");
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByText("谢谢分享", { exact: true })).toBeVisible();
  await page.goto("/#pantry");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("xiaozao-v1"));
    s.pantry = ["番茄", "盐"];
    s.timerDock = { hidden: true, position: null };
    localStorage.setItem("xiaozao-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.goto("/#community/account");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "备份本机配置", exact: true }).click();
  await expect(page.getByText("配置已备份", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("xiaozao-v1"));
    s.pantry = ["土豆"];
    localStorage.setItem("xiaozao-v1", JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole("button", { name: "恢复到本机", exact: true }).click();
  await expect(page.getByText(/已恢复配置/)).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("xiaozao-v1")).pantry,
    ),
  ).toEqual(["番茄", "盐"]);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("xiaozao-v1")).timerDock.hidden,
    ),
  ).toBe(true);
  await page.goto("/#community/edit/new");
  await page.getByLabel("菜名 *", { exact: true }).fill("未发布草稿");
  await expect(
    page.getByText("草稿已保存到本机", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("菜名 *", { exact: true })).toHaveValue("未发布草稿");
  await page.getByRole("link", { name: "我的菜谱", exact: true }).click();
  await page.goBack();
  await expect(page.getByLabel("菜名 *", { exact: true })).toHaveValue("未发布草稿");
  await page.getByRole("link", { name: "我的菜谱", exact: true }).click();
  await page.getByRole("link",{name:"草稿",exact:true}).click();
  await expect(page.getByText("未发布草稿", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "继续编辑", exact: true }).click();
  await expect(page.getByLabel("菜名 *", { exact: true })).toHaveValue(
    "未发布草稿",
  );
});
test("mobile layout and accessibility on community/account/editor", async ({
  page,
}) => {
  await connect(page);
  await register(page, "layout" + Date.now());
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [412, 915],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/#community/feed");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const nav = await page
      .locator('nav[aria-label="主要导航"] a')
      .evaluateAll((a) =>
        a.map((x) => ({
          w: x.getBoundingClientRect().width,
          h: x.getBoundingClientRect().height,
        })),
      );
    expect(nav.every((x) => x.w >= 48 && x.h >= 48)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#community/edit/new");
  await expect(page.getByLabel("菜名 *", { exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page })
    .include(".community")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({
    path: "/tmp/xiaozao-community-editor.png",
    fullPage: true,
  });
});

test("updates are explicit; active cooking blocks replacement; author deletion keeps local copy", async ({
  page,
}) => {
  await connect(page);
  await register(page, "versions" + Date.now());
  const id = await publish(page, "更新前的菜");
  await expect(page.getByText("已发布并保存到本机，可离线跟做。")).toBeVisible();
  await page.getByRole("button", { name: "打开离线菜谱" }).click();
  await page.getByRole("button", { name: "看备料", exact: true }).click();
  await page.goto("/#community/detail/" + id);
  await page.getByRole("button", { name: "编辑菜谱", exact: true }).click();
  await page.getByLabel("菜名 *", { exact: true }).fill("更新后的菜");
  await expect(
    page.getByText("草稿已保存到本机", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button",{name:"步骤",exact:true}).click();
  await page.getByRole("button", { name: "保存公开修改", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "更新下载（第 2 版）", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "打开离线菜谱", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "更新前的菜", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "看备料", exact: true }).click();
  await page.goto("/#community/detail/" + id);
  await page
    .getByRole("button", { name: "更新下载（第 2 版）", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("请先结束当前使用");
  await page.goto("/#community/mine");
  page.once("dialog", dialog => dialog.accept());
  await page.getByLabel("更多操作：更新前的菜").click();
  await page.getByRole("button", { name: "删除本机下载：更新前的菜" }).click();
  await expect(page.getByRole("alert")).toContainText("请先结束");
  await page.goto("/#community/detail/" + id);
  await page.getByRole("button", { name: "打开离线菜谱", exact: true }).click();
  await page.getByRole("button", { name: "看备料", exact: true }).click();
  await page.getByRole("button", { name: "备好了，开始做", exact: true }).click();
  await page.getByRole("button", { name: "完成这道菜", exact: true }).click();
  await page.goto("/#community/detail/" + id);
  await page.getByRole("button", { name: "更新下载（第 2 版）", exact: true }).click();
  await expect(page.getByText("已完整下载，可断网跟做", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-v1")).cooking)).toBeNull();
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除公开菜谱", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "饭友圈", exact: true }),
  ).toBeVisible();
  await page.goto("/#community/mine");
  await page.getByRole("button", { name: /^更新后的菜/ }).click();
  await expect(
    page.getByRole("heading", { name: "更新后的菜", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "更新后的菜", exact: true }),
  ).toBeVisible();
});
test("image failure never creates half download; failed comment preserves text; logout isolates drafts", async ({
  page,
}) => {
  await connect(page);
  await register(page, "failure" + Date.now());
  const id = await publish(page, "失败恢复测试菜");
  await page.goto("/#community/mine");
  page.once("dialog", dialog => dialog.accept());
  await page.getByLabel("更多操作：失败恢复测试菜").click();
  await page.getByRole("button", {name:"删除本机下载：失败恢复测试菜"}).click();
  await expect(page.getByText(/尚未下载菜谱/)).toBeVisible();
  await page.goto("/#community/detail/" + id);
  await page.route(server + "/api/images/**", (r) => r.abort());
  await page
    .getByRole("button", { name: "下载到我的菜谱", exact: true })
    .click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.goto("/#community/mine");
  await expect(page.getByText(/尚未下载菜谱/)).toBeVisible();
  await page.unroute(server + "/api/images/**");
  await page.goto("/#community/detail/" + id);
  await page.getByLabel("评论内容").fill("网络恢复后再发送");
  await page.route(server + "/api/recipes/" + id + "/comments", (r) =>
    r.request().method() === "POST" ? r.abort() : r.continue(),
  );
  await page.getByRole("button", { name: "发送评论" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("评论内容")).toHaveValue("网络恢复后再发送");
  await page.goto("/#community/edit/new");
  await page.getByLabel("菜名 *", { exact: true }).fill("私有草稿");
  await expect(
    page.getByText("草稿已保存到本机", { exact: true }),
  ).toBeVisible();
  await page.goto("/#community/account");
  await page.getByRole("button", { name: "退出登录", exact: true }).click();
  await register(page, "second" + Date.now());
  await page.goto("/#community/mine");
  await page.getByRole("link",{name:"草稿",exact:true}).click();
  await expect(page.getByText("私有草稿", { exact: true })).toHaveCount(0);
});

test("照烧牛肉饭下载后断网，普通牛肉不能替代牛肉卷，按原名添加即可备齐", async ({ page, browser }) => {
  await connect(page);
  await register(page, "cook" + Date.now());
  const id = await publish(page, "照烧牛肉饭", true);
  const ctx = await browser.newContext();
  try {
    const reader = await ctx.newPage();
    await connect(reader);
    await reader.goto("/#community/detail/" + id);
    await reader.getByRole("button", { name: "下载到我的菜谱", exact: true }).click();
    await reader.getByRole("button", { name: "打开离线菜谱" }).click();
    await reader.reload();
    await ctx.setOffline(true);
    await reader.getByRole("button", { name: "收藏", exact: true }).click();
    await reader.getByRole("button", { name: "加入今天的菜篮" }).click();
    const nav = reader.locator('nav');
    await nav.getByText("我的食材").click();
    const add = async (value) => {
      await reader.locator("#ingredient").fill(value);
      await reader.getByRole("button", { name: "添加食材", exact: true }).click();
    };
    await add("牛肉、熟米饭");
    await nav.getByText("菜篮").click();
    await expect(reader.locator(".basket-prep-summary")).toContainText("清单未记 1 样");
    await nav.getByText("我的食材").click();
    await add("牛肉卷");
    await expect(reader.getByRole("button", { name: "移除牛肉卷", exact: true })).not.toContainText("自定义");
    await nav.getByText("菜篮").click();
    await expect(reader.locator(".basket-prep-summary")).toContainText("必需食材都已记录");
    await nav.getByText("我的", { exact: true }).click();
    await reader.locator('main a[href="#community/mine"]').click();
    await reader.getByLabel("更多操作：照烧牛肉饭").click();
    const remove = reader.getByRole("button", { name: "删除本机下载：照烧牛肉饭" });
    reader.once("dialog", dialog => dialog.dismiss());
    await remove.click();
    await expect(remove).toBeVisible();
    reader.once("dialog", dialog => dialog.accept());
    await remove.click();
    await expect(remove).toHaveCount(0);
    await expect(reader.getByText(/尚未下载菜谱/)).toBeVisible();
    await nav.getByText("菜篮").click();
    await expect(reader.locator(".basket-dishes")).toHaveCount(0);
    await nav.getByText("我的", { exact: true }).click();
    await reader.locator('main a[href="#favorites"]').click();
    await expect(reader.getByText(/社区收藏尚未下载/)).toBeVisible();
    await ctx.setOffline(false);
    await reader.reload();
    await reader.goto("/#community/mine");
    await expect(reader.getByText(/尚未下载菜谱/)).toBeVisible();
    await reader.goto("/#community/detail/" + id);
    await reader.getByRole("button", { name: "下载到我的菜谱" }).click();
    await expect(reader.getByRole("button", { name: "打开离线菜谱" })).toBeVisible();
  } finally { await ctx.close(); }
});

test("mine starts creation, numeric drafts allow blanks, published edits replace the author's offline copy", async ({page}) => {
  await connect(page);
  await register(page, "creator" + Date.now());
  await page.goto("/#community/mine");
  await page.getByRole("button", {name:"写菜谱"}).click();
  for (const [label, number] of [["份数 *","1"], ["预计分钟 *","15"], ["计时秒数 1（0 表示不计时）","5"]]) {
    if (label.startsWith("计时")) {
      await page.getByRole("button",{name:"步骤",exact:true}).click();
      await page.getByText("火力、状态与计时",{exact:true}).click();
    }
    const field = page.getByLabel(label, {exact:true});
    await field.fill("");
    await expect(field).toHaveValue("");
    if (label.includes("*")) expect(await field.evaluate(el=>el.validity.valueMissing)).toBe(true);
    await field.pressSequentially(number);
    await expect(field).toHaveValue(number);
  }
  await page.goto("/#community/feed");
  await publish(page, "作者的食谱");
  await page.getByRole("button",{name:"编辑菜谱"}).click();
  await page.getByLabel("菜名 *",{exact:true}).fill("作者修订的食谱");
  await page.getByRole("button",{name:"步骤",exact:true}).click();
  await page.getByRole("button",{name:"保存公开修改"}).click();
  await expect(page.getByRole("button",{name:"打开离线菜谱"})).toBeVisible();
  await page.goto("/#community/mine");
  await expect(page.locator("article button.community-recipe")).toHaveCount(1);
  await expect(page.locator("article button.community-recipe")).toContainText("作者修订的食谱");
  await page.getByLabel("更多操作：作者修订的食谱").click();
  await page.getByRole("button",{name:"删除本机下载：作者修订的食谱"}).click({trial:true});
  await page.goto("/#settings");
  await page.getByLabel("界面语言").selectOption("zh-HK");
  await expect(page.locator("html")).toHaveAttribute("lang","zh-HK");
  await page.goto("/#community/mine");
  await expect(page.locator("article button.community-recipe")).toContainText("作者修订的食谱");
});

test("phone keyboard flow, ingredient undo and a third step survive returning to the draft", async ({page}) => {
  await page.setViewportSize({width:320,height:568});
  await connect(page);
  await register(page,"fivefoods"+Date.now());
  await page.getByRole("button",{name:"发布菜谱",exact:true}).click();
  await page.getByRole("button",{name:"食材",exact:true}).click();
  const foods=["番茄","鸡蛋","葱","姜","盐"];
  for (const [index,food] of foods.entries()) {
    const name=page.getByLabel(`食材 ${index+1} *`,{exact:true});
    if (index) await expect(name).toBeFocused();
    await name.fill(food);
    await name.press("Enter");
    const amount=page.getByLabel(`用量 ${index+1} *`,{exact:true});
    await expect(amount).toBeFocused();
    await amount.fill("1 克");
    if(index<4) await amount.press("Enter");
  }
  await page.getByRole("button",{name:"删除食材 3"}).click();
  await page.getByRole("button",{name:"撤销删除"}).click();
  await expect(page.getByLabel("食材 3 *",{exact:true})).toHaveValue("葱");
  await page.getByRole("button",{name:"下一步：步骤"}).click();
  for(const i of [1,2,3]){
    if(i>1) await page.getByRole("button",{name:"添加步骤"}).click();
    await page.getByLabel(`步骤标题 ${i} *`,{exact:true}).fill("备料"+i);
  }
  await expect(page.getByText("草稿已保存到本机",{exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox",{name:"步骤标题 3 *",exact:true})).toHaveValue("备料3");
  await expect(page.getByLabel("步骤标题 1 *",{exact:true})).toBeHidden();
  await page.getByRole("button",{name:/第 1 步.*备料1/}).click();
  await expect(page.getByRole("textbox",{name:"步骤标题 1 *",exact:true})).toBeVisible();
});

test("the moderator can inspect a reported recipe and keep it in the feed", async ({ page, request }) => {
  await connect(page);
  await register(page, "poster" + Date.now());
  const id = await publish(page, "举报核查用番茄");
  const { session } = await page.evaluate(() => JSON.parse(localStorage.getItem("xiaozao-community-connection")));
  const report = await request.post(server + "/api/reports", {
    headers: { Authorization: "Bearer " + session.token },
    data: { kind: "recipe", target: id, reason: "请核对这份做法" },
  });
  expect(report.ok()).toBe(true);
  const password = "test-moderator";
  const created = await request.post(server + "/api/auth/register", {
    data: { username: "moderatorSetup", password },
  });
  expect(created.ok()).toBe(true);
  const { user } = await created.json();
  app.db.prepare("UPDATE users SET username=? WHERE id=?").run("reviewmoderator", user.id);
  const login = await request.post(server + "/api/auth/login", {
    data: { username: "reviewmoderator", password },
  });
  expect(login.ok()).toBe(true);
  await page.goto(server + "/#community/admin");
  // The admin page uses the saved session on the same frontend origin.
  await page.evaluate(connection => localStorage.setItem("xiaozao-community-connection", JSON.stringify(connection)),
    { server, session: await login.json() });
  await page.reload();
  await page.getByText("查看被举报内容", { exact: true }).click();
  await expect(page.locator(".report-content")).toContainText("举报核查用番茄");
  await page.getByRole("button", { name: "保留内容，结案" }).click();
  await expect(page.getByText("暂无未处理举报。")).toBeVisible();
  expect((await request.get(server + "/api/recipes/" + id)).ok()).toBe(true);
});
