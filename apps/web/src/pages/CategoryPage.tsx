import { useEffect, useState } from "react";
import type { PostSummary } from "@sunny/shared";
import { api } from "../api";
import { PostCard } from "../components/PostCard";

export function CategoryPage({ category, title }: { category: string; title: string }) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.listPosts().then((items) => { if (active) setPosts(items.filter((post) => post.category === category)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category]);
  return <main className="section-page"><header className="page-title"><p className="section-label">Archive</p><h1>{title}</h1></header>{loading ? <p className="empty-state">正在加载…</p> : posts.length ? <div className="post-grid">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div> : <p className="empty-state">这里还没有文章。</p>}</main>;
}
