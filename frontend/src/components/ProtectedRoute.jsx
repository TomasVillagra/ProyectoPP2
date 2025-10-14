import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api/axios';

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let mounted = true;
    api.get('/api/auth/me/')
      .then(({data}) => mounted && setStatus(data?.is_authenticated ? 'authed' : 'anon'))
      .catch(() => mounted && setStatus('anon'));
    return () => { mounted = false; };
  }, []);

  if (status === 'loading') return null;
  if (status === 'anon') return <Navigate to="/login" replace />;
  return children;
}
