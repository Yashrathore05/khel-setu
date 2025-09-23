import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import TestProgressService from '../services/testProgressService';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import Avatar from '../components/Avatar';

export default function LeaderboardPage() {
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | ''>('');
    const [region, setRegion] = useState('');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');

    const filters = useMemo(() => ({
        gender: gender || undefined,
        level: level || undefined,
        region: region || undefined,
        minAge: minAge ? Number(minAge) : undefined,
        maxAge: maxAge ? Number(maxAge) : undefined,
    }), [gender, level, region, minAge, maxAge]);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ['leaderboard', filters],
        queryFn: () => TestProgressService.getLeaderboardFromResults(50, filters)
    });

    if (isLoading) {
        return (
            <div className="grid gap-4">
                <Skeleton className="h-10 w-52" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-400">Failed to load leaderboard.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">Leaderboard</h1>
                    <p className="text-sm text-gray-400">Top athletes by overall score</p>
                </div>
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex flex-col text-xs text-gray-400">
                        <label className="mb-1">Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="flex flex-col text-xs text-gray-400">
                        <label className="mb-1">Level</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm">
                            <option value="">All</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>
                    <div className="flex flex-col text-xs text-gray-400">
                        <label className="mb-1">Region</label>
                        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Delhi" className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex flex-col text-xs text-gray-400">
                            <label className="mb-1">Min Age</label>
                            <input type="number" min={0} value={minAge} onChange={(e) => setMinAge(e.target.value)} className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="flex flex-col text-xs text-gray-400">
                            <label className="mb-1">Max Age</label>
                            <input type="number" min={0} value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <button onClick={() => refetch()} className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-sm">Apply</button>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden">
                {/* Desktop table */}
                <div className="hidden sm:block divide-y divide-white/10">
                    <div className="grid grid-cols-12 px-4 py-3 text-sm text-gray-400">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Athlete</div>
                        <div className="col-span-3 text-right">Completed</div>
                        <div className="col-span-3 text-right">Progress%</div>
                    </div>
                    {isFetching && (
                        <div className="px-4 py-3 space-y-2">
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                            <Skeleton className="h-10" />
                        </div>
                    )}
                    {data && data.length > 0 ? (
                        data.map((row, idx) => (
                            <div key={row.userId} className="grid grid-cols-12 px-4 py-3 items-center">
                                <div className="col-span-1 text-gray-400 font-medium">{idx + 1}</div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <Avatar name={row.profile?.name || 'Anonymous'} src={row.profile?.avatar} size={32} />
                                    <div>
                                        <div className="font-semibold">{row.profile?.name || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-500">{row.profile?.region || '—'}</div>
                                    </div>
                                </div>
                                <div className="col-span-3 text-right font-semibold">{row.completedTests}/{row.totalTests}</div>
                                <div className="col-span-3 text-right text-emerald-400">{Math.round(row.overallProgress)}%</div>
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-6 text-sm text-gray-400">No data matches the selected filters.</div>
                    )}
                </div>
                {/* Mobile list */}
                <div className="sm:hidden divide-y divide-white/10">
                    {isFetching && (
                        <div className="px-3 py-3 space-y-2">
                            <Skeleton className="h-9" />
                            <Skeleton className="h-9" />
                            <Skeleton className="h-9" />
                        </div>
                    )}
                    {data && data.length > 0 ? (
                        data.map((row, idx) => (
                            <div key={row.userId} className="px-3 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-5 text-gray-400 shrink-0">{idx + 1}</div>
                                    <Avatar name={row.profile?.name || 'Anonymous'} src={row.profile?.avatar} size={28} />
                                    <div className="min-w-0">
                                        <div className="font-semibold truncate max-w-[160px]">{row.profile?.name || 'Anonymous'}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[160px]">{row.profile?.region || '—'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400">{row.completedTests}/{row.totalTests}</div>
                                    <div className="text-sm font-semibold text-emerald-400">{Math.round(row.overallProgress)}%</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-4 text-sm text-gray-400">No data matches the selected filters.</div>
                    )}
                </div>
            </Card>
        </div>
    );
}


