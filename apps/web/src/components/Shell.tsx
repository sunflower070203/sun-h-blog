import React, { type ReactNode, useEffect, useState } from "react";
import type { PublicAppearance } from "@sunny/shared";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../api";
import { appearanceStyle, defaultPublicAppearance, resolveColorMode } from "../appearance";

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [appearance, setAppearance] = useState<PublicAppearance>(defaultPublicAppearance);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    let active = true;
    api.getAppearance().then((value) => { if (active) setAppearance(value); }).catch(() => undefined);
    const receivePreview = (event: MessageEvent) => {
      if (event.origin === location.origin && event.data?.type === "sunny:appearance-preview") setAppearance(event.data.appearance as PublicAppearance);
    };
    addEventListener("message", receivePreview);
    return () => { active = false; removeEventListener("message", receivePreview); };
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem("sunny-color-mode");
    const visitorChoice = stored === "light" || stored === "dark" ? stored : null;
    setMode(resolveColorMode(appearance.publicColorMode, visitorChoice, matchMedia("(prefers-color-scheme: dark)").matches));
  }, [appearance.publicColorMode]);
  function toggleMode() {
    const next = mode === "dark" ? "light" : "dark";
    localStorage.setItem("sunny-color-mode", next);
    setMode(next);
  }
  function transitionTo(path: string) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const transitionDocument = document as Document & { startViewTransition?: (update: () => void) => void };
      if (transitionDocument.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) transitionDocument.startViewTransition(() => navigate(path));
      else navigate(path);
    };
  }
  return (
    <div className="public-layout" data-color-mode={mode} style={appearanceStyle(appearance)}>
      <div className={`public-banner ${bannerFailed ? "is-fallback" : ""}`}>
        {appearance.publicBannerUrl && !bannerFailed && <img src={appearance.publicBannerUrl} alt="" onError={() => setBannerFailed(true)} />}
      </div>
      <header className="site-header">
        <Link className="brand" to="/">Sunny</Link>
        <nav aria-label="主要导航">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/research" onClick={transitionTo("/research")}>科研学习</NavLink>
          <NavLink to="/life" onClick={transitionTo("/life")}>日常生活</NavLink>
          <NavLink to="/about" onClick={transitionTo("/about")}>个人介绍</NavLink>
        </nav>
        <button className="theme-toggle" type="button" aria-label={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"} onClick={toggleMode}>{mode === "dark" ? "☀" : "☾"}</button>
      </header>
      <div className="public-stage">{children}</div>
      {appearance.publicCustomCss && <style>{appearance.publicCustomCss}</style>}
    </div>
  );
}
