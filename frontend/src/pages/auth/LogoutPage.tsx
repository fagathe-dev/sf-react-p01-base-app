import { useAuthStore } from '@/stores/auth.store';
import { FullScreenLoader } from '@/components/FullScreenLoader';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LogoutPage = () => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return <FullScreenLoader label="Déconnexion en cours…" />;
};
