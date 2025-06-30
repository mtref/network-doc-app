// frontend/src/components/PortStatusModal.js
// This component displays a modal showing the status (connected/available)
// of all ports for a given Patch Panel or Switch.
// It now includes separate collapse/expand functionality for the detailed port list.
// The print feature has been removed.

import React, { useState } from "react";
import {
  XCircle,
  CheckCircle,
  CircleDot,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react"; // Removed Printer import

function PortStatusModal({ isOpen, onClose, data, entityType }) {
  const [isDetailedListExpanded, setIsDetailedListExpanded] = useState(false); // New state for detailed list expansion, defaulting to collapsed

  if (!isOpen || !data) return null;

  const entityName = data.patch_panel_name || data.switch_name || "N/A"; // Renamed server_name to switch_name
  const totalPorts = data.total_ports || 0;
  const ports = data.ports || [];

  const toggleDetailedList = () => {
    setIsDetailedListExpanded(!isDetailedListExpanded);
  };

  // handlePrint function removed as print feature is removed

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="p-6">
          {" "}
          {/* Removed print-container class */}
          {/* Modal Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            {" "}
            {/* Removed no-print class */}
            <h2 className="text-2xl font-bold text-gray-800">
              {entityType === "patch_panels" ? "Patch Panel" : "Switch"} Port
              Status: {entityName} {/* Renamed Server to Switch */}
            </h2>
            <div className="flex space-x-2">
              {/* Print button removed */}
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Close"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          {/* Report Header for Print View removed */}
          {/* Summary */}
          <div className="mb-6 text-center text-lg text-gray-700">
            <p>
              Total Ports:{" "}
              <span className="font-semibold text-blue-600">{totalPorts}</span>
            </p>
            <p>
              Connected Ports:{" "}
              <span className="font-semibold text-green-600">
                {ports.filter((p) => p.is_connected).length}
              </span>
            </p>
            <p>
              Available Ports:{" "}
              <span className="font-semibold text-gray-500">
                {ports.filter((p) => !p.is_connected).length}
              </span>
            </p>
          </div>
          {/* Always visible Port Grid */}
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Port Details:
          </h3>{" "}
          {/* Removed no-print class */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {" "}
            {/* Removed no-print class */}
            {ports.map((port) => (
              <div
                key={port.port_number}
                className={`p-2 rounded-md flex flex-col items-center justify-center text-center text-xs font-medium border
                            ${
                              port.is_connected
                                ? port.is_up
                                  ? "bg-green-100 border-green-300 text-green-800"
                                  : "bg-red-100 border-red-300 text-red-800"
                                : "bg-gray-100 border-gray-300 text-gray-600"
                            }`}
              >
                <span className="text-sm font-bold">
                  Port {port.port_number}
                </span>
                {port.is_connected ? (
                  <>
                    {port.is_up ? (
                      <CheckCircle
                        size={18}
                        className="text-green-500 mt-1"
                        title="Connected & Up"
                      />
                    ) : (
                      <WifiOff
                        size={18}
                        className="text-red-500 mt-1"
                        title="Connected & Down"
                      />
                    )}
                    <span
                      className="mt-1 truncate max-w-full"
                      title={port.connected_by_pc}
                    >
                      {port.connected_by_pc}
                    </span>
                  </>
                ) : (
                  <CircleDot
                    size={18}
                    className="text-gray-500 mt-1"
                    title="Available"
                  />
                )}
              </div>
            ))}
          </div>
          {/* Collapse/Expand Button for Detailed Port List */}
          <div
            className="flex justify-between items-center mt-6 mb-4 cursor-pointer"
            onClick={toggleDetailedList}
          >
            {" "}
            {/* Removed no-print class */}
            <h3 className="text-xl font-semibold text-gray-700">
              Detailed Port List:
            </h3>
            <button
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              title={isDetailedListExpanded ? "Collapse" : "Expand"}
            >
              {isDetailedListExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>
          {/* Detailed List Content for View (collapsible) */}
          <div
            className={`collapsible-content ${
              isDetailedListExpanded ? "expanded" : ""
            }`}
          >
            {" "}
            {/* Removed no-print class */}
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${
                isDetailedListExpanded ? "py-4 px-4" : "py-0 px-4"
              }`}
            >
              <div>
                <h4 className="font-bold text-green-700 mb-2">
                  Connected Ports:
                </h4>
                {ports.filter((p) => p.is_connected).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {ports
                      .filter((p) => p.is_connected)
                      .map((port) => (
                        <li key={`view-conn-${port.port_number}`}>
                          Port {port.port_number}: Connected by{" "}
                          {port.connected_by_pc} (Status:{" "}
                          {port.is_up ? "Up" : "Down"})
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No connected ports.</p>
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-700 mb-2">
                  Available Ports:
                </h4>
                {ports.filter((p) => !p.is_connected).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {ports
                      .filter((p) => !p.is_connected)
                      .map((port) => (
                        <li key={`view-avail-${port.port_number}`}>
                          Port {port.port_number}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No available ports.</p>
                )}
              </div>
            </div>
          </div>
          {/* Detailed List for Print (print-only) removed */}
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-4 text-sm text-gray-700">
            {" "}
            {/* Removed no-print class */}
            <div className="flex items-center">
              <CheckCircle size={18} className="text-green-500 mr-2" />{" "}
              Connected & Up
            </div>
            <div className="flex items-center">
              <WifiOff size={18} className="text-red-500 mr-2" /> Connected &
              Down
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
