import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Clock,
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const AuditLogsPage = () => {
  const [securityMetrics, setSecurityMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        const response = await api.get('/audit/security-metrics');
        setSecurityMetrics(response.data);
      } catch (error) {
        toast.error('Failed to load security data');
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
  }, []);

  const getActionIcon = (action) => {
    if (action.includes('FAILED') || action.includes('LOCKED') || action.includes('DENIED')) {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    if (action.includes('SUCCESS') || action.includes('ENABLED')) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (action.includes('SUSPICIOUS')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
    return <Shield className="w-5 h-5 text-blue-400" />;
  };

  const getActionColor = (action) => {
    if (action.includes('FAILED') || action.includes('LOCKED') || action.includes('DENIED')) {
      return 'bg-red-500/20 text-red-400';
    }
    if (action.includes('SUCCESS') || action.includes('ENABLED')) {
      return 'bg-green-500/20 text-green-400';
    }
    if (action.includes('SUSPICIOUS')) {
      return 'bg-yellow-500/20 text-yellow-400';
    }
    return 'bg-blue-500/20 text-blue-400';
  };

  const getStatusBadge = (status) => {
    const styles = {
      SUCCESS: 'bg-green-500/20 text-green-400',
      FAILURE: 'bg-red-500/20 text-red-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Security & Audit Logs</h1>
        <p className="text-gray-400">Monitor system security and user activity</p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{securityMetrics?.totalUsers || 0}</p>
              <p className="text-sm text-gray-400">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{securityMetrics?.successfulLoginsToday || 0}</p>
              <p className="text-sm text-gray-400">Logins Today</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              securityMetrics?.failedLogins24h > 10 ? 'bg-red-500/20' : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                securityMetrics?.failedLogins24h > 10 ? 'text-red-500' : 'text-yellow-500'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{securityMetrics?.failedLogins24h || 0}</p>
              <p className="text-sm text-gray-400">Failed Logins (24h)</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              securityMetrics?.lockedAccounts > 0 ? 'bg-red-500/20' : 'bg-green-500/20'
            }`}>
              <XCircle className={`w-5 h-5 ${
                securityMetrics?.lockedAccounts > 0 ? 'text-red-500' : 'text-green-500'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{securityMetrics?.lockedAccounts || 0}</p>
              <p className="text-sm text-gray-400">Locked Accounts</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{securityMetrics?.signupsToday || 0}</p>
              <p className="text-sm text-gray-400">New Signups Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Recent Security Events</h2>
          <p className="text-sm text-gray-400">Latest security-related activities</p>
        </div>

        <div className="p-4">
          {securityMetrics?.recentEvents?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No security events recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {securityMetrics?.recentEvents?.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getActionIcon(event.action)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(event.action)}`}>
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        <span className="text-white">{event.userId?.name || 'Unknown'}</span>
                        {' '}• IP: {event.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Security Recommendations</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Encourage all users to enable Two-Factor Authentication
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Review failed login attempts regularly for suspicious patterns
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Ensure locked accounts are reviewed and addressed promptly
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Monitor unusual activity during off-hours
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AuditLogsPage;
