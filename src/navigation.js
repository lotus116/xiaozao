import { useLayoutEffect, useEffect, useRef, useState } from "react";

const key = "xiaozaoNavigation";
const route = () => location.hash || "#pantry";
const metadata = () => history.state?.[key];
const write = (value) => history.replaceState({ ...history.state, [key]: value }, "");

export function initialBrowseState(value = metadata()?.filters) {
  return {
    query: typeof value?.query === "string" ? value.query.slice(0, 200) : "",
    category: ["dish", "staple", "soup"].includes(value?.category) ? value.category : "dish",
    max: ["all", "15", "30"].includes(value?.max) ? value.max : "all",
    level: ["0", "1", "2"].includes(value?.level) ? value.level : "0",
    photosOnly: value?.photosOnly === true,
    fewIngredients: value?.fewIngredients === true,
  };
}

// Keep list context and scroll within this tab, without adding router dependencies.
export function useKitchenNavigation(filters, setFilters) {
  const [hash, setHash] = useState(route);
  const current = useRef(hash);
  const restore = useRef(metadata()?.scroll || 0);
  const goRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    write({ ...metadata(), filters });
  }, [filters]);

  useEffect(() => {
    if (!Number.isInteger(metadata()?.index)) write({ ...metadata(), index: 0, scroll: 0, filters: filtersRef.current });
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let scrollSave;
    const save = () => {
      clearTimeout(scrollSave);
      // Avoid flooding History API limits during a long mobile scroll.
      scrollSave = setTimeout(() => {
        if (current.current === route())
          write({ ...metadata(), scroll: window.scrollY, filters: filtersRef.current });
      }, 200);
    };
    const change = () => {
      clearTimeout(scrollSave);
      const next = route();
      if (next === current.current) return;
      document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
      restore.current = metadata()?.scroll || 0;
      current.current = next;
      setFilters(initialBrowseState(metadata()?.filters));
      setHash(next);
    };
    const click = (event) => {
      const anchor = event.target.closest?.('a[href^="#"]');
      if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      goRef.current(anchor.getAttribute("href"));
    };
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("popstate", change);
    window.addEventListener("hashchange", change);
    document.addEventListener("click", click);
    return () => {
      clearTimeout(scrollSave);
      history.scrollRestoration = previousRestoration;
      window.removeEventListener("scroll", save);
      window.removeEventListener("popstate", change);
      window.removeEventListener("hashchange", change);
      document.removeEventListener("click", click);
    };
  }, []);

  useLayoutEffect(() => {
    const bookmark = document.querySelector('.cooking-overview [aria-current="step"] h2');
    const stepHeading = document.querySelector(".focused-step") ||
      (bookmark?.id !== "cooking-step-0" ? bookmark : null);
    (stepHeading || document.querySelector("h1"))?.focus({ preventScroll: true });
    if (stepHeading) stepHeading.scrollIntoView({ block: "start" });
    else window.scrollTo(0, restore.current);
  }, [hash]);

  const go = (path) => {
    const target = path.startsWith("#") ? path : "#" + path;
    if (target === current.current) return;
    const prior = metadata() || { index: 0 };
    write({ ...prior, scroll: window.scrollY, filters });
    const fromList = /^#(pantry|search|favorites|basket)$/.test(current.current);
    const origin = target.startsWith("#recipe/") && fromList
      ? { hash: current.current, index: prior.index }
      : prior.origin;
    history.pushState({ [key]: { index: prior.index + 1, scroll: 0, origin, filters } }, "", target);
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
    restore.current = 0;
    current.current = target;
    setHash(target);
  };
  goRef.current = go;

  const backToList = () => {
    const currentMeta = metadata();
    const origin = currentMeta?.origin;
    if (origin && origin.index < currentMeta.index) {
      write({ ...currentMeta, scroll: window.scrollY });
      history.go(origin.index - currentMeta.index);
    } else go("search");
  };
  return { hash, go, backToList };
}
