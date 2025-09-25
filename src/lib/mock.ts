import type { ProgressData, Badge, UserProfile, Event } from '../services/firestoreService';

export function isMockUserActive(): boolean {
    try {
        const stored = localStorage.getItem('mockUser');
        if (!stored) return false;
        const obj = JSON.parse(stored);
        return obj?.uid === 'mock-athlete';
    } catch {
        return false;
    }
}

export function getMockUserProfile(userId: string): UserProfile {
    // Minimal fields populated; timestamps omitted for mock usage in UI
    return {
        id: userId,
        name: 'athelete',
        email: 'athelete@example.com',
        age: 18,
        gender: 'Other',
        region: 'India',
        level: 'Beginner',
        avatar: undefined,
        createdAt: new Date() as unknown as any,
        updatedAt: new Date() as unknown as any,
    };
}

export function getMockBadges(userId: string): Badge[] {
    const base: any = new Date();
    return [
        { id: `${userId}_starter_athlete`, name: 'Athlete Starter', description: 'Welcome to Khel Setu!', icon: '🏅', condition: 'First login', earned: true,
          earnedAt: base as unknown as any, category: 'achievement' },
        { id: `${userId}_training_streak`, name: 'Training Streak', description: '3-day streak', icon: '🔥', condition: '3 days in a row', earned: true,
          earnedAt: base as unknown as any, category: 'fitness' },
    ] as any;
}

export function getMockProgress(userId: string): ProgressData {
    const totalTests = 10;
    const testResults = [
        { testId: 'test3', testName: 'Sit and Reach', result: 24, unit: 'cm', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test4', testName: 'Standing Vertical Jump', result: 38, unit: 'cm', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test5', testName: 'Standing Broad Jump', result: 170, unit: 'cm', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test7', testName: '30mts Standing Start', result: 5.3, unit: 's', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test9', testName: 'Sit Ups', result: 35, unit: 'reps', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test2', testName: 'Weight', result: 62, unit: 'kg', completedAt: new Date(), status: 'completed', testType: 'input' },
        { testId: 'test8', testName: '4 X 10 Mts Shuttle Run', result: null, unit: 's', completedAt: null, status: 'incomplete', testType: 'input' },
        { testId: 'test10', testName: '800m / 1.6km Run', result: null, unit: 's', completedAt: null, status: 'incomplete', testType: 'input' },
    ] as any;
    const completedTests = testResults.filter((r: any) => r.status === 'completed').length;
    const overallScore = Math.round((completedTests / totalTests) * 100);
    const res: any = {
        userId,
        overallScore,
        benchmark: 55,
        improvement: 12,
        lastUpdated: new Date() as unknown as any,
        testHistory: [],
        testResults,
    };
    return res;
}

export function getMockFitnessSummary(userId: string) {
    const progress = getMockProgress(userId);
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
        const result = (progress as any).testResults?.find((r: any) => r.testId === test.testId);
        if (result) {
            return { testId: test.testId, testName: test.testName, status: result.status, result: result.result ?? undefined, unit: result.unit, completedAt: result.completedAt, qualityTested: test.qualityTested };
        }
        return { testId: test.testId, testName: test.testName, status: 'not_started', qualityTested: test.qualityTested };
    });
}

export function getMockLeaderboard(): Array<{ userId: string; completedTests: number; totalTests: number; overallProgress: number; profile: { id: string; name?: string; region?: string; avatar?: string; age?: number; gender?: 'Male'|'Female'|'Other'; level?: 'Beginner'|'Intermediate'|'Advanced' } }>
{
    return [
        { userId: 'mock-athlete', completedTests: 6, totalTests: 10, overallProgress: 60, profile: { id: 'mock-athlete', name: 'athelete', region: 'India', level: 'Beginner' } },
        { userId: 'user_2', completedTests: 5, totalTests: 10, overallProgress: 50, profile: { id: 'user_2', name: 'Ravi', region: 'Delhi', level: 'Intermediate' } },
        { userId: 'user_3', completedTests: 4, totalTests: 10, overallProgress: 40, profile: { id: 'user_3', name: 'Neha', region: 'Mumbai', level: 'Beginner' } },
    ];
}

export function getMockEvents(): Event[] {
    const now = new Date();
    const plusDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
    return [
        { id: 'evt1', title: 'District Trial', description: 'Track & Field selection', date: plusDays(3) as any, location: 'Delhi', type: 'tournament', maxParticipants: 50, currentParticipants: 23, registrationOpen: true },
        { id: 'evt2', title: 'Strength Workshop', description: 'Form and technique', date: plusDays(7) as any, location: 'Online', type: 'workshop', maxParticipants: 200, currentParticipants: 120, registrationOpen: true },
        { id: 'evt3', title: 'Weekend Run', description: 'Community 5K', date: plusDays(10) as any, location: 'Gurugram', type: 'social', maxParticipants: 80, currentParticipants: 80, registrationOpen: true },
    ] as any;
}


