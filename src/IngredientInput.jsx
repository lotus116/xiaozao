import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { ingredientToken, ingredientSuggestions, replaceIngredientToken } from "./ingredient-suggestions";
import "./ingredient-input.css";

export default function IngredientInput({ value, onChange, catalog }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [caret, setCaret] = useState(value.length);
  const [placement, setPlacement] = useState({ side: "below", height: 240 });
  const root = useRef(null);
  const field = useRef(null);
  const list = useRef(null);
  const pendingCaret = useRef(null);
  const { query } = ingredientToken(value, caret);
  const suggestions = ingredientSuggestions(catalog, query).filter((name) =>
    replaceIngredientToken(value, name, caret).value.length <= 500);
  const close = () => { setOpen(false); setActive(-1); };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = root.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = (viewport?.offsetTop || 0) + 8;
      let bottom = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 8;
      const nav = document.querySelector('nav[aria-label="主要导航"]')?.getBoundingClientRect();
      if (nav && nav.top >= top && nav.top < bottom) bottom = nav.top - 8;
      const below = bottom - rect.bottom - 6;
      const above = rect.top - top - 6;
      const side = below < 150 && above > below ? "above" : "below";
      setPlacement({ side, height: Math.max(52, Math.min(240, side === "above" ? above : below)) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) { setOpen(false); setActive(-1); }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    setActive(-1);
    if (pendingCaret.current !== null) {
      field.current?.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value, caret]);
  useEffect(() => {
    if (active >= 0) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (name) => {
    const next = replaceIngredientToken(value, name, caret);
    pendingCaret.current = next.caret;
    onChange(next.value);
    setCaret(next.caret);
    close();
    field.current?.focus({ preventScroll: true });
  };
  const keyDown = (event) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (["ArrowDown", "ArrowUp"].includes(event.key) && suggestions.length) {
      event.preventDefault();
      setActive((index) => event.key === "ArrowDown"
        ? (index + 1) % suggestions.length
        : (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0 && suggestions[active]) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Enter" || event.key === "Tab") close();
  };
  return (
    <div className="input-row">
      <div className="ingredient-input" ref={root}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
        <div className="ingredient-input-field">
          <input
            ref={field}
            id="ingredient"
            value={value}
            onChange={(event) => { setCaret(event.target.selectionStart); onChange(event.target.value); }}
            onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
            onKeyDown={keyDown}
            onPaste={(event) => {
              const text = event.clipboardData.getData("text");
              if (!/[\r\n]/.test(text)) return;
              event.preventDefault();
              const input = event.currentTarget;
              const prefix = value.slice(0, input.selectionStart) + text.replace(/[\r\n]+/g, "、");
              const next = (prefix + value.slice(input.selectionEnd)).slice(0, 500);
              pendingCaret.current = Math.min(prefix.length, next.length);
              setCaret(pendingCaret.current);
              onChange(next);
            }}
            maxLength={500}
            placeholder="番茄、鸡蛋，可以一起添加"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? "ingredient-suggestions" : undefined}
            aria-activedescendant={open && active >= 0 && suggestions[active] ? `ingredient-option-${active}` : undefined}
            aria-describedby="ingredient-input-hint"
          />
          <button type="button" className="ingredient-dropdown-toggle"
            aria-label={open ? "收起食材建议" : "展开食材建议"}
            aria-expanded={open}
            aria-controls={open ? "ingredient-suggestions" : undefined}
            aria-haspopup="listbox"
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.preventDefault(); close(); }
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault(); setOpen(true); setActive(-1); field.current?.focus();
              }
            }}
            onClick={(event) => {
              setOpen(!open); setActive(-1);
              // Keyboard users can continue with the arrows in the input. Pointer
              // users keep the keyboard closed while browsing suggestions on mobile.
              if (event.detail === 0) field.current?.focus({ preventScroll: true });
            }}>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>
        {open && <div className="ingredient-suggestions-panel" data-side={placement.side} style={{ maxHeight: placement.height }}>
          <ul ref={list} id="ingredient-suggestions" role="listbox" aria-label="食材建议" style={{ maxHeight: placement.height - 2 }}>
            {suggestions.map((name, index) => <li
              key={name} id={`ingredient-option-${index}`} role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(name)}>{name}</li>)}
          </ul>
          {!suggestions.length && <p role="status">暂无匹配建议，可以直接添加自定义食材。</p>}
        </div>}
      </div>
      <button className="primary square" aria-label="添加食材" disabled={!value.trim()}><Plus /></button>
      <span className="sr-only" id="ingredient-input-hint">输入不会自动展开建议。用右侧箭头展开后，可用上下方向键选择，回车填入，Escape 收起。</span>
    </div>
  );
}
