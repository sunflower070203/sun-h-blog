import type { PostSummary } from "@sunny/shared";
import React from "react";
import { Link } from "react-router-dom";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="post-card">
      <time>{post.publishedAt?.slice(0, 10)}</time>
      <h3><Link to={`/posts/${post.slug}`}>{post.title}</Link></h3>
      <p>{post.excerpt}</p>
      {post.tags.length > 0 && (
        <div className="tags">{post.tags.map((tag, index) => <span key={`${tag}-${index}`}>#{tag}</span>)}</div>
      )}
    </article>
  );
}
