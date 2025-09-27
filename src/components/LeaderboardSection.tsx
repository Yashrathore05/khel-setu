import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import TestProgressService from '../services/testProgressService';
import Card from './Card';
import Skeleton from './Skeleton';
import Avatar from './Avatar';

interface LeaderboardSectionProps {
    limit?: number;
    showTitle?: boolean;
    className?: string;
}

export default function LeaderboardSection({ 
    limit = 5, 
    showTitle = true, 
    className = "" 
}: LeaderboardSectionProps) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['leaderboard', { limit }],
        queryFn: () => TestProgressService.getLeaderboardFromResults(limit, {})
    });

    if (isLoading) {
        return (
            <Card className={`p-6 bg-black/40 rounded-2xl shadow-2xl ${className}`}>
                {showTitle && <h3 className="text-lg font-semibold mb-4">Top Performers</h3>}
                <div className="space-y-3">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className={`p-6 bg-black/40 rounded-2xl shadow-2xl ${className}`}>
                {showTitle && <h3 className="text-lg font-semibold mb-4">Top Performers</h3>}
                <div className="text-red-400 text-sm">Failed to load leaderboard.</div>
            </Card>
        );
    }

    return (
        <Card className={`p-6 bg-black/40 rounded-2xl shadow-2xl ${className}`}>
            {showTitle && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Top Performers</h3>
                    <Link 
                        to="/leaderboard" 
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                        View all
                    </Link>
                </div>
            )}
            
            <div className="space-y-3">
                {data && data.length > 0 ? (
                    data.map((row, idx) => (
                        <div key={row.userId} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
                                    {idx + 1}
                                </div>
                                <Avatar name={row.profile?.name || 'Anonymous'} src={row.profile?.avatar} size={32} />
                                <div className="min-w-0">
                                    <div className="font-semibold truncate max-w-[180px]">{row.profile?.name || 'Anonymous'}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[180px]">{row.profile?.region || '—'}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-emerald-400">{Math.round(row.overallProgress)}%</div>
                                <div className="text-xs text-gray-500">{row.completedTests}/{row.totalTests}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 text-sm text-gray-400 text-center">No leaderboard data yet.</div>
                )}
            </div>
        </Card>
    );
}
