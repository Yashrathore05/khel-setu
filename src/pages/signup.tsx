import type { FormEvent } from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
	const { signUp, signInWithGoogle } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await signUp(email, password);
			navigate('/');
		} catch (err: any) {
			setError(err?.message || 'Signup failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-4 text-2xl font-semibold">Create account</h1>
			<form onSubmit={onSubmit} className="space-y-3">
				<label className="block">
					<span className="block text-sm font-medium">Email</span>
					<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded border px-3 py-2" />
				</label>
				<label className="block">
					<span className="block text-sm font-medium">Password</span>
					<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full rounded border px-3 py-2" />
				</label>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button disabled={loading} className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50">{loading ? 'Creating...' : 'Create account'}</button>
			</form>
			<div className="my-4 flex items-center gap-2 text-xs text-gray-500">
				<div className="h-px flex-1 bg-gray-300" />
				<span>or</span>
				<div className="h-px flex-1 bg-gray-300" />
			</div>
			<button
				onClick={async () => { setError(null); setLoading(true); try { await signInWithGoogle(); navigate('/'); } catch (e:any) { setError(e?.message || 'Google sign-in failed'); } finally { setLoading(false); } }}
				className="mt-2 w-full rounded bg-white px-3 py-2 text-black hover:bg-gray-200 flex items-center justify-center gap-2"
				aria-label="Continue with Google"
			>
				<span className="inline-block h-4 w-4 rounded-full bg-white text-[#4285F4] font-bold">G</span>
				<span>Continue with Google</span>
			</button>
			<p className="mt-3 text-sm">Have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
		</div>
	);
}
