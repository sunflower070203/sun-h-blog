import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const PostListPage = lazy(() => import("./pages/PostListPage").then((module) => ({ default: module.PostListPage })));
const PostPage = lazy(() => import("./pages/PostPage").then((module) => ({ default: module.PostPage })));
const LoginPage = lazy(() => import("./admin/LoginPage").then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import("./admin/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const PostEditorPage = lazy(() => import("./admin/PostEditorPage").then((module) => ({ default: module.PostEditorPage })));
const AppearancePage = lazy(() => import("./admin/AppearancePage").then((module) => ({ default: module.AppearancePage })));

function Public({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main className="inner-page empty-state">正在加载…</main>}>
        <Routes>
          <Route path="/" element={<Public><HomePage /></Public>} />
          <Route path="/posts" element={<Public><PostListPage /></Public>} />
          <Route path="/posts/:slug" element={<Public><PostPage /></Public>} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/appearance" element={<AppearancePage />} />
          <Route path="/admin/posts/new" element={<PostEditorPage />} />
          <Route path="/admin/posts/:id" element={<PostEditorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
