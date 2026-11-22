import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { FullScreenLoader } from '@/components/FullScreenLoader';

export const ProtectedRoute = () => {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return <FullScreenLoader label="Vérification de la session…" />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};