// /frontend/src/components/connection/AddPatchPanelForm.js
// REFACTORED: This component is now self-contained and manages its own form state.
// This reduces complexity in the parent component and makes it more reusable.

import React, { useState, useMemo } from "react";
import { PlusCircle, ChevronDown, ChevronUp, Columns, Server, HardDrive } from "lucide-react";

export const AddPatchPanelForm = ({ onAddEntity, showMessage, locations, racks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Form state is now managed internally within this component.
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [rackId, setRackId] = useState("");
  const [rowInRack, setRowInRack] = useState("");
  const [unitsOccupied, setUnitsOccupied] = useState(1);
  const [totalPorts, setTotalPorts] = useState(24);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setLocationId("");
    setRackId("");
    setRowInRack("");
    setUnitsOccupied(1);
    setTotalPorts(24);
    setDescription("");
    setIsExpanded(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !locationId) {
      showMessage("Patch Panel Name and Location are required.", 3000);
      return;
    }
    if (rackId && (rowInRack === "" || unitsOccupied === "")) {
      showMessage("For rack-mounted items, Starting Row and Units Occupied are required.", 5000);
      return;
    }
    
    const result = await onAddEntity("patch_panels", {
      name,
      location_id: parseInt(locationId),
      rack_id: rackId ? parseInt(rackId) : null,
      row_in_rack: rackId ? parseInt(rowInRack) : null,
      units_occupied: rackId ? parseInt(unitsOccupied) : 1,
      total_ports: parseInt(totalPorts),
      description,
    });

    if (result.success) {
      resetForm();
    }
  };

  const sortedLocations = useMemo(() => [...locations].sort((a, b) => a.name.localeCompare(b.name)), [locations]);
  const availableRacks = useMemo(() => {
    if (!locationId) return [];
    return racks.filter(r => String(r.location_id) === locationId).sort((a, b) => a.name.localeCompare(b.name));
  }, [racks, locationId]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6">
      <div
        className="flex justify-between items-center p-5 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-green-700 flex items-center">
          <PlusCircle size={20} className="mr-2" /> Create New Patch Panel
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      <div className={`collapsible-content ${isExpanded ? "expanded" : ""}`}>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input type="text" placeholder="Patch Panel Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-md" required />
          <select value={locationId} onChange={(e) => { setLocationId(e.target.value); setRackId(""); }} className="w-full p-2 border rounded-md" required>
            <option value="">-- Select Location --</option>
            {sortedLocations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} {loc.door_number && `(Door: ${loc.door_number})`}</option>))}
          </select>
          <div className="flex items-center space-x-2">
            <Columns size={20} className="text-gray-500" />
            <select value={rackId} onChange={(e) => setRackId(e.target.value)} className="w-full p-2 border rounded-md" disabled={!locationId}>
              <option value="">-- Select Rack (Optional) --</option>
              {availableRacks.map((rack) => (<option key={rack.id} value={rack.id}>{rack.name}</option>))}
            </select>
          </div>
          {rackId && (
            <>
              <div className="flex items-center space-x-2">
                <Server size={20} className="text-gray-500" />
                <input type="number" placeholder="Starting Row in Rack" value={rowInRack} onChange={(e) => setRowInRack(e.target.value)} className="w-full p-2 border rounded-md" min="1" required />
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive size={20} className="text-gray-500" />
                <input type="number" placeholder="Units Occupied" value={unitsOccupied} onChange={(e) => setUnitsOccupied(e.target.value)} className="w-full p-2 border rounded-md" min="1" required />
              </div>
            </>
          )}
          <input type="number" placeholder="Total Ports" value={totalPorts} onChange={(e) => setTotalPorts(e.target.value)} className="w-full p-2 border rounded-md" min="1" required />
          <textarea placeholder="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded-md resize-y" rows="3"></textarea>
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600">Create Patch Panel</button>
        </form>
      </div>
    </div>
  );
};
