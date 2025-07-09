// frontend/src/components/PatchPanelList.js
// This component displays a searchable list of Patch Panels in a card format.
// UPDATED: Hides Add/Edit/Delete controls based on user role.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
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
  Filter,
} from "lucide-react";

function PatchPanelList({
  patchPanels,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations,
  racks,
  user // Receive user prop
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatchPanels, setFilteredPatchPanels] = useState([]);
  const [editingPatchPanel, setEditingPatchPanel] = useState(null);
  const [ppFormName, setPpFormName] = useState("");
  const [ppFormLocationId, setPpFormLocationId] = useState("");
  const [ppFormRowInRack, setPpFormRowInRack] = useState("");
  const [ppFormRackId, setPpFormRackId] = useState("");
  const [ppFormUnitsOccupied, setPpFormUnitsOccupied] = useState(1);
  const [ppFormTotalPorts, setPpFormTotalPorts] = useState(1);
  const [ppFormDesc, setPpFormDesc] = useState("");
  const [isAddPpFormExpanded, setIsAddPpFormExpanded] = useState(false);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [selectedRackFilter, setSelectedRackFilter] = useState("all");
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);
  const [availableRackOptions, setAvailableRackOptions] = useState([]);

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

    const uniqueRacks = [
      ...new Set(
        racks.map(
          (rack) =>
            rack.name + (rack.location_name ? ` (${rack.location_name})` : "")
        )
      ),
    ].sort();
    setAvailableRackOptions(uniqueRacks);
  }, [locations, racks]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = patchPanels.filter((pp) => {
      const ppLocationDoorNumber = pp.location?.door_number || "";
      const ppRackNameWithLocation = pp.rack?.name
        ? pp.rack.name +
          (pp.rack.location_name ? ` (${pp.rack.location_name})` : "")
        : "";

      const matchesSearch =
        (pp.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pp.location_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (pp.row_in_rack || "").toString().includes(lowerCaseSearchTerm) ||
        (pp.rack_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        ppRackNameWithLocation.toLowerCase().includes(lowerCaseSearchTerm) ||
        String(pp.total_ports).includes(lowerCaseSearchTerm) ||
        (pp.description || "").toLowerCase().includes(lowerCaseSearchTerm);

      const matchesLocation =
        selectedLocationFilter === "all" ||
        pp.location_name +
          (ppLocationDoorNumber ? ` (Door: ${ppLocationDoorNumber})` : "") ===
          selectedLocationFilter;

      const matchesRack =
        selectedRackFilter === "all" ||
        ppRackNameWithLocation === selectedRackFilter;

      return matchesSearch && matchesLocation && matchesRack;
    });
    setFilteredPatchPanels(filtered);
  }, [
    patchPanels,
    searchTerm,
    selectedLocationFilter,
    selectedRackFilter,
    locations,
    racks,
  ]);

  const handleEdit = (pp) => {
    setEditingPatchPanel(pp);
    setPpFormName(pp.name);
    setPpFormLocationId(String(pp.location_id || ""));
    setPpFormRackId(String(pp.rack_id || ""));
    setPpFormRowInRack(pp.row_in_rack || "");
    setPpFormUnitsOccupied(pp.units_occupied || 1);
    setPpFormTotalPorts(pp.total_ports || 1);
    setPpFormDesc(pp.description || "");
    setIsAddPpFormExpanded(true);
  };

  const handlePpFormSubmit = async (e) => {
    e.preventDefault();
    if (!ppFormName.trim() || !ppFormLocationId) {
      alert("Patch Panel Name and Location are required.");
      return;
    }
    if (ppFormRackId && (ppFormRowInRack === "" || ppFormUnitsOccupied === "")) {
      alert(
        "For rack-mounted Patch Panels, Starting Row in Rack and Units Occupied are required."
      );
      return;
    }
    if (ppFormRackId) {
      const selectedRack = racks.find((r) => String(r.id) === ppFormRackId);
      if (selectedRack) {
        const startRow = parseInt(ppFormRowInRack);
        const units = parseInt(ppFormUnitsOccupied);
        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          alert(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          alert("Units Occupied must be a positive number.");
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          alert(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`
          );
          return;
        }
      }
    }

    const ppData = {
      name: ppFormName,
      location_id: parseInt(ppFormLocationId),
      row_in_rack: ppFormRackId ? parseInt(ppFormRowInRack) : null,
      rack_id: ppFormRackId ? parseInt(ppFormRackId) : null,
      units_occupied: ppFormRackId ? parseInt(ppFormUnitsOccupied) : 1,
      total_ports: parseInt(ppFormTotalPorts),
      description: ppFormDesc,
    };

    if (editingPatchPanel) {
      await onUpdateEntity("patch_panels", editingPatchPanel.id, ppData);
    } else {
      await onAddEntity("patch_panels", ppData);
    }
    setEditingPatchPanel(null);
    setPpFormName("");
    setPpFormLocationId("");
    setPpFormRowInRack("");
    setPpFormRackId("");
    setPpFormUnitsOccupied(1);
    setPpFormTotalPorts(1);
    setPpFormDesc("");
    setIsAddPpFormExpanded(false);
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pp-location-filter" className="text-sm font-medium text-gray-700">Location:</label>
          <select id="pp-location-filter" value={selectedLocationFilter} onChange={(e) => setSelectedLocationFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableLocationOptions.map((locNameWithDoor) => (<option key={locNameWithDoor} value={locNameWithDoor}>{locNameWithDoor}</option>))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pp-rack-filter" className="text-sm font-medium text-gray-700">Rack:</label>
          <select id="pp-rack-filter" value={selectedRackFilter} onChange={(e) => setSelectedRackFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableRackOptions.map((rackNameWithLocation) => (<option key={rackNameWithLocation} value={rackNameWithLocation}>{rackNameWithLocation}</option>))}
          </select>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <div className="flex justify-center items-center p-3 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg" onClick={() => setIsAddPpFormExpanded(!isAddPpFormExpanded)}>
            <h3 className="text-xl font-bold text-green-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> {editingPatchPanel ? "Edit Patch Panel" : "Add New Patch Panel"}
            </h3>
            {isAddPpFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`collapsible-content ${isAddPpFormExpanded ? "expanded" : ""}`}>
            <form onSubmit={handlePpFormSubmit} className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50">
              <input type="text" placeholder="Patch Panel Name" value={ppFormName} onChange={(e) => setPpFormName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
              <select value={ppFormLocationId} onChange={(e) => {setPpFormLocationId(e.target.value); setPpFormRackId(""); setPpFormRowInRack(""); setPpFormUnitsOccupied(1);}} className="w-full p-2 border border-gray-300 rounded-md" required>
                <option value="">-- Select Location --</option>
                {sortedLocations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} {loc.door_number && `(Door: ${loc.door_number})`}</option>))}
              </select>
              <div className="flex items-center space-x-2">
                <Columns size={20} className="text-gray-500" />
                <select value={ppFormRackId} onChange={(e) => {setPpFormRackId(e.target.value); setPpFormRowInRack(""); setPpFormUnitsOccupied(1);}} className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="">-- Select Rack (Optional) --</option>
                  {sortedRacks.filter((rack) => !ppFormLocationId || (rack.location_id !== undefined && String(rack.location_id) === ppFormLocationId)).map((rack) => (<option key={rack.id} value={rack.id}>{rack.name} ({rack.location_name}{rack.location?.door_number && ` (Door: ${rack.location.door_number})`})</option>))}
                </select>
              </div>
              {ppFormRackId && (
                <>
                  <div className="flex items-center space-x-2">
                    <Server size={20} className="text-gray-500" />
                    <input type="number" placeholder="Starting Row in Rack" value={ppFormRowInRack} onChange={(e) => setPpFormRowInRack(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required={!!ppFormRackId} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive size={20} className="text-gray-500" />
                    <input type="number" placeholder="Units Occupied" value={ppFormUnitsOccupied} onChange={(e) => setPpFormUnitsOccupied(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required={!!ppFormRackId} />
                  </div>
                </>
              )}
              <input type="number" placeholder="Total Ports" value={ppFormTotalPorts} onChange={(e) => setPpFormTotalPorts(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
              <textarea placeholder="Description (Optional)" value={ppFormDesc} onChange={(e) => setPpFormDesc(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md resize-y" rows="3"></textarea>
              <div className="flex space-x-3 justify-end">
                {editingPatchPanel && (<button type="button" onClick={() => {setEditingPatchPanel(null); setIsAddPpFormExpanded(false);}} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200">Cancel Edit</button>)}
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200">{editingPatchPanel ? "Update Patch Panel" : "Add Patch Panel"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredPatchPanels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatchPanels.map((pp) => (
            <div key={pp.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5">
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center"><Split size={20} className="text-green-500 mr-2" /> {pp.name}</h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><MapPin size={16} className="text-gray-500 mr-2" /> Location: {pp.location_name || "N/A"}{pp.location?.door_number && ` (Door: ${pp.location.door_number})`}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Columns size={16} className="text-gray-500 mr-2" /> Rack: {pp.rack_name || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Server size={16} className="text-gray-500 mr-2" /> Starting Row: {pp.row_in_rack || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><HardDrive size={16} className="text-gray-500 mr-2" /> Units: {pp.units_occupied || "N/A"}U</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><HardDrive size={16} className="text-gray-500 mr-2" /> Total Ports: {pp.total_ports || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-3 flex items-start"><Info size={16} className="text-gray-500 mr-2 flex-shrink-0 mt-0.5" /> Description: {pp.description || "No description"}</p>
              <div className="flex justify-end space-x-2">
                <button onClick={() => onShowPortStatus("patch_panels", pp.id)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200">View Ports</button>
                {canEdit && (
                  <>
                    <button onClick={() => handleEdit(pp)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">Edit</button>
                    <button onClick={() => onDeleteEntity("patch_panels", pp.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm ? "No Patch Panels match your search and filter criteria." : "No Patch Panels added yet."}
        </p>
      )}
    </div>
  );
}

export default PatchPanelList;
