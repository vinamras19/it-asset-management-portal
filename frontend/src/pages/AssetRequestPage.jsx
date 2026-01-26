import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  Trash2,
  Plus,
  Minus,
  Package,
  Loader,
  ArrowLeft,
} from 'lucide-react';
import useRequestStore from '../stores/requestStore';
import toast from 'react-hot-toast';

const AssetRequestPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateCartQuantity, clearCart, createRequest } = useRequestStore();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    justification: '',
    priority: 'Normal',
    deliveryLocation: {
      building: '',
      floor: '',
      desk: '',
    },
  });

  const total = cart.reduce((sum, item) => {
    const price = item.asset?.purchasePrice || 0;
    return sum + price * item.quantity;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('No assets selected for request');
      return;
    }

    if (!formData.deliveryLocation.building) {
      toast.error('Please enter a delivery location');
      return;
    }

    setSubmitting(true);
    try {
      await createRequest(formData);
      toast.success('Asset request submitted successfully!');
      navigate('/requests');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/assets" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">New Asset Request</h1>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No assets selected</h2>
          <p className="text-gray-400 mb-6">Browse the asset catalog and add items to your request</p>
          <Link
            to="/assets"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Package className="w-5 h-5" />
            Browse Asset Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/assets" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Asset Request</h1>
          <p className="text-gray-400">{cart.length} asset(s) selected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Assets */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Selected Assets</h2>
          {cart.map((item) => (
            <div
              key={item.asset._id}
              className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex gap-4"
            >
              <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.asset.image ? (
                  <img
                    src={item.asset.image}
                    alt={item.asset.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-500" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-white">{item.asset.name}</h3>
                <p className="text-sm text-gray-400">{item.asset.category}</p>
                <p className="text-xs text-gray-500 mt-1">{item.asset.assetTag}</p>
                <p className="text-lg font-medium text-white mt-1">
                  ${item.asset.purchasePrice?.toLocaleString()} per unit
                </p>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeFromCart(item.asset._id)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateCartQuantity(item.asset._id, Math.max(1, item.quantity - 1))
                    }
                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.asset._id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            Remove all assets
          </button>
        </div>

        {/* Request Form */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 h-fit">
          <h2 className="text-lg font-semibold text-white mb-4">Request Details</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Business Justification
              </label>
              <textarea
                value={formData.justification}
                onChange={(e) =>
                  setFormData({ ...formData, justification: e.target.value })
                }
                placeholder="Explain why you need these assets..."
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Low">Low - No rush</option>
                <option value="Normal">Normal - Standard processing</option>
                <option value="High">High - Needed soon</option>
                <option value="Urgent">Urgent - Business critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delivery Location *
              </label>
              <input
                type="text"
                placeholder="Building / Office"
                value={formData.deliveryLocation.building}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryLocation: { ...formData.deliveryLocation, building: e.target.value },
                  })
                }
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Floor"
                  value={formData.deliveryLocation.floor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryLocation: { ...formData.deliveryLocation, floor: e.target.value },
                    })
                  }
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Desk / Cubicle"
                  value={formData.deliveryLocation.desk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryLocation: { ...formData.deliveryLocation, desk: e.target.value },
                    })
                  }
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-300">Estimated Value</span>
                <span className="text-white">${total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Subject to manager approval
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request for Approval'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetRequestPage;
