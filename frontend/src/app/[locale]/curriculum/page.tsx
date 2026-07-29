"use client";

import DynamicPage from "@/components/DynamicPage";
import { BlockData } from "@/components/landing/BlockRenderer";

const FALLBACK_BLOCKS: BlockData[] = [
  // Academy blocks
  { id: 0, block_type: "hero", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 0 },
  { id: 1, block_type: "stats", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 1 },
  { id: 2, block_type: "features", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 2 },
  { id: 3, block_type: "how_it_works", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 3 },
  { id: 4, block_type: "demo", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 4 },
  { id: 5, block_type: "testimonials", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 5 },
  // Curriculum blocks
  { id: 6, block_type: "grade_showcase", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 6 },
  { id: 7, block_type: "subjects_grid", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 7 },
  { id: 8, block_type: "partners", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 8 },
  { id: 9, block_type: "faq", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 9 },
  { id: 10, block_type: "cta", content: {}, styles: {}, layout: {}, animation: {}, is_active: true, order: 10 },
];

export default function CurriculumPage() {
  return <DynamicPage slug="curriculum" fallbackBlocks={FALLBACK_BLOCKS} />;
}
