import { useEffect, useMemo, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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

function TabLink({ to, label, icon, end }: { to: string; label: string; icon: (isActive: boolean) => ReactNode; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "flex flex-col items-center justify-center gap-1 text-white" : "flex flex-col items-center justify-center gap-1 text-gray-300") }>
      {({ isActive }) => (
        <>
          <div className="h-6 flex items-center justify-center">{icon(isActive)}</div>
          <span className="text-[11px] leading-none">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const hideHeader =
    location.pathname.startsWith("/fitness-test") ||
    location.pathname.startsWith("/fitness-test-break") ||
    location.pathname.startsWith("/login");

  const hideFooter =
    location.pathname.startsWith("/fitness-test") ||
    location.pathname.startsWith("/fitness-test-break") ||
    location.pathname.startsWith("/assessment") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/signup");

  // Language Dropdown State (Indian regional languages only)
  const [langOpen, setLangOpen] = useState(false);
  // Mobile nav removed; keep placeholders avoided to satisfy TS unused
  const [notifOpen, setNotifOpen] = useState(false);
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

  const mockNotifications: Array<{ id: string; title: string; message: string; time: string }> = [
    { id: 'n1', title: 'Assessment Update', message: 'Your SAI assessment is ready to begin.', time: 'Just now' },
    { id: 'n2', title: 'Progress Milestone', message: 'You completed 3/10 fitness tests.', time: '1h ago' },
    { id: 'n3', title: 'Leaderboard', message: 'You moved up 2 places this week!', time: 'Yesterday' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      {/* HEADER */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Khel Setu" className="h-12 sm:h-14 w-12 sm:w-14 rounded-full object-cover border border-white/20 shadow-lg drop-shadow-[0_2px_10px_rgba(59,130,246,0.35)]" />
            <span className="text-lg sm:text-2xl font-extrabold tracking-wide">Khel Setu</span>
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-sm">
            <NavLink to="/" end className={({ isActive }) => navClasses(isActive)}>
              Home
            </NavLink>
            <NavLink to="/chatbot" className={({ isActive }) => navClasses(isActive)}>
              Chatbot
            </NavLink>
            <NavLink to="/normal-fitness-test" className={({ isActive }) => navClasses(isActive)}>
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
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-white/10 text-gray-200"
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{mockNotifications.length}</span>
              </button>
              {notifOpen && (
                <>
                  {/* Desktop/Tablet dropdown */}
                  <div className="hidden sm:block absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-black/90 border border-white/10 shadow-lg backdrop-blur-md z-50">
                    <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-sm font-semibold">Notifications</span>
                      <button onClick={() => setNotifOpen(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
                    </div>
                    <div className="max-h-80 overflow-auto">
                      {mockNotifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-white/5">
                          <div className="text-sm font-semibold">{n.title}</div>
                          <div className="text-xs text-gray-300 mt-0.5">{n.message}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{n.time}</div>
                        </div>
                      ))}
                      {mockNotifications.length === 0 && (
                        <div className="px-4 py-6 text-sm text-gray-400">No notifications</div>
                      )}
                    </div>
                  </div>

                  {/* Mobile centered overlay */}
                  <div
                    className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-start justify-center pt-16 px-4"
                    onClick={() => setNotifOpen(false)}
                  >
                    <div
                      className="w-full max-w-sm rounded-2xl bg-black/90 border border-white/10 shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                        <span className="text-sm font-semibold">Notifications</span>
                        <button onClick={() => setNotifOpen(false)} className="text-xs text-gray-400 hover:text-white">Close</button>
                      </div>
                      <div className="max-h-80 overflow-auto">
                        {mockNotifications.map((n) => (
                          <div key={n.id} className="px-4 py-3 hover:bg-white/5">
                            <div className="text-sm font-semibold">{n.title}</div>
                            <div className="text-xs text-gray-300 mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-gray-500 mt-1">{n.time}</div>
                          </div>
                        ))}
                        {mockNotifications.length === 0 && (
                          <div className="px-4 py-6 text-sm text-gray-400">No notifications</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
                <Link to="/profile" aria-label="Profile" className="rounded-full focus:outline-none focus:ring-2 focus:ring-white/30">
                  <Avatar name={user.displayName || user.email || "User"} size={36} />
                </Link>
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
        {/* Mobile nav panel removed in favor of bottom navbar */}
      </header>
      )}

      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8 page-fade">{children}</main>
      {!hideHeader && <div className="h-16 md:hidden" />}

      {/* BOTTOM NAVBAR (mobile only) */}
      {!hideHeader && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="mx-auto max-w-6xl px-4 py-2 grid grid-cols-5 gap-1">
          <TabLink to="/" end label="Home" icon={(isActive) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-white" : "text-gray-300"}><path d="M3 9l9-7 9 7"/><path d="M9 22V12h6v10"/></svg>
          )} />
          <TabLink to="/chatbot" label="Chat" icon={(isActive) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-white" : "text-gray-300"}><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
          )} />
          <TabLink to="/normal-fitness-test" label="Fitness" icon={(isActive) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-white" : "text-gray-300"}>
              <path d="M6 7v10"/>
              <path d="M18 7v10"/>
              <rect x="8" y="9" width="8" height="6" rx="1"/>
            </svg>
          )} />
          <TabLink to="/progress" label="Progress" icon={(isActive) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-white" : "text-gray-300"}><path d="M8 21V10"/><path d="M12 21V3"/><path d="M16 21v-6"/></svg>
          )} />
          <TabLink to="/profile" label="Profile" icon={(isActive) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isActive ? "text-white" : "text-gray-300"}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
          )} />
        </div>
      </nav>
      )}

      {/* FOOTER */}
      {!hideFooter && (
      <footer className="mt-8 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Khel Setu</span>
          <span className="hidden sm:inline">Developed by Code Sprinters team</span>
        </div>
      </footer>
      )}
    </div>
  );
}
