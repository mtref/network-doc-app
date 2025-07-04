// frontend/src/components/SwitchList.js
// This component displays a searchable list of Switches in a card format,
// now including filter options by Location, Rack, Model, and Usage.
// Added a "View Diagram" button to each switch card.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import {
  Server,
  Router,
  MapPin,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Columns, // Icon for Rack
  HardDrive,
  Link,
  Filter,
  Network, // New icon for the diagram button
} from "lucide-react";

function SwitchList({
  switches, // Ensure this is always an array, passed from App.js
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations, // locations prop is crucial here
  racks, // Make sure racks are passed as a prop from App.js
  onViewDiagram,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSwitches, setFilteredSwitches] = useState([]);
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [switchFormName, setSwitchFormName] = useState("");
  const [switchFormIp, setSwitchFormIp] = useState("");
  const [switchFormLocationId, setSwitchFormLocationId] = useState("");
  const [switchFormRowInRack, setSwitchFormRowInRack] = useState("");
  const [switchFormRackId, setSwitchFormRackId] = useState(""); // State for rack_id
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

  const usageOptions = ["Production", "Development", "Test", "Staging", "Backup", "Monitoring", "Other"];

  // Effect to extract unique filter options whenever 'switches' or 'locations' data changes
  useEffect(() => {
    const currentSwitches = Array.isArray(switches) ? switches : [];
    const currentLocations = Array.isArray(locations) ? locations : [];

    const uniqueLocations = [
      ...new Set(currentSwitches.map((s) => s.location_name).filter(Boolean)),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);

    const uniqueRacks = [
      ...new Set(currentSwitches.map((s) => s.rack_name).filter(Boolean)),
    ].sort();
    setAvailableRackOptions(uniqueRacks);

    const uniqueModels = [
      ...new Set(currentSwitches.map((s) => s.model).filter(Boolean)),
    ].sort();
    setAvailableModelOptions(uniqueModels);

    const uniqueUsage = [
      ...new Set(currentSwitches.map((s) => s.usage).filter(Boolean)),
    ].sort();
    setAvailableUsageOptions(uniqueUsage);
  }, [switches, locations]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const currentSwitches = Array.isArray(switches) ? switches : [];
    const currentLocations = Array.isArray(locations) ? locations : [];

    const filtered = currentSwitches.filter((_switch) => {
      const switchLocationDoorNumber = _switch.location?.door_number || "";

      const matchesSearch =
        (typeof _switch.name === 'string' && _switch.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.ip_address === 'string' && _switch.ip_address.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.location_name === 'string' && _switch.location_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.row_in_rack === 'string' && _switch.row_in_rack.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.rack_name === 'string' && _switch.rack_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.total_ports === 'number' && String(_switch.total_ports).includes(lowerCaseSearchTerm)) ||
        (typeof _switch.source_port === 'string' && String(_switch.source_port).toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.model === 'string' && String(_switch.model).toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.description === 'string' && String(_switch.description).toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof _switch.usage === 'string' && String(_switch.usage).toLowerCase().includes(lowerCaseSearchTerm)) ||
        (typeof switchLocationDoorNumber === 'string' && switchLocationDoorNumber.toLowerCase().includes(lowerCaseSearchTerm));

      const matchesLocation =
        selectedLocationFilter === "all" ||
        (typeof _switch.location_name === 'string' && _switch.location_name === selectedLocationFilter);

      const matchesRack =
        selectedRackFilter === "all" || (typeof _switch.rack_name === 'string' && _switch.rack_name === selectedRackFilter);
      const matchesModel =
        selectedModelFilter === "all" || (typeof _switch.model === 'string' && _switch.model === selectedModelFilter);
      const matchesUsage =
        selectedUsageFilter === "all" || (typeof _switch.usage === 'string' && _switch.usage === selectedUsageFilter);

      return matchesSearch && matchesLocation && matchesRack && matchesModel && matchesUsage;
    });
    setFilteredSwitches(filtered);
  }, [
    switches,
    searchTerm,
    selectedLocationFilter,
    selectedRackFilter,
    selectedModelFilter,
    selectedUsageFilter,
    locations
  ]);

  const handleEdit = (_switch) => {
    setEditingSwitch(_switch);
    setSwitchFormName(_switch.name);
    setSwitchFormIp(_switch.ip_address || "");
    setSwitchFormLocationId(_switch.location_id || "");
    setSwitchFormRowInRack(_switch.row_in_rack || "");
    setSwitchFormRackId(_switch.rack_id ? String(_switch.rack_id) : "");
    setSwitchFormTotalPorts(_switch.total_ports);
    setSwitchFormSourcePort(_switch.source_port || "");
    setSwitchFormModel(_switch.model || "");
    setSwitchFormDesc(_switch.description || "");
    setSwitchFormUsage(_switch.usage || "");
    setIsAddSwitchFormExpanded(true);
  };

  const handleSwitchFormSubmit = async (e) => {
    e.preventDefault();

    if (switchFormIp && !ipRegex.test(switchFormIp)) {
      alert("Please enter a valid IP address (e.g., 192.168.1.1).");
      return;
    }
    if (!switchFormName.trim() || !switchFormLocationId) {
      alert("Switch Name and Location are required.");
      return;
    }

    const switchData = {
      name: switchFormName,
      ip_address: switchFormIp,
      location_id: parseInt(switchFormLocationId),
      row_in_rack: switchFormRowInRack,
      rack_id: switchFormRackId ? parseInt(switchFormRackId) : null,
      total_ports: parseInt(switchFormTotalPorts),
      source_port: switchFormSourcePort,
      model: switchFormModel,
      description: switchFormDesc,
      usage: switchFormUsage,
    };

    if (editingSwitch) {
      await onUpdateEntity("switches", editingSwitch.id, switchData);
    } else {
      await onAddEntity("switches", switchData);
    }
    setEditingSwitch(null);
    setSwitchFormName("");
    setSwitchFormIp("");
    setSwitchFormLocationId("");
    setSwitchFormRowInRack("");
    setSwitchFormRackId("");
    setSwitchFormTotalPorts(1);
    setSwitchFormSourcePort("");
    setSwitchFormModel("");
    setSwitchFormDesc("");
    setSwitchFormUsage("");
    setIsAddSwitchFormExpanded(false);
  };

  const sortedLocations = Array.isArray(locations) ? [...locations].sort((a,b) => a.name.localeCompare(b.name)) : [];
  const sortedRacks = Array.isArray(racks) ? [...racks].sort((a,b) => a.name.localeCompare(b.name)) : [];

  // --- DEBUGGING LOGS ---
  useEffect(() => {
    console.log("SwitchList - Racks prop:", racks);
    console.log("SwitchList - Sorted Racks for dropdown:", sortedRacks);
    console.log("SwitchList - Selected Location ID for Switch Form:", switchFormLocationId);
    
    if (Array.isArray(sortedRacks) && switchFormLocationId) {
      const filteredForDebug = sortedRacks.filter(rack => {
        const match = (rack.location_id !== undefined && String(rack.location_id) === switchFormLocationId);
        if (!match) {
          console.log(`Rack "${rack.name}" (ID: ${rack.id}, LocationID: ${rack.location_id}) does NOT match selected location ${switchFormLocationId}`);
        } else {
          console.log(`Rack "${rack.name}" (ID: ${rack.id}, LocationID: ${rack.location_id}) DOES match selected location ${switchFormLocationId}`);
        }
        return match;
      });
      console.log("SwitchList - Filtered Racks (for dropdown, after filter):", filteredForDebug);
    } else if (!switchFormLocationId) {
      console.log("SwitchList - No location selected in form, showing all racks.");
    } else if (!Array.isArray(sortedRacks)) {
      console.log("SwitchList - sortedRacks is not an array!");
    }
  }, [racks, sortedRacks, switchFormLocationId]); // Add dependencies for this effect
  // --- END DEBUGGING LOGS ---


  return (
    <div className="space-y-6">
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options for Switches */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>

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
            {Array.isArray(locations) && locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}{loc.door_number ? ` (Door: ${loc.door_number})` : ''}
              </option>
            ))}
          </select>
        </div>

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
            {availableRackOptions.map((rack) => (
              <option key={rack} value={rack}>
                {rack}
              </option>
            ))}
          </select>
        </div>

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
            {availableUsageOptions.map((usage) => (
              <option key={usage} value={usage}>
                {usage}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Switch Form (Collapsible) */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-red-50 hover:bg-red-100 transition-colors duration-200 rounded-t-lg"
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
          <form onSubmit={handleSwitchFormSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder="Switch Name"
              value={switchFormName}
              onChange={(e) => setSwitchFormName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={switchFormIp}
              onChange={(e) => setSwitchFormIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={switchFormLocationId}
              onChange={(e) => {
                setSwitchFormLocationId(e.target.value);
                setSwitchFormRackId(""); // Reset selected rack when location changes
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
            {locations.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a location first (Go to Locations tab).
              </p>
            )}
            <input
              type="text"
              placeholder="Row in Rack (Optional)"
              value={switchFormRowInRack}
              onChange={(e) => setSwitchFormRowInRack(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Rack Selection Dropdown: Using rack.location_id for filtering */}
            <select
              value={switchFormRackId}
              onChange={(e) => setSwitchFormRackId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Rack (Optional) --</option>
              {Array.isArray(sortedRacks) && sortedRacks
                .filter(rack => {
                    // Filter based on rack.location_id
                    return !switchFormLocationId || (rack.location_id !== undefined && String(rack.location_id) === switchFormLocationId);
                })
                .map((rack) => (
                  <option key={rack.id} value={rack.id}>
                    {rack.name} ({rack.location_name}{rack.location?.door_number && ` (Door: ${rack.location.door_number})`})
                  </option>
                ))}
            </select>
            {Array.isArray(racks) && racks.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No racks added. Add racks in the Racks tab to link.
              </p>
            )}
            {switchFormLocationId && Array.isArray(sortedRacks) && sortedRacks.filter(rack => rack.location_id !== undefined && String(rack.location_id) === switchFormLocationId).length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                    No racks found for the selected location.
                </p>
            )}

            <input
              type="number"
              placeholder="Total Ports (e.g., 4)"
              value={switchFormTotalPorts}
              onChange={(e) => setSwitchFormTotalPorts(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
            <input
              type="text"
              placeholder="Source Port (Optional)"
              value={switchFormSourcePort}
              onChange={(e) => setSwitchFormSourcePort(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Model (Optional)"
              value={switchFormModel}
              onChange={(e) => setSwitchFormModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
                value={switchFormUsage}
                onChange={(e) => setSwitchFormUsage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">-- Select Usage (Optional) --</option>
                {usageOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
                <option value="other">Add Custom Usage...</option>
            </select>
            {switchFormUsage === "other" && (
                <input
                  type="text"
                  placeholder="Enter custom usage"
                  onBlur={(e) => {
                    const customUsage = e.target.value.trim();
                    if (customUsage) {
                      if (!usageOptions.includes(customUsage)) {
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
            <textarea
              placeholder="Description (Optional)"
              value={switchFormDesc}
              onChange={(e) => setSwitchFormDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
              rows="3"
            ></textarea>
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
                {_switch.location_name || "N/A"}{_switch.location?.door_number && ` (Door: ${_switch.location.door_number})`}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Server size={16} className="text-gray-500 mr-2" /> Row:{" "}
                {_switch.row_in_rack || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Columns size={16} className="text-gray-500 mr-2" /> Rack:{" "}
                {_switch.rack_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Total
                Ports: {_switch.total_ports}
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