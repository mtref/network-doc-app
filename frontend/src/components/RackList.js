// frontend/src/components/RackList.js
// This component displays a searchable list of Racks in a card format,
// including filter options by Location, and now a visual representation of each rack.

import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Columns, // Icon for Rack
  MapPin, // Icon for Location
  Info, // Icon for Description
  PlusCircle, // Icon for Add button
  ChevronDown, // Icon for Collapse
  ChevronUp, // Icon for Expand
  Filter, // Icon for Filter
  Server, // Icon for Switch
  Split, // Icon for Patch Panel
  HardDrive, // Generic device icon for unknown type
  ArrowDownNarrowWide, // Icon for top-down orientation
  ArrowUpWideNarrow, // Icon for bottom-up orientation
  Maximize, // Icon for View Rack button
} from "lucide-react";

// New sub-component for visualizing a single Rack
export const RackVisualizer = ({ rack, switches, patchPanels, onShowPortStatus }) => {
  // Explicitly ensure switches and patchPanels are arrays, even if props are undefined/null
  const currentSwitches = Array.isArray(switches) ? switches : [];
  const currentPatchPanels = Array.isArray(patchPanels) ? patchPanels : [];

  if (!rack || !rack.total_units) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        No rack unit information available.
      </div>
    );
  }

  // Create an array of units from 1 to total_units
  const rawUnits = Array.from({ length: rack.total_units }, (_, i) => i + 1);

  // Reverse the units for display if orientation is 'bottom-up' (standard rack view)
  // Or keep as is if 'top-down'
  const displayUnits = rack.orientation === 'top-down' ? rawUnits : [...rawUnits].reverse();

  // Create a map of occupied units for quick lookup
  const occupiedUnits = new Map(); // Map: unitNumber -> { type: 'switch'|'patchPanel', name: 'DeviceName', id: deviceId, total_ports: number }

  // Switches in this rack - Filtering on the guaranteed 'currentSwitches' array
  currentSwitches.forEach(s => {
      if (s !== null && s !== undefined && s.rack_id === rack.id && s.row_in_rack) {
          const unit = parseInt(s.row_in_rack);
          if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
              occupiedUnits.set(unit, { type: 'switch', name: s.name, id: s.id, total_ports: s.total_ports });
          }
      }
  });

  // Patch Panels in this rack - Filtering on the guaranteed 'currentPatchPanels' array
  currentPatchPanels.forEach(pp => {
      if (pp !== null && pp !== undefined && pp.rack_id === rack.id && pp.row_in_rack) {
          const unit = parseInt(pp.row_in_rack);
          if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
              if (!occupiedUnits.has(unit)) {
                 occupiedUnits.set(unit, { type: 'patchPanel', name: pp.name, id: pp.id, total_ports: pp.total_ports });
              }
          }
      }
  });
  
  // Determine text color based on orientation
  const orientationTextColor = rack.orientation === 'top-down' ? 'text-blue-600' : 'text-purple-600';
  const OrientationIcon = rack.orientation === 'top-down' ? ArrowDownNarrowWide : ArrowUpWideNarrow;


  return (
    <div className="mt-4 border border-gray-300 rounded-md p-2 bg-gray-50 max-h-64 overflow-y-auto">
      <h5 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center justify-between">
        <span>Rack Units ({rack.total_units}U)</span>
        <span className={`text-xs font-normal flex items-center ${orientationTextColor}`}>
            <OrientationIcon size={14} className="mr-1" />
            {rack.orientation === 'top-down' ? 'Top-Down' : 'Bottom-Up'}
        </span>
      </h5>
      <div className="space-y-0.5">
        {displayUnits.map((unit) => {
          const content = occupiedUnits.get(unit);
          let unitClass = "bg-gray-200 text-gray-600"; // Free slot
          let unitContent = `U${unit}: Free`;
          let Icon = HardDrive; // Default generic icon
          let isClickable = false;
          let entityType = null;
          let entityId = null;

          if (content) {
            isClickable = true; // Make occupied units clickable
            entityId = content.id;
            if (content.type === 'switch') {
              unitClass = "bg-red-100 text-red-800 border border-red-300";
              unitContent = `U${unit}: ${content.name} (SW - ${content.total_ports}p)`;
              Icon = Server;
              entityType = 'switches';
            } else if (content.type === 'patchPanel') {
              unitClass = "bg-green-100 text-green-800 border border-green-300";
              unitContent = `U${unit}: ${content.name} (PP - ${content.total_ports}p)`;
              Icon = Split;
              entityType = 'patch_panels';
            }
          }

          return (
            <div
              key={unit}
              className={`flex items-center text-xs p-1 rounded ${unitClass} ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''}`}
              title={content ? `${content.name} (${content.type === 'switch' ? 'Switch' : 'Patch Panel'}) - ${content.total_ports} ports` : `U${unit}: Free`}
              onClick={isClickable ? () => onShowPortStatus(entityType, entityId) : null}
            >
              <Icon size={12} className="mr-1 flex-shrink-0" />
              <span className="flex-grow truncate">{unitContent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


function RackList({ racks, locations, onAddEntity, onUpdateEntity, onDeleteEntity, switches, patchPanels, onShowPortStatus, onViewRackDetails }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRacks, setFilteredRacks] = useState([]);
  const [editingRack, setEditingRack] = useState(null); // State for editing a Rack
  const [rackFormName, setRackFormName] = useState("");
  const [rackFormLocationId, setRackFormLocationId] = useState("");
  const [rackFormDescription, setRackFormDescription] = useState("");
  const [rackFormTotalUnits, setRackFormTotalUnits] = useState(42); // NEW: State for total_units
  const [rackFormOrientation, setRackFormOrientation] = useState('bottom-up'); // NEW: State for orientation

  const [isAddRackFormExpanded, setIsAddRackFormExpanded] = useState(false);

  // State for filter options
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");

  // State to hold available unique location options for filters
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);

  // Effect to extract unique filter options whenever 'racks' or 'locations' data changes
  useEffect(() => {
    const uniqueLocations = [
      ...new Set(locations.map(loc => loc.name + (loc.door_number ? ` (Door: ${loc.door_number})` : ''))),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);
  }, [racks, locations]);

  // Filter Racks based on search term and filter selections
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const currentRacks = Array.isArray(racks) ? racks : []; // Defensive check
    const currentLocations = Array.isArray(locations) ? locations : []; // Defensive check

    const filtered = currentRacks.filter((rack) => {
      // Safely get location door number for search
      const rackLocationDoorNumber = rack.location?.door_number || "";

      // Text search filter
      const matchesSearch =
        (rack.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (rack.location_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (rackLocationDoorNumber).toLowerCase().includes(lowerCaseSearchTerm) || // Search by door number
        (rack.description || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (typeof rack.total_units === 'number' && String(rack.total_units).includes(lowerCaseSearchTerm)) || // Search by total_units
        (typeof rack.orientation === 'string' && rack.orientation.toLowerCase().includes(lowerCaseSearchTerm)); // NEW: Search by orientation

      // Location filter
      const matchesLocation =
        selectedLocationFilter === "all" ||
        (rack.location_name + (rackLocationDoorNumber ? ` (Door: ${rackLocationDoorNumber})` : '')) === selectedLocationFilter;

      return matchesSearch && matchesLocation;
    });
    setFilteredRacks(filtered);
  }, [
    racks,
    searchTerm,
    selectedLocationFilter,
    locations,
  ]);

  // Handle edit initiation
  const handleEdit = useCallback((rack) => {
    setEditingRack(rack);
    setRackFormName(rack.name);
    setRackFormLocationId(rack.location_id || "");
    setRackFormDescription(rack.description || "");
    setRackFormTotalUnits(rack.total_units || 42); // NEW: Set total_units for editing
    setRackFormOrientation(rack.orientation || 'bottom-up'); // NEW: Set orientation for editing
    setIsAddRackFormExpanded(true); // Expand form when editing
  }, []);

  // Handle form submission for Add/Update Rack
  const handleRackFormSubmit = async (e) => {
    e.preventDefault();
    if (!rackFormName.trim() || !rackFormLocationId) {
      alert("Rack Name and Location are required.");
      return;
    }
    // Basic validation for total_units
    if (isNaN(parseInt(rackFormTotalUnits)) || parseInt(rackFormTotalUnits) < 1 || parseInt(rackFormTotalUnits) > 50) {
        alert("Total Units must be a number between 1 and 50.");
        return;
    }

    const rackData = {
      name: rackFormName,
      location_id: parseInt(rackFormLocationId),
      description: rackFormDescription,
      total_units: parseInt(rackFormTotalUnits), // NEW: Include total_units in data
      orientation: rackFormOrientation, // NEW: Include orientation in data
    };

    if (editingRack) {
      await onUpdateEntity("racks", editingRack.id, rackData);
    } else {
      await onAddEntity("racks", rackData);
    }
    setEditingRack(null); // Clear editing state
    setRackFormName(""); // Clear form fields
    setRackFormLocationId("");
    setRackFormDescription("");
    setRackFormTotalUnits(42); // NEW: Reset total_units
    setRackFormOrientation('bottom-up'); // NEW: Reset orientation
    setIsAddRackFormExpanded(false); // Collapse form after submission
  };

  const sortedLocations = Array.isArray(locations) ? [...locations].sort((a,b) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options for Racks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>

        {/* Location Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="rack-location-filter"
            className="text-sm font-medium text-gray-700"
          >
            Location:
          </label>
          <select
            id="rack-location-filter"
            value={selectedLocationFilter}
            onChange={(e) => setSelectedLocationFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableLocationOptions.map((locNameWithDoor) => (
              <option key={locNameWithDoor} value={locNameWithDoor}>
                {locNameWithDoor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Rack Form (Collapsible) */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 rounded-t-lg"
          onClick={() => setIsAddRackFormExpanded(!isAddRackFormExpanded)}
        >
          <h3 className="text-xl font-bold flex items-center">
            <PlusCircle size={20} className="mr-2" />{" "}
            {editingRack ? "Edit Rack" : "Add New Rack"}
          </h3>
          {isAddRackFormExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
        <div
          className={`collapsible-content ${
            isAddRackFormExpanded ? "expanded" : ""
          }`}
        >
          <form onSubmit={handleRackFormSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Rack Name"
              value={rackFormName}
              onChange={(e) => setRackFormName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <select
              value={rackFormLocationId}
              onChange={(e) => setRackFormLocationId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select Location --</option>
              {sortedLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.door_number && `(Door: ${loc.door_number})`}
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a location first (Go to Locations tab) to add a Rack.
              </p>
            )}
            <input
              type="number"
              placeholder="Total Units (e.g., 42)"
              value={rackFormTotalUnits}
              onChange={(e) => setRackFormTotalUnits(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="50"
              required
            />
            {/* NEW: Orientation Selection */}
            <div>
              <label htmlFor="rack-orientation" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Numbering Orientation:
              </label>
              <select
                id="rack-orientation"
                value={rackFormOrientation}
                onChange={(e) => setRackFormOrientation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              >
                <option value="bottom-up">Bottom-Up (Unit 1 at bottom)</option>
                <option value="top-down">Top-Down (Unit 1 at top)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Determines how rack unit numbers are ordered visually. Standard is Bottom-Up.
              </p>
            </div>
            <textarea
              placeholder="Description (Optional)"
              value={rackFormDescription}
              onChange={(e) => setRackFormDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
              rows="3"
            ></textarea>
            <div className="flex space-x-3 justify-end">
              {editingRack && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRack(null);
                    setRackFormName("");
                    setRackFormLocationId("");
                    setRackFormDescription("");
                    setRackFormTotalUnits(42); // Reset total_units
                    setRackFormOrientation('bottom-up'); // Reset orientation
                    setIsAddRackFormExpanded(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                {editingRack ? "Update Rack" : "Add Rack"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rack List Display */}
      {filteredRacks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRacks.map((rack) => (
            <div
              key={rack.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5"
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <Columns size={20} className="text-blue-500 mr-2" /> {rack.name}
              </h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-500 mr-2" /> Location:{" "}
                {rack.location_name || "N/A"}{rack.location?.door_number && ` (Door: ${rack.location.door_number})`}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-start">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                Description: {rack.description || "No description"}
              </p>

              {/* NEW: Rack Visualizer Component */}
              <RackVisualizer
                  rack={rack}
                  switches={Array.isArray(switches) ? switches : []} // Ensure switches is an array [cite: 1]
                  patchPanels={Array.isArray(patchPanels) ? patchPanels : []} // Ensure patchPanels is an array [cite: 1]
                  onShowPortStatus={onShowPortStatus}
              />
              
              <div className="flex justify-end space-x-2 mt-4"> {/* Added mt-4 for spacing */}
                <button
                  onClick={() => handleEdit(rack)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteEntity("racks", rack.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Delete
                </button>
                {/* NEW: View Rack Details Button */}
                <button
                  onClick={() => onViewRackDetails(rack)}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center"
                  title="View Rack Details"
                >
                  <Maximize size={16} className="mr-1" /> View Rack
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm
            ? "No Racks match your search and filter criteria."
            : "No Racks added yet."}
        </p>
      )}
    </div>
  );
}

export default RackList;