// frontend/src/components/ConnectionList.js
// This component displays a list of network connections in a compact, single-line format.
// Each connection shows its full path from PC through multiple Patch Panels to a Switch,
// with actions for editing and deleting.

import React, { useState } from "react";
// Import icons from lucide-react for a better UI and consistent design
import {
  Laptop,
  Split,
  Server,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Link,
  WifiOff,
  Wifi,
} from "lucide-react";

// New component for individual connection cards
function ConnectionCard({ connection, onDelete, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 cursor-pointer"
      onClick={toggleExpand} // Click to expand/collapse
    >
      {/* Top row: Summary Path and Actions */}
      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        {/* Left side: Summary Connection Path - flex-grow allows it to take available space */}
        <div className="flex-grow flex items-center flex-wrap sm:flex-nowrap overflow-hidden pr-2">
          <span className="font-semibold text-blue-600 mr-2 text-sm flex-shrink-0">
            #{connection.id}
          </span>

          {/* PC Info (Always visible in compact format) */}
          <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1 sm:mb-0">
            <Laptop size={16} className="text-indigo-500 mr-1 flex-shrink-0" />
            <span className="font-medium">
              {connection.pc?.name || "N/A"} (
              {connection.pc?.ip_address || "No IP"})
            </span>
          </div>

          {/* Dynamically render compact view of patch panel hops */}
          {connection.hops.map((hop, index) => (
            <React.Fragment key={index}>
              <ArrowRight
                size={12}
                className="text-gray-400 mx-1 flex-shrink-0"
              />
              <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1 sm:mb-0">
                <Split
                  size={16}
                  className="text-green-500 mr-1 flex-shrink-0"
                />
                <span className="font-medium">
                  {hop.patch_panel?.name || "N/A"} (Port: {hop.patch_panel_port}
                  )
                  {hop.is_port_up ? (
                    <Wifi
                      size={14}
                      className="inline-block ml-1 text-green-500"
                      title="Port Up"
                    />
                  ) : (
                    <WifiOff
                      size={14}
                      className="inline-block ml-1 text-red-500"
                      title="Port Down"
                    />
                  )}
                </span>
              </div>
            </React.Fragment>
          ))}

          {/* Switch Info (Renamed from Server Info) */}
          <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
          <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
            <Server size={16} className="text-red-500 mr-1 flex-shrink-0" />{" "}
            {/* Reusing Server icon for Switch */}
            <span className="font-medium">
              {connection.switch?.name || "N/A"} (Port: {connection.switch_port}
              )
              {connection.is_switch_port_up ? (
                <Wifi
                  size={14}
                  className="inline-block ml-1 text-green-500"
                  title="Port Up"
                />
              ) : (
                <WifiOff
                  size={14}
                  className="inline-block ml-1 text-red-500"
                  title="Port Down"
                />
              )}{" "}
            </span>
          </div>
        </div>

        {/* Right side: Actions and Expand Button */}
        <div className="flex-shrink-0 flex items-center space-x-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(connection);
            }} // Prevent card click from triggering
            className="p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            title="Edit Connection"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              ></path>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(connection.id);
            }} // Prevent card click from triggering
            className="p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            title="Delete Connection"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }} // Prevent card click from triggering
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600"
            title={isExpanded ? "Collapse Details" : "Expand Details"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section (Conditional Rendering) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-gray-700 text-sm px-4 pb-4 animate-fade-in-down">
          <p>
            <span className="font-medium">PC IP:</span>{" "}
            {connection.pc?.ip_address || "N/A"}
          </p>
          <p>
            <span className="font-medium">PC Description:</span>{" "}
            {connection.pc?.description || "No description"}
          </p>
          {connection.hops.map((hop, index) => (
            <p key={`detail-hop-${index}`}>
              <span className="font-medium">
                Patch Panel {index + 1} Details:
              </span>{" "}
              {hop.patch_panel?.name || "N/A"} (Port: {hop.patch_panel_port},
              Location: {hop.patch_panel?.location || "N/A"}) - Status:{" "}
              {hop.is_port_up ? "Up" : "Down"}
            </p>
          ))}
          <p>
            <span className="font-medium">Switch IP:</span>{" "}
            {connection.switch?.ip_address || "N/A"}
          </p>{" "}
          # Renamed Server
          <p>
            <span className="font-medium">Switch Port:</span>{" "}
            {connection.switch_port || "N/A"} - Status:{" "}
            {connection.is_switch_port_up ? "Up" : "Down"}
          </p>{" "}
          # Renamed Server
          <p>
            <span className="font-medium">Switch Location:</span>{" "}
            {connection.switch?.location || "N/A"}
          </p>{" "}
          # Renamed Server
        </div>
      )}
    </div>
  );
}

function ConnectionList({ connections, onDelete, onEdit }) {
  if (!connections || connections.length === 0) {
    return null; // Render nothing if there are no connections
  }

  return (
    <div className="space-y-3">
      {" "}
      {/* Use space-y for consistent vertical spacing */}
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default ConnectionList;
