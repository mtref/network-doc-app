// frontend/src/components/PortStatusModal.js
// This component displays a modal showing the status (connected/available)
// of all ports for a given Patch Panel or Server.

import React from 'react';
import { XCircle, CheckCircle, CircleDot, WifiOff } from 'lucide-react'; // Added WifiOff to imports

function PortStatusModal({ isOpen, onClose, data, entityType }) {
  if (!isOpen || !data) return null;

  const entityName = data.patch_panel_name || data.server_name || 'N/A';
  const totalPorts = data.total_ports || 0;
  const ports = data.ports || [];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {entityType === 'patch_panels' ? 'Patch Panel' : 'Server'} Port Status: {entityName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              title="Close"
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 text-center text-lg text-gray-700">
            <p>Total Ports: <span className="font-semibold text-blue-600">{totalPorts}</span></p>
            <p>Connected Ports: <span className="font-semibold text-green-600">{ports.filter(p => p.is_connected).length}</span></p>
            <p>Available Ports: <span className="font-semibold text-gray-500">{ports.filter(p => !p.is_connected).length}</span></p>
          </div>

          {/* Port Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {ports.map((port) => (
              <div
                key={port.port_number}
                className={`p-2 rounded-md flex flex-col items-center justify-center text-center text-xs font-medium border
                            ${port.is_connected
                              ? (port.is_up ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800')
                              : 'bg-gray-100 border-gray-300 text-gray-600'
                            }`}
              >
                <span className="text-sm font-bold">Port {port.port_number}</span>
                {port.is_connected ? (
                  <>
                    {port.is_up ? (
                      <CheckCircle size={18} className="text-green-500 mt-1" title="Connected & Up" />
                    ) : (
                      <WifiOff size={18} className="text-red-500 mt-1" title="Connected & Down" />
                    )}
                    <span className="mt-1 truncate max-w-full" title={port.connected_by_pc}>
                      {port.connected_by_pc}
                    </span>
                  </>
                ) : (
                  <CircleDot size={18} className="text-gray-500 mt-1" title="Available" />
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-4 text-sm text-gray-700">
            <div className="flex items-center">
              <CheckCircle size={18} className="text-green-500 mr-2" /> Connected & Up
            </div>
            <div className="flex items-center">
              <WifiOff size={18} className="text-red-500 mr-2" /> Connected & Down
            </div>
            <div className="flex items-center">
              <CircleDot size={18} className="text-gray-500 mr-2" /> Available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortStatusModal;
