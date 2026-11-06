import React, { useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import photos from "./dish-photos.json";
import "./dish-photo.css";

function photoPath(id, size) {
  return photos[id]?.asset || `/dishes/${id}-${size}.webp`;
}

export function PhotoCredit({ recipe }) {
  const photo = photos[recipe.id];
  if (!photo) return null;
  return <footer className="photo-credit-footer" id="photo-credit" tabIndex={-1}>
    <h2>成品图来源</h2>
    <p><a href={photo.source} target="_blank" rel="noreferrer">
      {photo.credit} · {photo.publisher ? "来源于" + photo.publisher : photo.title}
    </a>{" · "}<a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a></p>
  </footer>;
}

export function DishThumbnail({ recipe, eager = false, tile = false }) {
  const photo = photos[recipe.id];
  const [failed, setFailed] = useState(null);
  if (!photo || failed === recipe.id) return null;
  const img = <img onError={() => setFailed(recipe.id)} className={photo.fullFrame ? "dish-thumbnail full-frame" : "dish-thumbnail"}
    src={photoPath(recipe.id, "thumb")} width="224" height="192" alt=""
    decoding="async" loading={eager ? "eager" : "lazy"} />;
  if (!tile) return img;
  return <span className="dish-tile">
    {photo.fullFrame && <img className="dish-tile-backdrop" src={photoPath(recipe.id, "thumb")}
      alt="" aria-hidden="true" decoding="async" loading="lazy" />}
    {img}
  </span>;
}

export function DishPreview({ recipe }) {
  const photo = photos[recipe.id];
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  if (!photo) return null;
  return <>
    <div className="detail-photo">
      <button className="dish-preview" aria-label={`看实拍，放大${recipe.name}`} onClick={() => {
        setUnavailable(false);
        setOpen(true);
        dialog.current.showModal();
      }}>
        <DishThumbnail recipe={recipe} eager />
        <span><Expand size={14} aria-hidden="true" /> 看实拍</span>
      </button>
    </div>
    <dialog ref={dialog} className="dish-photo-dialog" aria-label={recipe.name + "成品实拍"} onClose={() => setOpen(false)}>
      {open && <>
        <div className="photo-bar"><strong>{recipe.name}</strong><button aria-label="关闭实拍" autoFocus onClick={() => dialog.current.close()}><X size={22}/></button></div>
        {unavailable ? <p role="status">图片未能打开，可通过图片来源查看原图。</p> :
          <img src={photoPath(recipe.id, "view")} alt={photo.title + " · 作者成品实拍"} onError={() => setUnavailable(true)} />}
        <p>{photo.note || "同款成品参考 · 配料和摆盘可能不同"}</p>
        <button className="text-button" onClick={() => {
          dialog.current.close();
          document.getElementById("photo-credit")?.focus();
        }}>查看图片来源</button>
      </>}
    </dialog>
  </>;
}
