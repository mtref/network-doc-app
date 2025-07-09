// frontend/src/components/RackList.js
// This component displays a searchable list of Racks in a card format.
// UPDATED: Hides Add/Edit/Delete controls based on user role.

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
  user // Receive user prop
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

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
  }, [locations]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = racks.filter((rack) => {
      const rackLocationDoorNumber = rack.location?.door_number || "";
      const matchesSearch =
        (rack.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (rack.location_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (rack.description || "").toLowerCase().includes(lowerCaseSearchTerm);

      const matchesLocation =
        selectedLocationFilter === "all" ||
        rack.location_name +
          (rackLocationDoorNumber ? ` (Door: ${rackLocationDoorNumber})` : "") ===
          selectedLocationFilter;

      return matchesSearch && matchesLocation;
    });
    setFilteredRacks(filtered);
    setCurrentPage(1);
  }, [racks, searchTerm, selectedLocationFilter, locations]);

  const handleEdit = (rack) => {
    setEditingRack(rack);
    setRackFormName(rack.name);
    setRackFormLocationId(String(rack.location_id));
    setRackFormDescription(rack.description || "");
    setRackFormTotalUnits(rack.total_units || 42);
    setRackFormOrientation(rack.orientation || "bottom-up");
    setIsAddRackFormExpanded(true);
  };

  const handleRackFormSubmit = async (e) => {
    e.preventDefault();
    if (!rackFormName.trim() || !rackFormLocationId) {
      showMessage("Rack Name and Location are required.", 3000);
      return;
    }

    const rackData = {
      name: rackFormName,
      location_id: parseInt(rackFormLocationId),
      description: rackFormDescription,
      total_units: parseInt(rackFormTotalUnits),
      orientation: rackFormOrientation,
    };

    if (editingRack) {
      await onUpdateEntity("racks", editingRack.id, rackData);
    } else {
      await onAddEntity("racks", rackData);
    }
    setEditingRack(null);
    setRackFormName("");
    setRackFormLocationId("");
    setRackFormDescription("");
    setRackFormTotalUnits(42);
    setRackFormOrientation("bottom-up");
    setIsAddRackFormExpanded(false);
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRacks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRacks.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="rack-location-filter" className="text-sm font-medium text-gray-700">Location:</label>
          <select id="rack-location-filter" value={selectedLocationFilter} onChange={(e) => setSelectedLocationFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableLocationOptions.map((locNameWithDoor) => (<option key={locNameWithDoor} value={locNameWithDoor}>{locNameWithDoor}</option>))}
          </select>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <div className="flex justify-center items-center p-3 cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors duration-200 rounded-t-lg" onClick={() => setIsAddRackFormExpanded(!isAddRackFormExpanded)}>
            <h3 className="text-xl font-bold text-purple-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> {editingRack ? "Edit Rack" : "Add New Rack"}
            </h3>
            {isAddRackFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`collapsible-content ${isAddRackFormExpanded ? "expanded" : ""}`}>
            <form onSubmit={handleRackFormSubmit} className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50">
              <input type="text" placeholder="Rack Name" value={rackFormName} onChange={(e) => setRackFormName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
              <select value={rackFormLocationId} onChange={(e) => setRackFormLocationId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
                <option value="">-- Select Location --</option>
                {sortedLocations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} {loc.door_number && `(Door: ${loc.door_number})`}</option>))}
              </select>
              <input type="number" placeholder="Total Units" value={rackFormTotalUnits} onChange={(e) => setRackFormTotalUnits(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
              <select value={rackFormOrientation} onChange={(e) => setRackFormOrientation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="bottom-up">Bottom-Up</option>
                <option value="top-down">Top-Down</option>
              </select>
              <textarea placeholder="Description (Optional)" value={rackFormDescription} onChange={(e) => setRackFormDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md resize-y" rows="3"></textarea>
              <div className="flex space-x-3 justify-end">
                {editingRack && (<button type="button" onClick={() => {setEditingRack(null); setIsAddRackFormExpanded(false);}} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200">Cancel Edit</button>)}
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200">{editingRack ? "Update Rack" : "Add Rack"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((rack) => (
              <div key={rack.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5 flex flex-col">
                <div className="flex-grow">
                  <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center"><Columns size={20} className="text-purple-500 mr-2" /> {rack.name}</h4>
                  <p className="text-sm text-gray-700 mb-1 flex items-center"><MapPin size={16} className="text-gray-500 mr-2" /> {rack.location_name || "N/A"}</p>
                  <p className="text-sm text-gray-700 mb-3 flex items-start"><Info size={16} className="text-gray-500 mr-2 flex-shrink-0 mt-0.5" /> {rack.description || "No description"}</p>
                  <RackVisualizer rack={rack} switches={switches} patchPanels={patchPanels} pcs={pcs} onShowPortStatus={onShowPortStatus} onViewPcDetails={onViewPcDetails} />
                </div>
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                  <button onClick={() => onViewRackDetails(rack)} className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 flex items-center"><Maximize size={16} className="mr-1" /> View</button>
                  {canEdit && (
                    <>
                      <button onClick={() => handleEdit(rack)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">Edit</button>
                      <button onClick={() => onDeleteEntity("racks", rack.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (<button key={pageNumber} onClick={() => paginate(pageNumber)} className={`px-4 py-2 rounded-md ${currentPage === pageNumber ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{pageNumber}</button>))}
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="ml-4 p-2 border border-gray-300 rounded-md text-sm">
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm ? "No Racks match your search and filter criteria." : "No Racks added yet."}
        </p>
      )}
    </div>
  );
}

export default RackList;
