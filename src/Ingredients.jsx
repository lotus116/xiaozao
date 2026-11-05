import React from "react";
import {
  Carrot,
  Egg,
  Fish,
  Beef,
  Wheat,
  Bean,
  Milk,
  Droplets,
  Package,
  Leaf,
} from "lucide-react";
import { seasonings } from "./recipes";
export function FoodIcon({ name }) {
  const Icon = /油|醋|酱|酒|水/.test(name)
    ? Droplets
    : seasonings.includes(name)
      ? Package
      : /蛋/.test(name)
        ? Egg
        : /鱼|虾|蛤/.test(name)
          ? Fish
          : /肉|鸡|鸭|排骨/.test(name)
            ? Beef
            : /豆/.test(name)
              ? Bean
              : /奶|乳|黄油/.test(name)
                ? Milk
                : /米|面|粉|玉米/.test(name)
                  ? Wheat
                  : /菜|葱|香菇|木耳/.test(name)
                    ? Leaf
                    : seasonings.includes(name)
                      ? Package
                      : Carrot;
  return <Icon size={25} strokeWidth={1.6} aria-hidden="true" />;
}
export default function Ingredients({ r }) {
  const groups = [
    [
      "主料与配菜",
      r.ingredients.filter(
        (i) => !i.optional && !i.water && !seasonings.includes(i.name),
      ),
    ],
    [
      "基础调味与用水",
      r.ingredients.filter(
        (i) => !i.optional && (i.water || seasonings.includes(i.name)),
      ),
    ],
    ["有就加，没有也能做", r.ingredients.filter((i) => i.optional)],
  ];
  return (
    <div className="ingredient-board">
      {groups
        .filter(([, items]) => items.length)
        .map(([title, items]) => (
          <section key={title} className="ingredient-group">
            <h3>{title}</h3>
            <ul className="ingredient-tiles">
              {items.map((i) => (
                <li
                  className={
                    i.optional ? "ingredient-tile optional" : "ingredient-tile"
                  }
                  key={i.name}
                >
                  <FoodIcon name={i.name} />
                  <strong>{i.name}</strong>
                  <span className="ingredient-amount">{i.amount}</span>
                  {i.optional && <small>可省</small>}
                </li>
              ))}
            </ul>
            {title === "有就加，没有也能做" && (
              <details className="optional-notes">
                <summary>为什么可以省？</summary>
                {items.map((i) => (
                  <p key={i.name}>
                    <strong>{i.name}：</strong>
                    {i.optionalReason || "辅助增香或点缀，按喜好添加。"}
                  </p>
                ))}
              </details>
            )}
          </section>
        ))}
    </div>
  );
}
