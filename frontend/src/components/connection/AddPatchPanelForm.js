// /frontend/src/components/connection/AddPatchPanelForm.js
import React from "react";
import {
  PlusCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Columns,
  Server,
  HardDrive,
  Info,
} from "lucide-react";

export const AddPatchPanelForm = ({
  isExpanded,
  toggleExpanded,
  formState,
  formSetters,
  onAddEntity,
  showMessage,
  locations,
  racks,
}) => {
  const {
    newPpName,
    newPpLocationId,
    newPpRowInRack,
    newPpRackId,
    newPpTotalPorts,
    newPpDesc,
    newPpUnitsOccupied,
  } = formState;
  const {
    setNewPpName,
    setNewPpLocationId,
    setNewPpRowInRack,
    setNewPpRackId,
    setNewPpTotalPorts,
    setNewPpDesc,
    setNewPpUnitsOccupied,
  } = formSetters;

  const handleAddPp = async (e) => {
    e.preventDefault();
    if (!newPpName.trim() || !newPpLocationId) {
      showMessage("Patch Panel Name and Location are required.", 3000);
      return;
    }

    if (newPpRackId && (newPpRowInRack === "" || newPpUnitsOccupied === "")) {
      showMessage(
        "For rack-mounted Patch Panels, Starting Row in Rack and Units Occupied are required.",
        5000
      );
      return;
    }
    if (newPpRackId) {
      const selectedRack = racks.find((r) => String(r.id) === newPpRackId);
      if (selectedRack) {
        const startRow = parseInt(newPpRowInRack);
        const units = parseInt(newPpUnitsOccupied);
        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`,
            5000
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          showMessage("Units Occupied must be a positive number.", 5000);
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          showMessage(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`,
            5000
          );
          return;
        }
      }
    }

    const result = await onAddEntity("patch_panels", {
      name: newPpName,
      location_id: parseInt(newPpLocationId),
      row_in_rack: newPpRackId ? parseInt(newPpRowInRack) : null,
      rack_id: newPpRackId ? parseInt(newPpRackId) : null,
      units_occupied: newPpRackId ? parseInt(newPpUnitsOccupied) : 1,
      total_ports: parseInt(newPpTotalPorts),
      description: newPpDesc,
    });

    if (result.success) {
      setNewPpName("");
      setNewPpLocationId("");
      setNewPpRowInRack("");
      setNewPpRackId("");
      setNewPpUnitsOccupied(1);
      setNewPpTotalPorts(1);
      setNewPpDesc("");
      toggleExpanded(false);
    }
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      id="new-pp-creation-section"
      className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6"
    >
      <div
        className="flex justify-between items-center p-5 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg"
        onClick={() => toggleExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-green-700 flex items-center">
          <PlusCircle size={20} className="mr-2" /> Create New Patch Panel
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      <div className={`collapsible-content ${isExpanded ? "expanded" : ""}`}>
        <form onSubmit={handleAddPp} className="p-5 space-y-3">
          <input
            type="text"
            placeholder="Patch Panel Name"
            value={newPpName}
            onChange={(e) => setNewPpName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <select
            value={newPpLocationId}
            onChange={(e) => {
              setNewPpLocationId(e.target.value);
              setNewPpRackId("");
              setNewPpRowInRack("");
              setNewPpUnitsOccupied(1);
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">-- Select Location --</option>
            {sortedLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.door_number && `(Door: ${loc.door_number})`}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <Columns size={20} className="text-gray-500" />
            <select
              value={newPpRackId}
              onChange={(e) => {
                setNewPpRackId(e.target.value);
                setNewPpRowInRack("");
                setNewPpUnitsOccupied(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Select Rack (Optional) --</option>
              {sortedRacks
                .filter(
                  (rack) =>
                    !newPpLocationId ||
                    String(rack.location_id) === newPpLocationId
                )
                .map((rack) => (
                  <option key={rack.id} value={rack.id}>
                    {rack.name} ({rack.location_name}
                    {rack.location?.door_number &&
                      ` (Door: ${rack.location.door_number})`}
                    )
                  </option>
                ))}
            </select>
          </div>
          {newPpRackId && (
            <>
              <div className="flex items-center space-x-2">
                <Server size={20} className="text-gray-500" />
                <input
                  type="number"
                  placeholder="Starting Row in Rack"
                  value={newPpRowInRack}
                  onChange={(e) => setNewPpRowInRack(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive size={20} className="text-gray-500" />
                <input
                  type="number"
                  placeholder="Units Occupied"
                  value={newPpUnitsOccupied}
                  onChange={(e) => setNewPpUnitsOccupied(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  required
                />
              </div>
            </>
          )}
          <input
            type="number"
            placeholder="Total Ports"
            value={newPpTotalPorts}
            onChange={(e) => setNewPpTotalPorts(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            min="1"
            required
          />
          <textarea
            placeholder="Description (Optional)"
            value={newPpDesc}
            onChange={(e) => setNewPpDesc(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md resize-y"
            rows="3"
          ></textarea>
          <button
            type="submit"
            className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Create Patch Panel
          </button>
        </form>
      </div>
    </div>
  );
};
