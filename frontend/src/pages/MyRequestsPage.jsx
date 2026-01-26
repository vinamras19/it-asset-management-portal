import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Loader,
} from 'lucide-react';
import useRequestStore from '../stores/requestStore';
import toast from 'react-hot-toast';

const MyRequestsPage = () => {
  const { requests, fetchMyRequests, cancelRequest, isLoading } = useRequestStore();
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleCancel = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    setCancelling(requestId);
    try {
      await cancelRequest(requestId);
      toast.success('Request cancelled');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'Fulfilled':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'Cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      Rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      Fulfilled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'text-gray-400',
      Normal: 'text-blue-400',
      High: 'text-orange-400',
      Urgent: 'text-red-400',
    };
    return colors[priority] || 'text-gray-400';
  };

  const stats = {
    pending: requests.filter((r) => r.status === 'Pending').length,
    approved: requests.filter((r) => r.status === 'Approved').length,
    fulfilled: requests.filter((r) => r.status === 'Fulfilled').length,
    rejected: requests.filter((r) => r.status === 'Rejected').length,
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
      <div>
        <h1 className="text-2xl font-bold text-white">My Requests</h1>
        <p className="text-gray-400">Track your asset procurement requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-sm text-gray-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.fulfilled}</p>
              <p className="text-sm text-gray-400">Fulfilled</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.rejected}</p>
              <p className="text-sm text-gray-400">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No requests yet</h2>
          <p className="text-gray-400 mb-6">
            You haven't submitted any asset requests yet
          </p>
          <Link
            to="/assets"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Package className="w-5 h-5" />
            Browse Assets
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request._id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              {/* Request Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() =>
                  setExpandedRequest(expandedRequest === request._id ? null : request._id)
                }
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-white">{request.requestNumber}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(request.createdAt).toLocaleDateString()} •{' '}
                      {request.assets?.length} item(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                  <p className="font-semibold text-white">
                    ${request.totalAmount?.toLocaleString()}
                  </p>
                  {expandedRequest === request._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRequest === request._id && (
                <div className="border-t border-gray-700 p-4">
                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Items</h4>
                    <div className="space-y-2">
                      {request.assets?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-white">{item.asset?.name || 'Unknown Asset'}</p>
                              <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-white">
                            ${(item.priceAtRequest * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {request.justification && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">
                          Justification
                        </h4>
                        <p className="text-white">{request.justification}</p>
                      </div>
                    )}
                    {request.deliveryLocation?.building && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">
                          Delivery Location
                        </h4>
                        <p className="text-white">
                          {request.deliveryLocation.building}
                          {request.deliveryLocation.floor &&
                            `, Floor ${request.deliveryLocation.floor}`}
                          {request.deliveryLocation.desk &&
                            `, Desk ${request.deliveryLocation.desk}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason */}
                  {request.status === 'Rejected' && request.rejectionReason && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                      <h4 className="text-sm font-medium text-red-400 mb-1">
                        Rejection Reason
                      </h4>
                      <p className="text-gray-300">{request.rejectionReason}</p>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {request.status === 'Pending' && (
                    <button
                      onClick={() => handleCancel(request._id)}
                      disabled={cancelling === request._id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {cancelling === request._id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Cancel Request
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
