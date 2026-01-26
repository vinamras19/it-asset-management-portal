import { useState } from 'react';
import {
  FileText,
  Download,
  Package,
  HelpCircle,
  Shield,
  Loader,
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const ReportsPage = () => {
  const [generating, setGenerating] = useState(null);

  const reports = [
    {
      id: 'assets',
      title: 'Asset Inventory Report',
      description: 'Complete list of all IT assets with their status, location, and assigned users',
      icon: Package,
      color: 'blue',
      endpoint: '/reports/assets',
    },
    {
      id: 'tickets',
      title: 'Ticket Summary Report',
      description: 'Overview of all support tickets grouped by status and priority',
      icon: HelpCircle,
      color: 'orange',
      endpoint: '/reports/tickets',
    },
    {
      id: 'audit',
      title: 'Security Audit Report',
      description: 'Last 500 security events including logins, password changes, and suspicious activities',
      icon: Shield,
      color: 'red',
      endpoint: '/reports/audit',
    },
  ];

  const handleGenerateReport = async (report) => {
    setGenerating(report.id);
    try {
      const response = await api.get(report.endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.id}_report_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-500',
      orange: 'bg-orange-500/20 text-orange-500',
      red: 'bg-red-500/20 text-red-500',
      green: 'bg-green-500/20 text-green-500',
    };
    return colors[color] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-gray-400">Generate and download system reports</p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getColorClasses(report.color)}`}>
              <report.icon className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{report.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{report.description}</p>

            <button
              onClick={() => handleGenerateReport(report)}
              disabled={generating === report.id}
              className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {generating === report.id ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">About Reports</h3>
            <p className="text-gray-400 mb-4">
              Reports are generated in PDF format and contain real-time data from the system.
              They are useful for audits, compliance checks, and management reviews.
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Reports are generated with the current date and your username</li>
              <li>• Large reports may take a few seconds to generate</li>
              <li>• PDF files can be printed or shared as needed</li>
              <li>• For CSV export of assets, use the Export button in Manage Assets</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
