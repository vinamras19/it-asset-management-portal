import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, ArrowLeft, Calendar, MapPin, User, Tag, Hash, Clock, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import useAssetStore from '../stores/assetStore';
import useRequestStore from '../stores/requestStore';
import toast from 'react-hot-toast';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentAsset, fetchAssetById, isLoading, clearCurrentAsset } = useAssetStore();
  const { cart, addToCart } = useRequestStore();

  useEffect(() => {
    fetchAssetById(id).catch(() => { toast.error('Asset not found'); navigate('/assets'); });
    return () => clearCurrentAsset();
  }, [id, fetchAssetById, navigate, clearCurrentAsset]);

  const handleAddToCart = () => {
    if (currentAsset.status !== 'available') { toast.error('Not available'); return; }
    addToCart(currentAsset);
    toast.success(`${currentAsset.name} added to cart`);
  };

  const isInCart = cart.some((item) => item.asset._id === currentAsset?._id);

  const getStatusBadge = (status) => ({
    available: 'bg-green-500/20 text-green-400 border-green-500/30', assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', retired: 'bg-gray-500/20 text-gray-400 border-gray-500/30', lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  }[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

  const getConditionBadge = (condition) => ({
    New: 'bg-green-500/20 text-green-400', Excellent: 'bg-blue-500/20 text-blue-400', Good: 'bg-teal-500/20 text-teal-400', Fair: 'bg-yellow-500/20 text-yellow-400', Damaged: 'bg-red-500/20 text-red-400',
  }[condition] || 'bg-gray-500/20 text-gray-400');

  if (isLoading || !currentAsset) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /> Back</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="h-64 bg-gray-700 flex items-center justify-center">
              {currentAsset.image ? <img src={currentAsset.image} alt={currentAsset.name} className="w-full h-full object-cover" /> : <Package className="w-24 h-24 text-gray-600" />}
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{currentAsset.name}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(currentAsset.status)}`}>{currentAsset.status}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionBadge(currentAsset.condition)}`}>{currentAsset.condition}</span>
                  </div>
                </div>
                <div className="text-right"><p className="text-3xl font-bold text-white">${currentAsset.purchasePrice?.toLocaleString()}</p><p className="text-sm text-gray-400">Purchase Price</p></div>
              </div>
              {currentAsset.description && <p className="text-gray-300 mb-6">{currentAsset.description}</p>}
              {currentAsset.status === 'available' ? (
                <button onClick={handleAddToCart} disabled={isInCart} className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isInCart ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  {isInCart ? <><CheckCircle className="w-5 h-5" /> Added to Cart</> : <><Plus className="w-5 h-5" /> Add to Cart</>}
                </button>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /><p className="text-yellow-400">This asset is {currentAsset.status} and cannot be requested.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Asset Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><Tag className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Asset Tag</p><p className="font-medium text-white">{currentAsset.assetTag}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><Hash className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Serial Number</p><p className="font-medium text-white">{currentAsset.serialNumber}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><Package className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Category</p><p className="font-medium text-white">{currentAsset.category}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><MapPin className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Location</p><p className="font-medium text-white">{currentAsset.location}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><Calendar className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Purchase Date</p><p className="font-medium text-white">{new Date(currentAsset.purchaseDate).toLocaleDateString()}</p></div></div>
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><Clock className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Useful Life</p><p className="font-medium text-white">{currentAsset.usefulLife} years</p></div></div>
              {currentAsset.assignedTo && <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg sm:col-span-2"><User className="w-5 h-5 text-gray-400" /><div><p className="text-sm text-gray-400">Assigned To</p><p className="font-medium text-white">{currentAsset.assignedTo.name} ({currentAsset.assignedTo.email})</p></div></div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
            <Link to="/support" state={{ assetId: currentAsset._id, assetName: currentAsset.name }} className="block w-full text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors">Report an Issue</Link>
          </div>

          {currentAsset.history && currentAsset.history.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">History</h3>
              <div className="space-y-4">
                {currentAsset.history.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500" /><div><p className="text-sm text-white">{entry.action}</p><p className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()} • {entry.user}</p></div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
