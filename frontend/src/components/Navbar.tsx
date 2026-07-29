"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { useTheme } from "@/hooks/useTheme";
import LanguageSwitcher from "./LanguageSwitcher";
import { useApiList, usePrefetch } from "@/lib/useApi";

interface DynamicMenuItem {
  id: number; title: string;
  translations: Record<string, Record<string, string>>;
  url: string; icon: string; badge: string;
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
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const { data: dynamicMenus } = useApiList<DynamicMenuItem>("/pages/menu/header/", { locale });
  const prefetch = usePrefetch(dynamicMenus.map((item) => {
    const slug = item.url?.replace(/^\//, "") || "";
    return slug ? `/pages/${slug}/` : null;
  }).filter(Boolean) as string[]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setShowThemes(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setShowAdminMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prefetch all menu pages after they load (delayed so current page renders first)
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
    { href: `/${locale}/admin/blog`, label: t("admin.blog"), icon: "📝" },
    { href: `/${locale}/admin/themes`, label: t("admin.themes"), icon: "🎨" },
    { href: `/${locale}/admin/menus`, label: t("admin.menus"), icon: "📋" },
    { href: `/${locale}/admin/settings`, label: t("admin.settings"), icon: "🔧" },
  ];

  const isActive = (href: string) => pathname === href;
  const currentTheme = themes.find((th) => th.id === themeId) || themes[0];

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300 border-b"
      style={{
        backgroundColor: scrolled ? "color-mix(in srgb, var(--color-surface) 80%, transparent)" : "var(--color-surface)",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        boxShadow: scrolled ? "0 1px 3px 0 rgb(0 0 0 / 0.1)" : "none",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
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

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
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
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                href={`/${locale}/dashboard`}
                className="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isActive(`/${locale}/dashboard`) ? "var(--color-primary-light)" : "transparent",
                  color: isActive(`/${locale}/dashboard`) ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(`/${locale}/dashboard`)) {
                    e.currentTarget.style.color = "var(--color-text)";
                    e.currentTarget.style.backgroundColor = "var(--color-muted)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(`/${locale}/dashboard`)) {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span className="mr-1">📊</span>
                {t("nav.dashboard")}
              </Link>
            )}

            {user && (
              <Link
                href={`/${locale}/chat`}
                className="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isActive(`/${locale}/chat`) ? "var(--color-primary-light)" : "transparent",
                  color: isActive(`/${locale}/chat`) ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(`/${locale}/chat`)) {
                    e.currentTarget.style.color = "var(--color-text)";
                    e.currentTarget.style.backgroundColor = "var(--color-muted)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(`/${locale}/chat`)) {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span className="mr-1">
                  <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a4.5 4.5 0 00-3.09-3.09L13.5 6l1.035-.259a4.5 4.5 0 003.09-3.09L18 1.5l.259 1.035a4.5 4.5 0 003.09 3.09L22.5 6l-1.035.259a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </span>
                {t("nav.chat")}
              </Link>
            )}

            {user && isAdmin && (
              <div ref={adminRef} className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  className="px-3 xl:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: showAdminMenu || adminLinks.some((l) => isActive(l.href)) ? "var(--color-primary-light)" : "transparent",
                    color: adminLinks.some((l) => isActive(l.href)) ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!adminLinks.some((l) => isActive(l.href))) {
                      e.currentTarget.style.color = "var(--color-text)";
                      e.currentTarget.style.backgroundColor = "var(--color-muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!adminLinks.some((l) => isActive(l.href))) {
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span className="mr-1">⚙️</span>
                  {t("nav.admin")}
                </button>

                {showAdminMenu && (
                  <div
                    className="absolute top-full mt-2 w-52 rounded-2xl shadow-2xl overflow-hidden z-50 py-1"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
                    }}
                  >
                    {adminLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setShowAdminMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{
                          color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text)",
                          backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(link.href)) e.currentTarget.style.backgroundColor = "var(--color-muted)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(link.href)) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <span>{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side — compact on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher />

            <div ref={themeRef} className="relative">
              <button
                onClick={() => setShowThemes(!showThemes)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all duration-200"
                style={{
                  backgroundColor: showThemes ? "var(--color-primary-light)" : "transparent",
                  color: "var(--color-text-secondary)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-muted)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = showThemes ? "var(--color-primary-light)" : "transparent"; }}
                title={currentTheme.name_ar}
              >
                {currentTheme.icon}
              </button>

              {showThemes && (
                <div
                  className="absolute top-full mt-2 w-56 sm:w-64 rounded-2xl shadow-2xl overflow-hidden z-50"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
                    right: 0,
                  }}
                >
                  <div className="p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <p className="text-xs font-semibold px-1" style={{ color: "var(--color-text-muted)" }}>{t("profile.theme")}</p>
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => { setThemeId(theme.id); setShowThemes(false); }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl text-start transition-all duration-200"
                        style={{ backgroundColor: theme.id === themeId ? "var(--color-primary-light)" : "transparent" }}
                        onMouseEnter={(e) => { if (theme.id !== themeId) e.currentTarget.style.backgroundColor = "var(--color-muted)"; }}
                        onMouseLeave={(e) => { if (theme.id !== themeId) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <span className="text-xl flex-shrink-0">{theme.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: theme.id === themeId ? "var(--color-primary)" : "var(--color-text)" }}>
                            {theme.name_ar}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{theme.description_ar}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                        </div>
                        {theme.id === themeId && (
                          <svg className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link href={`/${locale}/profile`} className="hidden sm:flex items-center gap-2 pl-1" style={{ color: "var(--color-text-secondary)" }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {(user.name_ar || user.email)?.[0]?.toUpperCase() || "?"}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="hidden sm:block px-2.5 py-1.5 text-sm rounded-lg transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.backgroundColor = "var(--color-error-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {t("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-xl transition-all"
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

            {/* Mobile hamburger — after all right-side buttons */}
            <button
              className="lg:hidden flex flex-col gap-1 p-2 -mr-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span className="w-5 h-0.5 rounded transition-all duration-200" style={{ background: "var(--color-text)", transform: mobileOpen ? "rotate(45deg) translateY(3px)" : "none" }} />
              <span className="w-5 h-0.5 rounded transition-all duration-200" style={{ background: "var(--color-text)", opacity: mobileOpen ? 0 : 1 }} />
              <span className="w-5 h-0.5 rounded transition-all duration-200" style={{ background: "var(--color-text)", transform: mobileOpen ? "rotate(-45deg) translateY(-3px)" : "none" }} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="pt-2 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                    color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <div className="border-t my-2" style={{ borderColor: "var(--color-border)" }} />
                  <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive(`/${locale}/dashboard`) ? "var(--color-primary-light)" : "transparent",
                      color: isActive(`/${locale}/dashboard`) ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    <span className="text-lg">📊</span>
                    {t("nav.dashboard")}
                  </Link>
                  <Link
                    href={`/${locale}/chat`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive(`/${locale}/chat`) ? "var(--color-primary-light)" : "transparent",
                      color: isActive(`/${locale}/chat`) ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >
                    <span className="text-lg">🤖</span>
                    {t("nav.chat")}
                  </Link>
                </>
              )}
              {user && isAdmin && (
                <>
                  <div className="border-t my-2" style={{ borderColor: "var(--color-border)" }} />
                  <p className="px-4 py-1 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>{t("nav.admin")}</p>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive(link.href) ? "var(--color-primary-light)" : "transparent",
                        color: isActive(link.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      <span className="text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              {user && (
                <>
                  <div className="border-t my-2" style={{ borderColor: "var(--color-border)" }} />
                  <Link href={`/${locale}/profile`} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="text-lg">👤</span>
                    {t("nav.profile")}
                  </Link>
                  <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full" style={{ color: "var(--color-error)" }}>
                    <span className="text-lg">🚪</span>
                    {t("auth.logout")}
                  </button>
                </>
              )}
              {!user && (
                <div className="flex gap-2 px-4 pt-2">
                  <Link href={`/${locale}/login`} className="flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-xl border" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{t("auth.login")}</Link>
                  <Link href={`/${locale}/register`} className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-white rounded-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>{t("auth.register")}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
