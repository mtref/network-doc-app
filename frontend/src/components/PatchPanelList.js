// frontend/src/components/PatchPanelList.js
// This component displays a searchable list of Patch Panels in a card format.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Split,
  MapPin,
  HardDrive,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"; // Icons for PP details and collapse/expand

function PatchPanelList({
  patchPanels,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations,
}) {
  // Added locations prop
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatchPanels, setFilteredPatchPanels] = useState([]);
  const [editingPatchPanel, setEditingPatchPanel] = useState(null); // State for editing a Patch Panel
  const [ppFormName, setPpFormName] = useState("");
  const [ppFormLocationId, setPpFormLocationId] = useState(""); // Changed to location_id
  const [ppFormTotalPorts, setPpFormTotalPorts] = useState(1);

  const [isAddPpFormExpanded, setIsAddPpFormExpanded] = useState(false); // State for collapsible add form

  // Filter Patch Panels based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = patchPanels.filter(
      (pp) =>
        (pp.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pp.location_name || "").toLowerCase().includes(lowerCaseSearchTerm) || // Search by location_name
        String(pp.total_ports).includes(lowerCaseSearchTerm)
    );
    setFilteredPatchPanels(filtered);
  }, [patchPanels, searchTerm]);

  // Handle edit initiation
  const handleEdit = (pp) => {
    setEditingPatchPanel(pp);
    setPpFormName(pp.name);
    setPpFormLocationId(pp.location_id || ""); // Set location_id for editing
    setPpFormTotalPorts(pp.total_ports);
    setIsAddPpFormExpanded(true); // Expand form when editing
  };

  // Handle form submission for Add/Update Patch Panel
  const handlePpFormSubmit = async (e) => {
    e.preventDefault();
    const ppData = {
      name: ppFormName,
      location_id: parseInt(ppFormLocationId), // Send location_id
      total_ports: parseInt(ppFormTotalPorts),
    };

    if (editingPatchPanel) {
      await onUpdateEntity("patch_panels", editingPatchPanel.id, ppData);
    } else {
      await onAddEntity("patch_panels", ppData);
    }
    setEditingPatchPanel(null); // Clear editing state
    setPpFormName(""); // Clear form fields
    setPpFormLocationId(""); // Clear location_id
    setPpFormTotalPorts(1);
    setIsAddPpFormExpanded(false); // Collapse form after submission
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Add/Edit Patch Panel Form (Collapsible) */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg"
          onClick={() => setIsAddPpFormExpanded(!isAddPpFormExpanded)}
        >
          <h3 className="text-xl font-bold text-green-700 flex items-center">
            <PlusCircle size={20} className="mr-2" />{" "}
            {editingPatchPanel ? "Edit Patch Panel" : "Add New Patch Panel"}
          </h3>
          {isAddPpFormExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
        <div
          className={`collapsible-content ${
            isAddPpFormExpanded ? "expanded" : ""
          }`}
        >
          <form onSubmit={handlePpFormSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Patch Panel Name"
              value={ppFormName}
              onChange={(e) => setPpFormName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <select
              value={ppFormLocationId}
              onChange={(e) => setPpFormLocationId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a location first (Go to Locations tab).
              </p>
            )}
            <input
              type="number"
              placeholder="Total Ports (e.g., 24)"
              value={ppFormTotalPorts}
              onChange={(e) => setPpFormTotalPorts(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
            <div className="flex space-x-3 justify-end">
              {editingPatchPanel && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPatchPanel(null);
                    setPpFormName("");
                    setPpFormLocationId("");
                    setPpFormTotalPorts(1);
                    setIsAddPpFormExpanded(false); // Collapse form on cancel
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
              >
                {editingPatchPanel ? "Update Patch Panel" : "Add Patch Panel"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Patch Panel List Display */}
      {filteredPatchPanels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatchPanels.map((pp) => (
            <div
              key={pp.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5"
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <Split size={20} className="text-green-500 mr-2" /> {pp.name}
              </h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-500 mr-2" /> Location:{" "}
                {pp.location_name || "N/A"} {/* Display location name */}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Total
                Ports: {pp.total_ports}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onShowPortStatus("patch_panels", pp.id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  View Ports
                </button>
                <button
                  onClick={() => handleEdit(pp)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteEntity("patch_panels", pp.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm
            ? "No Patch Panels match your search."
            : "No Patch Panels added yet."}
        </p>
      )}
    </div>
  );
}

export default PatchPanelList;
