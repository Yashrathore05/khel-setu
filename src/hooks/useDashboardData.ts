import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { badgesService, progressService, userProfileService } from '../services/firestoreService';
import TestProgressService from '../services/testProgressService';

export function useDashboardData() {
	const { user } = useAuth();
	const userId = user?.uid || '';

	const profile = useQuery({
		queryKey: ['profile', userId],
		queryFn: () => userProfileService.getUserProfile(userId),
		enabled: !!userId,
	});

	const progress = useQuery({
		queryKey: ['progress', userId],
		queryFn: () => progressService.getUserProgress(userId),
		enabled: !!userId,
	});

	// Real-time fitness test progress aggregated from fitnessTestResults
	const testProgress = useQuery({
		queryKey: ['fitness.progress', userId],
		queryFn: () => TestProgressService.getTestProgress(userId),
		enabled: !!userId,
	});

    const fitnessSummary = useQuery({
        queryKey: ['fitness.summary', userId],
        queryFn: () => TestProgressService.getTestSummary(userId),
        enabled: !!userId,
    });

	const badges = useQuery({
		queryKey: ['badges', userId],
		queryFn: () => badgesService.getUserBadges(userId),
		enabled: !!userId,
	});

	return { profile, progress, fitnessSummary, badges, testProgress } as const;
}
