import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card';

export default function AssessmentBreakPage() {
    const { nextId } = useParams();
    const navigate = useNavigate();
    const DURATION_SEC = 5 * 60; // 5 minutes
    const [remaining, setRemaining] = useState<number>(DURATION_SEC);

    useEffect(() => {
        const t = window.setInterval(() => {
            setRemaining((v) => {
                if (v <= 1) {
                    window.clearInterval(t);
                    if (nextId) navigate(`/fitness-test/${nextId}`);
                    return 0;
                }
                return v - 1;
            });
        }, 1000);
        return () => window.clearInterval(t);
    }, [nextId, navigate]);

    const mmss = useMemo(() => {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, [remaining]);

    return (
        <div className="max-w-lg mx-auto">
            <Card className="p-6 text-center">
                <h3 className="text-2xl font-extrabold">Break Time</h3>
                <p className="text-sm text-gray-400 mt-2">Take a short rest. The next test will start automatically.</p>
                <div className="mt-6">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-white/10 border border-white/20 text-2xl font-semibold">
                        {mmss}
                    </div>
                </div>
                <div className="mt-6">
                    <button onClick={() => nextId && navigate(`/fitness-test/${nextId}`)} className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-white">
                        Resume Now
                    </button>
                </div>
            </Card>
        </div>
    );
}


