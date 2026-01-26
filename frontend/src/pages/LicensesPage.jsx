import { useEffect, useState } from 'react';
import { Key, Calendar, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const LicensesPage = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await api.get('/licenses');
        setLicenses(response.data);
      } catch (error) {
        toast.error('Failed to load licenses');
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  const isExpiringSoon = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < Date.now();
  };

  const getStatusBadge = (license) => {
    if (isExpired(license.expiryDate)) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
          <AlertTriangle className="w-3 h-3" />
          Expired
        </span>
      );
    }
    if (isExpiringSoon(license.expiryDate)) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
          <AlertTriangle className="w-3 h-3" />
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      Subscription: 'bg-blue-500/20 text-blue-400',
      Perpetual: 'bg-purple-500/20 text-purple-400',
      'Open Source': 'bg-green-500/20 text-green-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
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
        <h1 className="text-2xl font-bold text-white">Software Licenses</h1>
        <p className="text-gray-400">View available software licenses in your organization</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{licenses.length}</p>
              <p className="text-sm text-gray-400">Total Licenses</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {licenses.filter((l) => !isExpired(l.expiryDate)).length}
              </p>
              <p className="text-sm text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {licenses.filter((l) => isExpiringSoon(l.expiryDate)).length}
              </p>
              <p className="text-sm text-gray-400">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {licenses.filter((l) => isExpired(l.expiryDate)).length}
              </p>
              <p className="text-sm text-gray-400">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Licenses List */}
      {licenses.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No licenses found</h2>
          <p className="text-gray-400">
            Contact your administrator to add software licenses
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {licenses.map((license) => (
            <div
              key={license._id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Key className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{license.softwareName}</h3>
                    <p className="text-sm text-gray-400">{license.provider}</p>
                  </div>
                </div>
                {getStatusBadge(license)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Type</span>
                  <span className={`px-2 py-0.5 rounded ${getTypeColor(license.type)}`}>
                    {license.type}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Department</span>
                  <span className="text-white">{license.assignedToDept}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Seats
                  </span>
                  <span className="text-white">
                    {license.seatsUsed} / {license.seatsTotal}
                  </span>
                </div>

                {/* Seat Usage Bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      license.seatsUsed / license.seatsTotal > 0.9
                        ? 'bg-red-500'
                        : license.seatsUsed / license.seatsTotal > 0.7
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(license.seatsUsed / license.seatsTotal) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Expires
                  </span>
                  <span className={isExpired(license.expiryDate) ? 'text-red-400' : isExpiringSoon(license.expiryDate) ? 'text-yellow-400' : 'text-white'}>
                    {new Date(license.expiryDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Cost/Seat</span>
                  <span className="text-white font-medium">
                    ${license.costPerSeat?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LicensesPage;
