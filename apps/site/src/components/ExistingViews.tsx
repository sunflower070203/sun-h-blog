import React from "react";
import { StaticRouter } from "react-router-dom";
import type { PostSummary, PublicProfile } from "@sunny/shared";
import { HomeView } from "../../../web/src/pages/HomePage";
import { PostCard } from "../../../web/src/components/PostCard";

export function StaticHome({ posts, profile }: { posts: PostSummary[]; profile: PublicProfile }) {
  return <StaticRouter location="/"><HomeView posts={posts} profile={profile} /></StaticRouter>;
}

export function StaticPostCard({ post }: { post: PostSummary }) {
  return <StaticRouter><PostCard post={post} /></StaticRouter>;
}
