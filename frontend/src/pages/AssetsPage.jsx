import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Grid, List, Plus, CheckCircle, ClipboardList } from 'lucide-react';
import useAssetStore from '../stores/assetStore';
import useRequestStore from '../stores/requestStore';
import toast from 'react-hot-toast';

const AssetsPage = () => {
  const { assets, fetchAssets, isLoading } = useAssetStore();
  const { cart, addToCart } = useRequestStore();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const categories = ['all', ...new Set(assets.map((a) => a.category))];
  const statuses = ['all', 'available', 'assigned', 'maintenance', 'retired'];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.assetTag?.toLowerCase().includes(searchQuery.toLowerCase()) || asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddToRequest = (asset) => {
    if (asset.status !== 'available') { toast.error('Asset not available'); return; }
    addToCart(asset);
    toast.success(`${asset.name} added to request`);
  };

  const isInRequest = (assetId) => cart.some((item) => item.asset._id === assetId);

  const getStatusBadge = (status) => ({
    available: 'bg-green-500/20 text-green-400', assigned: 'bg-blue-500/20 text-blue-400',
    maintenance: 'bg-yellow-500/20 text-yellow-400', retired: 'bg-gray-500/20 text-gray-400', lost: 'bg-red-500/20 text-red-400',
  }[status] || 'bg-gray-500/20 text-gray-400');

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">Asset Catalog</h1><p className="text-gray-400">Browse and request IT assets</p></div>
        {cart.length > 0 && (
          <Link to="/asset-request" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <ClipboardList className="w-5 h-5" /> View Request ({cart.length})
          </Link>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-11 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            {categories.map((cat) => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}><Grid className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}><List className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      <p className="text-gray-400 text-sm">Showing {filteredAssets.length} of {assets.length} assets</p>

      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" /><h3 className="text-xl font-medium text-white mb-2">No assets found</h3><p className="text-gray-400">Try adjusting your search</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <div key={asset._id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
              <div className="h-40 bg-gray-700 flex items-center justify-center">
                {asset.image ? <img src={asset.image} alt={asset.name} className="w-full h-full object-cover" /> : <Package className="w-16 h-16 text-gray-600" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><Link to={`/assets/${asset._id}`} className="font-medium text-white hover:text-blue-400 transition-colors">{asset.name}</Link><p className="text-sm text-gray-400">{asset.assetTag}</p></div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(asset.status)}`}>{asset.status}</span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{asset.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">${asset.purchasePrice?.toLocaleString()}</span>
                  {asset.status === 'available' && (
                    <button onClick={() => handleAddToRequest(asset)} disabled={isInRequest(asset._id)} className={`p-2 rounded-lg transition-colors ${isInRequest(asset._id) ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      {isInRequest(asset._id) ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50"><tr>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Asset</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Category</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Price</th>
              <th className="text-left p-4 text-sm font-medium text-gray-400">Action</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAssets.map((asset) => (
                <tr key={asset._id} className="hover:bg-gray-700/50">
                  <td className="p-4"><Link to={`/assets/${asset._id}`} className="font-medium text-white hover:text-blue-400">{asset.name}</Link><p className="text-sm text-gray-400">{asset.assetTag}</p></td>
                  <td className="p-4 text-gray-300">{asset.category}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(asset.status)}`}>{asset.status}</span></td>
                  <td className="p-4 text-white font-medium">${asset.purchasePrice?.toLocaleString()}</td>
                  <td className="p-4">
                    {asset.status === 'available' && <button onClick={() => handleAddToRequest(asset)} disabled={isInRequest(asset._id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInRequest(asset._id) ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{isInRequest(asset._id) ? 'Added' : 'Add'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;
