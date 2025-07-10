// frontend/src/components/ConnectionList.js
// This component displays a list of network connections.
// REFACTORED: The connection card now has a new single-line collapsed view showing the full path,
// and a detailed, multi-section expanded view. The entire card is clickable to toggle the view.
// UPDATED: The expanded view now includes more details for the PC and Switch sections.

import React, { useState, useEffect } from "react";
import {
  Laptop,
  Server,
  Split,
  ArrowRight,
  WifiOff,
  Wifi,
  ChevronDown,
  ChevronUp,
  Tag,
  Palette,
  MapPin,
  Router as IpIcon,
  HardDrive,
  Info,
  User,
  Building2,
  Columns,
  Activity,
} from "lucide-react";
import SearchBar from "./SearchBar";

// A small helper component for displaying details in the expanded view
const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start text-sm">
    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500">
      {icon}
    </div>
    <div className="ml-2">
      <span className="font-semibold text-gray-800">{label}:</span>
      <span className="ml-1 text-gray-700">{value}</span>
    </div>
  </div>
);

// The main card component for a single connection
function ConnectionCard({
  connection,
  onDelete,
  onEdit,
  onViewPcDetails,
  onShowPortStatus,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActionClick = (e, action) => {
    e.stopPropagation(); // Prevent the card from expanding when clicking a button
    action();
  };

  const handleDetailClick = (e, action) => {
    e.stopPropagation(); // Prevent the card from expanding when clicking a detail box
    action();
  };

  const pcIcon =
    connection.pc?.type === "Server" ? (
      <Server size={20} className="text-indigo-500 flex-shrink-0" />
    ) : (
      <Laptop size={20} className="text-indigo-500 flex-shrink-0" />
    );

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* --- Collapsed View (Clickable to expand/collapse) --- */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2 overflow-hidden min-w-0">
          {pcIcon}
          <span
            className="font-semibold text-gray-800 truncate"
            title={connection.pc?.name}
          >
            {connection.pc?.name || "N/A"}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {connection.pc?.ip_address}
          </span>
          <ArrowRight size={18} className="text-gray-400 flex-shrink-0" />

          {connection.hops && connection.hops.length > 0 ? (
            connection.hops.map((hop, index) => (
              <React.Fragment key={hop.id || index}>
                <Split size={20} className="text-green-500 flex-shrink-0" />
                <span
                  className="font-medium text-gray-700 truncate"
                  title={`[P:${hop.patch_panel_port}] ${hop.patch_panel?.name} - ${hop.patch_panel?.location_name}`}
                >
                  [P:{hop.patch_panel_port}] {hop.patch_panel?.name}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {hop.patch_panel?.location_name}
                </span>
                <ArrowRight size={18} className="text-gray-400 flex-shrink-0" />
              </React.Fragment>
            ))
          ) : (
            <span className="text-sm text-gray-400 italic">Direct</span>
          )}

          <Server size={20} className="text-red-500 flex-shrink-0" />
          <span
            className="font-semibold text-gray-800 truncate"
            title={`[P:${connection.switch_port}] ${connection.switch?.name} - ${connection.switch?.location_name}`}
          >
            [P:{connection.switch_port}] {connection.switch?.name}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {connection.switch?.location_name}
          </span>
        </div>
        <div className="flex items-center space-x-2 pl-4">
          {connection.is_switch_port_up ? (
            <Wifi size={18} className="text-green-500" title="Port is Up" />
          ) : (
            <WifiOff size={18} className="text-red-500" title="Port is Down" />
          )}
          <button
            onClick={(e) => handleActionClick(e, onEdit)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={(e) => handleActionClick(e, onDelete)}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* --- Expanded View --- */}
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-4">
          {/* PC Details (Clickable) */}
          <div
            className="p-3 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:shadow-inner cursor-pointer"
            onClick={(e) =>
              handleDetailClick(e, () => onViewPcDetails(connection.pc))
            }
          >
            <h5 className="font-bold text-indigo-800 flex items-center mb-2">
              {pcIcon}
              <span className="ml-2">Start: {connection.pc?.name}</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <DetailItem
                icon={<IpIcon size={14} />}
                label="IP Address"
                value={connection.pc?.ip_address || "N/A"}
              />
              <DetailItem
                icon={<User size={14} />}
                label="Username"
                value={connection.pc?.username || "N/A"}
              />
              <DetailItem
                icon={<Building2 size={14} />}
                label="Office"
                value={connection.pc?.office || "N/A"}
              />
              <DetailItem
                icon={<Tag size={14} />}
                label="Wall Point"
                value={connection.wall_point_label || "N/A"}
              />
              <DetailItem
                icon={<Palette size={14} />}
                label="Wall Cable Color"
                value={connection.wall_point_cable_color || "N/A"}
              />
              <DetailItem
                icon={<Tag size={14} />}
                label="Wall Cable Label"
                value={connection.wall_point_cable_label || "N/A"}
              />
            </div>
          </div>

          {/* Hops Details (Clickable) */}
          {connection.hops && connection.hops.length > 0 && (
            <div className="p-3 rounded-md border border-green-200 bg-green-50">
              <h5 className="font-bold text-green-800 flex items-center mb-2">
                <Split size={20} className="mr-2" />
                Path Hops
              </h5>
              <div className="space-y-3">
                {connection.hops.map((hop, index) => (
                  <div
                    key={hop.id || index}
                    className="pl-4 border-l-2 border-green-300 hover:bg-green-100 rounded-r-md cursor-pointer"
                    onClick={(e) =>
                      handleDetailClick(e, () =>
                        onShowPortStatus("patch_panels", hop.patch_panel.id)
                      )
                    }
                  >
                    <DetailItem
                      icon={<Split size={14} />}
                      label={`Hop ${index + 1}`}
                      value={hop.patch_panel?.name || "N/A"}
                    />
                    <DetailItem
                      icon={<MapPin size={14} />}
                      label="Location"
                      value={hop.patch_panel?.location_name || "N/A"}
                    />
                    <DetailItem
                      icon={<HardDrive size={14} />}
                      label="Port"
                      value={`${hop.patch_panel_port} (${
                        hop.is_port_up ? "Up" : "Down"
                      })`}
                    />
                    <DetailItem
                      icon={<Palette size={14} />}
                      label="Cable Color"
                      value={hop.cable_color || "N/A"}
                    />
                    <DetailItem
                      icon={<Tag size={14} />}
                      label="Cable Label"
                      value={hop.cable_label || "N/A"}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Switch Details (Clickable) */}
          <div
            className="p-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-inner cursor-pointer"
            onClick={(e) =>
              handleDetailClick(e, () =>
                onShowPortStatus("switches", connection.switch.id)
              )
            }
          >
            <h5 className="font-bold text-red-800 flex items-center mb-2">
              <Server size={20} className="mr-2" />
              End: {connection.switch?.name}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <DetailItem
                icon={<IpIcon size={14} />}
                label="IP Address"
                value={connection.switch?.ip_address || "N/A"}
              />
              <DetailItem
                icon={<MapPin size={14} />}
                label="Location"
                value={connection.switch?.location_name || "N/A"}
              />
              <DetailItem
                icon={<Columns size={14} />}
                label="Rack"
                value={connection.switch?.rack_name || "N/A"}
              />
              <DetailItem
                icon={<Activity size={14} />}
                label="Usage"
                value={connection.switch?.usage || "N/A"}
              />
              <DetailItem
                icon={<HardDrive size={14} />}
                label="Port"
                value={`${connection.switch_port} (${
                  connection.is_switch_port_up ? "Up" : "Down"
                })`}
              />
              <DetailItem
                icon={<Info size={14} />}
                label="Model"
                value={connection.switch?.model || "N/A"}
              />
              <DetailItem
                icon={<Palette size={14} />}
                label="Final Cable Color"
                value={connection.cable_color || "N/A"}
              />
              <DetailItem
                icon={<Tag size={14} />}
                label="Final Cable Label"
                value={connection.cable_label || "N/A"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionList({
  connections,
  onDelete,
  onEdit,
  onViewPcDetails,
  onShowPortStatus,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = connections.filter((connection) => {
      const pcName = (connection.pc?.name || "").toLowerCase();
      const pcIp = (connection.pc?.ip_address || "").toLowerCase();
      const switchName = (connection.switch?.name || "").toLowerCase();
      const switchPort = (connection.switch_port || "").toLowerCase();
      const wallPoint = (connection.wall_point_label || "").toLowerCase();
      const wallPointCable = (
        connection.wall_point_cable_label || ""
      ).toLowerCase();
      const hopsText = (connection.hops || [])
        .map(
          (hop) =>
            `${hop.patch_panel?.name || ""} ${hop.patch_panel_port || ""}`
        )
        .join(" ")
        .toLowerCase();

      return (
        pcName.includes(lowerCaseSearchTerm) ||
        pcIp.includes(lowerCaseSearchTerm) ||
        switchName.includes(lowerCaseSearchTerm) ||
        switchPort.includes(lowerCaseSearchTerm) ||
        wallPoint.includes(lowerCaseSearchTerm) ||
        wallPointCable.includes(lowerCaseSearchTerm) ||
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
            onViewPcDetails={onViewPcDetails}
            onShowPortStatus={onShowPortStatus}
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
