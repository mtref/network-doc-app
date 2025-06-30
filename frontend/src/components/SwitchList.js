// frontend/src/components/SwitchList.js
// This component displays a searchable list of Switches in a card format,
// now including filter options by Location, Rack, and Model.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Server,
  Router,
  MapPin,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Columns,
  HardDrive,
  Link,
  Filter, // New icon for filter section
} from "lucide-react";

function SwitchList({
  switches,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
  locations,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSwitches, setFilteredSwitches] = useState([]);
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [switchFormName, setSwitchFormName] = useState("");
  const [switchFormIp, setSwitchFormIp] = useState("");
  const [switchFormLocationId, setSwitchFormLocationId] = useState("");
  const [switchFormRowInRack, setSwitchFormRowInRack] = useState("");
  const [switchFormRackName, setSwitchFormRackName] = useState("");
  const [switchFormTotalPorts, setSwitchFormTotalPorts] = useState(1);
  const [switchFormSourcePort, setSwitchFormSourcePort] = useState("");
  const [switchFormModel, setSwitchFormModel] = useState("");
  const [switchFormDesc, setSwitchFormDesc] = useState("");

  const [isAddSwitchFormExpanded, setIsAddSwitchFormExpanded] = useState(false);

  // New states for filter options
  const [selectedLocationFilter, setSelectedLocationFilter] = useState("all");
  const [selectedRackFilter, setSelectedRackFilter] = useState("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState("all");

  // States to hold available unique options for filters
  const [availableLocationOptions, setAvailableLocationOptions] = useState([]);
  const [availableRackOptions, setAvailableRackOptions] = useState([]);
  const [availableModelOptions, setAvailableModelOptions] = useState([]);

  // IP Address Regex for validation
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Effect to extract unique filter options whenever 'switches' data changes
  useEffect(() => {
    const uniqueLocations = [
      ...new Set(switches.map((s) => s.location_name).filter(Boolean)),
    ].sort();
    setAvailableLocationOptions(uniqueLocations);

    const uniqueRacks = [
      ...new Set(switches.map((s) => s.rack_name).filter(Boolean)),
    ].sort();
    setAvailableRackOptions(uniqueRacks);

    const uniqueModels = [
      ...new Set(switches.map((s) => s.model).filter(Boolean)),
    ].sort();
    setAvailableModelOptions(uniqueModels);
  }, [switches]);

  // Filter Switches based on search term and filter selections
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = switches.filter((_switch) => {
      // Text search filter
      const matchesSearch =
        (_switch.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (_switch.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.location_name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.row_in_rack || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.rack_name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        String(_switch.total_ports).includes(lowerCaseSearchTerm) ||
        (String(_switch.source_port) || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (String(_switch.model) || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (String(_switch.description) || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm);

      // Location filter
      const matchesLocation =
        selectedLocationFilter === "all" ||
        _switch.location_name === selectedLocationFilter;

      // Rack filter
      const matchesRack =
        selectedRackFilter === "all" ||
        _switch.rack_name === selectedRackFilter;

      // Model filter
      const matchesModel =
        selectedModelFilter === "all" || _switch.model === selectedModelFilter;

      return matchesSearch && matchesLocation && matchesRack && matchesModel;
    });
    setFilteredSwitches(filtered);
  }, [
    switches,
    searchTerm,
    selectedLocationFilter,
    selectedRackFilter,
    selectedModelFilter,
  ]);

  // Handle edit initiation
  const handleEdit = (_switch) => {
    setEditingSwitch(_switch);
    setSwitchFormName(_switch.name);
    setSwitchFormIp(_switch.ip_address || "");
    setSwitchFormLocationId(_switch.location_id || "");
    setSwitchFormRowInRack(_switch.row_in_rack || "");
    setSwitchFormRackName(_switch.rack_name || "");
    setSwitchFormTotalPorts(_switch.total_ports);
    setSwitchFormSourcePort(_switch.source_port || "");
    setSwitchFormModel(_switch.model || "");
    setSwitchFormDesc(_switch.description || "");
    setIsAddSwitchFormExpanded(true);
  };

  // Handle form submission for Add/Update Switch
  const handleSwitchFormSubmit = async (e) => {
    e.preventDefault();

    // IP validation
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
      rack_name: switchFormRackName,
      total_ports: parseInt(switchFormTotalPorts),
      source_port: switchFormSourcePort,
      model: switchFormModel,
      description: switchFormDesc,
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
    setSwitchFormRackName("");
    setSwitchFormTotalPorts(1);
    setSwitchFormSourcePort("");
    setSwitchFormModel("");
    setSwitchFormDesc("");
    setIsAddSwitchFormExpanded(false);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options for Switches */}
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
            {availableLocationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
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
            {availableRackOptions.map((rack) => (
              <option key={rack} value={rack}>
                {rack}
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
              onChange={(e) => setSwitchFormLocationId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
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
            <input
              type="text"
              placeholder="Rack Name (Optional)"
              value={switchFormRackName}
              onChange={(e) => setSwitchFormRackName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
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
                    setSwitchFormRackName("");
                    setSwitchFormTotalPorts(1);
                    setSwitchFormSourcePort("");
                    setSwitchFormModel("");
                    setSwitchFormDesc("");
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
