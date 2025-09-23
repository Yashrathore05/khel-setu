import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';

function formatDate(ts: any) {
	try {
		if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
		return new Date(ts).toLocaleString();
	} catch {
		return '';
	}
}

export default function EventsPage() {
	const qc = useQueryClient();
	const { user } = useAuth();
	const events = useQuery({ queryKey: ['events.upcoming'], queryFn: () => eventsService.getUpcomingEvents() });
	const register = useMutation({
		mutationFn: (eventId: string) => eventsService.registerForEvent(eventId, user!.uid),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['events.upcoming'] }); },
	});

	return (
		<div>
			<h2 className="mb-3 text-lg font-semibold">Upcoming Events</h2>
			{events.isLoading ? (
				<div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
					<Skeleton className="h-28" />
				</div>
			) : (
			<div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{events.data?.length ? events.data.map((e) => {
					const isFull = e.currentParticipants >= e.maxParticipants;
					return (
						<Card key={e.id}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium">{e.title}</p>
									<p className="text-xs text-gray-500">{e.location} • {formatDate(e.date)}</p>
								</div>
								<div className="text-xs text-gray-500">{e.currentParticipants}/{e.maxParticipants}</div>
							</div>
					<button onClick={() => register.mutate(e.id)} disabled={!user || register.isPending || isFull} className="mt-3 w-full rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50">{isFull ? 'Full' : register.isPending ? 'Registering...' : 'Register'}</button>
						</Card>
					);
				}) : <p className="text-sm text-gray-500">No upcoming events</p>}
			</div>
			)}
		</div>
	);
}
