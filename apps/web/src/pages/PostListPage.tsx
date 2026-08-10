import { useEffect, useState } from "react";
import type { PostSummary } from "@sunny/shared";
import { api } from "../api";
import { PostCard } from "../components/PostCard";

export function PostListPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => { api.listPosts(query ? `?q=${encodeURIComponent(query)}` : "").then(setPosts).catch(() => setPosts([])); }, [query]);
  return (
    <main className="inner-page">
      <div className="page-title"><p className="section-label">Notes & essays</p><h1>文章与笔记</h1><p>科研记录、课程学习与少量生活观察。</p></div>
      <label className="search"><span>搜索文章</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入标题或摘要关键词" /></label>
      {posts.length ? <div className="post-grid">{posts.map((post) => <PostCard post={post} key={post.id} />)}</div> : <div className="empty-state">暂无已发布文章。</div>}
    </main>
  );
}
