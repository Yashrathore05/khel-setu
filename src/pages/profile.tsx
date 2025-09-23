import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userProfileService } from '../services/firestoreService';
import Card from '../components/Card';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
	const { user } = useAuth();
	const userId = user?.uid || '';
	const qc = useQueryClient();
	const profile = useQuery({ queryKey: ['profile', userId], queryFn: () => userProfileService.getUserProfile(userId), enabled: !!userId, staleTime: 60_000 });
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [region, setRegion] = useState('');
	const [level, setLevel] = useState('');

	const update = useMutation({
		mutationFn: async () => {
			await userProfileService.updateUserProfile(userId, {
				name: name || profile.data?.name || '',
				phone: phone || profile.data?.phone,
				region: region || profile.data?.region || '',
				level: (level as any) || profile.data?.level || 'Beginner',
			});
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', userId] }),
	});

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<Card className="lg:col-span-1" title="Account">
				<div className="flex items-center gap-3">
					<Avatar name={profile.data?.name || user?.email || ''} size={56} />
					<div>
						<p className="text-sm font-medium">{profile.data?.name || '-'}</p>
						<p className="text-xs text-gray-500">{user?.email}</p>
					</div>
				</div>
				<div className="mt-3 grid grid-cols-2 gap-3 text-sm">
					<div><span className="text-gray-500">Level:</span> {profile.data?.level || '-'}</div>
					<div><span className="text-gray-500">Region:</span> {profile.data?.region || '-'}</div>
				</div>
			</Card>
			<Card className="lg:col-span-2" title="Edit Profile" subtitle="Update your personal information">
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="block">
						<span className="block text-sm">Name</span>
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder={profile.data?.name || ''} className="mt-1 w-full rounded border px-3 py-2" />
					</label>
					<label className="block">
						<span className="block text-sm">Phone</span>
						<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={profile.data?.phone || ''} className="mt-1 w-full rounded border px-3 py-2" />
					</label>
					<label className="block">
						<span className="block text-sm">Region</span>
						<input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={profile.data?.region || ''} className="mt-1 w-full rounded border px-3 py-2" />
					</label>
					<label className="block">
						<span className="block text-sm">Level</span>
						<input value={level} onChange={(e) => setLevel(e.target.value)} placeholder={profile.data?.level || ''} className="mt-1 w-full rounded border px-3 py-2" />
					</label>
				</div>
				<button onClick={() => update.mutate()} disabled={update.isPending} className="mt-4 rounded bg-black px-3 py-1.5 text-white disabled:opacity-50">{update.isPending ? 'Saving...' : 'Save changes'}</button>
			</Card>
		</div>
	);
}
