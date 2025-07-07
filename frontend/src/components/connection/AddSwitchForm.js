// /frontend/src/components/connection/AddSwitchForm.js
import React from "react";
import {
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Server,
  Router,
  MapPin,
  Columns,
  HardDrive,
  Link,
  Info,
  Activity,
} from "lucide-react";

export const AddSwitchForm = ({
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
    newSwitchName,
    newSwitchIp,
    newSwitchLocationId,
    newSwitchRowInRack,
    newSwitchRackId,
    newSwitchTotalPorts,
    newSwitchSourcePort,
    newSwitchModel,
    newSwitchDesc,
    newSwitchUsage,
    newSwitchUnitsOccupied,
    ipRegex,
    usageOptions,
  } = formState;
  const {
    setNewSwitchName,
    setNewSwitchIp,
    setNewSwitchLocationId,
    setNewSwitchRowInRack,
    setNewSwitchRackId,
    setNewSwitchTotalPorts,
    setNewSwitchSourcePort,
    setNewSwitchModel,
    setNewSwitchDesc,
    setNewSwitchUsage,
    setNewSwitchUnitsOccupied,
  } = formSetters;

  const handleAddSwitch = async (e) => {
    e.preventDefault();
    if (!newSwitchName.trim() || !newSwitchLocationId) {
      showMessage("Switch Name and Location are required.", 3000);
      return;
    }
    if (newSwitchIp && !ipRegex.test(newSwitchIp)) {
      showMessage("Please enter a valid IP address for Switch.", 5000);
      return;
    }
    if (
      newSwitchRackId &&
      (newSwitchRowInRack === "" || newSwitchUnitsOccupied === "")
    ) {
      showMessage(
        "For rack-mounted Switches, Starting Row in Rack and Units Occupied are required.",
        5000
      );
      return;
    }
    if (newSwitchRackId) {
      const selectedRack = racks.find((r) => String(r.id) === newSwitchRackId);
      if (selectedRack) {
        const startRow = parseInt(newSwitchRowInRack);
        const units = parseInt(newSwitchUnitsOccupied);
        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units}.`,
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

    const result = await onAddEntity("switches", {
      name: newSwitchName,
      ip_address: newSwitchIp,
      location_id: parseInt(newSwitchLocationId),
      row_in_rack: newSwitchRackId ? parseInt(newSwitchRowInRack) : null,
      rack_id: newSwitchRackId ? parseInt(newSwitchRackId) : null,
      units_occupied: newSwitchRackId ? parseInt(newSwitchUnitsOccupied) : 1,
      total_ports: parseInt(newSwitchTotalPorts),
      source_port: newSwitchSourcePort,
      model: newSwitchModel,
      description: newSwitchDesc,
      usage: newSwitchUsage,
    });

    if (result.success) {
      setNewSwitchName("");
      setNewSwitchIp("");
      setNewSwitchLocationId("");
      setNewSwitchRowInRack("");
      setNewSwitchRackId("");
      setNewSwitchUnitsOccupied(1);
      setNewSwitchTotalPorts(1);
      setNewSwitchSourcePort("");
      setNewSwitchModel("");
      setNewSwitchDesc("");
      setNewSwitchUsage("");
      toggleExpanded(false);
    }
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div
      id="new-switch-creation-section"
      className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6"
    >
      <div
        className="flex justify-between items-center p-5 cursor-pointer bg-red-50 hover:bg-red-100 transition-colors duration-200 rounded-t-lg"
        onClick={() => toggleExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-red-700 flex items-center">
          <PlusCircle size={20} className="mr-2" /> Create New Switch
        </h3>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      <div className={`collapsible-content ${isExpanded ? "expanded" : ""}`}>
        <form onSubmit={handleAddSwitch} className="p-5 space-y-3">
          <input
            type="text"
            placeholder="Switch Name"
            value={newSwitchName}
            onChange={(e) => setNewSwitchName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="IP Address (Optional)"
            value={newSwitchIp}
            onChange={(e) => setNewSwitchIp(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <select
            value={newSwitchLocationId}
            onChange={(e) => {
              setNewSwitchLocationId(e.target.value);
              setNewSwitchRackId("");
              setNewSwitchRowInRack("");
              setNewSwitchUnitsOccupied(1);
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
              value={newSwitchRackId}
              onChange={(e) => {
                setNewSwitchRackId(e.target.value);
                setNewSwitchRowInRack("");
                setNewSwitchUnitsOccupied(1);
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">-- Select Rack (Optional) --</option>
              {sortedRacks
                .filter(
                  (rack) =>
                    !newSwitchLocationId ||
                    String(rack.location_id) === newSwitchLocationId
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
          {newSwitchRackId && (
            <>
              <div className="flex items-center space-x-2">
                <Server size={20} className="text-gray-500" />
                <input
                  type="number"
                  placeholder="Starting Row in Rack"
                  value={newSwitchRowInRack}
                  onChange={(e) => setNewSwitchRowInRack(e.target.value)}
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
                  value={newSwitchUnitsOccupied}
                  onChange={(e) => setNewSwitchUnitsOccupied(e.target.value)}
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
            value={newSwitchTotalPorts}
            onChange={(e) => setNewSwitchTotalPorts(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            min="1"
            required
          />
          <input
            type="text"
            placeholder="Source Port (Optional)"
            value={newSwitchSourcePort}
            onChange={(e) => setNewSwitchSourcePort(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Model (Optional)"
            value={newSwitchModel}
            onChange={(e) => setNewSwitchModel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <select
            value={newSwitchUsage}
            onChange={(e) => setNewSwitchUsage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">-- Select Usage (Optional) --</option>
            {usageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description (Optional)"
            value={newSwitchDesc}
            onChange={(e) => setNewSwitchDesc(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md resize-y"
            rows="3"
          ></textarea>
          <button
            type="submit"
            className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
          >
            Create Switch
          </button>
        </form>
      </div>
    </div>
  );
};
