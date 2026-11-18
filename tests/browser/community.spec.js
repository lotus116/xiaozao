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
  app = createApp({ dataDir: dir });
  await new Promise((r) => app.server.listen(0, "127.0.0.1", r));
  server = "http://127.0.0.1:" + app.server.address().port;
});
test.afterAll(async () => {
  await app.close();
  await rm(dir, { recursive: true, force: true });
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
  await page.getByLabel("食材 1 *", { exact: true }).fill(beef ? "牛肉卷" : "番茄");
  await page.getByLabel("用量 1 *", { exact: true }).fill(beef ? "150 克" : "2 个");
  if (beef) {
    await page.getByRole("button", { name: "添加食材", exact: true }).click();
    await page.getByLabel("食材 2 *", { exact: true }).fill("熟米饭");
    await page.getByLabel("用量 2 *", { exact: true }).fill("1 碗");
  }
  await page.getByLabel("步骤标题 1 *", { exact: true }).fill(beef ? "煮牛肉卷" : "炒番茄");
  await page
    .getByLabel("操作说明 1 *", { exact: true })
    .fill(beef ? "将牛肉卷煮熟，铺在热米饭上。" : "将番茄切块，放入锅中翻炒至变软。");
  await page.getByLabel("本步用量 1 *", { exact: true }).fill(beef ? "牛肉卷 150 克、熟米饭 1 碗" : "番茄 2 个");
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
    viewport: { width: 390, height: 844 },
  });
  const reader = await context.newPage();
  await connect(reader);
  await reader.goto("/#community/detail/" + id);
  await reader
    .getByRole("button", { name: "下载到我的菜谱", exact: true })
    .click();
  await expect(
    reader.getByRole("status").filter({ hasText: "已完整下载" }),
  ).toBeVisible();
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
  await page.getByRole("button",{name:"保存公开修改"}).click();
  await expect(page.getByRole("button",{name:"打开离线菜谱"})).toBeVisible();
  await page.goto("/#community/mine");
  await expect(page.locator("article button.community-recipe")).toHaveCount(1);
  await expect(page.locator("article button.community-recipe")).toContainText("作者修订的食谱");
  await page.getByRole("button",{name:"删除本机下载：作者修订的食谱"}).click({trial:true});
  await page.goto("/#settings");
  await page.getByLabel("界面语言").selectOption("zh-HK");
  await expect(page.locator("html")).toHaveAttribute("lang","zh-HK");
  await page.goto("/#community/mine");
  await expect(page.locator("article button.community-recipe")).toContainText("作者修订的食谱");
});
