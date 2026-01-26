import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, FileText, HelpCircle, CheckCircle, TrendingUp, ArrowRight, Laptop } from 'lucide-react';
import api from '../lib/axios';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAssets: 0, availableAssets: 0, assignedAssets: 0 });
  const [myRequests, setMyRequests] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [myAssets, setMyAssets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [assetsRes, requestsRes, ticketsRes, assignedRes] = await Promise.all([
          api.get('/assets'),
          api.get('/requests/my'),
          api.get('/tickets'),
          api.get(`/assets/assigned/${user._id}`),
        ]);

        const assets = assetsRes.data;
        setStats({
          totalAssets: assets.length,
          availableAssets: assets.filter((a) => a.status === 'available').length,
          assignedAssets: assets.filter((a) => a.status === 'assigned').length,
        });
        setMyRequests(requestsRes.data.slice(0, 5));
        setMyTickets(ticketsRes.data.slice(0, 5));
        setMyAssets(assignedRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user._id]);

  const getStatusColor = (status) => ({
    Pending: 'bg-yellow-500/20 text-yellow-400', Approved: 'bg-green-500/20 text-green-400',
    Rejected: 'bg-red-500/20 text-red-400', Fulfilled: 'bg-blue-500/20 text-blue-400',
    Cancelled: 'bg-gray-500/20 text-gray-400', Open: 'bg-yellow-500/20 text-yellow-400',
    'In Progress': 'bg-blue-500/20 text-blue-400', Resolved: 'bg-green-500/20 text-green-400',
    Closed: 'bg-gray-500/20 text-gray-400',
  }[status] || 'bg-gray-500/20 text-gray-400');

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  const statCards = [
    { title: 'Total Assets', value: stats.totalAssets, icon: Package, color: 'blue', link: '/assets' },
    { title: 'Available', value: stats.availableAssets, icon: CheckCircle, color: 'green', link: '/assets' },
    { title: 'Assigned', value: stats.assignedAssets, icon: TrendingUp, color: 'purple', link: '/assets' },
    { title: 'My Assets', value: myAssets.length, icon: Laptop, color: 'orange', link: '/my-assets' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-blue-100">Here's what's happening with your IT assets today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-500/20' : stat.color === 'green' ? 'bg-green-500/20' : stat.color === 'purple' ? 'bg-purple-500/20' : 'bg-orange-500/20'}`}>
                <stat.icon className={`w-5 h-5 ${stat.color === 'blue' ? 'text-blue-500' : stat.color === 'green' ? 'text-green-500' : stat.color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.title}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/assets" className="flex items-center gap-4 bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500 transition-colors">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center"><Package className="w-6 h-6 text-blue-500" /></div>
          <div><h3 className="font-medium text-white">Browse Assets</h3><p className="text-sm text-gray-400">View and request assets</p></div>
        </Link>
        <Link to="/requests" className="flex items-center gap-4 bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-green-500 transition-colors">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6 text-green-500" /></div>
          <div><h3 className="font-medium text-white">My Requests</h3><p className="text-sm text-gray-400">Track your requests</p></div>
        </Link>
        <Link to="/support" className="flex items-center gap-4 bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-colors">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center"><HelpCircle className="w-6 h-6 text-purple-500" /></div>
          <div><h3 className="font-medium text-white">Get Support</h3><p className="text-sm text-gray-400">Report issues</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="font-semibold text-white">Recent Requests</h2>
            <Link to="/requests" className="text-sm text-blue-500 hover:text-blue-400">View all</Link>
          </div>
          <div className="p-5">
            {myRequests.length === 0 ? (
              <div className="text-center py-8"><FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No requests yet</p></div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div><p className="font-medium text-white">{r.requestNumber}</p><p className="text-sm text-gray-400">{r.assets?.length} item(s)</p></div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="font-semibold text-white">Support Tickets</h2>
            <Link to="/support" className="text-sm text-blue-500 hover:text-blue-400">View all</Link>
          </div>
          <div className="p-5">
            {myTickets.length === 0 ? (
              <div className="text-center py-8"><HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No tickets</p></div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((t) => (
                  <Link key={t._id} to={`/support/${t._id}`} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                    <div><p className="font-medium text-white">{t.title}</p><p className="text-sm text-gray-400">{t.ticketNumber}</p></div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {myAssets.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="font-semibold text-white">My Assigned Assets</h2>
            <Link to="/my-assets" className="text-sm text-blue-500 hover:text-blue-400">View all</Link>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssets.slice(0, 3).map((a) => (
              <Link key={a._id} to={`/assets/${a._id}`} className="p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-blue-500" /></div>
                  <div><p className="font-medium text-white">{a.name}</p><p className="text-sm text-gray-400">{a.assetTag}</p></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
