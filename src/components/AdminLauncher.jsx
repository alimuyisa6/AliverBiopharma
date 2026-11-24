 import { useContext, useState } from 'react';
import Button from './Button/Button';
import { AuthContext } from '../contexts/AuthContext';
import { requestHandoff, signout } from '../api/client';
import Icon from './Icon/Icon';

export default function AdminLauncher() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState('');

  if (!user?.is_admin) return null;

  async function openAdminDashboard() {
    try {
      setError('');
      setLoading(true);
      const { token } = await requestHandoff();
      window.location.href = `https://aliver-biopharma-admindashboard.vercel.app/sso?token=${token}`;
    } catch (e) {
      setLoading(false);

      if (e?.status === 409) {
        try {
          await signout();
        } catch {
          // Continue to sign-in; the server will reject an invalidated session.
        }
        window.location.assign('/login?admin_device_reapproval=1');
        return;
      }

      setError(e?.message || 'Unable to open the administrator dashboard. Please try again.');
    }
  }

  return (
    <>
      {error && (
        <div role="alert" className="fixed bottom-16 left-4 z-50 max-w-xs rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700 shadow-lg">
          {error}
        </div>
      )}
      <Button
        onClick={openAdminDashboard}
        disabled={loading}
        className="fixed bottom-4 left-4 z-50 min-h-9 rounded-lg px-3 py-2 text-xs shadow-lg"
      >
        <Icon name="shield-halved" />
        {loading ? 'Opening…' : 'Admin'}
      </Button>
    </>
  );
}