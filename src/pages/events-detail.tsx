import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../services/firestoreService';
import Card from '../components/Card';

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { user } = useAuth();
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
        if (!id) return;
        try {
            const flag = localStorage.getItem(`event_registered_${id}`);
            setRegistered(flag === '1');
        } catch {}
    }, [id]);

    const eventQ = useQuery({
        queryKey: ['event.detail', id],
        queryFn: () => eventsService.getEventById(id as string),
        enabled: !!id,
    });

    const register = useMutation({
        mutationFn: async () => {
            if (!id || !user) throw new Error('Not logged in');
            await eventsService.registerForEvent(id, user.uid);
        },
        onSuccess: async () => {
            // Optimistically update cached lists/details to fake increment
            qc.setQueryData<any>(['events.upcoming'], (prev: Array<any> | undefined) => {
                if (!prev || !Array.isArray(prev)) return prev;
                return prev.map((ev) => ev.id === id
                    ? { ...ev, currentParticipants: Math.min((ev.currentParticipants || 0) + 1, ev.maxParticipants) }
                    : ev
                );
            });
            qc.setQueryData<any>(['event.detail', id], (prev: any) => {
                if (!prev) return prev;
                return { ...prev, currentParticipants: Math.min((prev.currentParticipants || 0) + 1, prev.maxParticipants) };
            });
            try { localStorage.setItem(`event_registered_${id}`, '1'); } catch {}
            setRegistered(true);
            window.alert('Successfully registered');
            navigate('/events');
        }
    });

    if (eventQ.isLoading) return <Card className="p-6">Loading event...</Card>;
    if (!eventQ.data) return <Card className="p-6">Event not found.</Card>;

    const e = eventQ.data;
    const isFull = e.currentParticipants >= e.maxParticipants;

    return (
        <div className="max-w-3xl mx-auto">
            <Card className="p-6">
                <h2 className="text-xl font-semibold">{e.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{e.location} • {new Date((e as any).date?.seconds ? (e as any).date.seconds * 1000 : e.date as any).toLocaleString()}</p>
                {e.imageUrl && (
                    <img src={e.imageUrl} alt={e.title} className="mt-4 w-full rounded" />
                )}
                <p className="mt-4 text-gray-200 text-sm whitespace-pre-wrap">{e.description}</p>

                <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Participants: {e.currentParticipants}/{e.maxParticipants}</span>
                    <button
                        onClick={() => register.mutate()}
                        disabled={!user || register.isPending || isFull || registered}
                        className={`rounded px-4 py-2 text-sm ${isFull || registered ? 'bg-gray-700 text-gray-300' : 'bg-black text-white'} disabled:opacity-50`}
                    >
                        {registered ? 'Registered' : isFull ? 'Full' : register.isPending ? 'Registering...' : 'Register'}
                    </button>
                </div>
            </Card>
        </div>
    );
}


