"use client";

import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";

const FALLBACK_BLOCKS: BlockData[] = [
  { id: 0, block_type: "hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "stats", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "features", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
  { id: 3, block_type: "how_it_works", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 3 },
  { id: 4, block_type: "grade_showcase", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 4 },
  { id: 5, block_type: "subjects_grid", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 5 },
  { id: 6, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 6 },
];

export default function AcademyPageClient() {
  return <DynamicPage slug="academy" fallbackBlocks={FALLBACK_BLOCKS} />;
}
