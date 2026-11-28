import React from "react";
import { StaticRouter } from "react-router-dom";
import type { PostSummary } from "@sunny/shared";
import { PostCard } from "../../../web/src/components/PostCard";

export function StaticPostCard({ post }: { post: PostSummary }) {
  return <StaticRouter><PostCard post={post} /></StaticRouter>;
}
