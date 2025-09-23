import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PropsWithChildren } from 'react';

export default function ProtectedRoute({ children }: PropsWithChildren) {
	const { user, loading } = useAuth();
	if (loading) return <div className="text-center text-sm text-gray-600">Loading...</div>;
	if (!user) return <Navigate to="/login" replace />;
	return <>{children}</>;
}
