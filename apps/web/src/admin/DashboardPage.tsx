import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostStatus, PostSummary, SiteSettings } from "@sunny/shared";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { AdminFrame } from "./AdminFrame";

export function DashboardPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | PostStatus>("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState("");
  const pageSize = 20;

  const load = useCallback(() => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (q) query.set("q", q);
    if (status) query.set("status", status);
    if (category) query.set("category", category);
    api.listAdminPosts(`?${query}`).then((result) => { setPosts(result.items); setTotal(result.total); setSelected([]); }).catch((reason) => {
      if (reason.message === "请先登录") navigate("/admin/login"); else setError(reason.message);
    });
  }, [category, navigate, page, q, status]);
  useEffect(load, [load]);
  useEffect(() => { api.getSettings().then(setSettings).catch(() => undefined); }, []);

  const categories = useMemo(() => [...new Set(posts.map((post) => post.category))], [posts]);
  async function batch(nextStatus: PostStatus) { if (!selected.length) return; await api.batchPostStatus(selected, nextStatus); load(); }
  async function copy(id: string) { const result = await api.copyPost(id); navigate(`/admin/posts/${result.id}`); }
  const published = posts.filter((post) => post.status === "published").length;

  return <AdminFrame settings={settings}>
    <section className="admin-content">
      <header className="admin-top"><div><p className="eyebrow">Research content desk</p><h1>文章管理</h1></div><Link className="admin-button primary" to="/admin/posts/new">＋ 写新文章</Link></header>
      <div className="stats"><div><strong>{total}</strong><span>符合条件</span></div><div><strong>{published}</strong><span>本页已发布</span></div><div><strong>{posts.length - published}</strong><span>本页草稿</span></div></div>
      <div className="admin-filters">
        <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="搜索标题和摘要" />
        <select value={status} onChange={(event) => { setStatus(event.target.value as "" | PostStatus); setPage(1); }}><option value="">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select>
        <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">全部分类</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
      {selected.length > 0 && <div className="batch-bar"><span>已选择 {selected.length} 篇</span><button onClick={() => void batch("published")}>批量发布</button><button onClick={() => void batch("draft")}>批量撤回</button></div>}
      {error && <div className="form-error">{error}</div>}
      <div className="admin-list">
        {posts.length ? posts.map((post) => <article className="admin-row" key={post.id}>
          <input type="checkbox" checked={selected.includes(post.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, post.id] : current.filter((id) => id !== post.id))} aria-label={`选择 ${post.title}`} />
          <div><span className={`status-pill ${post.status}`}>{post.status === "published" ? "已发布" : "草稿"}</span><h2><Link to={`/admin/posts/${post.id}`}>{post.title}</Link></h2><p>{post.category} · {post.updatedAt.slice(0, 10)}</p></div>
          <div className="row-actions"><button onClick={() => void copy(post.id)}>复制</button><Link to={`/admin/posts/${post.id}`}>编辑 →</Link></div>
        </article>) : <div className="admin-empty"><h2>没有符合条件的文章</h2><p>调整筛选条件，或开始写一篇新文章。</p></div>}
      </div>
      <div className="pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一页</button><span>第 {page} 页</span><button disabled={page * pageSize >= total} onClick={() => setPage((value) => value + 1)}>下一页</button></div>
    </section>
  </AdminFrame>;
}
