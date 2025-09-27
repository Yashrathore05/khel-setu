import { Link } from 'react-router-dom';
import NormalTestProgressService from '../services/normalTestProgressService';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';

const ALL_TESTS = [
    { testId: 'test9', testName: 'Sit Ups' },
    { testId: 'test1', testName: 'Height' },
    { testId: 'test2', testName: 'Weight' },
    { testId: 'test3', testName: 'Sit and Reach' },
    { testId: 'test4', testName: 'Standing Vertical Jump' },
    { testId: 'test5', testName: 'Standing Broad Jump' },
    { testId: 'test6', testName: 'Medicine Ball Throw' },
    { testId: 'test7', testName: '30mts Standing Start' },
    { testId: 'test8', testName: '4 X 10 Mts Shuttle Run' },
    { testId: 'test10', testName: '800m / 1.6km Run' },
];

function StatusBadge({ status }: { status: string | undefined }) {
    const styles =
        status === 'completed'
            ? 'bg-green-100 text-green-700'
            : status === 'incomplete'
            ?   'bg-yellow-100 text-yellow-700'
            : status === 'failed'
            ?   'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700';
    return <span className={`rounded px-2 py-0.5 text-xs ${styles}`}>{status || 'not_started'}</span>;
}

function getNormalUserId(): string {
    const key = 'normalUserId';
    let id = localStorage.getItem(key);
    if (!id) {
        id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
    }
    return id;
}

export default function NormalFitnessTestPage() {
    const { user } = useAuth();
    const userId = user?.uid ?? getNormalUserId();
    const summary = useQuery({ queryKey: ['normal.tests.summary', userId], queryFn: () => NormalTestProgressService.getTestSummary(userId), enabled: !!userId });

    if (summary.isLoading) {
        return (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_TESTS.map((t) => {
                const s = summary.data?.find(x => x.testId === t.testId);
                return (
                    <Card key={t.testId}>
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div>
                                <p className="font-medium">{t.testName}</p>
                                <p className="text-xs text-gray-500">{s?.qualityTested || ''}</p>
                            </div>
                            <StatusBadge status={s?.status} />
                        </div>
                        {s?.status === 'completed' ? (
                            <span className="mt-3 inline-block rounded bg-green-600/20 text-green-400 px-3 py-1.5 text-xs sm:text-sm">Completed</span>
                        ) : (
                            <Link to={`/normal-fitness-test/${t.testId}`} className="mt-3 inline-block rounded bg-black px-3 py-2 text-xs sm:text-sm text-white">Start</Link>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}


