import type { PostSummary } from "@sunny/shared";
import React from "react";
import { Link } from "react-router-dom";

export function PostCard({ post, featured = false }: { post: PostSummary; featured?: boolean }) {
  return (
    <article className={`post-card fuwari-card ${featured ? "is-featured" : ""}`}>
      <Link className={`post-cover ${post.coverUrl ? "" : "is-placeholder"}`} to={`/posts/${post.slug}`} aria-label={post.title}>
        {post.coverUrl && <img src={post.coverUrl} alt={post.coverAlt} />}
      </Link>
      <div className="post-card-body">
      {post.tags.includes("项目") && <span className="project-badge">项目</span>}
      <div className="post-meta"><time dateTime={post.publishedAt ?? undefined}>{post.publishedAt?.slice(0, 10)}</time><span>{post.category}</span></div>
      <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
      <p>{post.excerpt}</p>
      {post.tags.length > 0 && (
        <div className="tags">{post.tags.map((tag, index) => <span key={`${tag}-${index}`}>#{tag}</span>)}</div>
      )}
      </div>
    </article>
  );
}
