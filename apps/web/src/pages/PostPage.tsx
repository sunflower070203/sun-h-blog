import { useEffect, useState } from "react";
import type { PostDetail } from "@sunny/shared";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { RichDocument } from "../components/RichDocument";

export function PostPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.getPost(slug).then(setPost).catch((reason) => setError(reason.message)); }, [slug]);
  if (error) return <main className="inner-page empty-state">{error}</main>;
  if (!post) return <main className="inner-page empty-state">正在加载文章…</main>;
  return (
    <main className="article-page">
      <header className="article-header">
        <p className="section-label">{post.category}</p>
        <h1>{post.title}</h1>
        <p>{post.excerpt}</p>
        <div className="tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      </header>
      {post.coverUrl && <img className="article-cover" src={post.coverUrl} alt={post.coverAlt} />}
      <RichDocument content={post.content} />
    </main>
  );
}
