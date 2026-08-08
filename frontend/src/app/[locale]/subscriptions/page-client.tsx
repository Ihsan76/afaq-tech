"use client";

import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";

const FALLBACK_BLOCKS: BlockData[] = [
  { id: 0, block_type: "hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "features", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
];

export default function SubscriptionsPageClient() {
  return <DynamicPage slug="subscriptions" fallbackBlocks={FALLBACK_BLOCKS} />;
}
