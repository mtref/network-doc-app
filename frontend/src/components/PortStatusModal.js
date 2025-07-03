// frontend/src/components/PortStatusModal.js
// This component displays a modal showing the status (connected/available)
// of all ports for a given Patch Panel or Switch.
// It now includes separate collapse/expand functionality for the detailed port list.
// The print feature has been removed.

import React, { useState } from "react";
import ReactDOMServer from "react-dom/server"; // Import ReactDOMServer
import {
  XCircle,
  CheckCircle,
  CircleDot,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Printer, // Re-import Printer icon
} from "lucide-react";

function PortStatusModal({ isOpen, onClose, data, entityType, cssContent }) {
  const [isDetailedListExpanded, setIsDetailedListExpanded] = useState(false);

  if (!isOpen || !data) return null;

  const entityName = data.patch_panel_name || data.switch_name || "N/A";
  const totalPorts = data.total_ports || 0;
  const ports = data.ports || [];

  // Determine common fields for the summary line based on entityType
  const isSwitch = entityType === "switches";
  const ip = isSwitch ? data.ip_address || "N/A" : "N/A";
  const locationName = data.patch_panel_location || data.switch_location || "N/A";
  const doorNumber = data.door_number || "N/A"; // New field
  const row = data.row_in_rack || "N/A";
  const rack = data.rack_name || "N/A";
  const sourcePort = isSwitch ? data.source_port || "N/A" : "N/A";
  const model = isSwitch ? data.model || "N/A" : "N/A";
  const usage = isSwitch ? data.usage || "N/A" : "N/A"; // New field
  const description = data.description || "N/A"; // Common description field

  const toggleDetailedList = () => {
    setIsDetailedListExpanded(!isDetailedListExpanded);
  };

  const handlePrintDetailedList = () => {
    // Corrected: Define connectedPorts and availablePorts here
    const connectedPorts = ports.filter((p) => p.is_connected);
    const availablePorts = ports.filter((p) => !p.is_connected);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups for printing.");
      return;
    }

    // Render the content for printing
    const printableContent = (
      <div className="p-8 bg-white text-gray-800 font-inter">
        <div className="text-center mb-2">
          {" "}
          {/* Reduced margin-bottom */}
          <h1 className="text-2xl font-extrabold text-blue-800 mb-1">
            {" "}
            {/* Reduced margin-bottom */}
            {isSwitch ? "Switch" : "Patch Panel"} Port Status Report
          </h1>
          <h2 className="text-xl font-bold text-gray-700">
            {" "}
            {/* Removed margin-bottom */}
            {entityName}
          </h2>
        </div>

        {/* New combined detail line */}
        <div className="text-sm text-gray-700 mt-4 mb-4 text-center">
          {" "}
          {/* Adjusted margins */}
          {isSwitch ? (
            <>
              <p>
                IP: {ip} | Location: {locationName} {doorNumber !== "N/A" ? `(Door: ${doorNumber})` : ''} | Row: {row} | Rack: {rack}
              </p>
              <p>
                Total Ports: {totalPorts} | Source Port: {sourcePort} | Model:{" "}
                {model} | Usage: {usage}
              </p>
              <p>Description: {description}</p>
            </>
          ) : (
            <>
              <p>
                Location: {locationName} {doorNumber !== "N/A" ? `(Door: ${doorNumber})` : ''} | Row: {row} | Rack: {rack} | Total Ports:{" "}
                {totalPorts}
              </p>
              <p>Description: {description}</p>
            </>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Detailed Port List:
          </h3>
          <div className="print-grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-green-700 mb-2">
                Connected Ports:
              </h4>
              {connectedPorts.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {connectedPorts.map((port) => (
                    <li key={`print-conn-${port.port_number}`}>
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
              <h4 className="font-bold text-gray-700 mb-2">Available Ports:</h4>
              {availablePorts.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {availablePorts.map((port) => (
                    <li key={`print-avail-${port.port_number}`}>
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
      </div>
    );

    const printableHtml = ReactDOMServer.renderToString(printableContent);
    const styleTag = `<style>${cssContent}</style>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${
            isSwitch ? "Switch" : "Patch Panel"
          } Port Status Report</title>
          ${styleTag}
          <style>
            body {
                margin: 0;
                padding: 0;
            }
            .p-8 { padding: 2cm !important; } /* Adjust padding for print */
            .mb-6 { margin-bottom: 0.5cm !important; } /* Adjusted general mb-6 for print */
            .mb-2 { margin-bottom: 0.2cm !important; } /* Adjusted general mb-2 for print */
            .mb-1 { margin-bottom: 0.1cm !important; } /* New: Adjusted general mb-1 for print */

            h1 {
              font-size: 20pt !important;
              margin-bottom: 0.1cm !important; /* Significantly reduced space below h1 */
              color: #000 !important;
            }
            h2 {
              font-size: 16pt !important;
              margin-top: 0.2cm !important; /* Small top margin for h2 */
              margin-bottom: 0.2cm !important; /* Small bottom margin for h2 */
              color: #000 !important;
            }
            h3 {
              font-size: 14pt !important;
              margin-top: 0.5cm !important; /* Adjusted top margin for h3 */
              margin-bottom: 0.2cm !important; /* Reduced bottom margin for h3 */
              color: #000 !important;
            }
            p, ul, li, span, div { font-size: 12pt !important; line-height: 1.5 !important; }
            .print-grid-cols-2 {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 1cm !important;
            }
            .print-grid-cols-2 > div {
              break-inside: avoid-column;
            }
            .border { border: 1px solid #ccc !important; }
            .rounded-lg { border-radius: 0 !important; }
            .shadow-xl { box-shadow: none !important; }
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          </style>
      </head>
      <body>
          ${printableHtml}
      </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
        <div className="p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {entityType === "patch_panels" ? "Patch Panel" : "Switch"} Port
              Status: {entityName}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrintDetailedList}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Print Detailed List"
              >
                <Printer size={24} />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                title="Close"
              >
                <XCircle size={24} />
              </button>
            </div>
          </div>
          {/* Summary (This is the on-screen summary, still visible) */}
          <div className="mb-6 text-center text-lg text-gray-700">
            <p>
              Total Ports:
              <span className="font-semibold text-blue-600"> {totalPorts}</span>
            </p>
            <p>
              Connected Ports:
              <span className="font-semibold text-green-600">
                {" "}
                {ports.filter((p) => p.is_connected).length}
              </span>
            </p>
            <p>
              Available Ports:
              <span className="font-semibold text-gray-500">
                {" "}
                {ports.filter((p) => !p.is_connected).length}
              </span>
            </p>
            {/* New fields for on-screen summary */}
            {isSwitch ? (
              <div className="text-sm text-gray-700 mt-4">
                <p>IP: {ip}</p>
                <p>
                  Location: {locationName} {doorNumber !== "N/A" ? `(Door: ${doorNumber})` : ''} | Row: {row} | Rack: {rack}
                </p>
                <p>
                  Source Port: {sourcePort} | Model: {model} | Usage: {usage}
                </p>
                <p>Description: {description}</p>
              </div>
            ) : (
              <div className="text-sm text-gray-700 mt-4">
                <p>
                  Location: {locationName} {doorNumber !== "N/A" ? `(Door: ${doorNumber})` : ''} | Row: {row} | Rack: {rack}
                </p>
                <p>Description: {description}</p>
              </div>
            )}
          </div>
          {/* Always visible Port Grid */}
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            Port Details:
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
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