import type { AdminPostPage, PostDetail, PostInput, PostStatus, PostSummary, PublicAppearance, PublicProfile, SiteSettings } from "@sunny/shared";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const csrfToken = document.cookie.split("; ").find((item) => item.startsWith("sunny_csrf="))?.split("=")[1];
  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers as Record<string, string> | undefined)
  };
  if (csrfToken && options?.method && options.method !== "GET") headers["x-csrf-token"] = decodeURIComponent(csrfToken);
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers,
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "请求失败" }));
    throw new Error(body.message ?? "请求失败");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  listPosts: (query = "") => request<PostSummary[]>(`/posts${query}`),
  getPost: (slug: string) => request<PostDetail>(`/posts/${slug}`),
  getProfile: () => request<PublicProfile>("/profile"),
  getAppearance: () => request<PublicAppearance>("/appearance"),
  login: (email: string, password: string) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  listAdminPosts: (query = "") => request<AdminPostPage>(`/admin/posts${query}`),
  getAdminPost: (id: string) => request<PostDetail>(`/admin/posts/${id}`),
  createPost: (input: PostInput) => request<PostDetail>("/admin/posts", { method: "POST", body: JSON.stringify(input) }),
  updatePost: (id: string, input: PostInput) => request<PostDetail>(`/admin/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  publishPost: (id: string) => request<PostDetail>(`/admin/posts/${id}/publish`, { method: "POST" }),
  unpublishPost: (id: string) => request<PostDetail>(`/admin/posts/${id}/unpublish`, { method: "POST" }),
  copyPost: (id: string) => request<PostDetail>(`/admin/posts/${id}/copy`, { method: "POST" }),
  batchPostStatus: (ids: string[], status: PostStatus) => request<PostDetail[]>("/admin/posts/batch-status", {
    method: "POST",
    body: JSON.stringify({ ids, status })
  }),
  deletePost: (id: string) => request<void>(`/admin/posts/${id}`, { method: "DELETE" }),
  getSettings: () => request<SiteSettings>("/admin/settings"),
  getAdminProfile: () => request<PublicProfile>("/admin/profile"),
  getAdminAppearance: () => request<PublicAppearance>("/admin/appearance/public"),
  updateAdminAppearance: (appearance: PublicAppearance) => request<PublicAppearance>("/admin/appearance/public", { method: "PUT", body: JSON.stringify(appearance) }),
  updateProfile: (profile: PublicProfile) => request<PublicProfile>("/admin/profile", { method: "PUT", body: JSON.stringify(profile) }),
  updateSettings: (settings: SiteSettings) => request<SiteSettings>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  }),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/admin/media", { method: "POST", body: form });
  }
};
