import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
// styles temporarily disabled until verified: import './index.css';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/index';
import ChatbotPage from './pages/chatbot';
import FitnessTestPage from './pages/fitness-test';
import FitnessTestDetailPage from './pages/fitness-test-detail';
import NormalFitnessTestPage from './pages/normal-fitness-test';
import NormalFitnessTestDetailPage from './pages/normal-fitness-test-detail';
import EventsPage from './pages/events';
import ProfilePage from './pages/profile';
import LoginPage from './pages/login';
import SignupPage from './pages/signup';
import LeaderboardPage from './pages/leaderboard';
import ProgressPage from './pages/progress';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import QueryProvider from './providers/QueryProvider';

function AppInner() {
    const [showLoader, setShowLoader] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    const { loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading) {
            setFadeOut(true);
            const t = window.setTimeout(() => setShowLoader(false), 250);
            return () => window.clearTimeout(t);
        }
    }, [authLoading]);

    return (
        <BrowserRouter>
            <div className="relative">
                {showLoader && (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-black via-black/95 to-black/90 ${fadeOut ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-sm flex items-center justify-center shadow-xl">
                                    <img src="/images/logo.png" alt="Khel Setu logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
                                </div>
                                <div className="absolute inset-0 -z-10 animate-ping-slow rounded-3xl bg-blue-500/10"></div>
                            </div>
                            <div className="relative">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white/20 border-t-blue-500/70 animate-spin"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm sm:text-base text-gray-300">Loading Khel Setu</p>
                                <p className="mt-1 text-[11px] sm:text-xs text-gray-500">Optimizing for athletes and sports aspirants</p>
                            </div>
                        </div>
                    </div>
                )}
                <AppLayout>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                        <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />
                        <Route path="/fitness-test" element={<ProtectedRoute><FitnessTestPage /></ProtectedRoute>} />
                        <Route path="/fitness-test/:id" element={<ProtectedRoute><FitnessTestDetailPage /></ProtectedRoute>} />
                        <Route path="/normal-fitness-test" element={<NormalFitnessTestPage />} />
                        <Route path="/normal-fitness-test/:id" element={<NormalFitnessTestDetailPage />} />
                        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
                        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    </Routes>
                </AppLayout>
            </div>
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <QueryProvider>
            <AuthProvider>
                <AppInner />
            </AuthProvider>
        </QueryProvider>
    );
}
