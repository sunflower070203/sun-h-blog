import type { PostSummary } from "@sunny/shared";
import { Link } from "react-router-dom";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="post-card">
      <div className="post-meta"><span>{post.category}</span><time>{post.publishedAt?.slice(0, 10)}</time></div>
      <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
      <p>{post.excerpt}</p>
      <div className="tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      <Link className="read-link" to={`/posts/${post.slug}`}>阅读全文 ↗</Link>
    </article>
  );
}
