import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { PublicTransition } from "./components/PublicTransition";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const PostListPage = lazy(() => import("./pages/PostListPage").then((module) => ({ default: module.PostListPage })));
const PostPage = lazy(() => import("./pages/PostPage").then((module) => ({ default: module.PostPage })));
const LoginPage = lazy(() => import("./admin/LoginPage").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import("./admin/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const PostEditorPage = lazy(() => import("./admin/PostEditorPage").then((module) => ({ default: module.PostEditorPage })));
const AppearancePage = lazy(() => import("./admin/AppearancePage").then((module) => ({ default: module.AppearancePage })));
const ProfilePage = lazy(() => import("./admin/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const CategoryPage = lazy(() => import("./pages/CategoryPage").then((module) => ({ default: module.CategoryPage })));
const AboutPage = lazy(() => import("./pages/AboutPage").then((module) => ({ default: module.AboutPage })));

function Public({ children }: { children: React.ReactNode }) {
  return <Shell><PublicTransition>{children}</PublicTransition></Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="inner-page empty-state">正在加载…</main>}>
        <Routes>
          <Route path="/" element={<Public><HomePage /></Public>} />
          <Route path="/research" element={<Public><CategoryPage category="科研学习" title="科研学习" /></Public>} />
          <Route path="/life" element={<Public><CategoryPage category="日常生活" title="日常生活" /></Public>} />
          <Route path="/about" element={<Public><AboutPage /></Public>} />
          <Route path="/posts" element={<Public><PostListPage /></Public>} />
          <Route path="/posts/:slug" element={<Public><PostPage /></Public>} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/admin/appearance" element={<AppearancePage />} />
          <Route path="/admin/posts/new" element={<PostEditorPage />} />
          <Route path="/admin/posts/:id" element={<PostEditorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
