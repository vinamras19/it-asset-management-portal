import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Users,
  FileText,
  HelpCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assets: { total: 0, available: 0, assigned: 0, maintenance: 0 },
    requests: { pending: 0, approved: 0, rejected: 0 },
    tickets: { open: 0, inProgress: 0, resolved: 0 },
    users: { total: 0 },
    totalValue: 0,
  });
  const [assetStats, setAssetStats] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [securityMetrics, setSecurityMetrics] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [assetsRes, requestsRes, ticketsRes, usersRes, requestStatsRes, ticketStatsRes, securityRes] = await Promise.all([
          api.get('/assets'),
          api.get('/requests/admin/all'),
          api.get('/tickets'),
          api.get('/auth/users'),
          api.get('/requests/admin/stats'),
          api.get('/tickets/admin/stats'),
          api.get('/audit/security-metrics'),
        ]);

        const assets = assetsRes.data;
        const requests = requestsRes.data;
        const tickets = ticketsRes.data;

        // Stats calculation
        const available = assets.filter((a) => a.status === 'available').length;
        const assigned = assets.filter((a) => a.status === 'assigned').length;
        const maintenance = assets.filter((a) => a.status === 'maintenance').length;
        const totalValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

        const pendingRequests = requests.filter((r) => r.status === 'Pending').length;
        const approvedRequests = requests.filter((r) => r.status === 'Approved').length;

        const openTickets = tickets.filter((t) => t.status === 'Open').length;
        const inProgressTickets = tickets.filter((t) => t.status === 'In Progress').length;

        setStats({
          assets: { total: assets.length, available, assigned, maintenance },
          requests: { pending: pendingRequests, approved: approvedRequests },
          tickets: { open: openTickets, inProgress: inProgressTickets },
          users: { total: usersRes.data.length },
          totalValue,
        });

        const categoryGroups = assets.reduce((acc, asset) => {
          acc[asset.category] = (acc[asset.category] || 0) + 1;
          return acc;
        }, {});
        setAssetStats(Object.entries(categoryGroups).map(([name, value]) => ({ name, value })));

        setRecentRequests(requests.slice(0, 5));
        setRecentTickets(tickets.slice(0, 5));
        setSecurityMetrics(securityRes.data);
      } catch (error) {
        console.error('Dashboard error:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500/20 text-yellow-400',
      Approved: 'bg-green-500/20 text-green-400',
      Rejected: 'bg-red-500/20 text-red-400',
      Open: 'bg-yellow-500/20 text-yellow-400',
      'In Progress': 'bg-blue-500/20 text-blue-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
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
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of your IT asset management system</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/assets" className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.assets.total}</p>
          <p className="text-sm text-gray-400">Total Assets</p>
          <p className="text-xs text-green-400 mt-1">{stats.assets.available} available</p>
        </Link>

        <Link to="/admin/requests" className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-500" />
            </div>
            {stats.requests.pending > 0 && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                {stats.requests.pending} pending
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white">{stats.requests.pending}</p>
          <p className="text-sm text-gray-400">Pending Requests</p>
        </Link>

        <Link to="/admin/tickets" className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-500" />
            </div>
            {stats.tickets.open > 0 && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                {stats.tickets.open} open
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white">{stats.tickets.open + stats.tickets.inProgress}</p>
          <p className="text-sm text-gray-400">Active Tickets</p>
        </Link>

        <Link to="/admin/users" className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.users.total}</p>
          <p className="text-sm text-gray-400">Total Users</p>
        </Link>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Asset Value</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {stats.assets.total > 0
                  ? ((stats.assets.assigned / stats.assets.total) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-gray-400">Utilization Rate</p>
            </div>
          </div>
        </div>

        {securityMetrics && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                securityMetrics.failedLogins24h > 10 ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  securityMetrics.failedLogins24h > 10 ? 'text-red-500' : 'text-green-500'
                }`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{securityMetrics.failedLogins24h}</p>
                <p className="text-sm text-gray-400">Failed Logins (24h)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Distribution */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Assets by Category</h2>
          {assetStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={assetStats}>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No asset data</p>
          )}
        </div>

        {/* Asset Status */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Asset Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Available', value: stats.assets.available },
                  { name: 'Assigned', value: stats.assets.assigned },
                  { name: 'Maintenance', value: stats.assets.maintenance },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {[0, 1, 2].map((index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-400">Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-400">Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Recent Requests</h2>
            <Link to="/admin/requests" className="text-sm text-blue-500 hover:text-blue-400">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No requests</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{request.requestNumber}</p>
                      <p className="text-sm text-gray-400">{request.user?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="font-semibold text-white">Recent Tickets</h2>
            <Link to="/admin/tickets" className="text-sm text-blue-500 hover:text-blue-400">
              View all
            </Link>
          </div>
          <div className="p-4">
            {recentTickets.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No tickets</p>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white truncate max-w-xs">{ticket.title}</p>
                      <p className="text-sm text-gray-400">{ticket.user?.name}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
