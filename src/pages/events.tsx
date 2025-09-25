import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { eventsService } from '../services/firestoreService';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import { Link } from 'react-router-dom';

function formatDate(ts: any) {
	try {
		if (ts?.seconds) return new Date(ts.seconds * 1000).toLocaleString();
		return new Date(ts).toLocaleString();
	} catch {
		return '';
	}
}

export default function EventsPage() {
	const events = useQuery({ queryKey: ['events.upcoming'], queryFn: () => eventsService.getUpcomingEvents() });
    const registeredMap = useMemo(() => {
        try {
            const map: Record<string, boolean> = {};
            (events.data || []).forEach((e: any) => {
                const flag = localStorage.getItem(`event_registered_${e.id}`);
                if (flag === '1') map[e.id] = true;
            });
            return map;
        } catch { return {}; }
    }, [events.data]);

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
                    const isRegistered = !!registeredMap[e.id];
					return (
						<Card key={e.id}>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="font-medium">{e.title}</p>
									<p className="text-xs text-gray-500">{e.location} • {formatDate(e.date)}</p>
								</div>
                                <div className="text-xs text-gray-500">{e.currentParticipants}/{e.maxParticipants}</div>
							</div>
                            <Link to={`/events/${e.id}`} className={`mt-3 w-full inline-block rounded px-3 py-2 text-sm text-center ${isFull || isRegistered ? 'bg-gray-700 cursor-not-allowed text-gray-300' : 'bg-black text-white'}`}>{isRegistered ? 'Registered' : isFull ? 'Full' : 'Register'}</Link>
						</Card>
					);
				}) : <p className="text-sm text-gray-500">No upcoming events</p>}
			</div>
			)}
		</div>
	);
}
