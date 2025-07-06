// frontend/src/components/PortStatusModal.js
// This component displays a modal showing the status (connected/available)
// of all ports for a given Patch Panel or Switch.
// It now combines and orders connected and available ports in a single list.
// UPDATED: Displays units_occupied for rack-mounted devices.

import React, { useState, useEffect } from "react";
import ReactDOMServer from "react-dom/server";
import {
  XCircle,
  CheckCircle, // Connected & Up
  CircleDot, // Available
  WifiOff, // Connected & Down (used for status icon)
  ChevronDown,
  ChevronUp,
  Server, // For Switch icon in header
  Split, // For Patch Panel icon in header
} from "lucide-react";

function PortStatusModal({ isOpen, onClose, data, entityType, cssContent }) {
  // Initialize to true to make it expanded by default
  const [isDetailedListExpanded, setIsDetailedListExpanded] = useState(true);

  if (!isOpen || !data) {
    return null;
  }

  const entityName = data.patch_panel_name || data.switch_name || "N/A";
  const totalPorts = data.total_ports || 0;
  const ports = data.ports || [];

  // Determine common fields for the summary line based on entityType
  const isSwitch = entityType === "switches";
  const ip = isSwitch ? data.ip_address || "N/A" : "N/A";
  const locationName =
    data.patch_panel_location || data.switch_location || "N/A";
  const doorNumber = data.door_number || "N/A";
  const row = data.row_in_rack || "N/A";
  const rack = data.rack_name || "N/A";
  const unitsOccupied = data.units_occupied || "N/A"; // NEW: Get units_occupied
  const sourcePort = isSwitch ? data.source_port || "N/A" : "N/A";
  const model = isSwitch ? data.model || "N/A" : "N/A";
  const usage = isSwitch ? data.usage || "N/A" : "N/A";

  // Calculate connected and available ports for summary
  const connectedPortsCount = ports.filter((p) => p.is_connected).length;
  const availablePortsCount = ports.filter((p) => !p.is_connected).length;

  // Combine all ports and sort them by port number
  const allSortedPorts = [...ports].sort((a, b) => {
    // Ensure comparison is numerical
    return parseInt(a.port_number) - parseInt(b.port_number);
  });

  return (
    // Increased z-index to z-[60] to ensure it stacks above z-50 modals
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            {isSwitch ? (
              <Server size={24} className="mr-2 text-red-500" />
            ) : (
              <Split size={24} className="mr-2 text-green-500" />
            )}{" "}
            Port Status: {entityName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Close"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          {/* Summary Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">
              Summary:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
              <p>
                <strong>Total Ports:</strong> {totalPorts}
              </p>
              <p>
                <strong>Connected:</strong> {connectedPortsCount}
              </p>
              <p>
                <strong>Available:</strong> {availablePortsCount}
              </p>
              <p>
                <strong>Location:</strong> {locationName}
                {doorNumber !== "N/A" && ` (Door: ${doorNumber})`}
              </p>
              {/* Display Rack and Row with Units Occupied */}
              {rack !== "N/A" && (
                <p>
                  <strong>Rack:</strong> {rack} (Starting Row: {row}, Units:{" "}
                  {unitsOccupied}U)
                </p>
              )}
              {isSwitch && (
                <>
                  <p>
                    <strong>IP Address:</strong> {ip}
                  </p>
                  <p>
                    <strong>Source Port:</strong> {sourcePort}
                  </p>
                  <p>
                    <strong>Model:</strong> {model}
                  </p>
                  <p>
                    <strong>Usage:</strong> {usage}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Combined and Detailed Port List */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div
              className="flex justify-between items-center cursor-pointer mb-3"
              onClick={() => setIsDetailedListExpanded(!isDetailedListExpanded)}
            >
              <h4 className="font-bold text-gray-700">All Ports:</h4>
              {isDetailedListExpanded ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </div>
            <div
              className={`collapsible-content ${
                allSortedPorts.length > 0 && isDetailedListExpanded
                  ? "expanded"
                  : ""
              }`}
            >
              {allSortedPorts.length > 0 ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {" "}
                  {/* Twelve-column grid layout */}
                  {allSortedPorts.map((port) => (
                    <div
                      key={`port-${port.port_number}`}
                      className="flex flex-col items-center p-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                    >
                      {port.is_connected ? (
                        port.is_up ? (
                          <CheckCircle
                            size={20}
                            className="text-green-500 mb-1"
                          />
                        ) : (
                          <WifiOff size={20} className="text-red-500 mb-1" />
                        )
                      ) : (
                        <CircleDot size={20} className="text-gray-500 mb-1" />
                      )}
                      <span className="font-medium text-gray-800 text-sm">
                        {port.port_number}
                      </span>{" "}
                      {/* Only port number */}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No ports found for this device.</p>
              )}
            </div>
          </div>
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-4 text-sm text-gray-700">
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
