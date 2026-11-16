"use client";

import { useState, useEffect } from "react";
import NzemboLogo from "./NzemboLogo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.nzembo.com";

const navLinks = [
  { label: "Exemples", href: "#exemples" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-nzembo-violet/10 shadow-lg shadow-nzembo-violet/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            <NzemboLogo size="sm" />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-nzembo-muted hover:text-white transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href={APP_URL}
              className="text-nzembo-muted hover:text-white transition-colors duration-200 text-sm font-medium"
            >
              Connexion
            </a>
            <a href={APP_URL} className="btn-gradient text-sm py-2.5 px-5">
              Commencer
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white"
            aria-label="Menu"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-nzembo-violet/10">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block text-nzembo-muted hover:text-white transition-colors py-2 text-lg"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-nzembo-violet/20" />
            <a
              href={APP_URL}
              className="block text-nzembo-muted hover:text-white transition-colors py-2"
            >
              Connexion
            </a>
            <a
              href={APP_URL}
              className="btn-gradient text-center block w-full py-3"
            >
              Commencer
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
