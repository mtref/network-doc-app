// frontend/src/components/SwitchList.js
// This component displays a searchable list of Switches in a card format,
// now including filter options by Location, Rack, Model, and Usage.
// Added a "View Diagram" button to each switch card.
// UPDATED: Added units_occupied for Switches.
// FIXED: Correctly casts location_id and rack_id to strings when editing.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import {
  Server, // Main icon for Switch, also for PC type Server
  Router, // IP Address
  MapPin, // Location/Office
  Info, // Description/Generic Info
  PlusCircle, // Add button
  ChevronDown,
  ChevronUp,
  Columns, // Rack
  HardDrive, // Total Ports
  Link, // Source Port
  Filter, // Filter section
  Network, // Diagram button
  Cpu, // Model
  Activity, // Usage
} from "lucide-react";

function SwitchList({
  switches,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations,
  racks,
  onViewDiagram,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSwitches, setFilteredSwitches] = useState([]);
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [switchFormName, setSwitchFormName] = useState("");
  const [switchFormIp, setSwitchFormIp] = useState("");
  const [switchFormLocationId, setSwitchFormLocationId] = useState("");
  const [switchFormRowInRack, setSwitchFormRowInRack] = useState("");
  const [switchFormRackId, setSwitchFormRackId] = useState("");
  const [switchFormUnitsOccupied, setSwitchFormUnitsOccupied] = useState(1); // NEW: State for units occupied
  const [switchFormTotalPorts, setSwitchFormTotalPorts] = useState(1);
  const [switchFormSourcePort, setSwitchFormSourcePort] = useState("");
  const [switchFormModel, setSwitchFormModel] = useState("");
  const [switchFormDesc, setSwitchFormDesc] = useState("");
  const [switchFormUsage, setSwitchFormUsage] = useState("");

  const [isAddSwitchFormExpanded, setIsAddSwitchFormExpanded] = useState(false);

  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [selectedRackFilter, setSelectedRackFilter] = useState("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState("all");
  const [selectedUsageFilter, setSelectedUsageFilter] = useState("all");

  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);
  const [availableRackOptions, setAvailableRackOptions] = useState([]);
  const [availableModelOptions, setAvailableModelOptions] = useState([]);
  const [availableUsageOptions, setAvailableUsageOptions] = useState([]);

  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;

  const usageOptions = [
    "Production",
    "Development",
    "Test",
    "Staging",
    "Backup",
    "Monitoring",
    "Other",
  ];

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

    const uniqueModels = [
      ...new Set(switches.map((s) => s.model).filter(Boolean)),
    ].sort();
    setAvailableModelOptions(uniqueModels);

    const uniqueUsage = [
      ...new Set(switches.map((s) => s.usage).filter(Boolean)),
    ].sort();
    setAvailableUsageOptions(uniqueUsage);
  }, [switches, locations, racks]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = switches.filter((_switch) => {
      const switchLocationDoorNumber = _switch.location?.door_number || "";
      const switchRackNameWithLocation = _switch.rack?.name
        ? _switch.rack.name +
          (_switch.rack.location_name ? ` (${_switch.rack.location_name})` : "")
        : "";

      const matchesSearch =
        (_switch.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (_switch.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.row_in_rack || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.units_occupied ? `${_switch.units_occupied}u` : "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) || // NEW: Search by units occupied
        (_switch.rack_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        switchRackNameWithLocation
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        String(_switch.total_ports).includes(lowerCaseSearchTerm) ||
        (_switch.source_port || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.model || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (_switch.description || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.usage || "").toLowerCase().includes(lowerCaseSearchTerm);

      const matchesLocation =
        selectedLocationFilter === "all" ||
        _switch.location_name +
          (switchLocationDoorNumber
            ? ` (Door: ${switchLocationDoorNumber})`
            : "") ===
          selectedLocationFilter;

      const matchesRack =
        selectedRackFilter === "all" ||
        switchRackNameWithLocation === selectedRackFilter;

      const matchesModel =
        selectedModelFilter === "all" || _switch.model === selectedModelFilter;

      const matchesUsage =
        selectedUsageFilter === "all" || _switch.usage === selectedUsageFilter;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesRack &&
        matchesModel &&
        matchesUsage
      );
    });
    setFilteredSwitches(filtered);
  }, [
    switches,
    searchTerm,
    selectedLocationFilter,
    selectedRackFilter,
    selectedModelFilter,
    selectedUsageFilter,
    locations,
    racks,
  ]);

  const handleEdit = (_switch) => {
    setEditingSwitch(_switch);
    setSwitchFormName(_switch.name);
    setSwitchFormIp(_switch.ip_address || "");
    // *** BUG FIX: Cast IDs to strings to match dropdown value types ***
    setSwitchFormLocationId(String(_switch.location_id || ""));
    setSwitchFormRackId(String(_switch.rack_id || ""));
    setSwitchFormRowInRack(_switch.row_in_rack || "");
    setSwitchFormUnitsOccupied(_switch.units_occupied || 1);
    setSwitchFormTotalPorts(_switch.total_ports || 1);
    setSwitchFormSourcePort(_switch.source_port || "");
    setSwitchFormModel(_switch.model || "");
    setSwitchFormDesc(_switch.description || "");
    setSwitchFormUsage(_switch.usage || "");
    setIsAddSwitchFormExpanded(true);
  };

  const handleSwitchFormSubmit = async (e) => {
    e.preventDefault();
    if (!switchFormName.trim() || !switchFormLocationId) {
      alert("Switch Name and Location are required.");
      return;
    }

    if (switchFormIp && !ipRegex.test(switchFormIp)) {
      alert("Please enter a valid IP address (e.g., 192.168.1.1).");
      return;
    }

    if (
      switchFormRackId &&
      (switchFormRowInRack === "" || switchFormUnitsOccupied === "")
    ) {
      alert(
        "For rack-mounted Switches, Starting Row in Rack and Units Occupied are required."
      );
      return;
    }
    if (switchFormRackId) {
      const selectedRack = racks.find((r) => String(r.id) === switchFormRackId);
      if (selectedRack) {
        const startRow = parseInt(switchFormRowInRack);
        const units = parseInt(switchFormUnitsOccupied);

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

    const switchData = {
      name: switchFormName,
      ip_address: switchFormIp,
      location_id: parseInt(switchFormLocationId),
      row_in_rack: switchFormRackId ? parseInt(switchFormRowInRack) : null,
      rack_id: switchFormRackId ? parseInt(switchFormRackId) : null,
      units_occupied: switchFormRackId ? parseInt(switchFormUnitsOccupied) : 1,
      total_ports: parseInt(switchFormTotalPorts),
      source_port: switchFormSourcePort,
      model: switchFormModel,
      description: switchFormDesc,
      usage: switchFormUsage,
    };

    if (editingSwitch) {
      console.log("Updating switch:", editingSwitch.id, switchData);
      await onUpdateEntity("switches", editingSwitch.id, switchData);
    } else {
      console.log("Adding new switch:", switchData);
      await onAddEntity("switches", switchData);
    }
    setEditingSwitch(null);
    setSwitchFormName("");
    setSwitchFormIp("");
    setSwitchFormLocationId("");
    setSwitchFormRowInRack("");
    setSwitchFormRackId("");
    setSwitchFormUnitsOccupied(1);
    setSwitchFormTotalPorts(1);
    setSwitchFormSourcePort("");
    setSwitchFormModel("");
    setSwitchFormDesc("");
    setSwitchFormUsage("");
    setIsAddSwitchFormExpanded(false);
  };

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

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
            htmlFor="switch-location-filter"
            className="text-sm font-medium text-gray-700"
          >
            Location:
          </label>
          <select
            id="switch-location-filter"
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

        {/* Rack Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="switch-rack-filter"
            className="text-sm font-medium text-gray-700"
          >
            Rack:
          </label>
          <select
            id="switch-rack-filter"
            value={selectedRackFilter}
            onChange={(e) => setSelectedRackFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableRackOptions.map((rackNameWithLocation) => (
              <option key={rackNameWithLocation} value={rackNameWithLocation}>
                {rackNameWithLocation}
              </option>
            ))}
          </select>
        </div>

        {/* Model Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="switch-model-filter"
            className="text-sm font-medium text-gray-700"
          >
            Model:
          </label>
          <select
            id="switch-model-filter"
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableModelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Usage Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="switch-usage-filter"
            className="text-sm font-medium text-gray-700"
          >
            Usage:
          </label>
          <select
            id="switch-usage-filter"
            value={selectedUsageFilter}
            onChange={(e) => setSelectedUsageFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {usageOptions.map((usage) => (
              <option key={usage} value={usage}>
                {usage}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Switch Form (Collapsible) - Outer container now has width and centering */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
        {/* Header (no mx-auto or w-x/y here, it's w-full of its parent) */}
        <div
          className="flex justify-center items-center p-3 cursor-pointer bg-red-50 hover:bg-red-100 transition-colors duration-200 rounded-t-lg"
          onClick={() => setIsAddSwitchFormExpanded(!isAddSwitchFormExpanded)}
        >
          <h3 className="text-xl font-bold text-red-700 flex items-center">
            <PlusCircle size={20} className="mr-2" />{" "}
            {editingSwitch ? "Edit Switch" : "Add New Switch"}
          </h3>
          {isAddSwitchFormExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
        <div
          className={`collapsible-content ${
            isAddSwitchFormExpanded ? "expanded" : ""
          }`}
        >
          {/* Form container with matching width, centering, and a more visible border */}
          <form
            onSubmit={handleSwitchFormSubmit}
            className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50"
          >
            <div className="flex items-center space-x-2">
              <Server size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Switch Name"
                value={switchFormName}
                onChange={(e) => setSwitchFormName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Router size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="IP Address (Optional)"
                value={switchFormIp}
                onChange={(e) => setSwitchFormIp(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={20} className="text-gray-500" />
              <select
                value={switchFormLocationId}
                onChange={(e) => {
                  setSwitchFormLocationId(e.target.value);
                  setSwitchFormRackId(""); // Reset rack when location changes
                  setSwitchFormRowInRack(""); // Reset row
                  setSwitchFormUnitsOccupied(1); // Reset units
                }}
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
                Please add locations first.
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Columns size={20} className="text-gray-500" />
              <select
                value={switchFormRackId}
                onChange={(e) => {
                  setSwitchFormRackId(e.target.value);
                  setSwitchFormRowInRack(""); // Reset row when rack changes
                  setSwitchFormUnitsOccupied(1); // Reset units
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Rack (Optional) --</option>
                {sortedRacks
                  .filter(
                    (rack) =>
                      !switchFormLocationId ||
                      (rack.location_id !== undefined &&
                        String(rack.location_id) === switchFormLocationId)
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
            {(racks.length === 0 ||
              (switchFormLocationId &&
                sortedRacks.filter(
                  (rack) => String(rack.location_id) === switchFormLocationId
                ).length === 0)) && (
              <p className="text-sm text-gray-500 mt-1">
                No racks available for selected location.
              </p>
            )}
            {switchFormRackId && (
              <>
                <div className="flex items-center space-x-2">
                  <Server size={20} className="text-gray-500" />
                  <input
                    type="number"
                    placeholder="Starting Row in Rack (e.g., 1)"
                    value={switchFormRowInRack}
                    onChange={(e) => setSwitchFormRowInRack(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required={!!switchFormRackId}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive size={20} className="text-gray-500" />
                  <input
                    type="number"
                    placeholder="Units Occupied (e.g., 1, 2)"
                    value={switchFormUnitsOccupied}
                    onChange={(e) => setSwitchFormUnitsOccupied(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required={!!switchFormRackId}
                  />
                </div>
              </>
            )}
            <div className="flex items-center space-x-2">
              <HardDrive size={20} className="text-gray-500" />
              <input
                type="number"
                placeholder="Total Ports (e.g., 4)"
                value={switchFormTotalPorts}
                onChange={(e) => setSwitchFormTotalPorts(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Link size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Source Port (Optional)"
                value={switchFormSourcePort}
                onChange={(e) => setSwitchFormSourcePort(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Cpu size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Model (Optional)"
                value={switchFormModel}
                onChange={(e) => setSwitchFormModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Activity size={20} className="text-gray-500" />
              <select
                value={switchFormUsage}
                onChange={(e) => setSwitchFormUsage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Usage (Optional) --</option>
                {usageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="other">Add Custom Usage...</option>
              </select>
            </div>
            {switchFormUsage === "other" && (
              <input
                type="text"
                placeholder="Enter custom usage"
                onBlur={(e) => {
                  const customUsage = e.target.value.trim();
                  if (customUsage) {
                    // Check if the custom usage already exists in the options
                    if (!usageOptions.includes(customUsage)) {
                      // Add the new custom usage to the options
                      usageOptions.push(customUsage);
                    }
                    setSwitchFormUsage(customUsage);
                  } else {
                    setSwitchFormUsage("");
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            )}
            <div className="flex items-start space-x-2">
              <Info size={20} className="text-gray-500 mt-2" />
              <textarea
                placeholder="Description (Optional)"
                value={switchFormDesc}
                onChange={(e) => setSwitchFormDesc(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                rows="3"
              ></textarea>
            </div>
            <div className="flex space-x-3 justify-end">
              {editingSwitch && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSwitch(null);
                    setSwitchFormName("");
                    setSwitchFormIp("");
                    setSwitchFormLocationId("");
                    setSwitchFormRowInRack("");
                    setSwitchFormRackId("");
                    setSwitchFormUnitsOccupied(1);
                    setSwitchFormTotalPorts(1);
                    setSwitchFormSourcePort("");
                    setSwitchFormModel("");
                    setSwitchFormDesc("");
                    setSwitchFormUsage("");
                    setIsAddSwitchFormExpanded(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
              >
                {editingSwitch ? "Update Switch" : "Add Switch"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Switch List Display */}
      {filteredSwitches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSwitches.map((_switch) => (
            <div
              key={_switch.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5"
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <Server size={20} className="text-red-500 mr-2" />{" "}
                {_switch.name}
              </h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Router size={16} className="text-gray-500 mr-2" /> IP:{" "}
                {_switch.ip_address || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-500 mr-2" /> Location:{" "}
                {_switch.location_name || "N/A"}
                {_switch.location?.door_number &&
                  ` (Door: ${_switch.location.door_number})`}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Columns size={16} className="text-gray-500 mr-2" /> Rack:{" "}
                {_switch.rack_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Starting Row:{" "}
                {_switch.row_in_rack || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Units:{" "}
                {_switch.units_occupied || "N/A"}U
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Total
                Ports: {_switch.total_ports || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Link size={16} className="text-gray-500 mr-2" /> Source Port:{" "}
                {_switch.source_port || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Model:{" "}
                {_switch.model || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Usage:{" "}
                {_switch.usage || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-start">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                Description: {_switch.description || "No description"}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => onShowPortStatus("switches", _switch.id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  View Ports
                </button>
                <button
                  onClick={() => onViewDiagram(_switch)}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 flex items-center justify-center"
                  title="View Diagram"
                >
                  <Network size={16} className="mr-1" /> Diagram
                </button>
                <button
                  onClick={() => handleEdit(_switch)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteEntity("switches", _switch.id)}
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
            ? "No Switches match your search and filter criteria."
            : "No Switches added yet."}
        </p>
      )}
    </div>
  );
}

export default SwitchList;
