import { collection, doc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firestore';

interface TestResult {
    testId: string;
    testName: string;
    result: number | null;
    unit: string;
    completedAt: any;
    status: 'completed' | 'incomplete' | 'failed';
    testType: 'input' | 'video';
    videoUrl?: string;
    imageUrl?: string;
    integrityResult?: any;
}

interface TestSummary {
    testId: string;
    testName: string;
    status: 'completed' | 'incomplete' | 'failed' | 'not_started';
    result?: number;
    unit?: string;
    completedAt?: any;
    qualityTested?: string;
}

class NormalTestProgressService {
    private static instance: NormalTestProgressService;

    static getInstance(): NormalTestProgressService {
        if (!NormalTestProgressService.instance) {
            NormalTestProgressService.instance = new NormalTestProgressService();
        }
        return NormalTestProgressService.instance;
    }

    async getTestSummary(userId: string): Promise<TestSummary[]> {
        const resultsRef = collection(db, 'normalFitnessTestResults');
        const qRef = query(resultsRef, where('userId', '==', userId));
        const qs = await getDocs(qRef);
        const results: Record<string, TestResult> = {};
        qs.forEach((d) => {
            const data = d.data() as any;
            results[data.testId] = {
                testId: data.testId,
                testName: data.testName,
                result: data.result ?? null,
                unit: data.unit,
                completedAt: data.completedAt,
                status: data.status,
                testType: data.testType,
                videoUrl: data.videoUrl,
                imageUrl: data.imageUrl,
                integrityResult: data.integrityResult,
            } as TestResult;
        });
        const allTests = [
            { testId: 'test9', testName: 'Sit Ups', qualityTested: 'Core Strength' },
            { testId: 'test1', testName: 'Height', qualityTested: '' },
            { testId: 'test2', testName: 'Weight', qualityTested: '' },
            { testId: 'test3', testName: 'Sit and Reach', qualityTested: 'Flexibility' },
            { testId: 'test4', testName: 'Standing Vertical Jump', qualityTested: 'Lower Body Explosive Strength' },
            { testId: 'test5', testName: 'Standing Broad Jump', qualityTested: 'Lower Body Explosive Strength' },
            { testId: 'test6', testName: 'Medicine Ball Throw', qualityTested: 'Upper Body Strength' },
            { testId: 'test7', testName: '30mts Standing Start', qualityTested: 'Speed' },
            { testId: 'test8', testName: '4 X 10 Mts Shuttle Run', qualityTested: 'Agility' },
            { testId: 'test10', testName: '800m / 1.6km Run', qualityTested: 'Endurance' },
        ];
        return allTests.map((t) => {
            const r = results[t.testId];
            if (r) return { testId: t.testId, testName: t.testName, status: r.status, result: r.result ?? undefined, unit: r.unit, completedAt: r.completedAt, qualityTested: t.qualityTested };
            return { testId: t.testId, testName: t.testName, status: 'not_started', qualityTested: t.qualityTested };
        });
    }

    async markTestAsCompleted(userId: string, testId: string, testData: Partial<TestResult>): Promise<void> {
        const testDocRef = doc(db, 'normalFitnessTestResults', `${userId}_${testId}`);
        await setDoc(testDocRef, { ...testData, userId, testId, completedAt: serverTimestamp(), status: 'completed' }, { merge: true });
    }
}

export default NormalTestProgressService.getInstance();


