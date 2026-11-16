"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import NzemboLogo from "./NzemboLogo";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Accueil",
    href: "/",
    svg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
  },
  {
    label: "Créer",
    href: "/create",
    svg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
    ),
  },
  {
    label: "Mes chansons",
    href: "/songs",
    svg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
      </svg>
    ),
  },
  {
    label: "Crédits",
    href: "/credits",
    svg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 6-8 14L4 8l8-6zm0 0v20m8-14H4"/>
      </svg>
    ),
  },
  {
    label: "Profil",
    href: "/profile",
    svg: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
      </svg>
    ),
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nzembo_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("nzembo_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("nzembo_theme", "light");
    }
  };

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAFC] dark:bg-nzembo-night text-slate-800 dark:text-white transition-colors">
      {/* Desktop Sidebar (Fixe w-64) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-nzembo-dark border-r border-slate-200 dark:border-nzembo-violet/15 h-screen fixed top-0 left-0 z-40 transition-colors">
        {/* Header Logo + Dark Mode Button */}
        <div className="p-6 border-b border-slate-100 dark:border-nzembo-violet/15 flex items-center justify-between">
          <Link href="/">
            <NzemboLogo size="sm" />
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-nzembo-card transition-colors"
            title="Basculer le thème"
          >
            {isDark ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Minimalist SVG Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  active
                    ? "bg-purple-50 dark:bg-gradient-to-r dark:from-nzembo-violet/25 dark:to-nzembo-cyan/15 border border-purple-200/80 dark:border-nzembo-violet/30 text-nzembo-violet dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-nzembo-card/40"
                }`}
              >
                <span className={active ? "text-nzembo-violet dark:text-nzembo-cyan" : ""}>{item.svg}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card in Sidebar (NO RETURN LINK - Modification 3) */}
        <div className="p-4 border-t border-slate-100 dark:border-nzembo-violet/15">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-nzembo-card/50 rounded-xl border border-slate-200/80 dark:border-nzembo-violet/15">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-nzembo-violet to-nzembo-cyan flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
              U
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">Utilisateur Démo</p>
              <p className="text-[11px] text-nzembo-violet dark:text-nzembo-cyan font-medium">3 crédits restants</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 dark:bg-nzembo-dark/90 backdrop-blur-xl border-b border-slate-200 dark:border-nzembo-violet/15 px-4 h-14 flex items-center justify-between transition-colors">
          <Link href="/">
            <span className="font-brand font-bold text-lg gradient-text">NZEMBO</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <button onClick={toggleDarkMode} className="p-2 text-slate-600 dark:text-slate-300">
              {isDark ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              href="/credits"
              className="text-xs px-2.5 py-1 rounded-full bg-nzembo-violet/10 border border-nzembo-violet/20 text-nzembo-violet dark:text-nzembo-cyan font-semibold flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l8 6-8 14L4 8l8-6zm0 0v20m8-14H4"/></svg>
              <span>3</span>
            </Link>
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-nzembo-violet to-nzembo-cyan flex items-center justify-center text-xs font-bold text-white shadow-sm"
            >
              U
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pb-24 lg:pb-12 max-w-2xl mx-auto w-full px-4 pt-6 sm:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Minimalist SVG Icons) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-nzembo-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-nzembo-violet/15 h-16 flex items-center justify-around px-2 pb-1 transition-colors">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const isCreate = item.href === "/create";

          if (isCreate) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-6"
              >
                <div className="w-13 h-13 p-3.5 rounded-2xl bg-gradient-to-tr from-nzembo-violet to-nzembo-cyan text-white shadow-lg shadow-nzembo-violet/30 hover:scale-105 active:scale-95 transition-transform">
                  {item.svg}
                </div>
                <span className="text-[10px] font-bold text-nzembo-violet dark:text-white mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                active
                  ? "text-nzembo-violet dark:text-nzembo-cyan font-bold"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {item.svg}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
