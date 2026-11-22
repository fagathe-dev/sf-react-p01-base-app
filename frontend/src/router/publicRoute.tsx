import { useAuthStore } from '@/stores/auth.store';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute = () => {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return <FullScreenLoader label="Vérification de la session…" />;
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
