import { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n";

function navClasses(isActive: boolean) {
  return isActive
    ? "px-3 py-2 rounded-lg text-white font-semibold bg-white/10"
    : "px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition";
}

// Dark mode hook was unused; removing to satisfy noUnusedLocals

export default function AppLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  // Language Dropdown State (Indian regional languages only)
  const [langOpen, setLangOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { i18n } = useTranslation();
  const languageOptions = useMemo(
    () => [
      { code: "en", label: "English" },
      { code: "hi", label: "हिन्दी" },
      { code: "bn", label: "বাংলা" },
      { code: "mr", label: "मराठी" },
      { code: "te", label: "తెలుగు" },
      { code: "kn", label: "ಕನ್ನಡ" },
      { code: "gu", label: "ગુજરાતી" },
      { code: "pa", label: "ਪੰਜਾਬੀ" },
    ],
    []
  );
  const [currentLang, setCurrentLang] = useState<string>(() => {
    const initial = (localStorage.getItem("khel_setu_language") || i18n.language || "hi").split("-")[0];
    const found = languageOptions.find((l) => l.code === initial);
    return found ? found.label : "हिन्दी";
  });
  useEffect(() => {
    const code = (i18n.language || "hi").split("-")[0];
    const found = languageOptions.find((l) => l.code === code);
    if (found) setCurrentLang(found.label);
  }, [i18n.language, languageOptions]);
  const handleLangSelect = (code: string) => {
    const found = languageOptions.find((l) => l.code === code);
    if (found) setCurrentLang(found.label);
    setLangOpen(false);
    changeLanguage(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Khel Setu" className="h-8 w-auto" />
            <span className="hidden sm:inline text-lg font-bold tracking-wide">
              Khel Setu
            </span>
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm">
            <NavLink to="/" end className={({ isActive }) => navClasses(isActive)}>
              Home
            </NavLink>
            <NavLink to="/chatbot" className={({ isActive }) => navClasses(isActive)}>
              Chatbot
            </NavLink>
            <NavLink to="/fitness-test" className={({ isActive }) => navClasses(isActive)}>
              Fitness Test
            </NavLink>
            <NavLink to="/progress" className={({ isActive }) => navClasses(isActive)}>
              Progress
            </NavLink>
            <NavLink to="/events" className={({ isActive }) => navClasses(isActive)}>
              Events
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => navClasses(isActive)}>
              Leaderboard
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => navClasses(isActive)}>
              Profile
            </NavLink>
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Mobile hamburger */}
            <button
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            {/* LANGUAGE DROPDOWN */}
            <div className="relative hidden xs:block">
              <button
                onClick={() => setLangOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition text-gray-300"
              >
                <Globe size={18} />
                <span className="hidden sm:inline">{currentLang}</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-black/90 border border-white/10 shadow-lg backdrop-blur-md z-50">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleLangSelect(opt.code)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${
                        currentLang === opt.label ? "text-white font-semibold" : "text-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DARK MODE TOGGLE REMOVED */}

            {/* USER AUTH */}
            {user ? (
              <div className="flex items-center gap-3">
                <Avatar name={user.displayName || user.email || "User"} size={36} />
                <Button
                  onClick={logout}
                  size="sm"
                  className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg px-3 sm:px-4 py-2 border border-white/20 hover:bg-white/10 transition text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
        {/* Mobile nav panel */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
            <div className="px-3 py-3 grid gap-1.5 text-sm">
              <NavLink onClick={() => setMobileNavOpen(false)} to="/" end className={({ isActive }) => navClasses(isActive)}>
                Home
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/chatbot" className={({ isActive }) => navClasses(isActive)}>
                Chatbot
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/fitness-test" className={({ isActive }) => navClasses(isActive)}>
                Fitness Test
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/progress" className={({ isActive }) => navClasses(isActive)}>
                Progress
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/events" className={({ isActive }) => navClasses(isActive)}>
                Events
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/leaderboard" className={({ isActive }) => navClasses(isActive)}>
                Leaderboard
              </NavLink>
              <NavLink onClick={() => setMobileNavOpen(false)} to="/profile" className={({ isActive }) => navClasses(isActive)}>
                Profile
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8 page-fade">{children}</main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Khel Setu</span>
          <span className="hidden sm:inline">Developed by Code Sprinters team</span>
        </div>
      </footer>
    </div>
  );
}
