"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";
import { useApiList, usePrefetch } from "@/lib/useApi";

interface DynamicMenuItem {
  id: number;
  title: string;
  translations: Record<string, Record<string, string>>;
  url: string;
  icon: string;
  badge: string;
  children: DynamicMenuItem[];
}

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user, logout, loadUser } = useAuthStore();
  const { themeId, setThemeId, themes } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const { data: dynamicMenus } = useApiList<DynamicMenuItem>("/pages/menu/header/", { locale });
  const prefetch = usePrefetch(
    dynamicMenus
      .map((item) => {
        const slug = item.url?.replace(/^\//, "") || "";
        return slug ? `/pages/${slug}/` : null;
      })
      .filter(Boolean) as string[]
  );

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemes(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowUserMenu(false);
    setShowThemes(false);
  }, [pathname]);

  // Prefetch menu pages
  useEffect(() => {
    if (dynamicMenus.length === 0) return;
    const timer = setTimeout(prefetch, 500);
    return () => clearTimeout(timer);
  }, [dynamicMenus, prefetch]);

  const navLinks = dynamicMenus.map((item) => {
    const rawUrl = item.url || `/pages/${item.id}`;
    const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    const href = `/${locale}${path === "/" ? "" : path}`;
    return {
      href,
      label: item.title || "Link",
      icon: item.icon || "🔗",
      badge: item.badge,
    };
  });

  const isAdmin = user?.role === "admin" || user?.is_staff;

  const adminLinks = [
    { href: `/${locale}/admin`, label: t("nav.admin"), icon: "⚙️" },
    { href: `/${locale}/admin/pages`, label: t("admin.pages"), icon: "📄" },
    { href: `/${locale}/admin/posts`, label: t("admin.blog"), icon: "📝" },
    { href: `/${locale}/admin/themes`, label: t("admin.themes"), icon: "🎨" },
    { href: `/${locale}/admin/menus`, label: t("admin.menus"), icon: "📋" },
    { href: `/${locale}/admin/languages`, label: t("admin.languages"), icon: "🌐" },
    { href: `/${locale}/admin/translations`, label: t("admin.translations"), icon: "🗂️" },
    { href: `/${locale}/admin/feature-flags`, label: t("admin.featureFlags"), icon: "🚩" },
    { href: `/${locale}/admin/settings`, label: t("admin.settings"), icon: "🔧" },
  ];

  const userApps = [
    { href: `/${locale}/dashboard`, label: t("nav.dashboard"), icon: "📊" },
    { href: `/${locale}/school`, label: t("nav.school"), icon: "🏫" },
    { href: `/${locale}/gamification`, label: t("nav.gamification"), icon: "🎮" },
    { href: `/${locale}/notifications`, label: t("nav.notifications"), icon: "🔔" },
    { href: `/${locale}/subscriptions`, label: t("nav.subscriptions"), icon: "💳" },
    { href: `/${locale}/chat`, label: t("nav.chat"), icon: "🤖" },
    { href: `/${locale}/profile`, label: t("nav.profile"), icon: "👤" },
  ];

  const isActive = (href: string) => pathname === href;
  const currentTheme = themes.find((th) => th.id === themeId) || themes[0];
  const userInitial = (user?.name_ar || user?.email || "?")[0]?.toUpperCase();
  const userName = user?.name_ar || user?.email?.split("@")[0] || user?.email || "";
  const roleLabel = isAdmin ? "مشرف" : user?.role === "teacher" ? "معلم" : "طالب";

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300 border-b"
      style={{
        backgroundColor: scrolled
          ? "color-mix(in srgb, var(--color-surface) 80%, transparent)"
          : "var(--color-surface)",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        boxShadow: scrolled ? "0 1px 3px 0 rgb(0 0 0 / 0.1)" : "none",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group shrink-0">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              <span className="text-white font-bold text-xs sm:text-sm">آ</span>
            </div>
            <span
              className="font-bold text-sm sm:text-lg hidden sm:block"
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("common.appName")}
            </span>
          </Link>

          {/* Desktop CMS Nav Links ONLY */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 max-w-[55vw]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 flex items-center gap-1.5"
                style={{
                  backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                  color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(link.href)) {
                    e.currentTarget.style.color = "var(--color-text)";
                    e.currentTarget.style.backgroundColor = "var(--color-muted)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(link.href)) {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Tools (Language, Theme, User Menu / Auth Buttons) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher />

            {/* Notifications Bell (desktop) */}
            <NotificationBell />

            {/* Theme Selector */}
            <div ref={themeRef} className="relative">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all duration-200"
                style={{
                  backgroundColor: showThemes ? "var(--color-primary-light)" : "transparent",
                  color: "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showThemes ? "var(--color-primary-light)" : "transparent";
                }}
                title={currentTheme.name_ar}
              >
                {currentTheme.icon}
              </button>

              {showThemes && (
                <div
                  className="absolute top-full mt-2 w-56 sm:w-64 rounded-2xl shadow-2xl overflow-hidden z-50 end-0 border"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
                  }}
                >
                  <div className="p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                    <p className="text-xs font-semibold px-1" style={{ color: "var(--color-text-muted)" }}>
                      {t("profile.theme")}
                    </p>
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setThemeId(theme.id);
                          setShowThemes(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all duration-200"
                        style={{
                          backgroundColor: theme.id === themeId ? "var(--color-primary-light)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (theme.id !== themeId) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                        }}
                        onMouseLeave={(e) => {
                          if (theme.id !== themeId) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span className="text-xl flex-shrink-0">{theme.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: theme.id === themeId ? "var(--color-primary)" : "var(--color-text)" }}
                          >
                            {theme.name_ar}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                            {theme.description_ar}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                        </div>
                        {theme.id === themeId && (
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: "var(--color-primary)" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop User Profile Dropdown or Auth Buttons ONLY (hidden on mobile, managed by Hamburger) */}
            {user ? (
              <div ref={userRef} className="relative hidden lg:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all duration-200 border"
                  style={{
                    backgroundColor: showUserMenu ? "var(--color-primary-light)" : "var(--color-surface)",
                    borderColor: showUserMenu ? "var(--color-primary)" : "var(--color-border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!showUserMenu) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                  }}
                  onMouseLeave={(e) => {
                    if (!showUserMenu) e.currentTarget.style.backgroundColor = "var(--color-surface)";
                  }}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {userInitial}
                  </div>
                  <span
                    className="text-xs sm:text-sm font-semibold max-w-[120px] truncate"
                    style={{ color: "var(--color-text)" }}
                  >
                    {userName}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                    style={{ color: "var(--color-text-muted)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Profile Dropdown Menu - Sleek, Scrollable, Modern */}
                {showUserMenu && (
                  <div
                    className="absolute top-full mt-2 w-72 sm:w-80 max-h-[82vh] overflow-y-auto rounded-2xl shadow-2xl z-50 py-2 end-0 border"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
                    }}
                  >
                    {/* User Info Header Card */}
                    <div
                      className="px-3.5 py-3 mx-2 rounded-xl mb-1 border"
                      style={{
                        background: "linear-gradient(135deg, var(--color-primary-light), transparent)",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0"
                          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                        >
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>
                            {user.name_ar || userName}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                            {user.email}
                          </p>
                          <span
                            className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full"
                            style={{
                              backgroundColor: isAdmin
                                ? "rgba(239, 68, 68, 0.15)"
                                : "var(--color-primary-light)",
                              color: isAdmin ? "var(--color-error)" : "var(--color-primary)",
                            }}
                          >
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* My Apps Section */}
                    <div className="px-1 py-1">
                      <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                        تطبيقاتي
                      </p>
                      <div className="space-y-0.5">
                        {userApps.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                            style={{
                              color: isActive(item.href) ? "var(--color-primary)" : "var(--color-text)",
                              backgroundColor: isActive(item.href) ? "var(--color-primary-light)" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive(item.href)) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive(item.href)) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Admin Section (If Admin/Staff) - 2-Column Grid */}
                    {isAdmin && (
                      <>
                        <div className="border-t my-1.5 mx-2" style={{ borderColor: "var(--color-border)" }} />
                        <div className="px-1 py-1">
                          <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                            {t("nav.admin")}
                          </p>
                          <div className="grid grid-cols-2 gap-1 px-1">
                            {adminLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
                                style={{
                                  color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                                  backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive(link.href)) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive(link.href)) e.currentTarget.style.backgroundColor = "transparent";
                                }}
                              >
                                <span className="text-sm shrink-0">{link.icon}</span>
                                <span className="truncate">{link.label}</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Logout */}
                    <div className="border-t pt-1.5 mt-1 mx-2" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors text-start"
                        style={{ color: "var(--color-error)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span className="text-base">🚪</span>
                        <span>{t("auth.logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1 sm:gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="px-3 py-1.5 text-sm font-medium rounded-xl transition-all"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="px-3 sm:px-4 py-1.5 text-sm font-medium text-white rounded-xl shadow-md transition-all duration-200"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  {t("auth.register")}
                </Link>
              </div>
            )}

            {/* Mobile Toggle Button */}
            <button
              className="lg:hidden flex flex-col items-center justify-center w-9 h-9 rounded-xl border transition-all"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: mobileOpen ? "var(--color-primary-light)" : "transparent",
              }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="w-4 h-0.5 rounded transition-all duration-200"
                style={{
                  background: mobileOpen ? "var(--color-primary)" : "var(--color-text)",
                  transform: mobileOpen ? "rotate(45deg) translateY(2.5px)" : "none",
                }}
              />
              <span
                className="w-4 h-0.5 rounded transition-all duration-200 my-0.5"
                style={{
                  background: "var(--color-text)",
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                className="w-4 h-0.5 rounded transition-all duration-200"
                style={{
                  background: mobileOpen ? "var(--color-primary)" : "var(--color-text)",
                  transform: mobileOpen ? "rotate(-45deg) translateY(-2.5px)" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileOpen && (
          <div className="lg:hidden pb-6 border-t mt-1" style={{ borderColor: "var(--color-border)" }}>
            <div className="pt-3 space-y-4 max-h-[80vh] overflow-y-auto px-1">
              {/* User Info Card in Mobile */}
              {user && (
                <div
                  className="p-3.5 rounded-2xl flex items-center gap-3 border"
                  style={{ backgroundColor: "var(--color-background-secondary)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>
                      {user.name_ar || userName}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {user.email}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0"
                    style={{
                      backgroundColor: isAdmin ? "rgba(239, 68, 68, 0.15)" : "var(--color-primary-light)",
                      color: isAdmin ? "var(--color-error)" : "var(--color-primary)",
                    }}
                  >
                    {roleLabel}
                  </span>
                </div>
              )}

              {/* Main Site Links */}
              <div>
                <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                  التصفح العام
                </p>
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                        color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      <span className="text-base">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Logged In Apps */}
              {user && (
                <div>
                  <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    تطبيقاتي
                  </p>
                  <div className="space-y-1">
                    {userApps.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isActive(item.href) ? "var(--color-primary-light)" : "transparent",
                          color: isActive(item.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Links in Mobile */}
              {user && isAdmin && (
                <div>
                  <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    {t("nav.admin")}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {adminLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "var(--color-background-secondary)",
                          color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <span className="text-sm">{link.icon}</span>
                        <span className="truncate">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Auth Actions */}
              <div className="pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                {user ? (
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold rounded-xl transition-colors border"
                    style={{
                      color: "var(--color-error)",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      backgroundColor: "rgba(239, 68, 68, 0.05)",
                    }}
                  >
                    <span>🚪</span>
                    <span>{t("auth.logout")}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/login`}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-medium rounded-xl border"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {t("auth.login")}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center py-2.5 text-sm font-medium text-white rounded-xl shadow-md"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                    >
                      {t("auth.register")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
