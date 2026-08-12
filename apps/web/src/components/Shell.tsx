import React, { type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
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
    <div className="public-layout">
      <header className="site-header">
        <Link className="brand" to="/">Sunny</Link>
        <nav aria-label="主要导航">
          <NavLink to="/" end>首页</NavLink>
          <NavLink to="/research" onClick={transitionTo("/research")}>科研学习</NavLink>
          <NavLink to="/life" onClick={transitionTo("/life")}>日常生活</NavLink>
          <NavLink to="/about" onClick={transitionTo("/about")}>个人介绍</NavLink>
        </nav>
      </header>
      <div className="public-stage">{children}</div>
    </div>
  );
}
