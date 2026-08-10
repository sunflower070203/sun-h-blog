import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostInput } from "@sunny/shared";
import { slugify } from "@sunny/shared";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };

export function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const draftKey = `sunny-editor-${id ?? "new"}`;
  const restored = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) ?? "null"); } catch { return null; }
  }, [draftKey]);
  const [title, setTitle] = useState(restored?.title ?? "");
  const [slug, setSlug] = useState(restored?.slug ?? "");
  const [excerpt, setExcerpt] = useState(restored?.excerpt ?? "");
  const [category, setCategory] = useState(restored?.category ?? "科研学习");
  const [tags, setTags] = useState<string>(restored?.tags?.join(", ") ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(restored?.coverUrl ?? null);
  const [coverAlt, setCoverAlt] = useState(restored?.coverAlt ?? "");
  const [featured, setFeatured] = useState(restored?.featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState("自动保存已开启");
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Image, LinkExtension.configure({ openOnClick: false })],
    content: restored?.content ?? emptyDocument,
    onUpdate: () => setDirty(true)
  });

  useEffect(() => {
    if (!isNew && id) api.getAdminPost(id).then((post) => {
      setTitle(post.title); setSlug(post.slug); setExcerpt(post.excerpt); setCategory(post.category);
      setTags(post.tags.join(", ")); setCoverUrl(post.coverUrl); setCoverAlt(post.coverAlt);
      setFeatured(post.featured); setStatus(post.status); editor?.commands.setContent(post.content);
      setDirty(false);
    }).catch((reason) => reason.message === "请先登录" ? navigate("/admin/login") : setMessage(reason.message));
  }, [editor, id, isNew, navigate]);

  const snapshot = useCallback(() => ({
    title, slug, excerpt, category, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    coverUrl, coverAlt, featured, content: editor?.getJSON() ?? emptyDocument
  }), [title, slug, excerpt, category, tags, coverUrl, coverAlt, featured, editor]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!dirty) return;
      localStorage.setItem(draftKey, JSON.stringify(snapshot()));
      setMessage("已自动保存在此设备"); setDirty(false);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [dirty, draftKey, snapshot]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function input(nextStatus = status): PostInput {
    return {
      ...snapshot(),
      slug: slug || slugify(title),
      status: nextStatus
    };
  }

  async function save(nextStatus = status) {
    setMessage("正在保存…");
    try {
      const result = isNew ? await api.createPost(input(nextStatus)) : await api.updatePost(id!, input(nextStatus));
      localStorage.removeItem(draftKey); setDirty(false); setMessage(nextStatus === "published" ? "文章已发布" : "草稿已保存");
      if (isNew) navigate(`/admin/posts/${result.id}`, { replace: true });
      setStatus(nextStatus);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失败"); }
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    setMessage("正在上传封面…");
    try { const result = await api.upload(file); setCoverUrl(result.url); setDirty(true); setMessage("封面上传完成"); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "上传失败"); }
  }

  async function remove() {
    if (!id || !confirm("确定删除这篇文章？此操作不可恢复。")) return;
    await api.deletePost(id); navigate("/admin");
  }

  return (
    <main className="editor-shell">
      <header className="editor-top">
        <Link to="/admin">← 文章管理</Link>
        <span>{message}</span>
        <div>
          <button className="admin-button" onClick={() => setPreview(true)}>预览</button>
          <button className="admin-button" onClick={() => save("draft")}>{status === "published" ? "撤回为草稿" : "保存草稿"}</button>
          <button className="admin-button primary" onClick={() => save("published")}>发布文章</button>
        </div>
      </header>
      <div className="editor-layout">
        <section className="editor-main">
          <input className="title-input" value={title} onChange={(event) => { setTitle(event.target.value); if (!slug) setSlug(slugify(event.target.value)); setDirty(true); }} placeholder="文章标题" />
          <input className="excerpt-input" value={excerpt} onChange={(event) => { setExcerpt(event.target.value); setDirty(true); }} placeholder="用一两句话概括文章…" />
          <div className="toolbar">
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive("bold") ? "active" : ""}>B</button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
            <button onClick={() => editor?.chain().focus().toggleBlockquote().run()}>“ Quote</button>
            <button onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>{"</>"}</button>
          </div>
          <EditorContent editor={editor} className="rich-editor" />
        </section>
        <aside className="editor-settings">
          <h2>发布设置</h2>
          <label>文章路径<input value={slug} onChange={(event) => { setSlug(slugify(event.target.value)); setDirty(true); }} /></label>
          <label>分类<input value={category} onChange={(event) => { setCategory(event.target.value); setDirty(true); }} /></label>
          <label>标签<input value={tags} onChange={(event) => { setTags(event.target.value); setDirty(true); }} placeholder="科研, 学习, 随笔" /><small>用英文逗号分隔</small></label>
          <label className="cover-upload">封面图片<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => uploadCover(event.target.files?.[0])} /></label>
          {coverUrl && <img src={coverUrl} alt="" className="cover-preview" />}
          <label>封面说明<input value={coverAlt} onChange={(event) => { setCoverAlt(event.target.value); setDirty(true); }} /></label>
          <label className="check"><input type="checkbox" checked={featured} onChange={(event) => { setFeatured(event.target.checked); setDirty(true); }} /> 首页置顶</label>
          <p className={`status-pill ${status}`}>{status === "published" ? "当前已发布" : "当前为草稿"}</p>
          {!isNew && <button className="danger-button" onClick={remove}>删除文章</button>}
        </aside>
      </div>
      {preview && (
        <div className="preview-overlay" role="dialog" aria-modal="true" aria-label="文章预览">
          <div className="preview-sheet">
            <button className="preview-close" onClick={() => setPreview(false)}>关闭预览 ×</button>
            <p className="eyebrow">{category}</p>
            <h1>{title || "未命名文章"}</h1>
            <p className="preview-excerpt">{excerpt}</p>
            {coverUrl && <img src={coverUrl} alt={coverAlt} />}
            <article className="prose" dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }} />
          </div>
        </div>
      )}
    </main>
  );
}
