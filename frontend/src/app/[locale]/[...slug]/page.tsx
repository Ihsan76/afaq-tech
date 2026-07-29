"use client";

import { useParams } from "next/navigation";
import DynamicPage from "@/components/DynamicPage";

export default function CatchAllPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug.join("/") : (params.slug || "");

  return <DynamicPage slug={slug} />;
}
