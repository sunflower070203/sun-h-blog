import { useEffect, useState, type ChangeEvent } from "react";
import { emptyRichDocument, type PublicProfile } from "@sunny/shared";
import { EditorContent, useEditor } from "@tiptap/react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { AdminFrame } from "./AdminFrame";
import { createEditorExtensions } from "./editor/editor-extensions";
import { MultiImagePanel } from "./editor/MultiImagePanel";
import { markdownToDocument } from "./editor/markdown";
import "./profile-about.css";
import {
  MAX_PROFILE_LINKS,
  canAddProfileLink,
  canSaveProfile,
  createEmptyProfileLink,
  createProfileLinks,
  removeProfileLink,
  serializeProfileLinks,
  updateProfileLink,
  type EditableProfileLink
} from "./profile-form";

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [links, setLinks] = useState<EditableProfileLink[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const aboutEditor = useEditor({
    extensions: createEditorExtensions({ openLinksOnClick: false }),
    content: emptyRichDocument,
    onUpdate: () => setMessage("个人介绍有未保存的修改")
  });

  useEffect(() => {
    api.getAdminProfile().then((loaded) => {
      setProfile(loaded);
      setLinks(createProfileLinks(loaded.links));
      aboutEditor?.commands.setContent(loaded.aboutContent ?? emptyRichDocument);
    }).catch((reason) => {
      if (reason instanceof Error && reason.message === "请先登录") navigate("/admin/login");
      else setMessage(reason instanceof Error ? reason.message : "加载失败");
    }).finally(() => setLoading(false));
  }, [aboutEditor, navigate]);

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("正在上传头像…");
    try {
      const media = await api.upload(file);
      setProfile((current) => current ? { ...current, avatarUrl: media.url } : current);
      setMessage("头像已上传，保存后生效");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "上传失败"); }
    finally { setUploading(false); }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    try { await uploadAvatar(file); }
    finally { input.value = ""; }
  }

  async function save() {
    if (!profile || !canSaveProfile(profile, loading, uploading, saving)) return;
    setSaving(true);
    setMessage("正在保存…");
    try {
      const saved = await api.updateProfile({ ...profile, links: serializeProfileLinks(links), aboutContent: aboutEditor?.getJSON() ?? emptyRichDocument });
      setProfile(saved);
      setLinks(createProfileLinks(saved.links));
      setMessage("个人资料已保存");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失败"); }
    finally { setSaving(false); }
  }

  async function importReadme(file?: File) {
    if (!file) return;
    try {
      aboutEditor?.commands.setContent(markdownToDocument(await file.text()));
      setMessage("README.md 已导入，请保存个人资料");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "README.md 导入失败"); }
  }

  return <AdminFrame>
    <section className="admin-content profile-page" aria-busy={loading || uploading || saving}>
      <header className="admin-top"><div><p className="eyebrow">Public identity</p><h1>个人资料</h1></div><span role="status" aria-live="polite">{message}</span></header>
      {loading && <div className="profile-card" role="status">正在加载个人资料…</div>}
      {!loading && !profile && <div className="profile-card form-error">{message || "无法加载个人资料"}</div>}
      {profile && !loading && <div className="profile-card">
        <fieldset className="profile-fields" disabled={saving}>
          <legend className="visually-hidden">个人资料编辑</legend>
          <label>显示名称<input value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} /></label>
          <label>头像<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void handleAvatarChange(event)} /></label>
          {profile.avatarUrl && <img className="profile-avatar-preview" src={profile.avatarUrl} alt="头像预览" />}
          <label>个人简介<textarea rows={5} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} /></label>
          <div className="profile-links">
            <div className="profile-links-heading"><h2>外部链接</h2><button className="admin-button" type="button" disabled={!canAddProfileLink(links)} onClick={() => setLinks((current) => canAddProfileLink(current) ? [...current, createEmptyProfileLink()] : current)}>新增链接</button></div>
            {!canAddProfileLink(links) && <p className="profile-links-limit" role="status">最多添加 {MAX_PROFILE_LINKS} 个链接</p>}
            {links.map((link) => <div className="profile-link-row" key={link.uiId}>
              <label>链接标题<input value={link.title} onChange={(event) => setLinks((current) => updateProfileLink(current, link.uiId, "title", event.target.value))} /></label>
              <label>链接地址<input type="url" value={link.url} onChange={(event) => setLinks((current) => updateProfileLink(current, link.uiId, "url", event.target.value))} /></label>
              <label>链接说明<input value={link.description} onChange={(event) => setLinks((current) => updateProfileLink(current, link.uiId, "description", event.target.value))} /></label>
              <button className="admin-button" type="button" onClick={() => setLinks((current) => removeProfileLink(current, link.uiId))}>删除</button>
            </div>)}
          </div>
          <section className="profile-about-editor">
            <h2>完整个人介绍</h2>
            <p>这里的内容只显示在“个人介绍”独立页面，可插入多张图片或图集。</p>
            <label className="readme-import">导入 README.md<input type="file" accept=".md,text/markdown,text/plain" onChange={(event) => { void importReadme(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
            <div className="profile-about-toolbar" aria-label="个人介绍格式工具">
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleBold().run()}>B</button>
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleItalic().run()}><i>I</i></button>
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleBulletList().run()}>列表</button>
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleBlockquote().run()}>引用</button>
              <button type="button" onClick={() => aboutEditor?.chain().focus().toggleCodeBlock().run()}>代码</button>
            </div>
            <EditorContent editor={aboutEditor} />
            <MultiImagePanel editor={aboutEditor} onMessage={setMessage} />
          </section>
          <button className="admin-button primary" type="button" disabled={!canSaveProfile(profile, loading, uploading, saving)} aria-busy={saving} onClick={() => void save()}>保存个人资料</button>
        </fieldset>
      </div>}
    </section>
  </AdminFrame>;
}
