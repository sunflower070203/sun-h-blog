import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">S<span>·</span></Link>
        <nav aria-label="主要导航">
          <NavLink to="/">首页</NavLink>
          <NavLink to="/posts">文章</NavLink>
          <a href="/#research">研究</a>
          <a href="/#about">关于</a>
        </nav>
        <Link className="nav-cta" to="/admin">写作后台 ↗</Link>
      </header>
      {children}
    </>
  );
}
