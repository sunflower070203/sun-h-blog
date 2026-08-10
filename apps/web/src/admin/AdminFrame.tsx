import type { CSSProperties, ReactNode } from "react";
import type { SiteSettings } from "@sunny/shared";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";

export function AdminFrame({ children, settings }: { children: ReactNode; settings?: SiteSettings | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const style = settings?.wallpaperUrl ? {
    "--admin-wallpaper": `url("${settings.wallpaperUrl}")`,
    "--admin-overlay": settings.overlay,
    "--admin-blur": `${settings.blur}px`,
    "--admin-position": settings.position
  } as CSSProperties : undefined;
  async function logout() { await api.logout(); navigate("/admin/login"); }
  return <main className={`admin-shell ${settings?.wallpaperUrl ? "has-wallpaper" : ""}`} style={style}>
    <aside className="admin-sidebar">
      <Link className="admin-logo" to="/admin">Sunny<span>Research Studio</span></Link>
      <nav>
        <Link className={location.pathname === "/admin" ? "active" : ""} to="/admin">文章</Link>
        <Link className={location.pathname === "/admin/appearance" ? "active" : ""} to="/admin/appearance">外观</Link>
        <a href="/" target="_blank">查看博客 ↗</a>
      </nav>
      <button onClick={logout}>退出登录</button>
    </aside>
    {children}
  </main>;
}
