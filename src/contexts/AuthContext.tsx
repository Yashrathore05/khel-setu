import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, OAuthProvider, signInWithPopup, GithubAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { firebaseApp } from '../lib/firebase';
import { userProfileService } from '../services/firestoreService';

export type AuthContextValue = {
	user: User | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	logout: () => Promise<void>;
	signInWithGoogle: () => Promise<void>;
	signInWithApple: () => Promise<void>;
	signInWithGithub: () => Promise<void>;
	startPhoneSignIn: (phone: string, recaptchaContainerId: string) => Promise<void>;
	confirmPhoneSignIn: (code: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const auth = useMemo(() => getAuth(firebaseApp), []);
	const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => {
			setUser(u);
			setLoading(false);
		});
		return () => unsub();
	}, [auth]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			loading,
			signIn: async (email: string, password: string) => {
				await signInWithEmailAndPassword(auth, email, password);
			},
            signUp: async (email: string, password: string) => {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                // Ensure a Firestore profile exists
                await userProfileService.updateUserProfile(cred.user.uid, {
                    name: cred.user.displayName || email.split('@')[0],
                    email: cred.user.email || email,
                    level: 'Beginner',
                    region: 'India',
                });
            },
			logout: async () => {
				await signOut(auth);
			},
            signInWithGoogle: async () => {
                const provider = new GoogleAuthProvider();
                const cred = await signInWithPopup(auth, provider);
                // Backfill profile on first Google sign-in
                await userProfileService.updateUserProfile(cred.user.uid, {
                    name: cred.user.displayName || cred.user.email || 'User',
                    email: cred.user.email || '',
                });
            },
			signInWithApple: async () => {
				// Apple provider requires configuration in Firebase console and on Apple Developer
				const provider = new OAuthProvider('apple.com');
				provider.addScope('email');
				provider.addScope('name');
				await signInWithPopup(auth, provider);
			},
			signInWithGithub: async () => {
				const provider = new GithubAuthProvider();
				await signInWithPopup(auth, provider);
			},
			startPhoneSignIn: async (phone: string, recaptchaContainerId: string) => {
				if (!auth.settings.appVerificationDisabledForTesting) {
					// Create or reuse an invisible reCAPTCHA for phone auth
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const win = window as any;
					if (!win._khelRecaptchaVerifier) {
						win._khelRecaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
					}
					const verifier: RecaptchaVerifier = win._khelRecaptchaVerifier;
					const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
					setPhoneConfirmation(confirmation);
				} else {
					// For testing mode
					const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: 'invisible' });
					const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
					setPhoneConfirmation(confirmation);
				}
			},
			confirmPhoneSignIn: async (code: string) => {
				if (!phoneConfirmation) throw new Error('No pending phone confirmation');
				await phoneConfirmation.confirm(code);
				setPhoneConfirmation(null);
			},
		}),
		[user, loading, auth, phoneConfirmation]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
