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

interface TestProgress {
	userId: string;
	totalTests: number;
	completedTests: number;
	incompleteTests: number;
	failedTests: number;
	overallProgress: number; // 0-100
	testResults: TestResult[];
	lastUpdated: any;
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

class TestProgressService {
	private static instance: TestProgressService;

	static getInstance(): TestProgressService {
		if (!TestProgressService.instance) {
			TestProgressService.instance = new TestProgressService();
		}
		return TestProgressService.instance;
	}

	async getTestProgress(userId: string): Promise<TestProgress> {
        const testResultsRef = collection(db, 'fitnessTestResults');
        // Avoid requiring composite index; simple where filter only
        const q = query(testResultsRef, where('userId', '==', userId));
        const qs = await getDocs(q);
		const testResults: TestResult[] = [];
		qs.forEach((doc) => {
            const data = doc.data() as any;
            testResults.push({
				testId: data.testId,
				testName: data.testName,
				result: data.result,
				unit: data.unit,
				completedAt: data.completedAt,
				status: data.status,
				testType: data.testType,
				videoUrl: data.videoUrl,
                imageUrl: data.imageUrl,
				integrityResult: data.integrityResult,
			});
		});
		const totalTests = 10;
		const completedTests = testResults.filter(r => r.status === 'completed').length;
		const incompleteTests = testResults.filter(r => r.status === 'incomplete').length;
		const failedTests = testResults.filter(r => r.status === 'failed').length;
		const overallProgress = (completedTests / totalTests) * 100;
		return { userId, totalTests, completedTests, incompleteTests, failedTests, overallProgress, testResults, lastUpdated: new Date() };
	}

	async getTestSummary(userId: string): Promise<TestSummary[]> {
		const progress = await this.getTestProgress(userId);
		const allTests = [
			{ testId: 'test1', testName: 'Height', qualityTested: '' },
			{ testId: 'test2', testName: 'Weight', qualityTested: '' },
			{ testId: 'test3', testName: 'Sit and Reach', qualityTested: 'Flexibility' },
			{ testId: 'test4', testName: 'Standing Vertical Jump', qualityTested: 'Lower Body Explosive Strength' },
			{ testId: 'test5', testName: 'Standing Broad Jump', qualityTested: 'Lower Body Explosive Strength' },
			{ testId: 'test6', testName: 'Medicine Ball Throw', qualityTested: 'Upper Body Strength' },
			{ testId: 'test7', testName: '30mts Standing Start', qualityTested: 'Speed' },
			{ testId: 'test8', testName: '4 X 10 Mts Shuttle Run', qualityTested: 'Agility' },
			{ testId: 'test9', testName: 'Sit Ups', qualityTested: 'Core Strength' },
			{ testId: 'test10', testName: '800m / 1.6km Run', qualityTested: 'Endurance' },
		];
		return allTests.map(test => {
			const result = progress.testResults.find(r => r.testId === test.testId);
			if (result) {
				return { testId: test.testId, testName: test.testName, status: result.status, result: result.result || undefined, unit: result.unit, completedAt: result.completedAt, qualityTested: test.qualityTested };
			}
			return { testId: test.testId, testName: test.testName, status: 'not_started', qualityTested: test.qualityTested };
		});
	}

    async markTestAsCompleted(userId: string, testId: string, testData: Partial<TestResult>): Promise<void> {
        const testDocRef = doc(db, 'fitnessTestResults', `${userId}_${testId}`);
        await setDoc(testDocRef, { ...testData, userId, testId, completedAt: serverTimestamp(), status: 'completed' }, { merge: true });
    }

    async markTestAsIncomplete(userId: string, testId: string, reason: string): Promise<void> {
        const testDocRef = doc(db, 'fitnessTestResults', `${userId}_${testId}`);
        await setDoc(testDocRef, { testId, userId, status: 'incomplete', incompleteReason: reason, completedAt: serverTimestamp() }, { merge: true });
    }
}

export default TestProgressService.getInstance();
