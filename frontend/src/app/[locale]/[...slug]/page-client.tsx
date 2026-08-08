"use client";

import { useParams, notFound } from "next/navigation";
import DynamicPage from "@/components/DynamicPage";

const RESERVED_PREFIXES = [
  "login", "register", "auth", "verify-email", "admin", "lesson-plans", "profile", "chat",
  "curriculum", "academy", "ebooks", "blog", "dashboard",
  "forgot-password", "reset-password", "search", "marketplace", "gamification",
  "privacy", "terms", "school", "school-followup"
];

export default function CatchAllPageClient({ slug: propSlug }: { slug?: string }) {
  const params = useParams();
  const slug = propSlug || (Array.isArray(params.slug) ? params.slug.join("/") : (params.slug || ""));
  const firstSegment = slug.split("/")[0];

  if (RESERVED_PREFIXES.includes(firstSegment)) {
    notFound();
  }

  return <DynamicPage slug={slug} />;
}
