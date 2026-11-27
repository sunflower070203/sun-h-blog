import type { PublicAppearance } from "@sunny/shared";
import { appearanceStyle, resolveColorMode } from "../../../web/src/appearance";

export function enablePreview(layout: HTMLElement, updateToggle: () => void) {
  const banner = layout.querySelector<HTMLElement>(".public-banner")!;
  const style = document.querySelector<HTMLStyleElement>("#public-custom-css")!;
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.origin !== location.origin || event.source !== window.parent
      || event.data?.type !== "sunny:appearance-preview") return;

    const appearance = event.data.appearance as PublicAppearance;
    for (const [variable, value] of Object.entries(appearanceStyle(appearance))) {
      layout.style.setProperty(variable, String(value));
    }
    const image = document.createElement("img");
    image.alt = "";
    if (appearance.publicBannerUrl) image.src = appearance.publicBannerUrl;
    banner.replaceChildren(...(appearance.publicBannerUrl ? [image] : []));
    style.textContent = appearance.publicCustomCss;
    const stored = localStorage.getItem("sunny-color-mode");
    const visitor = stored === "dark" || stored === "light" ? stored : null;
    layout.dataset.colorMode = resolveColorMode(appearance.publicColorMode, visitor, matchMedia("(prefers-color-scheme: dark)").matches);
    updateToggle();
  });
  window.parent.postMessage({ type: "sunny:appearance-preview-ready" }, location.origin);
}
