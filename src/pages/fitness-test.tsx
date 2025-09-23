import { Link } from 'react-router-dom';
import TestProgressService from '../services/testProgressService';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import FitnessRegistrationForm from '../components/FitnessRegistrationForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firestore';

const ALL_TESTS = [
	{ testId: 'test1', testName: 'Height' },
	{ testId: 'test2', testName: 'Weight' },
	{ testId: 'test3', testName: 'Sit and Reach' },
	{ testId: 'test4', testName: 'Standing Vertical Jump' },
	{ testId: 'test5', testName: 'Standing Broad Jump' },
	{ testId: 'test6', testName: 'Medicine Ball Throw' },
	{ testId: 'test7', testName: '30mts Standing Start' },
	{ testId: 'test8', testName: '4 X 10 Mts Shuttle Run' },
	{ testId: 'test9', testName: 'Sit Ups' },
	{ testId: 'test10', testName: '800m / 1.6km Run' },
];

function StatusBadge({ status }: { status: string | undefined }) {
	const styles =
		status === 'completed'
			? 'bg-green-100 text-green-700'
			: status === 'incomplete'
			?	'bg-yellow-100 text-yellow-700'
			: status === 'failed'
			?	'bg-red-100 text-red-700'
			: 'bg-gray-100 text-gray-700';
	return <span className={`rounded px-2 py-0.5 text-xs ${styles}`}>{status || 'not_started'}</span>;
}

export default function FitnessTestPage() {
	const { user } = useAuth();
	const userId = user!.uid;
    const summary = useQuery({ queryKey: ['tests.summary', userId], queryFn: () => TestProgressService.getTestSummary(userId), enabled: !!userId });
    const registration = useQuery({
        queryKey: ['fitness.registration', userId],
        queryFn: async () => {
            const ref = doc(db, 'fitnessRegistrations', userId);
            const snap = await getDoc(ref);
            return snap.exists() ? (snap.data() as any) : null;
        },
        enabled: !!userId,
    });

    if (!registration.data?.completed) {
        return (
            <FitnessRegistrationForm userId={userId} onCompleted={() => registration.refetch()} />
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{ALL_TESTS.map((t) => {
				const s = summary.data?.find(x => x.testId === t.testId);
				return (
					<Card key={t.testId}>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="font-medium">{t.testName}</p>
								<p className="text-xs text-gray-500">{s?.qualityTested || ''}</p>
							</div>
							<StatusBadge status={s?.status} />
						</div>
                        {s?.status === 'completed' ? (
                            <span className="mt-3 inline-block rounded bg-green-600/20 text-green-400 px-3 py-1.5 text-sm">Completed</span>
                        ) : (
                            <Link to={`/fitness-test/${t.testId}`} className="mt-3 inline-block rounded bg-black px-3 py-1.5 text-sm text-white">Start</Link>
                        )}
					</Card>
				);
			})}
		</div>
	);
}
