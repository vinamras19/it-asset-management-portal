import { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader,
} from 'lucide-react';
import useRequestStore from '../../stores/requestStore';
import toast from 'react-hot-toast';

const ManageRequestsPage = () => {
  const { allRequests, fetchAllRequests, updateRequestStatus, isLoading } = useRequestStore();
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [actionData, setActionData] = useState({ reason: '', adminNotes: '' });

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const handleStatusUpdate = async (requestId, newStatus) => {
    setProcessingId(requestId);
    try {
      await updateRequestStatus(requestId, newStatus, actionData.reason, actionData.adminNotes);
      toast.success(`Request ${newStatus.toLowerCase()}`);
      setActionData({ reason: '', adminNotes: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setProcessingId(null);
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

  const filteredRequests = statusFilter === 'all'
    ? allRequests
    : allRequests.filter((r) => r.status === statusFilter);

  const stats = {
    pending: allRequests.filter((r) => r.status === 'Pending').length,
    approved: allRequests.filter((r) => r.status === 'Approved').length,
    fulfilled: allRequests.filter((r) => r.status === 'Fulfilled').length,
    rejected: allRequests.filter((r) => r.status === 'Rejected').length,
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
        <h1 className="text-2xl font-bold text-white">Manage Requests</h1>
        <p className="text-gray-400">Review and process asset procurement requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: stats.pending, color: 'yellow' },
          { label: 'Approved', value: stats.approved, color: 'green' },
          { label: 'Fulfilled', value: stats.fulfilled, color: 'blue' },
          { label: 'Rejected', value: stats.rejected, color: 'red' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(stat.label)}
            className={`bg-gray-800 rounded-xl border p-4 text-left transition-colors ${
              statusFilter === stat.label ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'Pending', 'Approved', 'Fulfilled', 'Rejected', 'Cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No requests found</h2>
          <p className="text-gray-400">
            {statusFilter === 'all' ? 'No requests have been made yet' : `No ${statusFilter.toLowerCase()} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request._id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {/* Request Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="font-medium text-white">{request.requestNumber}</p>
                    <p className="text-sm text-gray-400">
                      {request.user?.name} • {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <p className="font-semibold text-white">${request.totalAmount?.toLocaleString()}</p>
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
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Requested Items</h4>
                    <div className="space-y-2">
                      {request.assets?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-white">{item.asset?.name || 'Unknown Asset'}</p>
                              <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="text-white">${(item.priceAtRequest * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {request.justification && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Justification</h4>
                        <p className="text-white">{request.justification}</p>
                      </div>
                    )}
                    {request.deliveryLocation?.building && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Delivery Location</h4>
                        <p className="text-white">
                          {request.deliveryLocation.building}
                          {request.deliveryLocation.floor && `, Floor ${request.deliveryLocation.floor}`}
                          {request.deliveryLocation.desk && `, Desk ${request.deliveryLocation.desk}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {request.status === 'Pending' && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Admin Notes</label>
                        <input
                          type="text"
                          value={actionData.adminNotes}
                          onChange={(e) => setActionData({ ...actionData, adminNotes: e.target.value })}
                          placeholder="Add internal notes..."
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(request._id, 'Approved')}
                          disabled={processingId === request._id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {processingId === request._id ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason) {
                              setActionData({ ...actionData, reason });
                              handleStatusUpdate(request._id, 'Rejected');
                            }
                          }}
                          disabled={processingId === request._id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fulfill Action */}
                  {request.status === 'Approved' && (
                    <div className="border-t border-gray-700 pt-4">
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'Fulfilled')}
                        disabled={processingId === request._id}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {processingId === request._id ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Package className="w-5 h-5" />
                            Mark as Fulfilled (Assign Assets)
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Show rejection reason if rejected */}
                  {request.status === 'Rejected' && request.rejectionReason && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-red-400 mb-1">Rejection Reason</h4>
                      <p className="text-gray-300">{request.rejectionReason}</p>
                    </div>
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

export default ManageRequestsPage;
