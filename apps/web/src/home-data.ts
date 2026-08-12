import { emptyRichDocument, type PostSummary, type PublicProfile } from "@sunny/shared";

export const emptyProfile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: null,
  bio: "",
  links: [],
  aboutContent: emptyRichDocument,
};

type HomeDataApi = {
  listPosts: () => Promise<PostSummary[]>;
  getProfile: () => Promise<PublicProfile>;
};

export async function loadHomeData(source: HomeDataApi) {
  const [postsResult, profileResult] = await Promise.allSettled([
    source.listPosts(),
    source.getProfile(),
  ]);

  return {
    posts: postsResult.status === "fulfilled" ? postsResult.value : [],
    profile: profileResult.status === "fulfilled" ? profileResult.value : emptyProfile,
  };
}

export function selectHomePosts(posts: PostSummary[]) {
  return {
    researchPosts: posts.filter((post) => post.category === "科研学习").slice(0, 5),
    lifePosts: posts.filter((post) => post.category === "日常生活").slice(0, 5),
  };
}

export function selectPinnedPosts(posts: PostSummary[]) {
  return posts.filter((post) => post.status === "published" && post.featured).slice(0, 6);
}

export function applyHomeData<T>(pending: Promise<T>, onData: (data: T) => void) {
  let active = true;
  pending.then((data) => {
    if (active) onData(data);
  });
  return () => { active = false; };
}
