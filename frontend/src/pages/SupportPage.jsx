import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  X,
  Loader,
} from 'lucide-react';
import useTicketStore from '../stores/ticketStore';
import useAssetStore from '../stores/assetStore';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const SupportPage = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { tickets, fetchTickets, createTicket, isLoading } = useTicketStore();
  const { assets, fetchAssets } = useAssetStore();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General Inquiry',
    priority: 'Medium',
    assetId: '',
  });

  // from ticket model
  const categories = [
    'Hardware Issue',
    'Software Issue',
    'Damage Report',
    'Request Return',
    'Upgrade Request',
    'General Inquiry',
    'Other',
  ];

  useEffect(() => {
    fetchTickets();
    fetchAssets();
  }, [fetchTickets, fetchAssets]);

  // Pre-fill if coming from asset page
  useEffect(() => {
    if (location.state?.assetId) {
      setFormData((prev) => ({
        ...prev,
        assetId: location.state.assetId,
        category: 'Hardware Issue',
        title: location.state.assetName ? `Issue with ${location.state.assetName}` : '',
      }));
      setShowModal(true);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Asset is required for all categories EXCEPT General Inquiry (per backend)
    if (formData.category !== 'General Inquiry' && !formData.assetId) {
      toast.error('Please select an asset for this issue type');
      return;
    }

    setSubmitting(true);
    try {
      await createTicket({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        assetId: formData.assetId || undefined,
      });
      toast.success('Ticket created successfully');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'General Inquiry',
        priority: 'Medium',
        assetId: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'Waiting on User':
        return <MessageSquare className="w-5 h-5 text-orange-400" />;
      case 'Resolved':
      case 'Closed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-yellow-500/20 text-yellow-400',
      'In Progress': 'bg-blue-500/20 text-blue-400',
      'Waiting on User': 'bg-orange-500/20 text-orange-400',
      Resolved: 'bg-green-500/20 text-green-400',
      Closed: 'bg-gray-500/20 text-gray-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-500/20 text-gray-400',
      Medium: 'bg-blue-500/20 text-blue-400',
      High: 'bg-orange-500/20 text-orange-400',
      Critical: 'bg-red-500/20 text-red-400',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400';
  };

  // Filter tickets for current user : non-admin view
  const myTickets = tickets.filter((t) => t.user?._id === user?._id);

  const stats = {
    open: myTickets.filter((t) => t.status === 'Open').length,
    inProgress: myTickets.filter((t) => t.status === 'In Progress').length,
    resolved: myTickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-gray-400">Get help with IT issues and requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.open}</p>
              <p className="text-sm text-gray-400">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              <p className="text-sm text-gray-400">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.resolved}</p>
              <p className="text-sm text-gray-400">Resolved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {myTickets.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No tickets yet</h2>
          <p className="text-gray-400 mb-6">
            Create a support ticket if you need help with IT issues
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Ticket</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Category</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {myTickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-700/50">
                  <td className="p-4">
                    <Link
                      to={`/support/${ticket._id}`}
                      className="font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-sm text-gray-400">{ticket.ticketNumber}</p>
                  </td>
                  <td className="p-4 text-gray-300">{ticket.category}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Create Support Ticket</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Related Asset{' '}
                  {formData.category !== 'General Inquiry' && '*'}
                </label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select an asset</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
                {formData.category !== 'General Inquiry' && (
                  <p className="text-xs text-gray-500 mt-1">Required for this category</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                />
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
                  {submitting ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create Ticket'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
