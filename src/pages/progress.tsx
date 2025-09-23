import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import TestProgressService from '../services/testProgressService';
import { useAuth } from '../contexts/AuthContext';
import { generateChat } from '../services/geminiService';
import { Link } from 'react-router-dom';

export default function ProgressPage() {
    const { user } = useAuth();
    const userId = user?.uid || '';
    const hasGeminiKey = Boolean((import.meta as any).env?.VITE_GEMINI_API_KEY);

    const progressQuery = useQuery({
        queryKey: ['fitness.progress', userId],
        queryFn: () => TestProgressService.getTestProgress(userId),
        enabled: !!userId,
    });

    const strengths = useMemo(() => {
        const results = progressQuery.data?.testResults || [];
        // Heuristic: completed tests with better-than-median style proxy based on known qualities
        const byQuality: Record<string, number> = {};
        results.forEach(r => {
            if (r.status !== 'completed') return;
            const key = (r.testName || '').toLowerCase();
            if (!key) return;
            byQuality[key] = (byQuality[key] || 0) + 1;
        });
        const entries = Object.entries(byQuality).sort((a, b) => b[1] - a[1]);
        return entries.slice(0, 3).map(([k]) => k);
    }, [progressQuery.data]);

    const aiRecommendationsQuery = useQuery({
        queryKey: ['ai.recommendations', userId, strengths, progressQuery.data?.overallProgress],
        enabled: !!userId && !!progressQuery.data && hasGeminiKey && (progressQuery.data?.testResults?.some(r => r.status === 'completed') ?? false),
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        queryFn: async () => {
            const progress = progressQuery.data!;
            const completed = progress.testResults.filter(r => r.status === 'completed');
            const lines = completed.slice(0, 12).map(r => `${r.testName}: ${r.result ?? '-'} ${r.unit ?? ''}`.trim());
            const prompt = [
                'You are Khel Setu Coach. Generate a concise, fully-personalized plan based ONLY on the actual test data provided. Do NOT ask clarifying questions. If a piece of data is missing, infer conservatively and proceed.',
                '',
                `User overall progress: ${Math.round(progress.overallProgress)}%`,
                `Completed tests: ${completed.length}/${progress.totalTests}`,
                strengths.length ? `Observed strengths (rough): ${strengths.join(', ')}` : 'Observed strengths: none detected',
                'Test results:',
                ...lines,
                '',
                'Output format:',
                '- Top 3 Strengths: 3 bullets',
                '- Score Interpretation: 2 short bullets',
                '- 7-Day Plan: bullets per day with sets/reps/time (metric), minimal equipment',
                '- Recovery & Injury Prevention: 3 bullets',
                'Tone: supportive, specific, actionable. Keep under 1800 characters.'
            ].join('\n');
            const text = await generateChat([
                { role: 'system', content: '' },
                { role: 'user', content: prompt },
            ]);
            return text;
        }
    });

    if (progressQuery.isLoading) {
        return (
            <div className="grid gap-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24" />
                <Skeleton className="h-40" />
            </div>
        );
    }

    if (progressQuery.isError) {
        return <div className="text-red-400">Failed to load progress.</div>;
    }

    const progress = progressQuery.data!;
    const overall = Math.round(progress.overallProgress);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Progress</h1>
                <p className="text-sm text-gray-400">Your scores, strengths and AI recommendations</p>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl">
                    <h3 className="text-lg font-semibold">Overall Score</h3>
                    <div className="mt-4">
                        <div className="h-3 w-full bg-white/10 rounded-full">
                            <div className="h-3 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full" style={{ width: `${Math.min(overall, 100)}%` }} />
                        </div>
                        <div className="mt-2 text-3xl font-bold">{overall}%</div>
                        <div className="text-sm text-gray-400">Completed {progress.completedTests} of {progress.totalTests} tests</div>
                    </div>
                </Card>

                <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl">
                    <h3 className="text-lg font-semibold">Top Strengths</h3>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                        {strengths.length ? strengths.map(s => (
                            <div key={s} className="px-3 py-2 rounded-lg bg-white/5 text-sm">{capitalize(s)}</div>
                        )) : (
                            <div className="text-sm text-gray-400">Not enough data yet.</div>
                        )}
                    </div>
                </Card>

                <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl">
                    <h3 className="text-lg font-semibold">Focus Areas</h3>
                    <div className="mt-4 text-sm text-gray-300">
                        {overall < 40 && 'Getting started: build consistency with 3 short sessions/week.'}
                        {overall >= 40 && overall < 70 && 'Solid base: improve form, add progressive overload and intervals.'}
                        {overall >= 70 && 'Advanced: refine technique and recovery to break plateaus.'}
                    </div>
                </Card>
            </div>

            <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-semibold">AI Recommendations</h3>
                    {aiRecommendationsQuery.isFetching && <span className="text-xs text-gray-400">Updating…</span>}
                </div>
                {!hasGeminiKey && (
                    <div className="text-sm text-amber-400">
                        Gemini API key missing. Add VITE_GEMINI_API_KEY to your .env and restart the dev server.
                    </div>
                )}
                {hasGeminiKey && progress.testResults.filter(r => r.status === 'completed').length === 0 && (
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-gray-300">No completed test data yet. Get a personalized plan via chat.</div>
                        <Link to="/chatbot" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Get personalized recommendation</Link>
                    </div>
                )}
                {aiRecommendationsQuery.isLoading && (
                    <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded" />
                        <div className="h-4 bg-white/5 rounded" />
                        <div className="h-4 bg-white/5 rounded" />
                    </div>
                )}
                {aiRecommendationsQuery.isError && (
                    <div className="text-sm text-red-400">Failed to get AI recommendations. Check API key and network access.</div>
                )}
                {aiRecommendationsQuery.data && (
                    <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap text-sm">
                        {aiRecommendationsQuery.data}
                    </div>
                )}
            </Card>

            <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl overflow-x-auto">
                <h3 className="text-lg font-semibold mb-3">Recent Results</h3>
                <div className="hidden sm:block divide-y divide-white/10">
                    {progress.testResults.slice(0, 10).map(r => (
                        <div key={r.testId} className="py-3 grid grid-cols-12 items-center text-sm">
                            <div className="col-span-6 truncate">{r.testName}</div>
                            <div className="col-span-3 text-gray-400">{r.status}</div>
                            <div className="col-span-3 text-right">{r.unit ? `${r.result ?? '-'} ${r.unit}` : ''}</div>
                        </div>
                    ))}
                    {progress.testResults.length === 0 && (
                        <div className="py-3 text-sm text-gray-400">No results yet.</div>
                    )}
                </div>
                <div className="sm:hidden divide-y divide-white/10">
                    {progress.testResults.slice(0, 10).map(r => (
                        <div key={r.testId} className="py-3 flex items-center justify-between gap-3 text-sm">
                            <div className="min-w-0">
                                <div className="font-medium truncate max-w-[180px]">{r.testName}</div>
                                <div className="text-xs text-gray-400">{r.status}</div>
                            </div>
                            <div className="text-right">{r.unit ? `${r.result ?? '-'} ${r.unit}` : ''}</div>
                        </div>
                    ))}
                    {progress.testResults.length === 0 && (
                        <div className="py-3 text-sm text-gray-400">No results yet.</div>
                    )}
                </div>
            </Card>
        </div>
    );
}

function capitalize(s: string) {
    return s.slice(0, 1).toUpperCase() + s.slice(1);
}


