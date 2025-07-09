// frontend/src/components/ConnectionList.js
// This component displays a list of network connections.
// UPDATED: Hides Edit/Delete buttons based on user role.

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
  Edit,
  Trash2
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
  user // Receive user prop
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pc = connection.pc || {};
  const switchDevice = connection.switch || {};
  const hops = connection.hops || [];

  const fullPath = [
    { type: "pc", name: pc.name },
    ...hops.map((hop) => ({
      type: "hop",
      name: hop.patch_panel?.name || "Unknown PP",
    })),
    { type: "switch", name: switchDevice.name },
  ];

  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white transition-shadow duration-300 hover:shadow-md">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Collapsed View */}
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm md:text-base">
            <Laptop size={18} className="text-indigo-500 flex-shrink-0" />
            <span className="font-bold text-gray-800">{pc.name}</span>
            <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
            {hops.map((hop, index) => (
              <React.Fragment key={index}>
                <Split size={18} className="text-green-500 flex-shrink-0" />
                <span className="font-semibold text-gray-700">
                  {hop.patch_panel?.name}
                </span>
                <ArrowRight size={16} className="text-gray-400 flex-shrink-0" />
              </React.Fragment>
            ))}
            <Server size={18} className="text-red-500 flex-shrink-0" />
            <span className="font-bold text-gray-800">{switchDevice.name}</span>
            <span className="text-gray-600">(Port: {connection.switch_port})</span>
          </div>
          <div className="flex items-center">
            {connection.is_switch_port_up ? (
              <Wifi size={20} className="text-green-500" title="Port is Up" />
            ) : (
              <WifiOff size={20} className="text-red-500" title="Port is Down" />
            )}
            {isExpanded ? (
              <ChevronUp size={24} className="ml-4 text-gray-500" />
            ) : (
              <ChevronDown size={24} className="ml-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PC Details Section */}
            <div className="p-4 border rounded-md bg-white">
              <h4 className="font-bold text-lg mb-2 flex items-center text-indigo-700">
                <Laptop size={20} className="mr-2" /> PC Details
              </h4>
              <DetailItem icon={<User size={16} />} label="Name" value={pc.name || "N/A"} />
              <DetailItem icon={<IpIcon size={16} />} label="IP Address" value={pc.ip_address || "N/A"} />
              <DetailItem icon={<Building2 size={16} />} label="Office" value={pc.office || "N/A"} />
              <button onClick={(e) => { e.stopPropagation(); onViewPcDetails(pc); }} className="text-sm text-blue-600 hover:underline mt-2">View More Details</button>
            </div>

            {/* Switch Details Section */}
            <div className="p-4 border rounded-md bg-white">
              <h4 className="font-bold text-lg mb-2 flex items-center text-red-700">
                <Server size={20} className="mr-2" /> Switch Details
              </h4>
              <DetailItem icon={<Server size={16} />} label="Name" value={switchDevice.name || "N/A"} />
              <DetailItem icon={<IpIcon size={16} />} label="IP Address" value={switchDevice.ip_address || "N/A"} />
              <DetailItem icon={<MapPin size={16} />} label="Location" value={switchDevice.location_name || "N/A"} />
              <button onClick={(e) => { e.stopPropagation(); onShowPortStatus("switches", switchDevice.id); }} className="text-sm text-blue-600 hover:underline mt-2">View Port Status</button>
            </div>
          </div>

          {/* Hops Details Section */}
          {hops.length > 0 && (
            <div className="p-4 border rounded-md bg-white">
              <h4 className="font-bold text-lg mb-2 flex items-center text-green-700">
                <Split size={20} className="mr-2" /> Patch Panel Hops
              </h4>
              <div className="space-y-3">
                {hops.map((hop, index) => (
                  <div key={index} className="p-2 border-l-4 border-green-200">
                    <p className="font-semibold">Hop {index + 1}: {hop.patch_panel?.name}</p>
                    <DetailItem icon={<MapPin size={16} />} label="Location" value={hop.patch_panel?.location_name || "N/A"} />
                    <DetailItem icon={<Tag size={16} />} label="Port" value={hop.patch_panel_port || "N/A"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex justify-end space-x-3 pt-3 border-t mt-4">
              <button onClick={(e) => { e.stopPropagation(); onEdit(connection); }} className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Edit size={16} className="mr-2" /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(connection.id); }} className="flex items-center px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">
                <Trash2 size={16} className="mr-2" /> Delete
              </button>
            </div>
          )}
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
  user
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = connections.filter((connection) => {
      const pc = connection.pc || {};
      const switchDevice = connection.switch || {};
      const hops = connection.hops || [];
      const searchString = [
        pc.name,
        pc.ip_address,
        switchDevice.name,
        switchDevice.ip_address,
        connection.switch_port,
        ...hops.map((h) => h.patch_panel?.name),
        ...hops.map((h) => h.patch_panel_port),
      ]
        .join(" ")
        .toLowerCase();
      return searchString.includes(lowerCaseSearchTerm);
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
            onDelete={onDelete}
            onEdit={onEdit}
            onViewPcDetails={onViewPcDetails}
            onShowPortStatus={onShowPortStatus}
            user={user}
          />
        ))
      ) : (
        <p className="text-center text-gray-500 mt-8">
          {searchTerm ? "No connections match your search." : "No connections found."}
        </p>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNumber) => (
              <button key={pageNumber} onClick={() => paginate(pageNumber)} className={`px-4 py-2 rounded-md ${currentPage === pageNumber ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                {pageNumber}
              </button>
            )
          )}
          <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">
            Next
          </button>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="ml-4 p-2 border rounded-md text-sm">
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
