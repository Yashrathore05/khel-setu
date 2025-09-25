import { Link } from 'react-router-dom';
import { useState } from 'react';
import TestProgressService from '../services/testProgressService';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import Input from '../components/Input';
import Button from '../components/Button';

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

export default function AssessmentPage() {
    const { user } = useAuth();
    const userId = user!.uid;
    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [mode, setMode] = useState<'choose'|'register'|'credsShown'|'disclaimer'>(() => hasAccess ? 'choose' : 'choose');
    const [generated, setGenerated] = useState<{ username: string; password: string } | null>(() => {
        try {
            const raw = localStorage.getItem('sai_assessment_creds');
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    });
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const summary = useQuery({ queryKey: ['tests.summary', userId], queryFn: () => TestProgressService.getTestSummary(userId), enabled: !!userId && hasAccess });

    // Mock gate: show login/register UI instead of real registration
    if (!hasAccess) {
        if (mode === 'choose') {
            return (
                <div className="max-w-md mx-auto">
                    <Card className="p-6 text-center">
                        <img src="/images/logo.png" alt="Khel-Setu" className="h-10 w-10 mx-auto mb-3" />
                        <h3 className="text-xl font-bold mb-1">SAI Assessment</h3>
                        <p className="text-sm text-gray-400 mb-6">Sign in or register to continue</p>
                        <div className="text-left grid gap-3 mb-4">
                            <Input label="Username" placeholder={generated?.username || 'e.g. sai_xxxxxx'} value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
                            <Input label="Password" type="password" placeholder={generated?.password || '••••••••'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-3">
                            <Button className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600" onClick={() => { setMode('disclaimer'); }}>
                                Login
                            </Button>
                            <button onClick={() => setMode('register')} className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10">
                                Register
                            </button>
                        </div>
                    </Card>
                </div>
            );
        }
        if (mode === 'register') {
            return (
                <MockAssessmentRegistration onComplete={(creds) => { setGenerated(creds); localStorage.setItem('sai_assessment_creds', JSON.stringify(creds)); setMode('credsShown'); }} />
            );
        }
        if (mode === 'credsShown' && generated) {
            return (
                <div className="max-w-md mx-auto">
                    <Card className="p-6 text-center">
                        <h3 className="text-xl font-bold mb-2">Registration Successful</h3>
                        <p className="text-sm text-gray-400 mb-4">Use the credentials below to sign in to the assessment.</p>
                        <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Username</span>
                                <span className="font-semibold">{generated.username}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-gray-400">Password</span>
                                <span className="font-semibold">{generated.password}</span>
                            </div>
                        </div>
                        <Button className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600" onClick={() => setMode('choose')}>
                            Go to Login
                        </Button>
                    </Card>
                </div>
            );
        }
        if (mode === 'disclaimer') {
            return (
                <AssessmentDisclaimer onAgree={() => { setHasAccess(true); }} onCancel={() => setMode('choose')} />
            );
        }
    }

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
    	<>
			<div className="mb-3 sm:mb-4">
				<Link to="/fitness-test/test1" className="inline-block w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-center text-white">
					Start Assessment
				</Link>
			</div>
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
                        <span className="mt-3 inline-block rounded px-3 py-1.5 text-xs sm:text-sm ${s?.status === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-white/10 text-gray-300'}">{s?.status === 'completed' ? 'Completed' : 'Pending'}</span>
					</Card>
				);
			})}
			</div>
		</>
	);
}


function MockAssessmentRegistration({ onComplete }: { onComplete: (creds: { username: string; password: string }) => void }) {
    const [name, setName] = useState('');
    const [fathersName, setFathersName] = useState('');
    const [aadharCard, setAadharCard] = useState('');
    const [address, setAddress] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [parentsPhone, setParentsPhone] = useState('');
    const [saving, setSaving] = useState(false);

    function generateCreds() {
        const rand = Math.random().toString(36).slice(2, 8);
        const username = 'sai_' + rand;
        const password = Math.random().toString(36).slice(2, 10);
        return { username, password };
    }

    async function submit() {
        setSaving(true);
        try {
            const creds = generateCreds();
            // No validation, no real persistence. Immediately complete.
            onComplete(creds);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="max-w-2xl mx-auto p-6">
            <h3 className="text-lg font-semibold mb-3">Assessment Registration </h3>
            <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Father's Name" value={fathersName} onChange={(e) => setFathersName(e.target.value)} />
                <Input label="Aadhar Card" value={aadharCard} onChange={(e) => setAadharCard(e.target.value)} />
                <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                <Input label="Height (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
                <Input label="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Parent's Phone" value={parentsPhone} onChange={(e) => setParentsPhone(e.target.value)} />
            </div>
            <Button onClick={submit} disabled={saving} className="mt-4">{saving ? 'Submitting...' : 'Submit & Show Login'}</Button>
            
        </Card>
    );
}


function AssessmentDisclaimer({ onAgree, onCancel }: { onAgree: () => void; onCancel: () => void }) {
    return (
        <div className="max-w-md mx-auto">
            <Card className="p-6">
                <h3 className="text-xl font-bold mb-2">Before you begin</h3>
                <p className="text-sm text-gray-300">
                    When you enter the assessment, it must be completed in one session. If you leave or close it before completion, you will need to start again.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button onClick={onCancel} className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10">Cancel</button>
                    <Button className="h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600" onClick={onAgree}>I Agree</Button>
                </div>
            </Card>
        </div>
    );
}

