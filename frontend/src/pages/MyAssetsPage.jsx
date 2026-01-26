import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Calendar, Tag, AlertTriangle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const MyAssetsPage = () => {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAssets = async () => {
      try {
        const response = await api.get(`/assets/assigned/${user._id}`);
        setAssets(response.data);
      } catch (error) {
        toast.error('Failed to load your assets');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAssets();
  }, [user._id]);

  const getConditionBadge = (condition) => {
    const styles = {
      New: 'bg-green-500/20 text-green-400',
      Excellent: 'bg-blue-500/20 text-blue-400',
      Good: 'bg-teal-500/20 text-teal-400',
      Fair: 'bg-yellow-500/20 text-yellow-400',
      Damaged: 'bg-red-500/20 text-red-400',
    };
    return styles[condition] || 'bg-gray-500/20 text-gray-400';
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
        <h1 className="text-2xl font-bold text-white">My Assets</h1>
        <p className="text-gray-400">Assets currently assigned to you</p>
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No assets assigned</h2>
          <p className="text-gray-400 mb-6">
            You don't have any IT assets assigned to you yet
          </p>
          <Link
            to="/assets"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Package className="w-5 h-5" />
            Request Assets
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Link
              key={asset._id}
              to={`/assets/${asset._id}`}
              className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 transition-colors"
            >
              {/* Asset Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  {asset.image ? (
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{asset.name}</h3>
                  <p className="text-sm text-gray-400">{asset.category}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getConditionBadge(asset.condition)}`}>
                    {asset.condition}
                  </span>
                </div>
              </div>

              {/* Asset Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Tag className="w-4 h-4" />
                  <span>{asset.assetTag}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{asset.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Since {new Date(asset.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Report Issue Button */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Link
                  to="/support"
                  state={{ assetId: asset._id, assetName: asset.name }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Issue
                </Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAssetsPage;
