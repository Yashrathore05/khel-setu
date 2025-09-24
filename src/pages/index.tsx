import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Badge, { LottieBadge } from '../components/Badge';
import { useDashboardData } from '../hooks/useDashboardData';
import { Trophy, Clock, TrendingUp, User } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import TestProgressService from '../services/testProgressService';
import Avatar from '../components/Avatar';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';

export default function HomePage() {
  const { t } = useTranslation();
  const { profile, progress, fitnessSummary, badges, testProgress } = useDashboardData();
  const DEFAULT_TOTAL_TESTS = 10;
  const totalTests = fitnessSummary.data?.length ?? DEFAULT_TOTAL_TESTS;
  const completedCount = fitnessSummary.data?.filter((s: any) => s.status === 'completed').length ?? 0;
  const pendingCount = Math.max(0, totalTests - completedCount);

  // Example sparkline data (replace with real trend data if available)
  const sparklineData = (value: number | null) => Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    value: value ? Math.max(0, value - i * 2 + Math.random() * 4) : 0,
  }));

  const overall = progress.data?.overallScore ?? testProgress.data?.overallProgress ?? 0;
  const benchmarkValue = progress.data?.benchmark ?? Math.round((testProgress.data?.completedTests ?? 0) / (testProgress.data?.totalTests || DEFAULT_TOTAL_TESTS) * 100);
  const improvementValue = progress.data?.improvement ?? 0;

  const progressItems = [
    { label: t('overallScore'), value: overall, icon: <Trophy size={20} className="text-yellow-400" />, suffix: '%', sparkline: sparklineData(overall) },
    { label: t('benchmark'), value: benchmarkValue, icon: <Clock size={20} className="text-blue-400" />, suffix: '%', sparkline: sparklineData(benchmarkValue) },
    { label: t('improvement'), value: improvementValue, icon: <TrendingUp size={20} className="text-green-400" />, suffix: '%', sparkline: sparklineData(improvementValue) },
  ];

  const isLoadingDashboard = profile.isLoading || progress.isLoading || testProgress.isLoading;

  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
      {/* Welcome & Progress */}
      <Link to="/progress" className="lg:col-span-2 group block">
        <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl backdrop-blur-sm group-hover:scale-[1.01] transition-transform">
          {isLoadingDashboard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56 mt-2" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{`${t('welcomeBack')} ${profile.data?.name || ''}`}</h2>
                  <p className="text-gray-400 mt-1">{t('progressTracking')}</p>
                </div>
                <User size={40} className="text-gray-300" />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {progressItems.map((item) => (
                  <div key={item.label} className="p-5 bg-gray-900/50 rounded-xl shadow-inner flex flex-col items-center w-full">
                    {item.icon}
                    <p className="text-gray-400 text-sm mt-2">{item.label}</p>
                    <p className="text-3xl font-bold mt-1">{item.value}{item.suffix || ''}</p>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full mt-3">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transition-all"
                        style={{ width: `${Math.min(Number(item.value) || 0, 100)}%` }}
                      />
                    </div>

                    {/* Sparkline chart */}
                    <div className="w-full mt-3 h-12">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={item.sparkline}>
                          <Line type="monotone" dataKey="value" stroke="url(#grad)" strokeWidth={2} dot={false} />
                          <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#34d399" />
                              <stop offset="100%" stopColor="#3b82f6" />
                            </linearGradient>
                          </defs>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </Link>

      {/* Profile */}
      <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl hover:scale-[1.01] transition-transform">
        <h3 className="text-lg font-semibold mb-4">{t('profile')}</h3>
        {profile.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <div className="space-y-3 text-gray-300 text-sm">
            <p><span className="text-gray-500">{t('name')}:</span> {profile.data?.name ?? '-'}</p>
            <p><span className="text-gray-500">{t('email')}:</span> {profile.data?.email ?? '-'}</p>
            <p><span className="text-gray-500">{t('level')}:</span> {profile.data?.level ?? '-'}</p>
          </div>
        )}
      </Card>

      {/* Leaderboard (Preview) */}
      <LeaderboardPreviewCard />

      {/* Normal User Fitness Test (no registration) */}
      <Link to="/normal-fitness-test" className="lg:col-span-2 group block">
        <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl backdrop-blur-sm group-hover:scale-[1.01] transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Quick Fitness Test</h3>
              <p className="text-gray-400 text-sm mt-1">No registration required. Try the tests instantly.</p>
            </div>
            <Badge>Start</Badge>
          </div>
        </Card>
      </Link>

      {/* Pending Tests */}
      <Card className="lg:col-span-2 p-6 bg-black/40 rounded-2xl shadow-2xl hover:scale-[1.01] transition-transform overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('pendingTests')}</h3>
          <span className="text-sm text-gray-400">{pendingCount}/{totalTests}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fitnessSummary.data?.filter((s: any) => s.status !== 'completed').slice(0, 6).map((s: any) => (
            <div key={s.testId} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl hover:shadow-lg transition flex flex-col justify-between">
              <p className="font-medium mb-2">{s.testName}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 capitalize">{s.qualityTested || ''}</p>
                <Badge variant="outline">{t('pending')}</Badge>
              </div>
            </div>
          )) || <p className="text-sm text-gray-500">{t('noData')}</p>}
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl hover:scale-[1.01] transition-transform">
        <h3 className="text-lg font-semibold mb-4">{t('badges')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-0 gap-6 md:gap-0">
          {badges.data?.length ? badges.data.slice(0, 4).map((b, idx) => {
            const categoryKey = (b.category || '').toString().toLowerCase();
            const animationPathMap: Record<string, string> = {
              strength: '/athlete.json',
              athlete: '/athlete.json',
              training: '/training.json',
              endurance: '/training.json',
            };
            const jsonPath = animationPathMap[categoryKey] || (idx % 2 === 0 ? '/athlete.json' : '/training.json');
            return (
              <div key={b.id} className="flex flex-col items-center text-white">
                <LottieBadge
                  name={b.name}
                  jsonPath={jsonPath}
                  hideLabel
                  size="xl"
                  className="flex flex-col items-center"
                  containerClassName="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
                />
                <div className="mt-3 text-center">
                  <p className="font-semibold text-sm sm:text-base">{b.name}</p>
                  <p className="text-[11px] sm:text-xs capitalize text-gray-200/80">{b.category}</p>
                </div>
              </div>
            );
          }) : <p className="text-sm text-gray-500">{t('noData')}</p>}
        </div>
      </Card>

      {/* Completed Tests */}
      <Card className="lg:col-span-3 p-6 bg-black/40 rounded-2xl shadow-2xl hover:scale-[1.01] transition-transform">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('completedTests')}</h3>
          <span className="text-sm text-gray-400">{completedCount}/{totalTests}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fitnessSummary.data?.filter((s: any) => s.status === 'completed').slice(0, 8).map((s: any) => (
            <div key={s.testId} className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl flex flex-col justify_between">
              <p className="font-medium mb-1">{s.testName}</p>
              <p className="text-xs text-gray-400">{s.unit ? `Result: ${s.result ?? '-'} ${s.unit}` : ''}</p>
            </div>
          )) || <p className="text-sm text-gray-500">{t('noData')}</p>}
        </div>
      </Card>
    </div>
  );
}

function LeaderboardPreviewCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', { limit: 5 }],
    queryFn: () => TestProgressService.getLeaderboardFromResults(5, {} as any)
  });

  return (
    <Card className="p-6 bg-black/40 rounded-2xl shadow-2xl hover:scale-[1.01] transition-transform">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Leaderboard</h3>
        <Link to="/leaderboard" className="text-sm text-blue-400 hover:underline">View all</Link>
      </div>
      {isLoading && (
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded" />
          <div className="h-4 bg-white/5 rounded" />
          <div className="h-4 bg-white/5 rounded" />
        </div>
      )}
      {isError && (
        <div className="text-sm text-red-400">Failed to load leaderboard.</div>
      )}
      {!isLoading && !isError && (
        <div className="divide-y divide-white/10">
          {(data && data.length > 0 ? data : []).map((row: any, idx: number) => (
            <div key={row.userId} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 text-gray-400 shrink-0">{idx + 1}</div>
                <Avatar name={row.profile?.name || 'Anonymous'} src={row.profile?.avatar} size={32} />
                <div className="min-w-0">
                  <div className="font-semibold truncate max-w-[200px]">{row.profile?.name || 'Anonymous'}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{row.profile?.region || '—'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-emerald-400">{Math.round(row.overallProgress)}%</div>
                <div className="text-[11px] text-gray-500">{row.completedTests}/{row.totalTests}</div>
              </div>
            </div>
          ))}
          {(!data || data.length === 0) && (
            <div className="py-4 text-sm text-gray-400">No leaderboard data yet.</div>
          )}
        </div>
      )}
    </Card>
  );
}
