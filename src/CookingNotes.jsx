import React from "react";
import { cookingReminders } from "./cooking-guidance";

export function PreparationNotes({ recipe }) {
  const reminders = cookingReminders(recipe);
  return (
    <aside className="preparation-notes" aria-label="开火前提醒">
      <h2>先备好，再开火</h2>
      <p>先看完步骤，洗切、沥水、分装调味料，锅铲和盛菜盘放手边。需要腌制或泡发的先处理。</p>
      {reminders.map((item) => <p key={item.key}>{item.text}</p>)}
      <p className="hint">只是提醒，不用勾选。加热时间是参考，还要检查食物状态。</p>
    </aside>
  );
}
export function CookingNotes({ recipe }) {
  const reminders = cookingReminders(recipe);
  return (
    <details className="cooking-notes">
      <summary>厨房小抄 · 用量、火候与安全</summary>
      <p><strong>量勺：</strong>1 茶匙 = 5 毫升，1 汤匙 = 15 毫升。家用饭勺大小不一；毫升是体积，不能把所有食材都按 1 毫升 = 1 克换算。</p>
      <p><strong>少许、适量：</strong>先少放盐和咸味调料，食物熟透后尝味再补。生抽、蚝油本身已有咸味。</p>
      <p><strong>多做一点：</strong>本页用量是 {recipe.servings} 人份参考，未自动换算。加量时考虑分批炒，不把时间、火力简单翻倍。</p>
      <p><strong>开始计时：</strong>先做到步骤写明的下锅、水开或盖盖时点再启动。到点先看锅，未熟继续加热；蒸煮留意水量，开盖防蒸汽烫伤。</p>
      {reminders.map((item) => <p key={item.key}>{item.text}</p>)}
      <p className="hint">这些是操作提醒，不能代替食品温度计、食材包装要求或实际熟度检查。长时间炖煮请同时设手机系统计时器。</p>
      <p className="hint">依据：<a href="https://thewoksoflife.com/how-to-cook-chinese-meal-one-wok/" target="_blank" rel="noreferrer">开火前准备与多菜顺序</a> · <a href="https://www.foodsafety.gov/keep-food-safe/4-steps-to-food-safety" target="_blank" rel="noreferrer">食品安全四步骤</a></p>
    </details>
  );
}
