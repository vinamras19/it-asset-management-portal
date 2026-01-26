import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Loader } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const TwoFactorPage = () => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { verify2FALogin } = useAuthStore();

  const userId = location.state?.userId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      await verify2FALogin(userId, token);
      toast.success('Authentication successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center">
        <p className="text-gray-400 mb-4">Session expired. Please login again.</p>
        <button onClick={() => navigate('/login')} className="text-blue-500 hover:text-blue-400">Go to Login</button>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-400">Enter the 6-digit code from your authenticator app</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            required
            maxLength={6}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button type="submit" disabled={isLoading || token.length !== 6} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
          {isLoading ? <><Loader className="w-5 h-5 animate-spin" /> Verifying...</> : 'Verify'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">You can also use a backup code</p>
    </div>
  );
};

export default TwoFactorPage;
