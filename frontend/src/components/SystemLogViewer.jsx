// frontend/src/components/SystemLogViewer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Filter, XCircle, Eye, RotateCcw, BadgeCheck } from 'lucide-react';

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
                  <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500">{String(values.old)}</td>
                  <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500">{String(values.new)}</td>
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
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ entity_type: '', action_type: '' });
  const [loading, setLoading] = useState(true);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const { user } = useAuth();

  const fetchLogs = useCallback(async (page = 1, perPage = 15) => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      per_page: perPage,
      entity_type: filters.entity_type,
      action_type: filters.action_type,
    });

    try {
      const data = await api(`logs?${params.toString()}`);
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
      showMessage(`Failed to fetch system logs: ${error.message}`, 5000);
    } finally {
      setLoading(false);
    }
  }, [filters, showMessage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchLogs(newPage);
    }
  };

  const handleRevert = async (logId) => {
    if(window.confirm('Are you sure you want to revert this action? This can have cascading effects.')) {
        try {
            const response = await api(`logs/${logId}/revert`, { method: 'POST' });
            showMessage(response.message || 'Action reverted successfully.');
            fetchLogs(pagination.current_page);
        } catch (error) {
            showMessage(`Failed to revert action: ${error.message}`, 5000);
        }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {selectedLogDetails && (
        <LogDetailsModal 
            isOpen={!!selectedLogDetails} 
            onClose={() => setSelectedLogDetails(null)} 
            details={selectedLogDetails} 
        />
      )}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h3 className="text-2xl font-bold text-gray-800">System Activity Log</h3>
        <div className="flex items-center gap-2">
          <select name="entity_type" value={filters.entity_type} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="">All Entities</option>
            <option value="PC">PC</option>
            <option value="Switch">Switch</option>
            <option value="Patch Panel">Patch Panel</option>
            <option value="Connection">Connection</option>
            <option value="Location">Location</option>
            <option value="Rack">Rack</option>
          </select>
          <select name="action_type" value={filters.action_type} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="REVERT">Revert</option>
          </select>
          <button onClick={() => fetchLogs()} className="p-2 border rounded-md bg-blue-500 text-white hover:bg-blue-600">
            <Filter size={20} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8"><RefreshCw className="animate-spin inline-block" /></td></tr>
            ) : logs.length > 0 ? (
              logs.map(log => (
                <tr key={log.id} className={`${log.is_reverted ? 'bg-gray-200 opacity-60' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.action_type === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action_type === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                        log.action_type === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.entity_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entity_name || log.entity_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action_by}</td>
                  {/* CORRECTED: Wrapped actions in a flex container for better alignment */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-4">
                        {log.action_type === 'UPDATE' && log.details && (
                        <button onClick={() => setSelectedLogDetails(log.details)} className="text-blue-600 hover:text-blue-900" title="View Changes">
                            <Eye size={18} />
                        </button>
                        )}
                        {log.is_reverted && (
                            <BadgeCheck size={18} className="text-green-600" title="This action has been reverted." />
                        )}
                        {user.role === 'Admin' && !log.is_reverted && (
                        <button 
                            onClick={() => handleRevert(log.id)} 
                            className="flex items-center px-2 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                            disabled={log.action_type === 'REVERT'}
                            title={log.action_type === 'REVERT' ? 'Cannot revert this action' : 'Revert this action'}
                        >
                            <RotateCcw size={14} className="mr-1" /> Revert
                        </button>
                        )}
                    </div>
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
    </div>
  );
}

export default SystemLogViewer;
