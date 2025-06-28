// frontend/src/components/ConnectionList.js
// This component displays a list of network connections.
// Each connection is presented as a card with detailed path information
// and actions for editing and deleting.

import React from 'react';

// Icons using inline SVG for a consistent look without external dependencies
const PcIcon = () => (
  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L12 19.25M12 19.25L14.25 17M12 19.25V14.75M19 8H5C3.343 8 2 9.343 2 11V18C2 19.657 3.343 21 5 21H19C20.657 21 22 19.657 22 18V11C22 9.343 20.657 8 19 8Z"></path>
  </svg>
);

const PatchPanelIcon = () => (
  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
  </svg>
);

const ServerIcon = () => (
  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"></path>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <line x1="8" y1="8" x2="8" y2="16"></line>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="16" y1="8" x2="16" y2="16"></line>
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
  </svg>
);


function ConnectionList({ connections, onDelete, onEdit }) {
  if (!connections || connections.length === 0) {
    return null; // Or a message like "No connections yet."
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200"
        >
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-blue-600 mr-2"># {connection.id}</span> Connection Details
            </h3>

            {/* Connection Path Visualization */}
            <div className="flex items-center justify-between py-4 border-t border-b border-gray-100 mb-4">
              <div className="flex flex-col items-center flex-1">
                <PcIcon />
                <span className="text-sm font-medium text-indigo-700 mt-1 truncate max-w-[80%]">{connection.pc?.name || 'N/A'}</span>
                <span className="text-xs text-gray-500">IP: {connection.pc?.ip_address || 'N/A'}</span>
              </div>

              {/* Dynamically render multiple patch panel hops */}
              {connection.hops.map((hop, index) => (
                <React.Fragment key={index}>
                  <ArrowRightIcon />
                  <div className="flex flex-col items-center flex-1">
                    <PatchPanelIcon />
                    <span className="text-sm font-medium text-green-700 mt-1 truncate max-w-[80%]">{hop.patch_panel?.name || 'N/A'}</span>
                    <span className="text-xs text-gray-500">Port: {hop.patch_panel_port}</span>
                    <span className="text-xs text-gray-500">{hop.patch_panel?.location || 'N/A'}</span>
                  </div>
                </React.Fragment>
              ))}

              <ArrowRightIcon />
              <div className="flex flex-col items-center flex-1">
                <ServerIcon />
                <span className="text-sm font-medium text-red-700 mt-1 truncate max-w-[80%]">{connection.server?.name || 'N/A'}</span>
                <span className="text-xs text-gray-500">Port: {connection.server_port}</span>
              </div>
            </div>

            {/* Detailed Properties */}
            <div className="space-y-2 text-gray-700 text-sm">
              <p>
                <span className="font-medium">PC Description:</span> {connection.pc?.description || 'No description'}
              </p>
              <p>
                <span className="font-medium">Server IP:</span> {connection.server?.ip_address || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Server Location:</span> {connection.server?.location || 'N/A'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-100">
            <button
              onClick={() => onEdit(connection)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              Edit
            </button>
            <button
              onClick={() => onDelete(connection.id)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConnectionList;
