// frontend/src/components/RackList.js
// This component displays a searchable list of Racks in a card format,
// including filter options by Location.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Columns, // Icon for Rack
  MapPin, // Icon for Location
  Info, // Icon for Description
  PlusCircle, // Icon for Add button
  ChevronDown, // Icon for Collapse
  ChevronUp, // Icon for Expand
  Filter, // ADDED: Icon for Filter
} from "lucide-react";

function RackList({ racks, locations, onAddEntity, onUpdateEntity, onDeleteEntity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRacks, setFilteredRacks] = useState([]);
  const [editingRack, setEditingRack] = useState(null); // State for editing a Rack
  const [rackFormName, setRackFormName] = useState("");
  const [rackFormLocationId, setRackFormLocationId] = useState("");
  const [rackFormDescription, setRackFormDescription] = useState("");

  const [isAddRackFormExpanded, setIsAddRackFormExpanded] = useState(false);

  // State for filter options
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");

  // State to hold available unique location options for filters
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);

  // Effect to extract unique filter options whenever 'racks' or 'locations' data changes
  useEffect(() => {
    // Combine location name and door number for display in filters
    const uniqueLocations = [
      ...new Set(locations.map(loc => loc.name + (loc.door_number ? ` (Door: ${loc.door_number})` : ''))),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);
  }, [racks, locations]); // Added locations to dependency array

  // Filter Racks based on search term and filter selections
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = racks.filter((rack) => {
      // Text search filter
      const matchesSearch =
        (rack.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (rack.location_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (locations.find(loc => loc.id === rack.location_id)?.door_number || "").toLowerCase().includes(lowerCaseSearchTerm) || // Search by door number
        (rack.description || "").toLowerCase().includes(lowerCaseSearchTerm);

      // Location filter
      const matchesLocation =
        selectedLocationFilter === "all" ||
        (rack.location_name + (locations.find(loc => loc.id === rack.location_id)?.door_number ? ` (Door: ${locations.find(loc => loc.id === rack.location_id).door_number})` : '')) === selectedLocationFilter;

      return matchesSearch && matchesLocation;
    });
    setFilteredRacks(filtered);
  }, [
    racks,
    searchTerm,
    selectedLocationFilter,
    locations, // Added locations to dependency array
  ]);

  // Handle edit initiation
  const handleEdit = (rack) => {
    setEditingRack(rack);
    setRackFormName(rack.name);
    setRackFormLocationId(rack.location_id || "");
    setRackFormDescription(rack.description || "");
    setIsAddRackFormExpanded(true); // Expand form when editing
  };

  // Handle form submission for Add/Update Rack
  const handleRackFormSubmit = async (e) => {
    e.preventDefault();
    if (!rackFormName.trim() || !rackFormLocationId) {
      alert("Rack Name and Location are required.");
      return;
    }

    const rackData = {
      name: rackFormName,
      location_id: parseInt(rackFormLocationId),
      description: rackFormDescription,
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
    setIsAddRackFormExpanded(false); // Collapse form after submission
  };

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
              {locations.map((loc) => (
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
              <div className="flex justify-end space-x-2">
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