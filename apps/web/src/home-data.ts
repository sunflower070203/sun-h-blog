import { emptyRichDocument, type PostSummary, type PublicProfile } from "@sunny/shared";

export const emptyProfile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: null,
  bio: "",
  links: [],
  aboutContent: emptyRichDocument,
  introContent: emptyRichDocument,
};

type HomeDataApi = {
  listPosts: () => Promise<PostSummary[]>;
  getProfile: () => Promise<PublicProfile>;
};

type HomeData = { posts: PostSummary[]; profile: PublicProfile };

function hasProfileContent(profile: PublicProfile) {
  const intro = profile.introContent.content;
  return Boolean(profile.bio || profile.avatarUrl || profile.links.length || (Array.isArray(intro) && intro.some((node) => {
    const content = node && typeof node === "object" ? (node as { content?: unknown[] }).content : undefined;
    return Array.isArray(content) && content.length > 0;
  })));
}

export function resolveHomeData(actual: HomeData, demo: HomeData, demoEnabled: boolean): HomeData {
  return demoEnabled && actual.posts.length === 0 && !hasProfileContent(actual.profile) ? demo : actual;
}

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

export function selectHomeFeed(posts: PostSummary[]) {
  const published = posts.filter((post) => post.status === "published");
  return {
    featured: published.filter((post) => post.featured).slice(0, 1),
    latest: published.filter((post) => !post.featured).slice(0, 3)
  };
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((left, right) => right.count - left.count);
}

export function collectPostFacets(posts: PostSummary[]) {
  const published = posts.filter((post) => post.status === "published");
  return {
    categories: countValues(published.map((post) => post.category)),
    tags: countValues(published.flatMap((post) => post.tags))
  };
}

export function applyHomeData<T>(pending: Promise<T>, onData: (data: T) => void) {
  let active = true;
  pending.then((data) => {
    if (active) onData(data);
  });
  return () => { active = false; };
}
