import { useEffect, useState } from "react";
import type { PublicProfile } from "@sunny/shared";
import { api } from "../api";
import { RichDocument } from "../components/RichDocument";

export function hasAboutContent(content?: Record<string, unknown>) {
  return Array.isArray(content?.content) && content.content.some((node) => typeof node === "object" && node !== null && ("content" in node || (node as { type?: string }).type !== "paragraph"));
}

export function AboutPage() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  useEffect(() => { let active = true; api.getProfile().then((value) => { if (active) setProfile(value); }); return () => { active = false; }; }, []);
  return <main className="section-page about-page">{!profile ? <p className="empty-state">正在加载…</p> : hasAboutContent(profile.aboutContent) ? <RichDocument content={profile.aboutContent} /> : <p className="empty-state">个人介绍尚未填写。</p>}</main>;
}
