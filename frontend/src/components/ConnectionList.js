// frontend/src/components/ConnectionList.js
// This component displays a list of network connections in a compact, single-line format.
// Each connection shows its full path from PC through multiple Patch Panels to a Switch,
// with actions for editing and deleting.
// The expand/collapse feature has been reintroduced with a more organized expanded view.
// Now includes search and pagination.
// UPDATED: Displays the new "Wall Point Label" field in the expanded view.

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Split,
  Server,
  ArrowRight,
  WifiOff,
  Wifi,
  User,
  Monitor,
  Columns,
  Link,
  Info,
  MapPin,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Router,
  Building2,
  Tag,
  Palette,
  Printer,
} from "lucide-react";
import SearchBar from "./SearchBar";

// ConnectionCard component displays individual connection details
function ConnectionCard({ connection, onDelete, onEdit, onPrint }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 p-4">
      {/* Collapsed View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <Laptop size={20} className="text-indigo-500 flex-shrink-0" />
          <span className="font-semibold text-gray-800 truncate">
            {connection.pc?.name || "N/A"}
          </span>
          <ArrowRight size={18} className="text-gray-400 flex-shrink-0" />
          {connection.hops && connection.hops.length > 0 && (
            <>
              {connection.hops.map((hop, index) => (
                <React.Fragment key={hop.id || index}>
                  <Split size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 truncate">
                    {hop.patch_panel?.name || "N/A"}
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-gray-400 flex-shrink-0"
                  />
                </React.Fragment>
              ))}
            </>
          )}
          <Server size={20} className="text-red-500 flex-shrink-0" />
          <span className="font-semibold text-gray-800 truncate">
            {connection.switch?.name || "N/A"}
          </span>
          <span className="text-sm text-gray-600 truncate">
            (Port: {connection.switch_port})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {connection.is_switch_port_up ? (
            <Wifi size={18} className="text-green-500" title="Port is Up" />
          ) : (
            <WifiOff size={18} className="text-red-500" title="Port is Down" />
          )}
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={toggleExpand}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PC Details */}
          <div className="bg-indigo-50 p-3 rounded-md">
            <h5 className="font-semibold text-gray-700 flex items-center mb-2">
              <Laptop size={18} className="mr-2 text-indigo-500" /> PC Details
            </h5>
            <p className="text-sm">
              <span className="font-medium">Name:</span>{" "}
              {connection.pc?.name || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">IP:</span>{" "}
              {connection.pc?.ip_address || "N/A"}
            </p>
            {/* ADDED: Display Wall Point Label */}
            <p className="text-sm mt-1 flex items-start">
              <Tag
                size={14}
                className="mr-1 mt-0.5 text-gray-500 flex-shrink-0"
              />
              <span className="font-medium">Wall Point:</span>&nbsp;
              {connection.wall_point_label || "N/A"}
            </p>
            {connection.pc?.type === "Server" && (
              <>
                <p className="text-sm mt-1">
                  <span className="font-medium">Rack:</span>{" "}
                  {connection.pc.rack_name || "N/A"}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Row:</span>{" "}
                  {connection.pc.row_in_rack || "N/A"}
                </p>
              </>
            )}
          </div>

          {/* Hops Details */}
          <div className="bg-green-50 p-3 rounded-md md:col-span-2">
            <h5 className="font-semibold text-gray-700 flex items-center mb-2">
              <Split size={18} className="mr-2 text-green-500" /> Connection
              Path
            </h5>
            {connection.hops && connection.hops.length > 0 ? (
              <div className="space-y-3">
                {connection.hops.map((hop, index) => (
                  <div
                    key={hop.id || index}
                    className="border-b border-green-200 pb-2 last:border-b-0"
                  >
                    <p className="text-sm font-medium">
                      Hop {index + 1}: {hop.patch_panel?.name || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      Port: {hop.patch_panel_port || "N/A"} (
                      {hop.is_port_up ? "Up" : "Down"})
                    </p>
                    <p className="text-xs text-gray-600 ml-4">
                      Cable Label: {hop.cable_label || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No patch panel hops in this connection.
              </p>
            )}
          </div>

          {/* Switch Details */}
          <div className="bg-red-50 p-3 rounded-md md:col-span-3">
            <h5 className="font-semibold text-gray-700 flex items-center mb-2">
              <Server size={18} className="mr-2 text-red-500" /> Switch Details
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <p>
                <span className="font-medium">Name:</span>{" "}
                {connection.switch?.name || "N/A"}
              </p>
              <p>
                <span className="font-medium">IP:</span>{" "}
                {connection.switch?.ip_address || "N/A"}
              </p>
              <p>
                <span className="font-medium">Port:</span>{" "}
                {connection.switch_port || "N/A"}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {connection.is_switch_port_up ? "Up" : "Down"}
              </p>
              <p className="col-span-full">
                <span className="font-medium">Cable Label:</span>{" "}
                {connection.cable_label || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionList({ connections, onDelete, onEdit, onPrint }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = connections.filter((connection) => {
      const pcName = (connection.pc?.name || "").toLowerCase();
      const switchName = (connection.switch?.name || "").toLowerCase();
      const switchPort = (connection.switch_port || "").toLowerCase();
      const wallPoint = (connection.wall_point_label || "").toLowerCase();
      const hopsText = (connection.hops || [])
        .map(
          (hop) =>
            `${hop.patch_panel?.name || ""} ${hop.patch_panel_port || ""}`
        )
        .join(" ")
        .toLowerCase();

      return (
        pcName.includes(lowerCaseSearchTerm) ||
        switchName.includes(lowerCaseSearchTerm) ||
        switchPort.includes(lowerCaseSearchTerm) ||
        wallPoint.includes(lowerCaseSearchTerm) ||
        hopsText.includes(lowerCaseSearchTerm)
      );
    });
    setFilteredConnections(filtered);
    setCurrentPage(1);
  }, [connections, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConnections.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredConnections.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-4">
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      {currentItems.length > 0 ? (
        currentItems.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onDelete={() => onDelete(connection.id)}
            onEdit={() => onEdit(connection)}
            onPrint={() => onPrint(connection)}
          />
        ))
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm
            ? "No connections match your search."
            : "No connections found."}
        </p>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => paginate(pageNumber)}
                className={`px-4 py-2 rounded-md ${
                  currentPage === pageNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-4 p-2 border rounded-md text-sm"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default ConnectionList;
