import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try { await api.login(email, password); navigate("/admin"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "登录失败"); }
    finally { setBusy(false); }
  }

  return (
    <main className="admin-auth">
      <form onSubmit={submit} className="login-card">
        <div className="admin-mark">S·</div>
        <p className="eyebrow">Sunny Studio</p>
        <h1>欢迎回来</h1>
        <p>这里仅供 Sunny 写作与管理内容。</p>
        <label>邮箱<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="admin-button primary" disabled={busy}>{busy ? "正在登录…" : "进入写作后台"}</button>
        <a href="/">← 返回博客</a>
      </form>
    </main>
  );
}
