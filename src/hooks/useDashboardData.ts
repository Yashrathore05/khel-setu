import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { badgesService, progressService, userProfileService } from '../services/firestoreService';
import TestProgressService from '../services/testProgressService';
import { isMockUserActive, getMockUserProfile, getMockProgress, getMockBadges, getMockFitnessSummary } from '../lib/mock';

export function useDashboardData() {
	const { user } = useAuth();
	const userId = user?.uid || '';

    const profile = useQuery({
		queryKey: ['profile', userId],
        queryFn: () => isMockUserActive() ? Promise.resolve(getMockUserProfile(userId)) : userProfileService.getUserProfile(userId),
		enabled: !!userId,
	});

    const progress = useQuery({
		queryKey: ['progress', userId],
        queryFn: () => isMockUserActive() ? Promise.resolve(getMockProgress(userId) as any) : progressService.getUserProgress(userId),
		enabled: !!userId,
	});

	// Real-time fitness test progress aggregated from fitnessTestResults
    const testProgress = useQuery({
		queryKey: ['fitness.progress', userId],
        queryFn: () => isMockUserActive() ? Promise.resolve({
            userId,
            totalTests: 10,
            completedTests: 6,
            incompleteTests: 2,
            failedTests: 0,
            overallProgress: 60,
            testResults: (getMockProgress(userId) as any).testResults || [],
            lastUpdated: new Date(),
        } as any) : TestProgressService.getTestProgress(userId),
		enabled: !!userId,
	});

    const fitnessSummary = useQuery({
        queryKey: ['fitness.summary', userId],
        queryFn: () => isMockUserActive() ? Promise.resolve(getMockFitnessSummary(userId) as any) : TestProgressService.getTestSummary(userId),
        enabled: !!userId,
    });

    const badges = useQuery({
		queryKey: ['badges', userId],
        queryFn: () => isMockUserActive() ? Promise.resolve(getMockBadges(userId)) : badgesService.getUserBadges(userId),
		enabled: !!userId,
	});

	return { profile, progress, fitnessSummary, badges, testProgress } as const;
}
