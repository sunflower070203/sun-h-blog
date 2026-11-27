import { useEffect, useRef, useState } from "react";
import { defaultPublicDesignTokens, type PublicAppearance, type PublicDesignTokens } from "@sunny/shared";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { defaultPublicAppearance, validateLayoutTokens } from "../appearance";
import { AdminFrame } from "./AdminFrame";

type NumericToken = Exclude<keyof PublicDesignTokens, "version">;
const groups: Array<{ title: string; controls: Array<[NumericToken, string, number, number, number]> }> = [
  { title: "页面布局", controls: [["pageWidth", "页面宽度", 960, 1440, 10], ["pagePadding", "页面边距", 12, 64, 1], ["columnGap", "栏间距", 20, 96, 1], ["sidebarWidth", "侧栏宽度", 220, 360, 1], ["mobileGap", "移动端间距", 10, 32, 1]] },
  { title: "横幅与导航", controls: [["bannerHeight", "桌面横幅高度", 180, 480, 1], ["mobileBannerHeight", "移动横幅高度", 120, 280, 1], ["navHeight", "导航高度", 52, 88, 1]] },
  { title: "卡片", controls: [["cardRadius", "圆角", 0, 32, 1], ["cardOpacity", "透明度", .55, 1, .01], ["cardBlur", "背景模糊", 0, 30, 1], ["cardShadow", "阴影范围", 0, 40, 1], ["coverRatio", "封面宽高比", 1, 2.4, .01]] },
  { title: "文字", controls: [["titleSize", "文章标题字号", 22, 48, 1], ["bodySize", "正文字号", 14, 22, 1], ["metaSize", "元数据字号", 10, 16, 1], ["bodyLineHeight", "正文行高", 1.4, 2.2, .05]] }
];
const viewports = [1280, 1024, 760, 390];

export function PublicAppearancePage() {
  const navigate = useNavigate();
  const frame = useRef<HTMLIFrameElement>(null);
  const [appearance, setAppearance] = useState<PublicAppearance | null>(null);
  const [viewport, setViewport] = useState(1280);
  const [message, setMessage] = useState("正在加载…");
  const [saving, setSaving] = useState(false);
  const layoutError = appearance ? validateLayoutTokens(appearance.publicDesignTokens) : null;

  useEffect(() => {
    api.getAdminAppearance().then((value) => { setAppearance(value); setMessage(""); })
      .catch((reason) => reason.message === "请先登录" ? navigate("/admin/login") : setMessage(reason.message));
  }, [navigate]);
  useEffect(() => {
    if (!appearance) return;
    const sendPreview = () => frame.current?.contentWindow?.postMessage({ type: "sunny:appearance-preview", appearance }, location.origin);
    const receiveReady = (event: MessageEvent) => {
      if (event.origin === location.origin && event.source === frame.current?.contentWindow
          && event.data?.type === "sunny:appearance-preview-ready") sendPreview();
    };
    window.addEventListener("message", receiveReady);
    sendPreview();
    return () => window.removeEventListener("message", receiveReady);
  }, [appearance]);

  function updateToken(key: NumericToken, value: number) {
    setAppearance((current) => current && ({ ...current, publicDesignTokens: { ...current.publicDesignTokens, [key]: value } }));
  }
  async function upload(file?: File) {
    if (!file) return;
    setMessage("正在上传横幅…");
    try { const media = await api.upload(file); setAppearance((current) => current && ({ ...current, publicBannerUrl: media.url })); setMessage("横幅已上传，保存后生效"); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "上传失败"); }
  }
  async function save() {
    if (!appearance || layoutError || saving) return;
    setSaving(true);
    try { setAppearance(await api.updateAdminAppearance(appearance)); setMessage("公共外观已保存"); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "保存失败"); }
    finally { setSaving(false); }
  }

  return <AdminFrame><section className="admin-content public-appearance-page">
    <header className="admin-top"><div><p className="eyebrow">Public design system</p><h1>公共外观</h1></div><span role="status">{message}</span></header>
    {!appearance ? <div className="appearance-card">{message}</div> : <div className="public-appearance-workspace">
      <div className="appearance-controls">
        <section className="appearance-card"><h2>横幅</h2>
          <label>横幅图片<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file); }} /></label>
          <label>横向焦点 <strong>{appearance.publicBannerPositionX}%</strong><input type="range" min="0" max="100" value={appearance.publicBannerPositionX} onChange={(event) => setAppearance({ ...appearance, publicBannerPositionX: Number(event.target.value) })} /></label>
          <label>纵向焦点 <strong>{appearance.publicBannerPositionY}%</strong><input type="range" min="0" max="100" value={appearance.publicBannerPositionY} onChange={(event) => setAppearance({ ...appearance, publicBannerPositionY: Number(event.target.value) })} /></label>
          <label>默认明暗模式<select value={appearance.publicColorMode} onChange={(event) => setAppearance({ ...appearance, publicColorMode: event.target.value as PublicAppearance["publicColorMode"] })}><option value="system">跟随系统</option><option value="light">亮色</option><option value="dark">暗色</option></select></label>
        </section>
        {groups.map((group) => <section className="appearance-card token-group" key={group.title}><header><h2>{group.title}</h2><button className="admin-button" type="button" onClick={() => setAppearance({ ...appearance, publicDesignTokens: { ...appearance.publicDesignTokens, ...Object.fromEntries(group.controls.map(([key]) => [key, defaultPublicDesignTokens[key]])) } })}>恢复本组</button></header>
          {group.controls.map(([key, label, min, max, step]) => <label className="token-control" key={key}><span>{label}</span><input type="range" min={min} max={max} step={step} value={appearance.publicDesignTokens[key]} onChange={(event) => updateToken(key, Number(event.target.value))} /><input type="number" min={min} max={max} step={step} value={appearance.publicDesignTokens[key]} onChange={(event) => updateToken(key, Number(event.target.value))} /></label>)}
        </section>)}
        <section className="appearance-card"><h2>高级 CSS</h2><p>仅作用于公共站点；不允许 @import 或外部 url()。</p><textarea rows={10} value={appearance.publicCustomCss} onChange={(event) => setAppearance({ ...appearance, publicCustomCss: event.target.value })} /><button className="admin-button" type="button" onClick={() => setAppearance({ ...appearance, publicCustomCss: "" })}>清空 CSS</button></section>
        {layoutError && <p className="form-error" role="alert">{layoutError}</p>}
        <div className="appearance-actions"><button className="admin-button primary" disabled={saving || Boolean(layoutError)} onClick={() => void save()}>{saving ? "保存中…" : "保存公共外观"}</button><button className="admin-button" onClick={() => setAppearance(defaultPublicAppearance)}>全部恢复默认</button></div>
      </div>
      <div className="appearance-preview"><div className="preview-toolbar">{viewports.map((width) => <button className={viewport === width ? "active" : ""} key={width} onClick={() => setViewport(width)}>{width}</button>)}</div><div className="preview-canvas"><iframe ref={frame} title="公共外观实时预览" src="/?appearance-preview=1" style={{ width: viewport }} onLoad={() => frame.current?.contentWindow?.postMessage({ type: "sunny:appearance-preview", appearance }, location.origin)} /></div></div>
    </div>}
  </section></AdminFrame>;
}
