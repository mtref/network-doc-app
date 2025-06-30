// frontend/src/components/SwitchList.js
// This component displays a searchable list of Switches in a card format.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import { Server, Router, MapPin, Info, HardDrive } from "lucide-react"; // Icons for Switch details

function SwitchList({
  switches,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  onShowPortStatus,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSwitches, setFilteredSwitches] = useState([]);
  const [editingSwitch, setEditingSwitch] = useState(null); // State for editing a Switch
  const [switchFormName, setSwitchFormName] = useState("");
  const [switchFormIp, setSwitchFormIp] = useState("");
  const [switchFormLocation, setSwitchFormLocation] = useState("");
  const [switchFormTotalPorts, setSwitchFormTotalPorts] = useState(1);

  // Filter Switches based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = switches.filter(
      (_switch) =>
        (_switch.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (_switch.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (_switch.location || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        String(_switch.total_ports).includes(lowerCaseSearchTerm)
    );
    setFilteredSwitches(filtered);
  }, [switches, searchTerm]);

  // Handle edit initiation
  const handleEdit = (_switch) => {
    setEditingSwitch(_switch);
    setSwitchFormName(_switch.name);
    setSwitchFormIp(_switch.ip_address || "");
    setSwitchFormLocation(_switch.location || "");
    setSwitchFormTotalPorts(_switch.total_ports);
  };

  // Handle form submission for Add/Update Switch
  const handleSwitchFormSubmit = async (e) => {
    e.preventDefault();
    const switchData = {
      name: switchFormName,
      ip_address: switchFormIp,
      location: switchFormLocation,
      total_ports: parseInt(switchFormTotalPorts),
    };

    if (editingSwitch) {
      await onUpdateEntity("switches", editingSwitch.id, switchData);
    } else {
      await onAddEntity("switches", switchData);
    }
    setEditingSwitch(null); // Clear editing state
    setSwitchFormName(""); // Clear form fields
    setSwitchFormIp("");
    setSwitchFormLocation("");
    setSwitchFormTotalPorts(1);
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Add/Edit Switch Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
        <h3 className="text-xl font-bold text-blue-700 mb-4">
          {editingSwitch ? "Edit Switch" : "Add New Switch"}
        </h3>
        <form onSubmit={handleSwitchFormSubmit} className="space-y-3">
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
            placeholder="IP Address (Optional)"
            value={switchFormIp}
            onChange={(e) => setSwitchFormIp(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Location (Optional)"
            value={switchFormLocation}
            onChange={(e) => setSwitchFormLocation(e.target.value)}
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
          <div className="flex space-x-3 justify-end">
            {editingSwitch && (
              <button
                type="button"
                onClick={() => {
                  setEditingSwitch(null);
                  setSwitchFormName("");
                  setSwitchFormIp("");
                  setSwitchFormLocation("");
                  setSwitchFormTotalPorts(1);
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
                {_switch.location || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Total
                Ports: {_switch.total_ports}
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
            ? "No Switches match your search."
            : "No Switches added yet."}
        </p>
      )}
    </div>
  );
}

export default SwitchList;
