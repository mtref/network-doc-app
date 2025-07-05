// frontend/src/components/PcList.js
// This component displays a searchable list of PCs in a card format,
// now including filter options by In Domain, OS, Office, Type, and Usage.
// Added multi_port, type, model (replaces ports_name), and usage fields to PC creation/edit form and display.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; // Reusing the generic SearchBar component
import {
  Laptop,
  Router,
  Info,
  PlusCircle, // The plus icon for "Add New PC"
  ChevronDown,
  ChevronUp,
  User,
  HardDrive,
  ToggleRight,
  ToggleLeft,
  Monitor,
  Building2,
  Filter,
  Link, // Icon for multi-port
  Server, // Icon for PC type: Server
  MonitorCheck, // Icon for PC type: Workstation (assuming it fits)
  Activity, // New icon for Usage
  Tag, // New icon for Model
  Cpu, // New icon for OS
  MapPin, // New icon for Office
  Globe, // New icon for In Domain
} from "lucide-react"; // Icons for PC details and collapse/expand

function PcList({ pcs, onAddEntity, onUpdateEntity, onDeleteEntity }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [editingPc, setEditingPc] = useState(null); // State for editing a PC
  const [pcFormName, setPcFormName] = useState("");
  const [pcFormIp, setPcFormIp] = useState("");
  const [pcFormUsername, setPcFormUsername] = useState("");
  const [pcFormInDomain, setPcFormInDomain] = useState(false);
  const [pcFormOs, setPcFormOs] = useState("");
  const [pcFormModel, setPcFormModel] = useState(""); // Renamed from pcFormPortsName to pcFormModel
  const [pcFormOffice, setPcFormOffice] = useState("");
  const [pcFormDesc, setPcFormDesc] = useState("");
  const [pcFormMultiPort, setPcFormMultiPort] = useState(false);
  const [pcFormType, setPcFormType] = useState("Workstation"); // New state for PC type
  const [pcFormUsage, setPcFormUsage] = useState(""); // New state for PC usage


  const [isAddPcFormExpanded, setIsAddPcFormExpanded] = useState(false);

  // New states for filter options
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all"); // 'all', 'true', 'false'
  const [selectedOsFilter, setSelectedOsFilter] = useState("all");
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // New filter for PC Type
  const [selectedUsageFilter, setSelectedUsageFilter] = useState("all"); // New filter for PC Usage
  const [selectedModelFilter, setSelectedModelFilter] = useState("all"); // ADDED: State for Model filter

  // States to hold available unique options for filters
  const [availableOsOptions, setAvailableOsOptions] = useState([]);
  const [availableOfficeOptions, setAvailableOfficeOptions] = useState([]);
  const [availableModelOptions, setAvailableModelOptions] = useState([]); // New filter options for Model
  const [availableUsageOptions, setAvailableUsageOptions] = useState([]); // New filter options for Usage

  // IP Address Regex for validation
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Dropdown options for Usage
  const usageOptions = ["Production", "Development", "Test", "Staging", "Backup", "Monitoring", "Other"];


  // Effect to extract unique filter options whenever 'pcs' data changes
  useEffect(() => {
    const uniqueOs = [
      ...new Set(pcs.map((pc) => pc.operating_system).filter(Boolean)),
    ].sort();
    setAvailableOsOptions(uniqueOs);

    const uniqueOffice = [
      ...new Set(pcs.map((pc) => pc.office).filter(Boolean)),
    ].sort();
    setAvailableOfficeOptions(uniqueOffice);

    const uniqueModels = [ // New filter options for Model
      ...new Set(pcs.map((pc) => pc.model).filter(Boolean)),
    ].sort();
    setAvailableModelOptions(uniqueModels);

    const uniqueUsage = [ // New filter options for Usage
      ...new Set(pcs.map((pc) => pc.usage).filter(Boolean)),
    ].sort();
    setAvailableUsageOptions(uniqueUsage);
  }, [pcs]);

  // Filter PCs based on search term and filter selections
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = pcs.filter((pc) => {
      // Text search filter
      const matchesSearch =
        (pc.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.ip_address || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.username || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.in_domain ? "yes" : "no").includes(lowerCaseSearchTerm) ||
        (pc.operating_system || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (pc.model || "").toLowerCase().includes(lowerCaseSearchTerm) || // Updated from ports_name
        (pc.office || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.description || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.multi_port ? "multi-port" : "single-port").includes(
          lowerCaseSearchTerm
        ) ||
        (pc.type || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.usage || "").toLowerCase().includes(lowerCaseSearchTerm);


      // "In Domain" filter
      const matchesDomain =
        selectedDomainFilter === "all" ||
        (selectedDomainFilter === "true" && pc.in_domain) ||
        (selectedDomainFilter === "false" && !pc.in_domain);

      // OS filter
      const matchesOs =
        selectedOsFilter === "all" || pc.operating_system === selectedOsFilter;

      // Office filter
      const matchesOffice =
        selectedOfficeFilter === "all" || pc.office === selectedOfficeFilter;
      
      // Type filter
      const matchesType =
        selectedTypeFilter === "all" || pc.type === selectedTypeFilter;

      // Usage filter
      const matchesUsage =
        selectedUsageFilter === "all" || pc.usage === selectedUsageFilter;

      // Model filter
      const matchesModel =
        selectedModelFilter === "all" || pc.model === selectedModelFilter;


      return matchesSearch && matchesDomain && matchesOs && matchesOffice && matchesType && matchesUsage && matchesModel;
    });
    setFilteredPcs(filtered);
  }, [
    pcs,
    searchTerm,
    selectedDomainFilter,
    selectedOsFilter,
    selectedOfficeFilter,
    selectedTypeFilter,
    selectedUsageFilter,
    selectedModelFilter, // ADDED: Dependency for useEffect
  ]);

  // Handle edit initiation
  const handleEdit = (pc) => {
    setEditingPc(pc);
    setPcFormName(pc.name);
    setPcFormIp(pc.ip_address || "");
    setPcFormUsername(pc.username || "");
    setPcFormInDomain(pc.in_domain || false);
    setPcFormOs(pc.operating_system || "");
    setPcFormModel(pc.model || ""); // Updated to model
    setPcFormOffice(pc.office || "");
    setPcFormDesc(pc.description || "");
    setPcFormMultiPort(pc.multi_port || false);
    setPcFormType(pc.type || "Workstation"); // Set PC type for editing
    setPcFormUsage(pc.usage || ""); // Set PC usage for editing
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
      model: pcFormModel, // Updated to model
      office: pcFormOffice,
      description: pcFormDesc,
      multi_port: pcFormMultiPort,
      type: pcFormType, // Include PC type in data
      usage: pcFormUsage, // Include PC usage in data
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
    setPcFormModel(""); // Reset new field
    setPcFormOffice("");
    setPcFormDesc("");
    setPcFormMultiPort(false); // Reset multi_port
    setPcFormType("Workstation"); // Reset new field
    setPcFormUsage(""); // Reset new field
    setIsAddPcFormExpanded(false); // Collapse form after submission
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Filter Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>

        {/* In Domain Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="domain-filter"
            className="text-sm font-medium text-gray-700"
          >
            In Domain:
          </label>
          <select
            id="domain-filter"
            value={selectedDomainFilter}
            onChange={(e) => setSelectedDomainFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* OS Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="os-filter"
            className="text-sm font-medium text-gray-700"
          >
            OS:
          </label>
          <select
            id="os-filter"
            value={selectedOsFilter}
            onChange={(e) => setSelectedOsFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableOsOptions.map((os) => (
              <option key={os} value={os}>
                {os}
              </option>
            ))}
          </select>
        </div>

        {/* Office Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="office-filter"
            className="text-sm font-medium text-gray-700"
          >
            Office:
          </label>
          <select
            id="office-filter"
            value={selectedOfficeFilter}
            onChange={(e) => setSelectedOfficeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            {availableOfficeOptions.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </div>

        {/* PC Type Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="pc-type-filter"
            className="text-sm font-medium text-gray-700"
          >
            Type:
          </label>
          <select
            id="pc-type-filter"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="Workstation">Workstation</option>
            <option value="Server">Server</option>
          </select>
        </div>

        {/* PC Usage Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="pc-usage-filter"
            className="text-sm font-medium text-gray-700"
          >
            Usage:
          </label>
          <select
            id="pc-usage-filter"
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

        {/* PC Model Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label
            htmlFor="pc-model-filter"
            className="text-sm font-medium text-gray-700"
          >
            Model:
          </label>
          <select
            id="pc-model-filter"
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

      {/* Add/Edit PC Form (Collapsible) - Outer container now has width and centering */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
        {/* Header (no mx-auto or w-x/y here, it's w-full of its parent) */}
        <div
          className="flex justify-center items-center p-3 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 rounded-t-lg"
          onClick={() => setIsAddPcFormExpanded(!isAddPcFormExpanded)}
        >
          <h3 className="text-xl font-bold text-indigo-700 flex items-center">
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
          {/* Form content (no mx-auto or w-x/y here, it's w-full of its parent, the outer div) */}
          <form onSubmit={handlePcFormSubmit}
                className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50">
            <div className="flex items-center space-x-2">
                <Laptop size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="PC Name"
                    value={pcFormName}
                    onChange={(e) => setPcFormName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div className="flex items-center space-x-2">
                <Router size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="IP Address (e.g., 192.168.1.1)"
                    value={pcFormIp}
                    onChange={(e) => setPcFormIp(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center space-x-2">
                <User size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Username (Optional)"
                    value={pcFormUsername}
                    onChange={(e) => setPcFormUsername(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center space-x-4">
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
              <div className="flex items-center">
                <input
                  id="pc-multi-port"
                  type="checkbox"
                  checked={pcFormMultiPort}
                  onChange={(e) => setPcFormMultiPort(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="pc-multi-port"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Multi-Port PC (Can have multiple connections)
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-2">
                {pcFormType === "Server" ? (
                  <Server size={20} className="text-gray-500" />
                ) : (
                  <MonitorCheck size={20} className="text-gray-500" />
                )}
                <select // PC Type dropdown
                    value={pcFormType}
                    onChange={(e) => setPcFormType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                >
                    <option value="Workstation">Workstation</option>
                    <option value="Server">Server</option>
                </select>
            </div>
            <div className="flex items-center space-x-2">
                <Activity size={20} className="text-gray-500" />
                <select // PC Usage dropdown
                    value={pcFormUsage}
                    onChange={(e) => setPcFormUsage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="">-- Select Usage (Optional) --</option>
                    {usageOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    {/* Option to add custom usage (handled client-side for simplicity, or could have a modal) */}
                    <option value="other">Add Custom Usage...</option>
                </select>
            </div>
            {pcFormUsage === "other" && (
                <input
                  type="text"
                  placeholder="Enter custom usage"
                  onBlur={(e) => {
                    const customUsage = e.target.value.trim();
                    if (customUsage) {
                      if (!usageOptions.includes(customUsage)) {
                        usageOptions.push(customUsage); // Dynamically add to available options
                      }
                      setPcFormUsage(customUsage);
                    } else {
                      setPcFormUsage(""); // Reset if input is cleared
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            )}
            <div className="flex items-center space-x-2">
                <Tag size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Model (e.g., Dell OptiPlex 7010)" // Updated from Ports Name
                    value={pcFormModel}
                    onChange={(e) => setPcFormModel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center space-x-2">
                <Cpu size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Operating System (Optional)"
                    value={pcFormOs}
                    onChange={(e) => setPcFormOs(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center space-x-2">
                <MapPin size={20} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Office (Optional)"
                    value={pcFormOffice}
                    onChange={(e) => setPcFormOffice(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-start space-x-2">
                <Info size={20} className="text-gray-500 mt-2" />
                <textarea
                    placeholder="Description (Optional)"
                    value={pcFormDesc}
                    onChange={(e) => setPcFormDesc(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                    rows="3"
                ></textarea>
            </div>
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
                    setPcFormModel(""); // Reset new field
                    setPcFormOffice("");
                    setPcFormDesc("");
                    setPcFormMultiPort(false); // Reset multi_port
                    setPcFormType("Workstation"); // Reset new field
                    setPcFormUsage(""); // Reset new field
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
                {pc.type === "Server" ? ( // Conditional icon display based on PC type
                  <Server size={20} className="text-indigo-500 mr-2" />
                ) : (
                  <Laptop size={20} className="text-indigo-500 mr-2" />
                )}{" "}
                {pc.name}
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
                {pc.multi_port ? ( // Display multi_port status
                  <Link size={16} className="text-blue-500 mr-2" />
                ) : (
                  <Info size={16} className="text-gray-500 mr-2" />
                )}{" "}
                Multi-Port: {pc.multi_port ? "Yes" : "No"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Monitor size={16} className="text-gray-500 mr-2" /> OS:{" "}
                {pc.operating_system || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Model:{" "}
                {pc.model || "N/A"} {/* Updated from Ports Name */}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Building2 size={16} className="text-gray-500 mr-2" /> Office:{" "}
                {pc.office || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Type:{" "}
                {pc.type || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Usage:{" "}
                {pc.usage || "N/A"}
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
          {searchTerm
            ? "No PCs match your search and filter criteria."
            : "No PCs added yet."}
        </p>
      )}
    </div>
  );
}

export default PcList;