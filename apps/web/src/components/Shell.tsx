import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <header className="site-header">
        <Link className="brand" to="/">SUNNY<span> / INDEX</span></Link>
        <nav aria-label="主要导航">
          <NavLink to="/">首页</NavLink>
          <a href="/#research">研究</a>
          <NavLink to="/posts">文章</NavLink>
          <a href="/#about">关于</a>
        </nav>
        <Link className="nav-cta" to="/admin">写作后台 ↗</Link>
      </header>
      <div className="public-stage">{children}</div>
    </div>
  );
}
