import React, { useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import photoPages from "./domestic-photo-pages.json";
import photos from "./dish-photos.json";
import "./dish-photo.css";

export function hasDishPhoto(id) {
  return Boolean(photos[id]);
}

function photoPath(id, size) {
  return `/dishes/${id}-${size}.webp`;
}

export function DishThumbnail({ recipe, eager = false }) {
  const [failed, setFailed] = useState(null);
  if (!photos[recipe.id] || failed === recipe.id) return null;
  return <img className="dish-thumbnail" src={photoPath(recipe.id, "thumb")}
    width="224" height="192" alt="" decoding="async" loading={eager ? "eager" : "lazy"}
    onError={() => setFailed(recipe.id)} />;
}

export function DishPreview({ recipe }) {
  const photo = photos[recipe.id];
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  if (!photo) {
    const reference = recipe.domesticSources?.[0] || photoPages[recipe.id];
    const search = "https://www.xiachufang.com/search/?keyword=" + encodeURIComponent(recipe.name.replace(/（.*?）/g, ""));
    return <a className="dish-reference" href={reference?.url || search} target="_blank" rel="noreferrer">
      {reference ? "看国内图文 ↗" : "下厨房搜同名菜 ↗"}
    </a>;
  }
  return <>
    <button className="dish-preview" aria-label={`看实拍，放大${recipe.name}`} onClick={() => {
      setOpen(true);
      dialog.current.showModal();
    }}>
      <DishThumbnail recipe={recipe} eager />
      <span><Expand size={14} aria-hidden="true" /> 看实拍</span>
    </button>
    <dialog ref={dialog} className="dish-photo-dialog" aria-label={recipe.name + "成品实拍"} onClose={() => setOpen(false)}>
      {open && <>
        <div className="photo-bar"><strong>{recipe.name}</strong><button aria-label="关闭实拍" autoFocus onClick={() => dialog.current.close()}><X size={22}/></button></div>
        <img src={photoPath(recipe.id, "view")} alt={recipe.name + "的同款成品参考"} />
        <p>同款成品参考 · 配料和摆盘可能不同</p>
        <p><a href={photo.source} target="_blank" rel="noreferrer">{photo.credit} · 原图</a> · <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a> · 已缩放压缩，列表图经裁切</p>
      </>}
    </dialog>
  </>;
}
