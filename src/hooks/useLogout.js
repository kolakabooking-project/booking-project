import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext';

export default function useLogout() {
  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const navigate = useNavigate();

  return useCallback(async () => {
    showLoading('Melakukan logout...');
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      hideLoading();
      navigate('/login', { replace: true });
    }
  }, [logout, showLoading, hideLoading, navigate]);
}
