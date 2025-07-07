// frontend/src/components/SystemLogViewer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Filter, XCircle, ArrowRight, Eye, RotateCcw, Check, BadgeCheck } from 'lucide-react';

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5004';

// Modal to show detailed changes for UPDATE actions
const LogDetailsModal = ({ isOpen, onClose, details }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-[70]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Change Details</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XCircle size={24} className="text-gray-600" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(details).map(([field, values]) => (
                <tr key={field}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-red-50 rounded-md">
                    <pre><code>{String(values.old)}</code></pre>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono bg-green-50 rounded-md">
                    <pre><code>{String(values.new)}</code></pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


function SystemLogViewer({ showMessage }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current_page: 1 });
  const [filters, setFilters] = useState({ entity_type: '', action_type: '' });
  const [loading, setLoading] = useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const entityTypes = ['Location', 'Rack', 'PC', 'Patch Panel', 'Switch', 'Connection', 'PDF Template', 'Settings'];
  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'REVERT'];

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current_page,
        per_page: 15,
        ...filters,
      });
      const response = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data.logs);
      setPagination({
        total: data.total,
        pages: data.pages,
        current_page: data.current_page,
        has_next: data.has_next,
        has_prev: data.has_prev,
      });
    } catch (error) {
      console.error("Failed to fetch system logs:", error);
      showMessage(`Error fetching logs: ${error.message}`, 5000);
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, filters, showMessage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    }
  };

  const handleViewDetails = (details) => {
    setSelectedLogDetails(details);
    setIsDetailsModalOpen(true);
  };

  const handleRevert = async (logId) => {
      if (!window.confirm("Are you sure you want to revert this action? This cannot be undone.")) {
          return;
      }
      try {
          const response = await fetch(`${API_BASE_URL}/logs/${logId}/revert`, {
              method: 'POST'
          });
          const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || `HTTP error! status: ${response.status}`);
          }
          showMessage(result.message || 'Action reverted successfully!');
          fetchLogs(); // Refresh the logs to show the reverted status
      } catch (error) {
          console.error("Failed to revert action:", error);
          showMessage(`Error reverting action: ${error.message}`, 5000);
      }
  };

  const formatTimestamp = (isoString) => {
    try {
      return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'REVERT': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
      <LogDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} details={selectedLogDetails} />
      <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
        System Activity Log
      </h3>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white rounded-md border">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <label htmlFor="entity_type" className="text-sm font-medium text-gray-700">Entity:</label>
          <select name="entity_type" value={filters.entity_type} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="">All</option>
            {entityTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="action_type" className="text-sm font-medium text-gray-700">Action:</label>
          <select name="action_type" value={filters.action_type} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="">All</option>
            {actionTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center">
          <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name / ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Details</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8">Loading logs...</td></tr>
            ) : logs.length > 0 ? (
              logs.map(log => (
                <tr key={log.id} className={`hover:bg-gray-50 ${log.is_reverted ? 'bg-gray-200 opacity-60' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatTimestamp(log.timestamp)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{log.entity_type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.entity_name || `ID: ${log.entity_id}`}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {log.action_type === 'UPDATE' && log.details && (
                      <button onClick={() => handleViewDetails(log.details)} className="text-blue-600 hover:underline flex items-center">
                        <Eye size={16} className="mr-1" /> View Changes
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {log.is_reverted ? (
                        <span className="flex items-center text-gray-500 italic">
                            <BadgeCheck size={16} className="mr-1" /> Reverted
                        </span>
                    ) : (
                      <button 
                        onClick={() => handleRevert(log.id)}
                        disabled={log.action_type === 'REVERT'}
                        className="text-blue-600 hover:underline flex items-center disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={log.action_type === 'REVERT' ? 'Cannot revert this action' : 'Revert this action'}
                      >
                        <RotateCcw size={16} className="mr-1" /> Revert
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center py-8">No logs found for the selected filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span>Page {pagination.current_page} of {pagination.pages} (Total: {pagination.total} logs)</span>
        <div className="flex space-x-1">
          <button onClick={() => handlePageChange(1)} disabled={!pagination.has_prev} className="px-3 py-1 border rounded-md disabled:opacity-50">First</button>
          <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={!pagination.has_prev} className="px-3 py-1 border rounded-md disabled:opacity-50">Prev</button>
          <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={!pagination.has_next} className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
          <button onClick={() => handlePageChange(pagination.pages)} disabled={!pagination.has_next} className="px-3 py-1 border rounded-md disabled:opacity-50">Last</button>
        </div>
      </div>
    </section>
  );
}

export default SystemLogViewer;
