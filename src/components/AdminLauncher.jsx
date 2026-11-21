 import { useContext, useState } from 'react';
import Button from './Button/Button';
import { AuthContext } from '../contexts/AuthContext';
import { requestHandoff } from '../api/client';
import Icon from './Icon/Icon';

export default function AdminLauncher() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  if (!user?.is_admin) return null;

  async function openAdminDashboard() {
    try {
      setLoading(true);
      const { token } = await requestHandoff();
      window.location.href = `https://aliver-biopharma-admindashboard.vercel.app/sso?token=${token}`;
    } catch (e) {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={openAdminDashboard}
      disabled={loading}
      className="fixed bottom-4 left-4 z-50 min-h-9 rounded-lg px-3 py-2 text-xs shadow-lg"
    >
      <Icon name="shield-halved" />
      {loading ? 'Opening…' : 'Admin'}
    </Button>
  );
}