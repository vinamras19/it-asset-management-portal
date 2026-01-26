import { useEffect, useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  X,
  Loader,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const ManageLicensesPage = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    softwareName: '',
    provider: '',
    licenseKey: '',
    type: 'Subscription',
    seatsTotal: 1,
    seatsUsed: 0,
    costPerSeat: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    assignedToDept: 'General',
  });

  const licenseTypes = ['Subscription', 'Perpetual', 'Open Source'];
  const departments = ['General', 'Engineering', 'Sales', 'Marketing', 'HR'];

  useEffect(() => {
    fetchLicenses();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        seatsTotal: parseInt(formData.seatsTotal),
        seatsUsed: parseInt(formData.seatsUsed),
        costPerSeat: parseFloat(formData.costPerSeat),
      };

      await api.post('/licenses', payload);
      toast.success('License created successfully');
      setShowModal(false);
      setFormData({
        softwareName: '',
        provider: '',
        licenseKey: '',
        type: 'Subscription',
        seatsTotal: 1,
        seatsUsed: 0,
        costPerSeat: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        assignedToDept: 'General',
      });
      fetchLicenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create license');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this license?')) return;

    try {
      await api.delete(`/licenses/${id}`);
      toast.success('License deleted');
      setLicenses(licenses.filter((l) => l._id !== id));
    } catch (error) {
      toast.error('Failed to delete license');
    }
  };

  const isExpiringSoon = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < Date.now();
  };

  const getStatusBadge = (license) => {
    if (isExpired(license.expiryDate)) {
      return <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded"><AlertTriangle className="w-3 h-3" />Expired</span>;
    }
    if (isExpiringSoon(license.expiryDate)) {
      return <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded"><AlertTriangle className="w-3 h-3" />Expiring Soon</span>;
    }
    return <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded"><CheckCircle className="w-3 h-3" />Active</span>;
  };

  const getTypeColor = (type) => {
    const colors = {
      Subscription: 'bg-blue-500/20 text-blue-400',
      Perpetual: 'bg-purple-500/20 text-purple-400',
      'Open Source': 'bg-green-500/20 text-green-400',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400';
  };

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => !isExpired(l.expiryDate)).length,
    expiringSoon: licenses.filter((l) => isExpiringSoon(l.expiryDate)).length,
    totalCost: licenses.reduce((sum, l) => sum + (l.costPerSeat * l.seatsTotal), 0),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Licenses</h1>
          <p className="text-gray-400">Add and manage software licenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add License
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
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
              <p className="text-2xl font-bold text-white">{stats.active}</p>
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
              <p className="text-2xl font-bold text-white">{stats.expiringSoon}</p>
              <p className="text-sm text-gray-400">Expiring Soon</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${stats.totalCost.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      {licenses.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No licenses found</h2>
          <p className="text-gray-400 mb-6">Add your first software license to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add License
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Software</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Department</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Seats</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Expiry</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {licenses.map((license) => (
                <tr key={license._id} className="hover:bg-gray-700/50">
                  <td className="p-4">
                    <p className="font-medium text-white">{license.softwareName}</p>
                    <p className="text-sm text-gray-400">{license.provider}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(license.type)}`}>
                      {license.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{license.assignedToDept}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-white">{license.seatsUsed}/{license.seatsTotal}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(license.expiryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(license)}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(license._id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add License Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Add New License</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Software Name *</label>
                  <input
                    type="text"
                    value={formData.softwareName}
                    onChange={(e) => setFormData({ ...formData, softwareName: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Provider *</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">License Key *</label>
                <input
                  type="text"
                  value={formData.licenseKey}
                  onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value })}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {licenseTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <select
                    value={formData.assignedToDept}
                    onChange={(e) => setFormData({ ...formData, assignedToDept: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Total Seats</label>
                  <input
                    type="number"
                    value={formData.seatsTotal}
                    onChange={(e) => setFormData({ ...formData, seatsTotal: e.target.value })}
                    min="1"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Seats Used</label>
                  <input
                    type="number"
                    value={formData.seatsUsed}
                    onChange={(e) => setFormData({ ...formData, seatsUsed: e.target.value })}
                    min="0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cost/Seat ($)</label>
                  <input
                    type="number"
                    value={formData.costPerSeat}
                    onChange={(e) => setFormData({ ...formData, costPerSeat: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader className="w-5 h-5 animate-spin" /> : 'Create License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLicensesPage;
