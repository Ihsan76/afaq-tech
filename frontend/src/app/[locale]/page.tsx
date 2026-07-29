"use client";

import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";

const FALLBACK_BLOCKS: BlockData[] = [
  { id: 0, block_type: "platform_hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "platform_stats", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "services_showcase", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
  { id: 3, block_type: "portfolio", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 3 },
  { id: 4, block_type: "platform_how_it_works", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 4 },
  { id: 5, block_type: "testimonials", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 5 },
  { id: 6, block_type: "pricing", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 6 },
  { id: 7, block_type: "faq", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 7 },
  { id: 8, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 8 },
];

export default function HomePage() {
  return <DynamicPage slug="homepage" fallbackBlocks={FALLBACK_BLOCKS} />;
}
