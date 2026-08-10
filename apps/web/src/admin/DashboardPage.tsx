import { useEffect, useState } from "react";
import type { PostSummary } from "@sunny/shared";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export function DashboardPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api.listAdminPosts().then((page) => setPosts(page.items)).catch((reason) => {
      if (reason.message === "请先登录") navigate("/admin/login");
      else setError(reason.message);
    });
  }, [navigate]);
  const published = posts.filter((post) => post.status === "published").length;
  const drafts = posts.length - published;
  async function logout() { await api.logout(); navigate("/admin/login"); }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-logo" to="/admin">Sunny<span>Studio</span></Link>
        <nav><Link className="active" to="/admin">文章</Link><a href="/" target="_blank">查看博客 ↗</a></nav>
        <button onClick={logout}>退出登录</button>
      </aside>
      <section className="admin-content">
        <header className="admin-top"><div><p className="eyebrow">Content desk</p><h1>文章管理</h1></div><Link className="admin-button primary" to="/admin/posts/new">＋ 写新文章</Link></header>
        <div className="stats"><div><strong>{posts.length}</strong><span>全部文章</span></div><div><strong>{published}</strong><span>已发布</span></div><div><strong>{drafts}</strong><span>草稿</span></div></div>
        {error && <div className="form-error">{error}</div>}
        <div className="admin-list">
          {posts.length ? posts.map((post) => (
            <Link className="admin-row" to={`/admin/posts/${post.id}`} key={post.id}>
              <div><span className={`status-pill ${post.status}`}>{post.status === "published" ? "已发布" : "草稿"}</span><h2>{post.title}</h2><p>{post.category} · {post.updatedAt.slice(0, 10)}</p></div><span>编辑 →</span>
            </Link>
          )) : <div className="admin-empty"><h2>开始写第一篇文章</h2><p>草稿只对你可见，确认后再发布。</p></div>}
        </div>
      </section>
    </main>
  );
}
