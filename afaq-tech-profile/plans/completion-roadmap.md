# Afaq Tech — Master Completion Roadmap

This document outlines the structured execution plan to bring the Afaq Tech platform to full production readiness and absolute completion, covering backend architecture, security hardening, user roles, and frontend portals (Academy & Library).

---

## Stage 1: Profile Synchronization & Documentation Update
- [x] Document recent developments: per-school calendar & working days configuration, CI security pipeline (gitleaks, bandit, pip-audit), isolated DAST environment.
- [x] Document subscription gating hardening (`get_subscription_level()`) and secure attachment downloads (`Content-Disposition: attachment`).
- [ ] Update database and API profile docs for new school calendar fields and endpoints.
- [ ] Document Academy & Library roles and screen specifications in profile docs.

## Stage 2: Academy Module Completion (Instructor & Student Portals)
- [ ] **Instructor/Creator Portal**:
  - Backend/API endpoints for course creation, lesson management, and student progress tracking.
  - Frontend view `/instructor/courses` for creating and managing courses and lessons.
- [ ] **Student Academy Portal**:
  - Learning journey view with lesson completion tracking and progress indicators.

## Stage 3: Library & E-books Hub Enhancement
- [ ] **Catalog & Search UI**:
  - Advanced search and filtering (category, access level, price) for e-books.
- [ ] **Secure Reader & Purchase/Download Flow**:
  - Integration with secure ebook download endpoint and paywall messaging.

## Stage 4: Comprehensive Testing & Production Readiness
- [ ] Full pytest regression run (target: 100% pass rate).
- [ ] Frontend TypeScript type-checking (`tsc --noEmit`) and ESLint pass.
- [ ] Final security audit and visual QA pass across all viewports and locales.
