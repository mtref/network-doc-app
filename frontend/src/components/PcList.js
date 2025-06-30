// frontend/src/components/PcList.js
// This component displays a searchable list of PCs in a card format.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Laptop,
  Router,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  User,
  HardDrive,
  ToggleRight,
  ToggleLeft,
  Monitor,
} from "lucide-react"; // Icons for PC details and collapse/expand

function PcList({ pcs, onAddEntity, onUpdateEntity, onDeleteEntity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [editingPc, setEditingPc] = useState(null); // State for editing a PC
  const [pcFormName, setPcFormName] = useState("");
  const [pcFormIp, setPcFormIp] = useState("");
  const [pcFormUsername, setPcFormUsername] = useState(""); // New field
  const [pcFormInDomain, setPcFormInDomain] = useState(false); // New field
  const [pcFormOs, setPcFormOs] = useState(""); // New field
  const [pcFormPortsName, setPcFormPortsName] = useState(""); // New field
  const [pcFormDesc, setPcFormDesc] = useState("");

  const [isAddPcFormExpanded, setIsAddPcFormExpanded] = useState(false); // State for collapsible add form

  // IP Address Regex for validation
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Filter PCs based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = pcs.filter(
      (pc) =>
        (pc.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.ip_address || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.username || "").toLowerCase().includes(lowerCaseSearchTerm) || // Search by username
        (pc.in_domain ? "yes" : "no").includes(lowerCaseSearchTerm) || // Search by in_domain status
        (pc.operating_system || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) || // Search by OS
        (pc.ports_name || "").toLowerCase().includes(lowerCaseSearchTerm) || // Search by ports_name
        (pc.description || "").toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredPcs(filtered);
  }, [pcs, searchTerm]);

  // Handle edit initiation
  const handleEdit = (pc) => {
    setEditingPc(pc);
    setPcFormName(pc.name);
    setPcFormIp(pc.ip_address || "");
    setPcFormUsername(pc.username || "");
    setPcFormInDomain(pc.in_domain || false);
    setPcFormOs(pc.operating_system || "");
    setPcFormPortsName(pc.ports_name || "");
    setPcFormDesc(pc.description || "");
    setIsAddPcFormExpanded(true); // Expand form when editing
  };

  // Handle form submission for Add/Update PC
  const handlePcFormSubmit = async (e) => {
    e.preventDefault();

    // IP validation
    if (pcFormIp && !ipRegex.test(pcFormIp)) {
      alert("Please enter a valid IP address (e.g., 192.168.1.1).");
      return;
    }

    const pcData = {
      name: pcFormName,
      ip_address: pcFormIp,
      username: pcFormUsername,
      in_domain: pcFormInDomain,
      operating_system: pcFormOs,
      ports_name: pcFormPortsName,
      description: pcFormDesc,
    };

    if (editingPc) {
      await onUpdateEntity("pcs", editingPc.id, pcData);
    } else {
      await onAddEntity("pcs", pcData);
    }
    setEditingPc(null); // Clear editing state
    setPcFormName(""); // Clear form fields
    setPcFormIp("");
    setPcFormUsername("");
    setPcFormInDomain(false);
    setPcFormOs("");
    setPcFormPortsName("");
    setPcFormDesc("");
    setIsAddPcFormExpanded(false); // Collapse form after submission
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Add/Edit PC Form (Collapsible) */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200">
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200 rounded-t-lg"
          onClick={() => setIsAddPcFormExpanded(!isAddPcFormExpanded)}
        >
          <h3 className="text-xl font-bold text-blue-700 flex items-center">
            <PlusCircle size={20} className="mr-2" />{" "}
            {editingPc ? "Edit PC" : "Add New PC"}
          </h3>
          {isAddPcFormExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
        <div
          className={`collapsible-content ${
            isAddPcFormExpanded ? "expanded" : ""
          }`}
        >
          <form onSubmit={handlePcFormSubmit} className="p-5 space-y-3">
            <input
              type="text"
              placeholder="PC Name"
              value={pcFormName}
              onChange={(e) => setPcFormName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (e.g., 192.168.1.1)"
              value={pcFormIp}
              onChange={(e) => setPcFormIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Username (Optional)"
              value={pcFormUsername}
              onChange={(e) => setPcFormUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex items-center">
              <input
                id="pc-in-domain"
                type="checkbox"
                checked={pcFormInDomain}
                onChange={(e) => setPcFormInDomain(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="pc-in-domain"
                className="ml-2 block text-sm text-gray-900"
              >
                In Domain
              </label>
            </div>
            <input
              type="text"
              placeholder="Operating System (Optional)"
              value={pcFormOs}
              onChange={(e) => setPcFormOs(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Ports Name (e.g., HDMI, USB, Eth)"
              value={pcFormPortsName}
              onChange={(e) => setPcFormPortsName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <textarea
              placeholder="Description (Optional)"
              value={pcFormDesc}
              onChange={(e) => setPcFormDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
              rows="3"
            ></textarea>
            <div className="flex space-x-3 justify-end">
              {editingPc && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPc(null);
                    setPcFormName("");
                    setPcFormIp("");
                    setPcFormUsername("");
                    setPcFormInDomain(false);
                    setPcFormOs("");
                    setPcFormPortsName("");
                    setPcFormDesc("");
                    setIsAddPcFormExpanded(false);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-200"
              >
                {editingPc ? "Update PC" : "Add PC"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* PC List Display */}
      {filteredPcs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPcs.map((pc) => (
            <div
              key={pc.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5"
            >
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <Laptop size={20} className="text-indigo-500 mr-2" /> {pc.name}
              </h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Router size={16} className="text-gray-500 mr-2" /> IP:{" "}
                {pc.ip_address || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <User size={16} className="text-gray-500 mr-2" /> Username:{" "}
                {pc.username || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                {pc.in_domain ? (
                  <ToggleRight size={16} className="text-green-500 mr-2" />
                ) : (
                  <ToggleLeft size={16} className="text-red-500 mr-2" />
                )}{" "}
                In Domain: {pc.in_domain ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Monitor size={16} className="text-gray-500 mr-2" /> OS:{" "}
                {pc.operating_system || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Ports:{" "}
                {pc.ports_name || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-start">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                Description: {pc.description || "No description"}
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEdit(pc)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteEntity("pcs", pc.id)}
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
          {searchTerm ? "No PCs match your search." : "No PCs added yet."}
        </p>
      )}
    </div>
  );
}

export default PcList;
