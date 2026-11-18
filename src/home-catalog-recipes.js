import asiaRecords from "./asia-recipes.json" with { type: "json" };
import chinaRecords from "./home-catalog-recipes.json" with { type: "json" };

const records = [...chinaRecords, ...asiaRecords];
const checked = "2026-11-18";
const commit = "25854882a423d7dbd6f6146b6554e2fa3b8f9804";
const upstream = `https://github.com/Anduin2017/HowToCook/blob/${commit}/`;
const safety = {
  url: "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
  site: "FoodSafety.gov",
  author: "美国政府食品安全信息平台",
  checked,
};
const mushroomSafety = {
  url: "https://www.cfs.gov.hk/sc_chi/multimedia/multimedia_pub/multimedia_pub_fsf_200_04.html",
  site: "香港食物安全中心",
  author: "食物安全中心",
  checked,
};

export const homeCatalogRecipes = records.map((row) => {
  const { path, primary, reference, ingredients, steps, focus, flexibility, rescue, safetyCheck, ...recipe } = row;
  const [url, site, author, title, supports, step] = reference;
  const crossCheck = { url, site, author, title, supports, step, checked, adaptation: flexibility };
  return {
    ...recipe,
    ingredients: ingredients.map(([name, amount, optionalReason]) => ({
      name, amount, water: name === "水", optional: !!optionalReason,
      ...(optionalReason ? { optionalReason } : {}),
    })),
    steps: steps.map(([title, amount, heat, action, cue, seconds = 0]) => ({
      title, text: [amount, heat, action, cue].filter(Boolean).join("。") + "。", seconds,
    })),
    source: primary ? { ...primary, checked } :
      { url: upstream + path, site: "HowToCook 中文开源菜谱", author: "HowToCook 社区贡献者", checked },
    additionalSources: [crossCheck],
    methodReviews: [crossCheck],
    teaching: { focus, flexibility, rescue: rescue.map(([problem, advice]) => ({ problem, advice })) },
    safetySources: [
      ...(safetyCheck ? [safety] : []),
      ...(ingredients.some(([name]) => name === "木耳") ? [mushroomSafety] : []),
    ],
    editorNote: "已比对两份同菜资料并写明取舍，尚未下厨试做。",
    timeNote: "总用时按切配、加热与列出的等待估计，计时用于检查状态。",
    servingsNote: `约${recipe.servings}人份`,
    nutrition: null,
    description: focus,
    stateVersion: 3,
  };
});

export const homeCatalogGuidance = Object.fromEntries(records.map(({ id, steps }) => [
  id,
  Object.fromEntries(steps.map(([title, amount, heat, action, cue]) => {
    const separateCue = [...action.matchAll(/\d+\s*°C/g)].some(([value]) => !cue.includes(value));
    return [title, { amount, ...(heat ? { heat } : {}), cue: separateCue ? action + "。" + cue : cue }];

  })),
]));
