import React, { useEffect, useState } from "react";
import type { PostSummary, PublicProfile } from "@sunny/shared";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { ProfileLinkIcon } from "../components/ProfileLinkIcon";
import { demoHomeData } from "../demo-home-data";
import { applyHomeData, emptyProfile, loadHomeData, resolveHomeData, selectHomeFeed } from "../home-data";

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [profile, setProfile] = useState<PublicProfile>(emptyProfile);

  useEffect(() => {
    return applyHomeData(loadHomeData(api).then((data) => resolveHomeData(data, demoHomeData, import.meta.env.DEV)), (data) => {
      setPosts(data.posts);
      setProfile(data.profile);
    });
  }, []);

  return <HomeView posts={posts} profile={profile} />;
}

export function HomeView({ posts, profile }: { posts: PostSummary[]; profile: PublicProfile }) {
  const feed = selectHomeFeed(posts);
  const featured = feed.featured[0];
  const visibleLinks = profile.links.slice(0, 4);

  return (
    <>
    <main className="home-layout">
      <aside className="profile-sidebar">
        <section className="fuwari-card profile-card-public">
          <Link className="profile-avatar-link" to="/about" aria-label="查看个人介绍">
            {profile.avatarUrl
              ? <img className="profile-avatar" src={profile.avatarUrl} alt={profile.displayName} />
              : <span className="profile-avatar profile-avatar-placeholder" aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</span>}
            <span className="profile-avatar-overlay" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M6.5 16c.8-2 2-3 3.5-3s2.7 1 3.5 3M15 9h3M15 12h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
          </Link>
          <h1>{profile.displayName}</h1>
          <span className="profile-accent" aria-hidden="true" />
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          {visibleLinks.length > 0 && (
          <nav className="profile-named-links" aria-label="外部链接">
            {visibleLinks.map((link, index) => (
              <a className="profile-named-link" href={link.url} target="_blank" rel="noopener noreferrer" key={`${link.title}-${link.url}-${index}`}>
                <ProfileLinkIcon icon={link.icon} />
                <span>{link.title}</span>
              </a>
            ))}
          </nav>
          )}
        </section>
      </aside>

      <div className="home-content">

        {featured && (
          <section className="home-section featured-section">
            <header className="section-heading"><div><p className="section-label">Pinned</p><h2>置顶内容</h2></div></header>
            <PostCard post={featured} featured />
          </section>
        )}

        <section className="home-section latest-section-public">
          <header className="section-heading"><div><p className="section-label">Latest</p><h2>最新文章</h2></div><Link to="/posts">全部文章 →</Link></header>
          {feed.latest.length > 0 ? <div className="home-latest-list">{feed.latest.map((item) => (
            <article className="home-latest-item" key={item.id}>
              <time dateTime={item.publishedAt ?? undefined}>{item.publishedAt?.slice(0, 10)}</time>
              <div>
                <span>{item.category}</span>
                <h3><Link to={`/posts/${item.slug}`}>{item.title}</Link></h3>
                {item.excerpt && <p>{item.excerpt}</p>}
              </div>
            </article>
          ))}</div> : <p className="empty-state fuwari-card">暂无其他文章。</p>}
        </section>

      </div>
    </main>
    <footer className="public-compliance">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">晋ICP备2026010770号</a>
      <span aria-hidden="true">·</span>
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=32011502014222" target="_blank" rel="noopener noreferrer">
        <img src="/beian-police.png" alt="" />
        苏公网安备32011502014222号
      </a>
    </footer>
    </>
  );
}
