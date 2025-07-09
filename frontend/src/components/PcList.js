// frontend/src/components/PcList.js
// This component displays a searchable list of PCs in a card format.
// UPDATED: Hides Add/Edit/Delete controls based on user role.

import React, { useState, useEffect } from "react";
import SearchBar from "./SearchBar"; 
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
  Building2,
  Filter,
  Link, 
  Server, 
  MonitorCheck,
  Activity, 
  Tag, 
  Cpu, 
  MapPin, 
  Globe, 
  Columns, 
  Fingerprint, 
  ClipboardList, 
  Database, 
} from "lucide-react";

function PcList({
  pcs,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  locations,
  racks,
  user // Receive user prop
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPcs, setFilteredPcs] = useState([]);
  const [editingPc, setEditingPc] = useState(null);
  const [pcFormName, setPcFormName] = useState("");
  const [pcFormIp, setPcFormIp] = useState("");
  const [pcFormUsername, setPcFormUsername] = useState("");
  const [pcFormInDomain, setPcFormInDomain] = useState(false);
  const [pcFormOs, setPcFormOs] = useState("");
  const [pcFormModel, setPcFormModel] = useState("");
  const [pcFormOffice, setPcFormOffice] = useState("");
  const [pcFormDesc, setPcFormDesc] = useState("");
  const [pcFormMultiPort, setPcFormMultiPort] = useState(false);
  const [pcFormType, setPcFormType] = useState("Workstation");
  const [pcFormUsage, setPcFormUsage] = useState("");
  const [pcFormRowInRack, setPcFormRowInRack] = useState("");
  const [pcFormRackId, setPcFormRackId] = useState("");
  const [pcFormUnitsOccupied, setPcFormUnitsOccupied] = useState(1);
  const [pcFormSerialNumber, setPcFormSerialNumber] = useState("");
  const [pcFormSpecification, setPcFormSpecification] = useState("");
  const [pcFormMonitorModel, setPcFormMonitorModel] = useState("");
  const [pcFormDiskInfo, setPcFormDiskInfo] = useState("");
  const [showCustomUsageInput, setShowCustomUsageInput] = useState(false);
  const [customUsageValue, setCustomUsageValue] = useState("");
  const [isAddPcFormExpanded, setIsAddPcFormExpanded] = useState(false);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all");
  const [selectedOsFilter, setSelectedOsFilter] = useState("all");
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedUsageFilter, setSelectedUsageFilter] = useState("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState("all");
  const [selectedRackFilter, setSelectedRackFilter] = useState("all");
  const [availableOsOptions, setAvailableOsOptions] = useState([]);
  const [availableOfficeOptions, setAvailableOfficeOptions] = useState([]);
  const [availableModelOptions, setAvailableModelOptions] = useState([]);
  const [availableUsageOptions, setAvailableUsageOptions] = useState([]);
  const [availableRackOptions, setAvailableRackOptions] = useState([]);

  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;

  const initialUsageOptions = [
    "Production",
    "Development",
    "Test",
    "Staging",
    "Backup",
    "Monitoring",
  ];

  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

  useEffect(() => {
    const uniqueOs = [...new Set(pcs.map((pc) => pc.operating_system).filter(Boolean))].sort();
    setAvailableOsOptions(uniqueOs);

    const uniqueOffice = [...new Set(pcs.map((pc) => pc.office).filter(Boolean))].sort();
    setAvailableOfficeOptions(uniqueOffice);

    const uniqueModels = [...new Set(pcs.map((pc) => pc.model).filter(Boolean))].sort();
    setAvailableModelOptions(uniqueModels);

    const allUsages = new Set([...initialUsageOptions, ...pcs.map(pc => pc.usage).filter(Boolean)]);
    setAvailableUsageOptions([...allUsages].sort());

    const uniqueRacks = [...new Set(racks.map((rack) => rack.name + (rack.location_name ? ` (${rack.location_name})` : "")))].sort();
    setAvailableRackOptions(uniqueRacks);
  }, [pcs, locations, racks]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = pcs.filter((pc) => {
      const pcRackNameWithLocation = pc.rack?.name ? pc.rack.name + (pc.rack.location_name ? ` (${pc.rack.location_name})` : "") : "";
      const matchesSearch =
        (pc.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.ip_address || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.username || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.operating_system || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.model || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.office || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.description || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.type || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.usage || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        pcRackNameWithLocation.toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.serial_number || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.pc_specification || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.monitor_model || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (pc.disk_info || "").toLowerCase().includes(lowerCaseSearchTerm);

      const matchesDomain = selectedDomainFilter === "all" || (selectedDomainFilter === "true" && pc.in_domain) || (selectedDomainFilter === "false" && !pc.in_domain);
      const matchesOs = selectedOsFilter === "all" || pc.operating_system === selectedOsFilter;
      const matchesOffice = selectedOfficeFilter === "all" || pc.office === selectedOfficeFilter;
      const matchesType = selectedTypeFilter === "all" || pc.type === selectedTypeFilter;
      const matchesUsage = selectedUsageFilter === "all" || pc.usage === selectedUsageFilter;
      const matchesModel = selectedModelFilter === "all" || pc.model === selectedModelFilter;
      const matchesRack = selectedRackFilter === "all" || pcRackNameWithLocation === selectedRackFilter;

      return matchesSearch && matchesDomain && matchesOs && matchesOffice && matchesType && matchesUsage && matchesModel && matchesRack;
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
    selectedModelFilter,
    selectedRackFilter,
  ]);

  const handleEdit = (pc) => {
    setEditingPc(pc);
    setPcFormName(pc.name);
    setPcFormIp(pc.ip_address || "");
    setPcFormUsername(pc.username || "");
    setPcFormInDomain(pc.in_domain || false);
    setPcFormOs(pc.operating_system || "");
    setPcFormModel(pc.model || "");
    setPcFormOffice(pc.office || "");
    setPcFormDesc(pc.description || "");
    setPcFormMultiPort(pc.multi_port || false);
    setPcFormType(pc.type || "Workstation");
    setPcFormRowInRack(pc.row_in_rack || "");
    setPcFormRackId(pc.rack_id || "");
    setPcFormUnitsOccupied(pc.units_occupied || 1);
    setPcFormSerialNumber(pc.serial_number || "");
    setPcFormSpecification(pc.pc_specification || "");
    setPcFormMonitorModel(pc.monitor_model || "");
    setPcFormDiskInfo(pc.disk_info || "");

    const usage = pc.usage || "";
    if (initialUsageOptions.includes(usage) || usage === "") {
        setPcFormUsage(usage);
        setShowCustomUsageInput(false);
        setCustomUsageValue("");
    } else {
        setPcFormUsage("Other");
        setShowCustomUsageInput(true);
        setCustomUsageValue(usage);
    }

    setIsAddPcFormExpanded(true);
  };

  const handlePcFormSubmit = async (e) => {
    e.preventDefault();
    if (pcFormIp && !ipRegex.test(pcFormIp)) {
      alert("Please enter a valid IP address (e.g., 192.168.1.1).");
      return;
    }
    if (pcFormType === "Server") {
      if (!pcFormRackId || pcFormRowInRack === "" || pcFormUnitsOccupied === "") {
        alert("For Server type PCs, Rack, Starting Row in Rack, and Units Occupied are required.");
        return;
      }
      const selectedRack = racks.find((r) => String(r.id) === pcFormRackId);
      if (selectedRack) {
        const startRow = parseInt(pcFormRowInRack);
        const units = parseInt(pcFormUnitsOccupied);
        if (isNaN(startRow) || startRow < 1 || startRow > selectedRack.total_units) {
          alert(`Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`);
          return;
        }
        if (isNaN(units) || units < 1) {
          alert("Units Occupied must be a positive number.");
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          alert(`Device extends beyond total units of the rack (${selectedRack.total_units}U).`);
          return;
        }
      }
    }

    const pcData = {
      name: pcFormName,
      ip_address: pcFormIp,
      username: pcFormUsername,
      in_domain: pcFormInDomain,
      operating_system: pcFormOs,
      model: pcFormModel,
      office: pcFormOffice,
      description: pcFormDesc,
      multi_port: pcFormMultiPort,
      type: pcFormType,
      usage: pcFormUsage === 'Other' ? customUsageValue : pcFormUsage,
      row_in_rack: pcFormType === "Server" ? parseInt(pcFormRowInRack) : null,
      rack_id: pcFormType === "Server" ? parseInt(pcFormRackId) : null,
      units_occupied: pcFormType === "Server" ? parseInt(pcFormUnitsOccupied) : 1,
      serial_number: pcFormSerialNumber,
      pc_specification: pcFormSpecification,
      monitor_model: pcFormMonitorModel,
      disk_info: pcFormDiskInfo,
    };

    if (editingPc) {
      await onUpdateEntity("pcs", editingPc.id, pcData);
    } else {
      await onAddEntity("pcs", pcData);
    }
    setEditingPc(null);
    setPcFormName("");
    setPcFormIp("");
    setPcFormUsername("");
    setPcFormInDomain(false);
    setPcFormOs("");
    setPcFormModel("");
    setPcFormOffice("");
    setPcFormDesc("");
    setPcFormMultiPort(false);
    setPcFormType("Workstation");
    setPcFormUsage("");
    setPcFormRowInRack("");
    setPcFormRackId("");
    setPcFormUnitsOccupied(1);
    setPcFormSerialNumber("");
    setPcFormSpecification("");
    setPcFormMonitorModel("");
    setPcFormDiskInfo("");
    setShowCustomUsageInput(false);
    setCustomUsageValue("");
    setIsAddPcFormExpanded(false);
  };

  const handleUsageChange = (e) => {
    const value = e.target.value;
    setPcFormUsage(value);
    if (value === 'Other') {
        setShowCustomUsageInput(true);
    } else {
        setShowCustomUsageInput(false);
        setCustomUsageValue("");
    }
  };

  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="domain-filter" className="text-sm font-medium text-gray-700">In Domain:</label>
          <select id="domain-filter" value={selectedDomainFilter} onChange={(e) => setSelectedDomainFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="os-filter" className="text-sm font-medium text-gray-700">OS:</label>
          <select id="os-filter" value={selectedOsFilter} onChange={(e) => setSelectedOsFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableOsOptions.map((os) => (<option key={os} value={os}>{os}</option>))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="office-filter" className="text-sm font-medium text-gray-700">Office:</label>
          <select id="office-filter" value={selectedOfficeFilter} onChange={(e) => setSelectedOfficeFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableOfficeOptions.map((office) => (<option key={office} value={office}>{office}</option>))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pc-type-filter" className="text-sm font-medium text-gray-700">Type:</label>
          <select id="pc-type-filter" value={selectedTypeFilter} onChange={(e) => setSelectedTypeFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            <option value="Workstation">Workstation</option>
            <option value="Server">Server</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pc-usage-filter" className="text-sm font-medium text-gray-700">Usage:</label>
          <select id="pc-usage-filter" value={selectedUsageFilter} onChange={(e) => setSelectedUsageFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableUsageOptions.map((usage) => (<option key={usage} value={usage}>{usage}</option>))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pc-model-filter" className="text-sm font-medium text-gray-700">Model:</label>
          <select id="pc-model-filter" value={selectedModelFilter} onChange={(e) => setSelectedModelFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableModelOptions.map((model) => (<option key={model} value={model}>{model}</option>))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
          <label htmlFor="pc-rack-filter" className="text-sm font-medium text-gray-700">Rack:</label>
          <select id="pc-rack-filter" value={selectedRackFilter} onChange={(e) => setSelectedRackFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="all">All</option>
            {availableRackOptions.map((rackNameWithLocation) => (<option key={rackNameWithLocation} value={rackNameWithLocation}>{rackNameWithLocation}</option>))}
          </select>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <div className="flex justify-center items-center p-3 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 rounded-t-lg" onClick={() => setIsAddPcFormExpanded(!isAddPcFormExpanded)}>
            <h3 className="text-xl font-bold text-indigo-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> {editingPc ? "Edit PC" : "Add New PC"}
            </h3>
            {isAddPcFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`collapsible-content ${isAddPcFormExpanded ? "expanded" : ""}`}>
            <form onSubmit={handlePcFormSubmit} className="p-5 space-y-3 border border-gray-300 rounded-b-lg shadow-md bg-gray-50">
              <input type="text" placeholder="PC Name" value={pcFormName} onChange={(e) => setPcFormName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
              <input type="text" placeholder="IP Address" value={pcFormIp} onChange={(e) => setPcFormIp(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Username" value={pcFormUsername} onChange={(e) => setPcFormUsername(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Serial Number" value={pcFormSerialNumber} onChange={(e) => setPcFormSerialNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <textarea placeholder="PC Specification (e.g., CPU, RAM, GPU)" value={pcFormSpecification} onChange={(e) => setPcFormSpecification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
              <input type="text" placeholder="Monitor Model(s)" value={pcFormMonitorModel} onChange={(e) => setPcFormMonitorModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Disk Info (e.g., 1x 512GB NVMe, 2x 1TB SSD)" value={pcFormDiskInfo} onChange={(e) => setPcFormDiskInfo(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input id="pc-in-domain" type="checkbox" checked={pcFormInDomain} onChange={(e) => setPcFormInDomain(e.target.checked)} className="h-4 w-4 text-blue-600" />
                  <label htmlFor="pc-in-domain" className="ml-2 text-sm">In Domain</label>
                </div>
                <div className="flex items-center">
                  <input id="pc-multi-port" type="checkbox" checked={pcFormMultiPort} onChange={(e) => setPcFormMultiPort(e.target.checked)} className="h-4 w-4 text-blue-600" />
                  <label htmlFor="pc-multi-port" className="ml-2 text-sm">Multi-Port PC</label>
                </div>
              </div>
              <select value={pcFormType} onChange={(e) => {setPcFormType(e.target.value); if (e.target.value === "Workstation") {setPcFormRackId(""); setPcFormRowInRack(""); setPcFormUnitsOccupied(1);}}} className="w-full p-2 border border-gray-300 rounded-md" required>
                <option value="Workstation">Workstation</option>
                <option value="Server">Server</option>
              </select>
              {pcFormType === "Server" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Columns size={20} className="text-gray-500" />
                    <select value={pcFormRackId} onChange={(e) => setPcFormRackId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
                      <option value="">-- Select Rack --</option>
                      {sortedRacks.map((rack) => (<option key={rack.id} value={String(rack.id)}>{rack.name} ({rack.location_name})</option>))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Server size={20} className="text-gray-500" />
                    <input type="number" placeholder="Starting Row in Rack" value={pcFormRowInRack} onChange={(e) => setPcFormRowInRack(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                  </div>
                  <div className="flex items-center space-x-2">
                    <HardDrive size={20} className="text-gray-500" />
                    <input type="number" placeholder="Units Occupied" value={pcFormUnitsOccupied} onChange={(e) => setPcFormUnitsOccupied(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                  </div>
                </>
              )}
              <input type="text" placeholder="OS" value={pcFormOs} onChange={(e) => setPcFormOs(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Model" value={pcFormModel} onChange={(e) => setPcFormModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <input type="text" placeholder="Office" value={pcFormOffice} onChange={(e) => setPcFormOffice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <select value={pcFormUsage} onChange={handleUsageChange} className="w-full p-2 border border-gray-300 rounded-md">
                <option value="">-- Select Usage (Optional) --</option>
                {initialUsageOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
                <option value="Other">Other...</option>
              </select>
              {showCustomUsageInput && (
                <input type="text" placeholder="Enter custom usage" value={customUsageValue} onChange={(e) => setCustomUsageValue(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              )}
              <textarea placeholder="Description" value={pcFormDesc} onChange={(e) => setPcFormDesc(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
              <div className="flex space-x-3 justify-end">
                {editingPc && (<button type="button" onClick={() => {setEditingPc(null); setIsAddPcFormExpanded(false);}} className="px-4 py-2 bg-gray-300 rounded-md">Cancel Edit</button>)}
                <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">{editingPc ? "Update PC" : "Add PC"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredPcs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPcs.map((pc) => (
            <div key={pc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 p-5">
              <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                {pc.type === "Server" ? <Server size={20} className="text-indigo-500 mr-2" /> : <Laptop size={20} className="text-indigo-500 mr-2" />} {pc.name}
              </h4>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Router size={16} className="text-gray-500 mr-2" /> IP: {pc.ip_address || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><User size={16} className="text-gray-500 mr-2" /> Username: {pc.username || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Fingerprint size={16} className="text-gray-500 mr-2" /> S/N: {pc.serial_number || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Monitor size={16} className="text-gray-500 mr-2" /> Monitor(s): {pc.monitor_model || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Database size={16} className="text-gray-500 mr-2" /> Disk(s): {pc.disk_info || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><ClipboardList size={16} className="text-gray-500 mr-2" /> Specs: {pc.pc_specification || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">{pc.in_domain ? <ToggleRight size={16} className="text-green-500 mr-2" /> : <ToggleLeft size={16} className="text-red-500 mr-2" />} In Domain: {pc.in_domain ? "Yes" : "No"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">{pc.multi_port ? <Link size={16} className="text-blue-500 mr-2" /> : <Info size={16} className="text-gray-500 mr-2" />} Multi-Port: {pc.multi_port ? "Yes" : "No"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Cpu size={16} className="text-gray-500 mr-2" /> OS: {pc.operating_system || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Tag size={16} className="text-gray-500 mr-2" /> Model: {pc.model || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Building2 size={16} className="text-gray-500 mr-2" /> Office: {pc.office || "N/A"}</p>
              <p className="text-sm text-gray-700 mb-1 flex items-center"><Activity size={16} className="text-gray-500 mr-2" /> Usage: {pc.usage || "N/A"}</p>
              {pc.type === "Server" && (
                <>
                  <p className="text-sm text-gray-700 mb-1 flex items-center"><Columns size={16} className="text-gray-500 mr-2" /> Rack: {pc.rack_name || "N/A"}</p>
                  <p className="text-sm text-gray-700 mb-1 flex items-center"><Server size={16} className="text-gray-500 mr-2" /> Starting Row: {pc.row_in_rack || "N/A"}</p>
                  <p className="text-sm text-gray-700 mb-1 flex items-center"><HardDrive size={16} className="text-gray-500 mr-2" /> Units: {pc.units_occupied || "N/A"}U</p>
                </>
              )}
              <p className="text-sm text-gray-700 mb-3 flex items-start"><Info size={16} className="text-gray-500 mr-2 flex-shrink-0 mt-0.5" /> Description: {pc.description || "No description"}</p>
              {canEdit && (
                <div className="flex justify-end space-x-2">
                  <button onClick={() => handleEdit(pc)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">Edit</button>
                  <button onClick={() => onDeleteEntity("pcs", pc.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-8">
          {searchTerm ? "No PCs match your search and filter criteria." : "No PCs added yet."}
        </p>
      )}
    </div>
  );
}

export default PcList;
