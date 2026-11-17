// Keep the return control reachable while bringing the current instruction into view.
export function scrollCookingHeading(heading) {
  if (!heading) return;
  if (heading.classList.contains("focused-step")) {
    if (window.innerHeight >= 700) {
      window.scrollTo(0, 0);
    } else {
      const toolbar = document.querySelector(".cooking-toolbar");
      const safeTop = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      const top = heading.previousElementSibling || heading;
      window.scrollTo(0, window.scrollY + top.getBoundingClientRect().top -
        (toolbar?.getBoundingClientRect().height || 0) - safeTop - 12);
    }
  } else heading.scrollIntoView({ block: "start" });
}
