// frontend/src/components/ConnectionList.js
// This component displays a list of network connections in a compact, single-line format.
// Each connection shows its full path from PC through multiple Patch Panels to a Switch,
// with actions for editing and deleting.
// The expand/collapse feature has been reintroduced with a more organized expanded view.
// Now includes search and pagination.

import React, { useState, useEffect } from "react";
// Import icons from lucide-react for a better UI and consistent design
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
  Tag, // New icon for cable label
  Palette, // New icon for cable color
  Printer, // Import Printer icon
} from "lucide-react";
import SearchBar from "./SearchBar"; // Import the SearchBar component

// ConnectionCard component (remains unchanged as it displays individual connection details)
function ConnectionCard({ connection, onDelete, onEdit, onPrint }) { // Added onPrint prop
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200 p-4 cursor-pointer"
      onClick={toggleExpand}
    >
      {/* Top row: Summary Path and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
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

          {/* Dynamically render compact view of cable color/label for direct connection to switch */}
          {connection.cable_color && (
            <>
              <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
              <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1 sm:mb-0">
                <Palette size={16} className="text-purple-500 mr-1 flex-shrink-0" />
                <span className="font-medium">{connection.cable_color}</span>
              </div>
            </>
          )}
          {connection.cable_label && (
            <>
              <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
              <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1 sm:mb-0">
                <Tag size={16} className="text-orange-500 mr-1 flex-shrink-0" />
                <span className="font-medium">{connection.cable_label}</span>
              </div>
            </>
          )}

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
                  {hop.patch_panel?.location_name && (
                    <span className="ml-1">
                      ({hop.patch_panel.location_name})
                    </span>
                  )}
                  {hop.cable_color && (
                    <span className="ml-1 flex items-center">
                      <Palette size={12} className="text-purple-500 mr-0.5" />
                      {hop.cable_color}
                    </span>
                  )}
                  {hop.cable_label && (
                    <span className="ml-1 flex items-center">
                      <Tag size={12} className="text-orange-500 mr-0.5" />
                      {hop.cable_label}
                    </span>
                  )}
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

          {/* Switch Info */}
          <ArrowRight size={12} className="text-gray-400 mx-1 flex-shrink-0" />
          <div className="flex items-center text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
            <Server size={16} className="text-red-500 mr-1 flex-shrink-0" />
            <span className="font-medium">
              {connection.switch?.name || "N/A"} (Port: {connection.switch_port}
              )
              {connection.switch?.location_name && (
                <span className="ml-1">
                  ({connection.switch.location_name})
                </span>
              )}
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
              )}
            </span>
          </div>
        </div>

        {/* Right side: Actions and Expand Button */}
        <div className="flex-shrink-0 flex items-center space-x-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card from expanding/collapsing
              onPrint(connection); // Pass the specific connection data to print
            }}
            className="p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            title="Print Connection Data"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(connection);
            }}
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
            }}
            className="p-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
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
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600"
            title={isExpanded ? "Collapse Details" : "Expand Details"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Section (Conditional Rendering with collapsible-content) */}
      <div
        className={`collapsible-content ${isExpanded ? "expanded" : ""} ${
          isExpanded ? "py-4 px-4" : "py-0 px-4"
        }`}
      >
        <div className="space-y-4">
          {/* PC Details */}
          <h4 className="font-semibold text-indigo-700 mb-2">PC Details:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            <p className="flex items-center">
              <Laptop size={16} className="text-indigo-500 mr-2" />{" "}
              <span className="font-medium">Name:</span>{" "}
              {connection.pc?.name || "N/A"}
            </p>
            <p className="flex items-center">
              <Router size={16} className="text-gray-500 mr-2" />{" "}
              <span className="font-medium">IP:</span>{" "}
              {connection.pc?.ip_address || "N/A"}
            </p>
            <p className="flex items-center">
              <User size={16} className="text-gray-500 mr-2" />{" "}
              <span className="font-medium">Username:</span>{" "}
              {connection.pc?.username || "N/A"}
            </p>
            <p className="flex items-center">
              {connection.pc?.in_domain !== undefined ? (
                connection.pc.in_domain ? (
                  <Wifi size={16} className="text-green-500 mr-2" />
                ) : (
                  <WifiOff size={16} className="text-red-500 mr-2" />
                )
              ) : (
                <Info size={16} className="text-gray-500 mr-2" />
              )}
              <span className="font-medium">In Domain:</span>{" "}
              {connection.pc?.in_domain !== undefined
                ? connection.pc.in_domain
                  ? "Yes"
                  : "No"
                : "N/A"}
            </p>
            <p className="flex items-center"> {/* New field: PC Type */}
              <Info size={16} className="text-gray-500 mr-2" />{" "}
              <span className="font-medium">Type:</span>{" "}
              {connection.pc?.type || "N/A"}
            </p>
            <p className="flex items-center"> {/* New field: PC Usage */}
              <Info size={16} className="text-gray-500 mr-2" />{" "}
              <span className="font-medium">Usage:</span>{" "}
              {connection.pc?.usage || "N/A"}
            </p>
            <p className="flex items-center">
              <Monitor size={16} className="text-gray-500 mr-2" /> OS:{" "}
              {connection.pc?.operating_system || "N/A"}
            </p>
            <p className="flex items-center">
              <HardDrive size={16} className="text-gray-500 mr-2" /> Model:{" "}
              {connection.pc?.model || "N/A"}
            </p>
            <p className="flex items-center">
              <Building2 size={16} className="text-gray-500 mr-2" /> Office:{" "}
              {connection.pc?.office || "N/A"}
            </p>
            <p className="flex items-start col-span-full">
              <Info
                size={16}
                className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
              />{" "}
              <span className="font-medium">Description:</span>{" "}
              {connection.pc?.description || "No description"}
            </p>
          </div>

          {/* Connection Cable Details (for direct Switch connection) */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-blue-700 mb-2">Connection Cable Details:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <p className="flex items-center">
                    <Palette size={16} className="text-purple-500 mr-2" />{" "}
                    <span className="font-medium">Color:</span>{" "}
                    {connection.cable_color || "N/A"}
                </p>
                <p className="flex items-center">
                    <Tag size={16} className="text-orange-500 mr-2" />{" "}
                    <span className="font-medium">Label:</span>{" "}
                    {connection.cable_label || "N/A"}
                </p>
            </div>
          </div>

          {/* Patch Panel Hops Details */}
          {connection.hops.map((hop, index) => (
            <div
              key={`detail-hop-${index}`}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <h4 className="font-semibold text-green-700 mb-2">
                Patch Panel {index + 1} Details:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <p className="flex items-center">
                  <Split size={16} className="text-green-500 mr-2" />{" "}
                  <span className="font-medium">Name:</span>{" "}
                  {hop.patch_panel?.name || "N/A"}
                </p>
                <p className="flex items-center">
                  <MapPin size={16} className="text-gray-500 mr-2" />{" "}
                  <span className="font-medium">Location:</span>{" "}
                  {hop.patch_panel?.location_name || "N/A"}
                  {hop.patch_panel?.location?.door_number && ( // Display door number
                    <span className="ml-1"> (Door: {hop.patch_panel.location.door_number})</span>
                  )}
                </p>
                <p className="flex items-center">
                  <Server size={16} className="text-gray-500 mr-2" />{" "}
                  <span className="font-medium">Row:</span>{" "}
                  {hop.patch_panel?.row_in_rack || "N/A"}
                </p>
                <p className="flex items-center">
                  <Columns size={16} className="text-gray-500 mr-2" />{" "}
                  <span className="font-medium">Rack:</span>{" "}
                  {hop.patch_panel?.rack_name || "N/A"}
                </p>
                <p className="flex items-center">
                  <HardDrive size={16} className="text-gray-500 mr-2" />{" "}
                  <span className="font-medium">Total Ports:</span>{" "}
                  {hop.patch_panel?.total_ports || "N/A"}
                </p>
                <p className="flex items-center">
                  <Link size={16} className="text-gray-500 mr-2" />{" "}
                  <span className="font-medium">Port:</span>{" "}
                  {hop.patch_panel_port || "N/A"} - Status:{" "}
                  {hop.is_port_up ? "Up" : "Down"}
                </p>
                <p className="flex items-center"> {/* New field: Cable Color for hop */}
                    <Palette size={16} className="text-purple-500 mr-2" />{" "}
                    <span className="font-medium">Cable Color:</span>{" "}
                    {hop.cable_color || "N/A"}
                </p>
                <p className="flex items-center"> {/* New field: Cable Label for hop */}
                    <Tag size={16} className="text-orange-500 mr-2" />{" "}
                    <span className="font-medium">Cable Label:</span>{" "}
                    {hop.cable_label || "N/A"}
                </p>
                <p className="flex items-start col-span-full">
                  <Info
                    size={16}
                    className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                  />{" "}
                  <span className="font-medium">Description:</span>{" "}
                  {hop.patch_panel?.description || "No description"}
                </p>
              </div>
            </div>
          ))}

          {/* Switch Details */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-red-700 mb-2">Switch Details:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
              <p className="flex items-center">
                <Server size={16} className="text-red-500 mr-2" />{" "}
                <span className="font-medium">Name:</span>{" "}
                {connection.switch?.name || "N/A"}
              </p>
              <p className="flex items-center">
                <Router size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">IP:</span>{" "}
                {connection.switch?.ip_address || "N/A"}
              </p>
              <p className="flex items-center">
                <MapPin size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Location:</span>{" "}
                {connection.switch?.location_name || "N/A"}
                {connection.switch?.location?.door_number && ( // Display door number
                    <span className="ml-1"> (Door: {connection.switch.location.door_number})</span>
                )}
              </p>
              <p className="flex items-center">
                <Columns size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Row:</span>{" "}
                {connection.switch?.row_in_rack || "N/A"}
              </p>
              <p className="flex items-center">
                <Server size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Rack:</span>{" "}
                {connection.switch?.rack_name || "N/A"}
              </p>
              <p className="flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Total Ports:</span>{" "}
                {connection.switch?.total_ports || "N/A"}
              </p>
              <p className="flex items-center">
                <Link size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Source Port:</span>{" "}
                {connection.switch?.source_port || "N/A"}
              </p>
              <p className="flex items-center">
                <Info size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Model:</span>{" "}
                {connection.switch?.model || "N/A"}
              </p>
              <p className="flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Usage:{" "}
                {connection.switch?.usage || "N/A"}
              </p>
              <p className="flex items-start col-span-full">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                <span className="font-medium">Description:</span>{" "}
                {connection.switch?.description || "No description"}
              </p>
              <p className="flex items-center col-span-full">
                <Link size={16} className="text-gray-500 mr-2" />{" "}
                <span className="font-medium">Port:</span>{" "}
                {connection.switch_port || "N/A"} - Status:{" "}
                {connection.is_switch_port_up ? "Up" : "Down"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionList({ connections, onDelete, onEdit, onPrint }) { // Pass onPrint here
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [filteredConnections, setFilteredConnections] = useState([]); // State for filtered connections

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 10 items per page

  // Effect to filter connections based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = connections.filter((connection) => {
      // Check PC details
      const pcMatches =
        (connection.pc?.name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.username || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.operating_system || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.model || "") // Updated from ports_name
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.office || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.description || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.multi_port ? "multi-port" : "single-port").includes(
          lowerCaseSearchTerm
        ) ||
        (connection.pc?.type || "") // New: search by type
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.usage || "") // New: search by usage
          .toLowerCase()
          .includes(lowerCaseSearchTerm);

      // Check Connection Cable details
      const connectionCableMatches =
        (connection.cable_color || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (connection.cable_label || "").toLowerCase().includes(lowerCaseSearchTerm);

      // Check Patch Panel hop details
      const hopMatches = connection.hops.some(
        (hop) =>
          (hop.patch_panel?.name || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel_port || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.location_name || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.location?.door_number || "") // New: search by location door number
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.rack_name || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.row_in_rack || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.description || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.cable_color || "") // New: search by hop cable color
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.cable_label || "") // New: search by hop cable label
            .toLowerCase()
            .includes(lowerCaseSearchTerm)
      );

      // Check Switch details
      const switchMatches =
        (connection.switch?.name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch_port || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.location_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.location?.door_number || "") // New: search by location door number
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.rack_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.model || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.source_port || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.description || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.usage || "") // New: search by usage
          .toLowerCase()
          .includes(lowerCaseSearchTerm);

      return pcMatches || connectionCableMatches || hopMatches || switchMatches;
    });
    setFilteredConnections(filtered);
    setCurrentPage(1); // Reset to first page on new search/filter
  }, [connections, searchTerm]);

  // Calculate the connections to display for the current page from filteredConnections
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentConnections = filteredConnections.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Calculate total pages based on filteredConnections
  const totalPages = Math.ceil(filteredConnections.length / itemsPerPage);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Adjust current page if itemsPerPage changes or filteredConnections list shrinks
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && connections.length > 0) {
      // If no filtered connections but there are total connections, means search yielded nothing
      // Or if all connections are deleted
      setCurrentPage(1); // Still reset to 1
    } else if (totalPages === 0 && connections.length === 0) {
      // No connections at all
      setCurrentPage(1);
    }
  }, [
    filteredConnections.length,
    itemsPerPage,
    totalPages,
    currentPage,
    connections.length,
  ]);

  return (
    <div className="space-y-6">
      {/* Search Bar for Connections */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search connections (PC, Patch Panel, Switch details, cable color/label...)"
      />

      {/* Display current connections */}
      {currentConnections.length > 0 ? (
        <div className="space-y-3">
          {currentConnections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onDelete={onDelete}
              onEdit={onEdit}
              onPrint={onPrint} 
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm
            ? "No connections match your search criteria."
            : "No connections found. Start by adding one in the form above."}
        </p>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>

          {/* Items per page selector (Optional) */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to page 1 when items per page changes
            }}
            className="ml-4 p-2 border border-gray-300 rounded-md text-sm"
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