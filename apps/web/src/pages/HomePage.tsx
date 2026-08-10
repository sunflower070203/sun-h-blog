import { useEffect, useState } from "react";
import type { PostSummary } from "@sunny/shared";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PostCard } from "../components/PostCard";
import { interests, site } from "../content/site";

export function HomePage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  useEffect(() => { api.listPosts().then(setPosts).catch(() => setPosts([])); }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="kicker">{site.school} <span>/</span> {site.role}</p>
          <h1>向未知航行，<br /><em>也记录沿途。</em></h1>
          <p className="hero-intro">{site.intro}</p>
          <div className="hero-actions">
            <a className="button primary" href="#research">查看研究方向 ↗</a>
            <Link className="button ghost" to="/posts">阅读全部文章</Link>
          </div>
        </div>
        <div className="hero-meta glass">
          <div><span>Current focus</span><strong>学习如何提出更好的问题</strong></div>
          <div><span>Base</span><strong>南京 · 东南大学</strong></div>
          <div><span>Status</span><strong className="status">持续探索中</strong></div>
        </div>
      </section>

      <section className="section" id="research">
        <div className="section-label">01 / Research</div>
        <div className="section-heading">
          <h2>不是展示答案，<br />而是记录问题如何展开。</h2>
          <p>目前仍在建立研究基础。这里会诚实记录阅读、实验、复现与失败，而不是提前包装成熟成果。</p>
        </div>
        <div className="interest-grid">
          {interests.map(([index, title, description]) => (
            <article className="interest-card" key={index}>
              <span>{index}</span><h3>{title}</h3><p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section latest-section">
        <div className="section-label">02 / Field notes</div>
        <div className="section-heading compact"><h2>最近更新</h2><Link to="/posts">查看全部文章 ↗</Link></div>
        {posts.length ? <div className="post-grid">{posts.slice(0, 3).map((post) => <PostCard post={post} key={post.id} />)}</div> :
          <div className="empty-state"><p>第一篇文章还在航线上。</p><span>登录写作后台，发布后会自动出现在这里。</span></div>}
      </section>

      <section className="section about-section" id="about">
        <div><span className="sun-mark">☀</span><p className="section-label">03 / About Sunny</p></div>
        <div><h2>一名仍在形成方向的<br />东大本科生。</h2><p>这个网站不是完成时的简历，而是一份持续更新的航海日志。它会随着研究兴趣、能力边界和生活经验一起改变。</p></div>
      </section>

      <footer><p>Sunny · Research · Learning · Life</p><Link to="/admin">进入写作后台 ↗</Link></footer>
    </main>
  );
}
