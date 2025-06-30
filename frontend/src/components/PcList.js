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
} from "lucide-react"; // Icons for PC details and collapse/expand

function PcList({ pcs, onAddEntity, onUpdateEntity, onDeleteEntity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [editingPc, setEditingPc] = useState(null); // State for editing a PC
  const [pcFormName, setPcFormName] = useState("");
  const [pcFormIp, setPcFormIp] = useState("");
  const [pcFormDesc, setPcFormDesc] = useState("");

  const [isAddPcFormExpanded, setIsAddPcFormExpanded] = useState(false); // State for collapsible add form

  // Filter PCs based on search term
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = pcs.filter(
      (pc) =>
        (pc.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.ip_address || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.description || "").toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredPcs(filtered);
  }, [pcs, searchTerm]);

  // Handle edit initiation
  const handleEdit = (pc) => {
    setEditingPc(pc);
    setPcFormName(pc.name);
    setPcFormIp(pc.ip_address || "");
    setPcFormDesc(pc.description || "");
    setIsAddPcFormExpanded(true); // Expand form when editing
  };

  // Handle form submission for Add/Update PC
  const handlePcFormSubmit = async (e) => {
    e.preventDefault();
    const pcData = {
      name: pcFormName,
      ip_address: pcFormIp,
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
              placeholder="IP Address (Optional)"
              value={pcFormIp}
              onChange={(e) => setPcFormIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={pcFormDesc}
              onChange={(e) => setPcFormDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex space-x-3 justify-end">
              {editingPc && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPc(null);
                    setPcFormName("");
                    setPcFormIp("");
                    setPcFormDesc("");
                    setIsAddPcFormExpanded(false); // Collapse form on cancel
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
