import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Trash2,
  Loader,
} from 'lucide-react';
import useTicketStore from '../../stores/ticketStore';
import toast from 'react-hot-toast';

const ManageTicketsPage = () => {
  const { tickets, fetchTickets, updateTicketStatus, deleteTicket, isLoading } = useTicketStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusUpdate = async (ticketId, newStatus, resolution = '') => {
    setProcessingId(ticketId);
    try {
      await updateTicketStatus(ticketId, newStatus, resolution);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await deleteTicket(ticketId);
      toast.success('Ticket deleted');
    } catch (error) {
      toast.error('Delete failed');
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
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'Closed':
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
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

  const statuses = ['Open', 'In Progress', 'Waiting on User', 'Resolved', 'Closed'];

  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const stats = {
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved').length,
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
        <h1 className="text-2xl font-bold text-white">Manage Tickets</h1>
        <p className="text-gray-400">Review and resolve support tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'yellow' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'blue' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'green' },
          { label: 'Total', value: tickets.length, icon: HelpCircle, color: 'gray' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', ...statuses].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No tickets found</h2>
          <p className="text-gray-400">
            {statusFilter === 'all' ? 'No support tickets have been created' : `No ${statusFilter.toLowerCase()} tickets`}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Ticket</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Category</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Created</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-700/50">
                  <td className="p-4">
                    <Link to={`/support/${ticket._id}`} className="font-medium text-white hover:text-blue-400">
                      {ticket.title}
                    </Link>
                    <p className="text-sm text-gray-400">{ticket.ticketNumber}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-white">{ticket.user?.name}</p>
                    <p className="text-sm text-gray-400">{ticket.user?.email}</p>
                  </td>
                  <td className="p-4 text-gray-300">{ticket.category}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={ticket.status}
                      onChange={(e) => {
                        if (e.target.value === 'Resolved') {
                          const resolution = prompt('Enter resolution:');
                          if (resolution) {
                            handleStatusUpdate(ticket._id, e.target.value, resolution);
                          }
                        } else {
                          handleStatusUpdate(ticket._id, e.target.value);
                        }
                      }}
                      disabled={processingId === ticket._id}
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${getStatusColor(ticket.status)}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/support/${ticket._id}`}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ticket._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default ManageTicketsPage;
