import { useEffect, useState } from "react";
import type { PostDetail } from "@sunny/shared";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { Gallery } from "../admin/editor/Gallery";

function ArticleBody({ post }: { post: PostDetail }) {
  const editor = useEditor({ extensions: [StarterKit, Image, Gallery, Link], content: post.content, editable: false });
  return <EditorContent editor={editor} />;
}

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
      <article className="prose"><ArticleBody post={post} /></article>
    </main>
  );
}
