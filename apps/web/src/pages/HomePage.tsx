import React, { useEffect, useState } from "react";
import type { PostSummary, PublicProfile } from "@sunny/shared";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { RichDocument } from "../components/RichDocument";
import { ProfileLinkIcon } from "../components/ProfileLinkIcon";
import { applyHomeData, emptyProfile, loadHomeData, selectPinnedPosts } from "../home-data";

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [profile, setProfile] = useState<PublicProfile>(emptyProfile);

  useEffect(() => {
    return applyHomeData(loadHomeData(api), (data) => {
      setPosts(data.posts);
      setProfile(data.profile);
    });
  }, []);

  return <HomeView posts={posts} profile={profile} />;
}

export function HomeView({ posts, profile }: { posts: PostSummary[]; profile: PublicProfile }) {
  const pinnedPosts = selectPinnedPosts(posts);

  return (
    <main className="home-layout">
      <aside className="profile-sidebar">
        {profile.avatarUrl && <img src={profile.avatarUrl} alt={profile.displayName} />}
        <h1>{profile.displayName}</h1>
          <h2>简介</h2>
          <RichDocument content={profile.introContent} />

          <h2>外部链接</h2>
          {profile.links.length > 0 ? (
          <div className="profile-links">
            {profile.links.map((link, index) => (
              <a href={link.url} target="_blank" rel="noopener noreferrer" key={`${link.title}-${link.url}-${index}`}>
                <ProfileLinkIcon icon={link.icon} />
                <span className="profile-link-copy"><strong>{link.title}</strong>{link.description && <small>{link.description}</small>}</span>
              </a>
            ))}
          </div>
          ) : <p className="empty-state">还没有添加外部链接。</p>}
      </aside>

      <div className="home-content">

        <section className="home-section pinned-section">
          <p className="section-label">Pinned</p>
          <h2>置顶文章 / 项目</h2>
          {pinnedPosts.length > 0
            ? <div className="post-grid">{pinnedPosts.map((post) => <PostCard post={post} key={post.id} />)}</div>
            : <p className="empty-state">还没有置顶文章。</p>}
        </section>

        <footer><Link to="/admin">管理</Link></footer>
      </div>
    </main>
  );
}
