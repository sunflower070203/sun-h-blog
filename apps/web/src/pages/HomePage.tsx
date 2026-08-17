import React, { useEffect, useState } from "react";
import type { PostSummary, PublicProfile } from "@sunny/shared";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { RichDocument } from "../components/RichDocument";
import { ProfileLinkIcon } from "../components/ProfileLinkIcon";
import { demoHomeData } from "../demo-home-data";
import { applyHomeData, collectPostFacets, emptyProfile, loadHomeData, resolveHomeData, selectHomeFeed } from "../home-data";

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
  const facets = collectPostFacets(posts);

  return (
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
          <RichDocument content={profile.introContent} />
          {profile.links.length > 0 ? (
          <div className="profile-social-links" aria-label="社交链接">
            {profile.links.map((link, index) => (
              <a href={link.url} target="_blank" rel="noopener noreferrer" title={link.title} aria-label={link.title} key={`${link.title}-${link.url}-${index}`}>
                <ProfileLinkIcon icon={link.icon} />
              </a>
            ))}
          </div>
          ) : null}
        </section>
        {profile.links.length > 0 && <section className="fuwari-card external-links-card"><h2>外部链接</h2><div className="profile-links">
          {profile.links.map((link, index) => <a href={link.url} target="_blank" rel="noopener noreferrer" key={`detail-${link.title}-${link.url}-${index}`}><ProfileLinkIcon icon={link.icon} /><span className="profile-link-copy"><strong>{link.title}</strong>{link.description && <small>{link.description}</small>}</span></a>)}
        </div></section>}
        <section className="fuwari-card facet-card"><h2>分类</h2>{facets.categories.length ? <div className="category-list">{facets.categories.map((item) => <Link to={item.name === "科研学习" ? "/research" : item.name === "日常生活" ? "/life" : `/posts?category=${encodeURIComponent(item.name)}`} key={item.name}><span>{item.name}</span><strong>{item.count}</strong></Link>)}</div> : <p>暂无分类</p>}</section>
        <section className="fuwari-card facet-card"><h2>标签</h2>{facets.tags.length ? <div className="tag-cloud">{facets.tags.map((item) => <Link to={`/posts?q=${encodeURIComponent(item.name)}`} key={item.name}>#{item.name}<small>{item.count}</small></Link>)}</div> : <p>暂无标签</p>}</section>
      </aside>

      <div className="home-content">

        <section className="home-section featured-section">
          <header className="section-heading"><div><p className="section-label">Featured</p><h2>精选内容</h2></div></header>
          {feed.featured.length > 0
            ? <div className="featured-grid">{feed.featured.map((post) => <PostCard post={post} key={post.id} featured />)}</div>
            : <p className="empty-state fuwari-card">还没有精选文章。</p>}
        </section>

        <section className="home-section latest-section-public">
          <header className="section-heading"><div><p className="section-label">Latest</p><h2>最新文章</h2></div><Link to="/posts">全部文章 →</Link></header>
          {feed.latest.length > 0 ? <div className="post-grid">{feed.latest.map((post) => <PostCard post={post} key={post.id} />)}</div> : <p className="empty-state fuwari-card">暂无其他文章。</p>}
        </section>

        <footer><Link to="/admin">管理</Link></footer>
      </div>
    </main>
  );
}
