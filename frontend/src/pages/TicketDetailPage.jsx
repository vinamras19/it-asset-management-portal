import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Package,
  Send,
  Loader,
  AlertCircle,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import useTicketStore from '../stores/ticketStore';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTicket, fetchTicketById, addComment, isLoading, clearCurrentTicket } = useTicketStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTicketById(id).catch(() => {
      toast.error('Ticket not found');
      navigate('/support');
    });

    return () => clearCurrentTicket();
  }, [id, fetchTicketById, navigate, clearCurrentTicket]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(id, newComment);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
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
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Waiting on User': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      Resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      Closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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

  if (isLoading || !currentTicket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/support')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Support
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">{currentTicket.ticketNumber}</p>
                <h1 className="text-xl font-bold text-white">{currentTicket.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(currentTicket.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentTicket.status)}`}>
                  {currentTicket.status}
                </span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{currentTicket.description}</p>
            </div>

            {/* Resolution */}
            {currentTicket.resolution && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-1">Resolution</h4>
                <p className="text-gray-300">{currentTicket.resolution}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">
                Comments ({currentTicket.comments?.length || 0})
              </h2>
            </div>

            <div className="p-4">
              {/* Comments List */}
              {currentTicket.comments?.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {currentTicket.comments.map((comment, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-white">
                          {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {comment.user?.name || 'Unknown'}
                          </span>
                          {comment.user?.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              Admin
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-300">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No comments yet</p>
              )}

              {/* Add Comment Form */}
              {currentTicket.status !== 'Closed' && (
                <form onSubmit={handleAddComment} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !newComment.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {submitting ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Details */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Category</p>
                <p className="text-white">{currentTicket.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Priority</p>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(currentTicket.priority)}`}>
                  {currentTicket.priority}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">Created</p>
                <p className="text-white">
                  {new Date(currentTicket.createdAt).toLocaleString()}
                </p>
              </div>
              {currentTicket.resolvedAt && (
                <div>
                  <p className="text-sm text-gray-400">Resolved</p>
                  <p className="text-white">
                    {new Date(currentTicket.resolvedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reporter Info */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Reporter</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{currentTicket.user?.name}</p>
                <p className="text-sm text-gray-400">{currentTicket.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Related Asset */}
          {currentTicket.asset && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Related Asset</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{currentTicket.asset?.name}</p>
                  <p className="text-sm text-gray-400">{currentTicket.asset?.serialNumber}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
