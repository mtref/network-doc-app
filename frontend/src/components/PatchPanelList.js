// frontend/src/components/PatchPanelList.js
// This component displays a searchable list of Patch Panels in a card format,
// now including filter options by Location and Rack.

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
  Columns,
  Server,
  Filter, // New icon for filter section
} from "lucide-react";

function PatchPanelList({
  patchPanels,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatchPanels, setFilteredPatchPanels] = useState([]);
  const [editingPatchPanel, setEditingPatchPanel] = useState(null);
  const [ppFormName, setPpFormName] = useState("");
  const [ppFormLocationId, setPpFormLocationId] = useState("");
  const [ppFormRowInRack, setPpFormRowInRack] = useState("");
  const [ppFormRackName, setPpFormRackName] = useState("");
  const [ppFormTotalPorts, setPpFormTotalPorts] = useState(1);
  const [ppFormDesc, setPpFormDesc] = useState("");

  const [isAddPpFormExpanded, setIsAddPpFormExpanded] = useState(false);

  // New states for filter options
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [selectedRackFilter, setSelectedRackFilter] = useState("all");

  // States to hold available unique options for filters
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);
  const [availableRackOptions, setAvailableRackOptions] = useState([]);

  // Effect to extract unique filter options whenever 'patchPanels' data changes
  useEffect(() => {
    const uniqueLocations = [
      ...new Set(patchPanels.map((pp) => pp.location_name).filter(Boolean)),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);

    const uniqueRacks = [
      ...new Set(patchPanels.map((pp) => pp.rack_name).filter(Boolean)),
    ].sort();
    setAvailableRackOptions(uniqueRacks);
  }, [patchPanels]);

  // Filter Patch Panels based on search term and filter selections
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = patchPanels.filter((pp) => {
      // Text search filter
      const matchesSearch =
        (pp.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pp.location_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pp.row_in_rack || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pp.rack_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        String(pp.total_ports).includes(lowerCaseSearchTerm) ||
        (pp.description || "").toLowerCase().includes(lowerCaseSearchTerm);

      // Location filter
      const matchesLocation =
        selectedLocationFilter === "all" ||
        pp.location_name === selectedLocationFilter;

      // Rack filter
      const matchesRack =
        selectedRackFilter === "all" || pp.rack_name === selectedRackFilter;

      return matchesSearch && matchesLocation && matchesRack;
    });
    setFilteredPatchPanels(filtered);
  }, [patchPanels, searchTerm, selectedLocationFilter, selectedRackFilter]);

  // Handle edit initiation
  const handleEdit = (pp) => {
    setEditingPatchPanel(pp);
    setPpFormName(pp.name);
    setPpFormLocationId(pp.location_id || "");
    setPpFormRowInRack(pp.row_in_rack || "");
    setPpFormRackName(pp.rack_name || "");
    setPpFormTotalPorts(pp.total_ports);
    setPpFormDesc(pp.description || "");
    setIsAddPpFormExpanded(true); // Expand form when editing
  };

  // Handle form submission for Add/Update Patch Panel
  const handlePpFormSubmit = async (e) => {
    e.preventDefault();
    if (!ppFormName.trim() || !ppFormLocationId) {
      alert("Patch Panel Name and Location are required.");
      return;
    }

    const ppData = {
      name: ppFormName,
      location_id: parseInt(ppFormLocationId),
      row_in_rack: ppFormRowInRack,
      rack_name: ppFormRackName,
      total_ports: parseInt(ppFormTotalPorts),
      description: ppFormDesc,
    };

    if (editingPatchPanel) {
      await onUpdateEntity("patch_panels", editingPatchPanel.id, ppData);
    } else {
      await onAddEntity("patch_panels", ppData);
    }
    setEditingPatchPanel(null); // Clear editing state
    setPpFormName(""); // Clear form fields
    setPpFormLocationId("");
    setPpFormRowInRack("");
    setPpFormRackName("");
    setPpFormTotalPorts(1);
    setPpFormDesc("");
    setIsAddPpFormExpanded(false); // Collapse form after submission
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options for Patch Panels */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>

        {/* Location Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="pp-location-filter"
            className="text-sm font-medium text-gray-700"
          >
            Location:
          </label>
          <select
            id="pp-location-filter"
            value={selectedLocationFilter}
            onChange={(e) => setSelectedLocationFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableLocationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Rack Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="pp-rack-filter"
            className="text-sm font-medium text-gray-700"
          >
            Rack:
          </label>
          <select
            id="pp-rack-filter"
            value={selectedRackFilter}
            onChange={(e) => setSelectedRackFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableRackOptions.map((rack) => (
              <option key={rack} value={rack}>
                {rack}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              type="text"
              placeholder="Row in Rack (Optional)"
              value={ppFormRowInRack}
              onChange={(e) => setPpFormRowInRack(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Rack Name (Optional)"
              value={ppFormRackName}
              onChange={(e) => setPpFormRackName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Total Ports (e.g., 24)"
              value={ppFormTotalPorts}
              onChange={(e) => setPpFormTotalPorts(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
            <textarea
              placeholder="Description (Optional)"
              value={ppFormDesc}
              onChange={(e) => setPpFormDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
              rows="3"
            ></textarea>
            <div className="flex space-x-3 justify-end">
              {editingPatchPanel && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPatchPanel(null);
                    setPpFormName("");
                    setPpFormLocationId("");
                    setPpFormRowInRack("");
                    setPpFormRackName("");
                    setPpFormTotalPorts(1);
                    setPpFormDesc("");
                    setIsAddPpFormExpanded(false);
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
                {pp.location_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Server size={16} className="text-gray-500 mr-2" /> Row:{" "}
                {pp.row_in_rack || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Columns size={16} className="text-gray-500 mr-2" /> Rack:{" "}
                {pp.rack_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Total
                Ports: {pp.total_ports}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-start">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                Description: {pp.description || "No description"}
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
            ? "No Patch Panels match your search and filter criteria."
            : "No Patch Panels added yet."}
        </p>
      )}
    </div>
  );
}

export default PatchPanelList;
