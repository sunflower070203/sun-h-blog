import { useEffect, useState } from "react";
import type { SiteSettings } from "@sunny/shared";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { AdminFrame } from "./AdminFrame";

const defaults: SiteSettings = { wallpaperUrl: null, overlay: 0.62, blur: 8, position: "center" };

export function AppearancePage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [message, setMessage] = useState("");
  useEffect(() => { api.getSettings().then(setSettings).catch((reason) => reason.message === "请先登录" ? navigate("/admin/login") : setMessage(reason.message)); }, [navigate]);

  async function upload(file?: File) {
    if (!file) return;
    setMessage("正在上传壁纸…");
    try { const media = await api.upload(file); setSettings((current) => ({ ...current, wallpaperUrl: media.url })); setMessage("壁纸已上传，保存后生效"); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "上传失败"); }
  }
  async function save(next = settings) {
    try { const saved = await api.updateSettings(next); setSettings(saved); setMessage("后台外观已保存"); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失败"); }
  }

  return <AdminFrame settings={settings}>
    <section className="admin-content appearance-page">
      <header className="admin-top"><div><p className="eyebrow">Personal workspace</p><h1>后台外观</h1></div><span>{message}</span></header>
      <div className="appearance-card">
        <label>后台壁纸<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => void upload(event.target.files?.[0])} /></label>
        <label>遮罩强度 <strong>{Math.round(settings.overlay * 100)}%</strong><input type="range" min="0.35" max="0.9" step="0.01" value={settings.overlay} onChange={(event) => setSettings({ ...settings, overlay: Number(event.target.value) })} /></label>
        <label>模糊程度 <strong>{settings.blur}px</strong><input type="range" min="0" max="30" step="1" value={settings.blur} onChange={(event) => setSettings({ ...settings, blur: Number(event.target.value) })} /></label>
        <label>图片位置<select value={settings.position} onChange={(event) => setSettings({ ...settings, position: event.target.value as SiteSettings["position"] })}><option value="top">顶部</option><option value="center">居中</option><option value="bottom">底部</option></select></label>
        <div className="appearance-actions"><button className="admin-button primary" onClick={() => void save()}>保存设置</button><button className="admin-button" onClick={() => { setSettings(defaults); void save(defaults); }}>恢复默认</button></div>
      </div>
    </section>
  </AdminFrame>;
}
