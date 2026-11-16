import NzemboLogo from "./NzemboLogo";

export default function Footer() {
  return (
    <footer className="border-t border-nzembo-violet/10 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="text-center md:text-left">
            <NzemboLogo size="sm" />
            <p className="text-nzembo-muted text-sm mt-2">
              Ta musique. Ton histoire. Avec l&apos;IA.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="/privacy" className="text-nzembo-muted hover:text-white transition-colors">
              Confidentialité
            </a>
            <a href="/terms" className="text-nzembo-muted hover:text-white transition-colors">
              CGU
            </a>
            <a
              href="mailto:contact@nzembo.com"
              className="text-nzembo-muted hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-4">
            {[
              { label: "Instagram", path: "M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm4.5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.5-2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" },
              { label: "TikTok", path: "M9 3a1 1 0 0 1 2 0v11a3 3 0 1 1-3-3h1V9H8a5 5 0 1 0 5 5V8.5A7 7 0 0 0 17 10V8a5 5 0 0 1-4-5H9z" },
              { label: "YouTube", path: "M22.54 6.42a2.78 2.78 0 0 0-1.96-1.96C18.88 4 12 4 12 4s-6.88 0-8.58.46a2.78 2.78 0 0 0-1.96 1.96A29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.96 1.96C5.12 20 12 20 12 20s6.88 0 8.58-.46a2.78 2.78 0 0 0 1.96-1.96A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-10 h-10 rounded-full border border-nzembo-violet/20 flex items-center justify-center text-nzembo-muted hover:text-white hover:border-nzembo-violet/50 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 pt-8 border-t border-nzembo-violet/10">
          <p className="text-nzembo-subtle text-sm">
            © 2026 Nzembo. Ta musique, ton histoire.
          </p>
        </div>
      </div>
    </footer>
  );
}
