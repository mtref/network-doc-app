// frontend/src/components/RackList.js
// This component displays a searchable list of Racks in a card format,
// including filter options by Location, and now a visual representation of each rack.
// Now includes pagination.

import React, { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./SearchBar";
import {
  Columns,
  MapPin,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Server,
  Split,
  HardDrive,
  ArrowDownNarrowWide,
  ArrowUpWideNarrow,
  Maximize,
} from "lucide-react";
import { RackVisualizer } from "./RackVisualizer";

function RackList({
  racks,
  locations,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  switches,
  patchPanels,
  pcs,
  onShowPortStatus,
  onViewRackDetails,
  showMessage,
  onViewPcDetails,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRacks, setFilteredRacks] = useState([]);
  const [editingRack, setEditingRack] = useState(null);
  const [rackFormName, setRackFormName] = useState("");
  const [rackFormLocationId, setRackFormLocationId] = useState("");
  const [rackFormDescription, setRackFormDescription] = useState("");
  const [rackFormTotalUnits, setRackFormTotalUnits] = useState(42);
  const [rackFormOrientation, setRackFormOrientation] = useState("bottom-up");

  const [isAddRackFormExpanded, setIsAddRackFormExpanded] = useState(false);

  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9); // Default to 9 items per page

  useEffect(() => {
    const uniqueLocations = [
      ...new Set(
        locations.map(
          (loc) =>
            loc.name + (loc.door_number ? ` (Door: ${loc.door_number})` : "")
        )
      ),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);
  }, [racks, locations]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const currentRacks = Array.isArray(racks) ? racks : [];
    const currentLocations = Array.isArray(locations) ? locations : [];

    const filtered = currentRacks.filter((rack) => {
      const rackLocationDoorNumber = rack.location?.door_number || "";

      const matchesSearch =
        (rack.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (rack.location_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        rackLocationDoorNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
        (rack.description || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (typeof rack.total_units === "number" &&
          String(rack.total_units).includes(lowerCaseSearchTerm)) ||
        (typeof rack.orientation === "string" &&
          rack.orientation.toLowerCase().includes(lowerCaseSearchTerm));

      const matchesLocation =
        selectedLocationFilter === "all" ||
        rack.location_name +
          (rackLocationDoorNumber
            ? ` (Door: ${rackLocationDoorNumber})`
            : "") ===
          selectedLocationFilter;

      return matchesSearch && matchesLocation;
    });
    setFilteredRacks(filtered);
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [racks, searchTerm, selectedLocationFilter, locations]);

  const handleEdit = useCallback((rack) => {
    setEditingRack(rack);
    setRackFormName(rack.name);
    setRackFormLocationId(rack.location_id || "");
    setRackFormDescription(rack.description || "");
    setRackFormTotalUnits(rack.total_units || 42);
    setRackFormOrientation(rack.orientation || "bottom-up");
    setIsAddRackFormExpanded(true);
  }, []);

  const handleRackFormSubmit = async (e) => {
    e.preventDefault();
    if (!rackFormName.trim() || !rackFormLocationId) {
      showMessage("Rack Name and Location are required.", 3000);
      return;
    }

    if (
      isNaN(parseInt(rackFormTotalUnits)) ||
      parseInt(rackFormTotalUnits) < 1 ||
      parseInt(rackFormTotalUnits) > 50
    ) {
      showMessage("Total Units must be a number between 1 and 50.", 3000);
      return;
    }

    const rackData = {
      name: rackFormName,
      location_id: parseInt(rackFormLocationId),
      description: rackFormDescription,
      total_units: parseInt(rackFormTotalUnits),
      orientation: rackFormOrientation,
    };

    let success = false;
    let errorMessage = "";

    if (editingRack) {
      const result = await onUpdateEntity("racks", editingRack.id, rackData);
      success = result.success;
      errorMessage = result.error;
    } else {
      const result = await onAddEntity("racks", rackData);
      success = result.success;
      errorMessage = result.error;
    }

    if (success) {
      setEditingRack(null);
      setRackFormName("");
      setRackFormLocationId("");
      setRackFormDescription("");
      setRackFormTotalUnits(42);
      setRackFormOrientation("bottom-up");
      setIsAddRackFormExpanded(false);
    } else {
      showMessage(`Operation failed: ${errorMessage}`, 5000);
    }
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRacks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRacks.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options */}
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

      {/* Add/Edit Rack Form (Collapsible) - Outer container now has width and centering */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
        {/* Header (no mx-auto or w-x/y here, it's w-full of its parent) */}
        <div
          className="flex justify-center items-center p-3 cursor-pointer bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 rounded-t-lg"
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
          {/* Form container with matching width, centering, and a more visible border */}
          <form
            onSubmit={handleRackFormSubmit}
            className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <Columns size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Rack Name"
                value={rackFormName}
                onChange={(e) => setRackFormName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={20} className="text-gray-500" />
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
            </div>
            {locations.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a location first (Go to Locations tab) to add a Rack.
              </p>
            )}
            <div className="flex items-center space-x-2">
              <HardDrive size={20} className="text-gray-500" />
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
            </div>
            {/* Orientation Selection with Icon */}
            <div className="flex items-center space-x-2">
              {rackFormOrientation === "top-down" ? (
                <ArrowDownNarrowWide size={20} className="text-gray-500" />
              ) : (
                <ArrowUpWideNarrow size={20} className="text-gray-500" />
              )}
              <div className="w-full">
                <label
                  htmlFor="rack-orientation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Unit Numbering Orientation:
                </label>
                <select
                  id="rack-orientation"
                  value={rackFormOrientation}
                  onChange={(e) => setRackFormOrientation(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="bottom-up">
                    Bottom-Up (Unit 1 at bottom)
                  </option>
                  <option value="top-down">Top-Down (Unit 1 at top)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Determines how rack unit numbers are ordered visually.
                  Standard is Bottom-Up.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Info size={20} className="text-gray-500 mt-2" />
              <textarea
                placeholder="Description (Optional)"
                value={rackFormDescription}
                onChange={(e) => setRackFormDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                rows="3"
              ></textarea>
            </div>
            <div className="flex space-x-3 justify-end">
              {editingRack && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRack(null);
                    setRackFormName("");
                    setRackFormLocationId("");
                    setRackFormDescription("");
                    setRackFormTotalUnits(42);
                    setRackFormOrientation("bottom-up");
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map(
              (
                rack // Use currentItems for pagination
              ) => (
                <div
                  key={rack.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5"
                >
                  <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                    <Columns size={20} className="text-blue-500 mr-2" />{" "}
                    {rack.name}
                  </h4>
                  <p className="text-sm text-gray-700 mb-1 flex items-center">
                    <MapPin size={16} className="text-gray-500 mr-2" />{" "}
                    Location: {rack.location_name || "N/A"}
                    {rack.location?.door_number &&
                      ` (Door: ${rack.location.door_number})`}
                  </p>
                  <p className="text-sm text-gray-700 mb-1 flex items-center">
                    <Info
                      size={16}
                      className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                    />{" "}
                    Description: {rack.description || "No description"}
                  </p>

                  {/* Rack Visualizer Component */}
                  <RackVisualizer
                    rack={rack}
                    switches={Array.isArray(switches) ? switches : []}
                    patchPanels={Array.isArray(patchPanels) ? patchPanels : []}
                    pcs={Array.isArray(pcs) ? pcs : []}
                    onShowPortStatus={onShowPortStatus}
                    onViewPcDetails={onViewPcDetails}
                    isModalView={false}
                  />

                  <div className="flex justify-end space-x-2 mt-4">
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
                    {/* View Rack Details Button */}
                    <button
                      onClick={() => onViewRackDetails(rack)}
                      className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center"
                      title="View Rack Details"
                    >
                      <Maximize size={16} className="mr-1" /> View Rack
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center space-x-2 mt-8">
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

            {/* Items per page selector */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to page 1 when items per page changes
              }}
              className="ml-4 p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>
        </>
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
