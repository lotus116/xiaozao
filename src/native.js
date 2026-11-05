import { Capacitor } from "@capacitor/core";

export function handleAndroidBack(
  canGoBack,
  { document, location, history, minimize },
) {
  const dialog = document.querySelector("dialog[open]");
  if (dialog) dialog.close();
  else if (canGoBack) history.back();
  else if (location.hash && location.hash !== "#pantry")
    location.hash = "pantry";
  else minimize();
}

export async function setupNative() {
  if (Capacitor.getPlatform() !== "android") return;
  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", ({ canGoBack }) =>
    handleAndroidBack(canGoBack, {
      document,
      location,
      history,
      minimize: () => App.minimizeApp(),
    }),
  );
}
