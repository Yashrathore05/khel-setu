import { 
	collection, doc, getDocs, getDoc, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firestore';

export interface UserProfile {
	id: string;
	name: string;
	email: string;
	phone?: string;
	age: number;
	gender: 'Male' | 'Female' | 'Other';
	region: string;
	level: 'Beginner' | 'Intermediate' | 'Advanced';
	avatar?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface Test {
	id: string;
	name: string;
	type: 'speed' | 'endurance' | 'strength' | 'agility' | 'flexibility';
	score?: number;
	maxScore: number;
	completed: boolean;
	completedAt?: Timestamp;
	dueDate?: Timestamp;
	instructions: string[];
	createdAt: Timestamp;
}

export interface Badge {
	id: string;
	name: string;
	description: string;
	icon: string;
	condition: string;
	earned: boolean;
	earnedAt?: Timestamp;
	category: 'fitness' | 'achievement' | 'streak' | 'social';
}

export interface ProgressData {
	userId: string;
	overallScore: number;
	benchmark: number;
	improvement: number;
	lastUpdated: Timestamp;
	testHistory: { testId: string; score: number; completedAt: Timestamp }[];
}

export interface Event {
	id: string;
	title: string;
	description: string;
	date: Timestamp;
	location: string;
	type: 'tournament' | 'training' | 'workshop' | 'social';
	maxParticipants: number;
	currentParticipants: number;
	registrationOpen: boolean;
	imageUrl?: string;
	createdAt: Timestamp;
}

export const userProfileService = {
	async getUserProfile(userId: string): Promise<UserProfile | null> {
		const docRef = doc(db, 'users', userId);
		const snap = await getDoc(docRef);
		return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserProfile) : null;
	},
	async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
		const ref = doc(db, 'users', userId);
		const snap = await getDoc(ref);
		if (snap.exists()) {
			await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
		} else {
			await setDoc(ref, { id: userId, ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
		}
	},
	async createUserProfile(userId: string, data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
		const ref = doc(db, 'users', userId);
		await setDoc(ref, { ...data, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
	},
};

export const testsService = {
	async getUserTests(userId: string): Promise<Test[]> {
		const qRef = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
		const qs = await getDocs(qRef);
		return qs.docs.map(d => ({ id: d.id, ...d.data() } as Test));
	},
	async getPendingTests(userId: string): Promise<Test[]> {
		const qRef = query(collection(db, 'tests'), where('userId', '==', userId), where('completed', '==', false), orderBy('dueDate', 'asc'));
		const qs = await getDocs(qRef);
		return qs.docs.map(d => ({ id: d.id, ...d.data() } as Test));
	},
	async getCompletedTests(userId: string): Promise<Test[]> {
		const qRef = query(collection(db, 'tests'), where('userId', '==', userId), where('completed', '==', true), orderBy('completedAt', 'desc'));
		const qs = await getDocs(qRef);
		return qs.docs.map(d => ({ id: d.id, ...d.data() } as Test));
	},
	async completeTest(testId: string, score: number): Promise<void> {
		const ref = doc(db, 'tests', testId);
		await updateDoc(ref, { score, completed: true, completedAt: Timestamp.now() });
	},
};

export const badgesService = {
	async getUserBadges(userId: string): Promise<Badge[]> {
		const qRef = query(collection(db, 'badges'), where('userId', '==', userId), orderBy('earnedAt', 'desc'));
		const qs = await getDocs(qRef);
		return qs.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
	},
    async awardBadge(_userId: string, badgeId: string): Promise<void> {
        const ref = doc(db, 'badges', badgeId);
		await updateDoc(ref, { earned: true, earnedAt: Timestamp.now() });
	},
};

export const progressService = {
	async getUserProgress(userId: string): Promise<ProgressData | null> {
		const ref = doc(db, 'progress', userId);
		const snap = await getDoc(ref);
		return snap.exists() ? (snap.data() as ProgressData) : null;
	},
	async updateUserProgress(userId: string, data: Partial<ProgressData>): Promise<void> {
		const ref = doc(db, 'progress', userId);
		await updateDoc(ref, { ...data, lastUpdated: Timestamp.now() });
	},
};

export const eventsService = {
	async getUpcomingEvents(): Promise<Event[]> {
		const qRef = query(collection(db, 'events'), where('date', '>=', Timestamp.now()), where('registrationOpen', '==', true), orderBy('date', 'asc'), limit(10));
		const qs = await getDocs(qRef);
		return qs.docs.map(d => ({ id: d.id, ...d.data() } as Event));
	},
    async registerForEvent(eventId: string, userId: string): Promise<void> {
		const eventRef = doc(db, 'events', eventId);
		const snap = await getDoc(eventRef);
		if (snap.exists()) {
			const data = snap.data() as Event;
			if (data.currentParticipants < data.maxParticipants) {
				await updateDoc(eventRef, { currentParticipants: data.currentParticipants + 1 });
				const participantRef = doc(db, 'eventParticipants', `${eventId}_${userId}`);
				await setDoc(participantRef, { eventId, userId, registeredAt: Timestamp.now() });
            } else {
                throw new Error('Event is full');
            }
		}
	},
};

export const realTimeService = {
	listenToUserProfile(userId: string, cb: (p: UserProfile | null) => void) {
		const ref = doc(db, 'users', userId);
		return onSnapshot(ref, (docSnap) => {
			cb(docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as UserProfile) : null);
		});
	},
	listenToUserTests(userId: string, cb: (tests: Test[]) => void) {
		const qRef = query(collection(db, 'tests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
		return onSnapshot(qRef, (qs) => cb(qs.docs.map(d => ({ id: d.id, ...d.data() } as Test))));
	},
	listenToUpcomingEvents(cb: (events: Event[]) => void) {
		const qRef = query(collection(db, 'events'), where('date', '>=', Timestamp.now()), orderBy('date', 'asc'), limit(10));
		return onSnapshot(qRef, (qs) => cb(qs.docs.map(d => ({ id: d.id, ...d.data() } as Event))));
	}
};
