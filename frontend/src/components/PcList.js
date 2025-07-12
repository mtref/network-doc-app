// frontend/src/components/PcList.js
// REFACTORED: Logic is separated into custom hooks.
// UPDATED: Added missing 'useCallback' import from React.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import SearchBar from "./SearchBar";
import { Laptop, Server, Router as IpIcon, Info, PlusCircle, ChevronDown, ChevronUp, User, HardDrive, ToggleRight, ToggleLeft, Columns, Filter, Cpu, Building2, Tag, Activity, Fingerprint, Monitor, Database, ClipboardList, Link as LinkIcon } from "lucide-react";

// --- Custom Hooks for Logic Abstraction ---

const usePcFilters = (pcs, racks, filters) => {
  const [filteredPcs, setFilteredPcs] = useState([]);

  useEffect(() => {
    const { searchTerm, domain, os, office, type, usage, model, rack } = filters;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filtered = pcs.filter((pc) => {
      const pcRackNameWithLocation = pc.rack ? `${pc.rack.name} (${pc.rack.location_name || ''})` : "";
      
      const matchesSearch = lowerCaseSearchTerm === '' || [
        pc.name, pc.ip_address, pc.username, pc.operating_system,
        pc.model, pc.office, pc.description, pc.type, pc.usage,
        pcRackNameWithLocation, pc.serial_number, pc.pc_specification,
        pc.monitor_model, pc.disk_info
      ].some(field => (field || '').toLowerCase().includes(lowerCaseSearchTerm));

      const matchesDomain = domain === "all" || String(pc.in_domain) === domain;
      const matchesOs = os === "all" || pc.operating_system === os;
      const matchesOffice = office === "all" || pc.office === office;
      const matchesType = type === "all" || pc.type === type;
      const matchesUsage = usage === "all" || pc.usage === usage;
      const matchesModel = model === "all" || pc.model === model;
      const matchesRack = rack === "all" || pcRackNameWithLocation.trim() === rack;

      return matchesSearch && matchesDomain && matchesOs && matchesOffice && matchesType && matchesUsage && matchesModel && matchesRack;
    });

    setFilteredPcs(filtered);
  }, [pcs, racks, filters]);

  return filteredPcs;
};

const usePcForm = (editingPc, onFormClose) => {
  const initialUsageOptions = ["Production", "Development", "Test", "Staging", "Backup", "Monitoring"];
  const initialFormState = {
    name: "", ip_address: "", username: "", in_domain: false,
    operating_system: "", model: "", office: "", description: "",
    multi_port: false, type: "Workstation", usage: "", row_in_rack: "",
    rack_id: "", units_occupied: 1, serial_number: "", pc_specification: "",
    monitor_model: "", disk_info: ""
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [customUsage, setCustomUsage] = useState({ show: false, value: "" });

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setCustomUsage({ show: false, value: "" });
    onFormClose();
  }, [onFormClose]);
  
  useEffect(() => {
    if (editingPc) {
      setFormData({ ...initialFormState, ...editingPc });
      const usage = editingPc.usage || "";
      if (!initialUsageOptions.includes(usage) && usage) {
        setFormData(prev => ({ ...prev, usage: "Other" }));
        setCustomUsage({ show: true, value: usage });
      } else {
        setCustomUsage({ show: false, value: "" });
      }
    } else {
      setFormData(initialFormState);
      setCustomUsage({ show: false, value: "" });
    }
  }, [editingPc]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleUsageChange = (e) => {
    const { value } = e.target;
    handleInputChange(e);
    setCustomUsage(prev => ({ ...prev, show: value === 'Other', value: value === 'Other' ? prev.value : '' }));
  };

  const handleCustomUsageChange = (e) => {
    setCustomUsage(prev => ({ ...prev, value: e.target.value }));
  };

  return { formData, handleInputChange, handleUsageChange, customUsage, handleCustomUsageChange, resetForm };
};


// --- Main Component ---

function PcList({ pcs, onAddEntity, onUpdateEntity, onDeleteEntity, racks, user }) {
  const [editingPc, setEditingPc] = useState(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "", domain: "all", os: "all", office: "all", 
    type: "all", usage: "all", model: "all", rack: "all"
  });

  const filteredPcs = usePcFilters(pcs, racks, filters);
  const { formData, handleInputChange, handleUsageChange, customUsage, handleCustomUsageChange, resetForm } = usePcForm(editingPc, () => {
    setEditingPc(null);
    setIsFormExpanded(false);
  });
  
  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const handleEditClick = (pc) => {
    setEditingPc(pc);
    setIsFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      usage: formData.usage === 'Other' ? customUsage.value : formData.usage,
      rack_id: formData.type === "Server" && formData.rack_id ? parseInt(formData.rack_id) : null,
      row_in_rack: formData.type === "Server" && formData.row_in_rack ? parseInt(formData.row_in_rack) : null,
      units_occupied: formData.type === "Server" && formData.units_occupied ? parseInt(formData.units_occupied) : 1,
    };
    
    if (editingPc) {
      onUpdateEntity("pcs", editingPc.id, finalData);
    } else {
      onAddEntity("pcs", finalData);
    }
    resetForm();
  };

  const availableOptions = useMemo(() => ({
    os: [...new Set(pcs.map((pc) => pc.operating_system).filter(Boolean))].sort(),
    office: [...new Set(pcs.map((pc) => pc.office).filter(Boolean))].sort(),
    model: [...new Set(pcs.map((pc) => pc.model).filter(Boolean))].sort(),
    usage: [...new Set(["Production", "Development", "Test", "Staging", "Backup", "Monitoring", ...pcs.map(pc => pc.usage).filter(Boolean)])].sort(),
    rack: [...new Set(racks.map((rack) => `${rack.name} (${rack.location_name || ''})`))].sort(),
  }), [pcs, racks]);

  const sortedRacks = useMemo(() => [...racks].sort((a,b) => a.name.localeCompare(b.name)), [racks]);

  return (
    <div className="space-y-6">
      <SearchBar searchTerm={filters.searchTerm} onSearchChange={(val) => setFilters(prev => ({...prev, searchTerm: val}))} />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>
        <select name="domain" value={filters.domain} onChange={handleFilterChange} className="p-2 border rounded-md text-sm"><option value="all">Domain: All</option><option value="true">Yes</option><option value="false">No</option></select>
        <select name="type" value={filters.type} onChange={handleFilterChange} className="p-2 border rounded-md text-sm"><option value="all">Type: All</option><option value="Workstation">Workstation</option><option value="Server">Server</option></select>
        {Object.keys(availableOptions).map(key => (
          <select key={key} name={key} value={filters[key]} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="all">{`${key.charAt(0).toUpperCase() + key.slice(1)}: All`}</option>
            {availableOptions[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ))}
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full md:w-2/3">
          <div className="flex justify-center items-center p-3 cursor-pointer bg-indigo-50 hover:bg-indigo-100" onClick={() => setIsFormExpanded(!isFormExpanded)}>
            <h3 className="text-xl font-bold text-indigo-700 flex items-center"><PlusCircle size={20} className="mr-2" /> {editingPc ? "Edit PC" : "Add New PC"}</h3>
            {isFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`collapsible-content ${isFormExpanded ? "expanded" : ""}`}>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 border-t bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="PC Name *" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                <input type="text" name="ip_address" placeholder="IP Address" value={formData.ip_address || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="username" placeholder="Username" value={formData.username || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="serial_number" placeholder="Serial Number" value={formData.serial_number || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="operating_system" placeholder="Operating System" value={formData.operating_system || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="model" placeholder="Model" value={formData.model || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="office" placeholder="Office Location" value={formData.office || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <select name="usage" value={formData.usage || ''} onChange={handleUsageChange} className="w-full p-2 border rounded-md"><option value="">-- Select Usage --</option>{availableOptions.usage.map(o => (<option key={o} value={o}>{o}</option>))}<option value="Other">Other...</option></select>
                {customUsage.show && (<input type="text" name="custom_usage" placeholder="Enter custom usage" value={customUsage.value} onChange={handleCustomUsageChange} className="w-full p-2 border rounded-md md:col-span-2" />)}
                <textarea name="pc_specification" placeholder="PC Specification (e.g., CPU, RAM, GPU)" value={formData.pc_specification || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" rows="3"></textarea>
                <input type="text" name="monitor_model" placeholder="Monitor Model(s)" value={formData.monitor_model || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" />
                <input type="text" name="disk_info" placeholder="Disk Info (e.g., 1x 512GB NVMe)" value={formData.disk_info || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" />
                <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" rows="3"></textarea>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center"><input id="in_domain" name="in_domain" type="checkbox" checked={formData.in_domain || false} onChange={handleInputChange} className="h-4 w-4" /><label htmlFor="in_domain" className="ml-2 text-sm">In Domain</label></div>
                <div className="flex items-center"><input id="multi_port" name="multi_port" type="checkbox" checked={formData.multi_port || false} onChange={handleInputChange} className="h-4 w-4" /><label htmlFor="multi_port" className="ml-2 text-sm">Multi-Port PC</label></div>
              </div>
              <select name="type" value={formData.type || 'Workstation'} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                <option value="Workstation">Workstation</option><option value="Server">Server</option>
              </select>
              {formData.type === "Server" && (
                <div className="p-3 border rounded-md bg-gray-100 space-y-2 mt-2">
                  <h4 className="font-semibold text-gray-600">Rack Information (Required for Servers)</h4>
                  <select name="rack_id" value={formData.rack_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" required><option value="">-- Select Rack --</option>{sortedRacks.map((rack) => (<option key={rack.id} value={rack.id}>{`${rack.name} (${rack.location_name})`}</option>))}</select>
                  <input type="number" name="row_in_rack" placeholder="Starting Row" value={formData.row_in_rack || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" min="1" required />
                  <input type="number" name="units_occupied" placeholder="Units Occupied" value={formData.units_occupied || 1} onChange={handleInputChange} className="w-full p-2 border rounded-md" min="1" required />
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">{editingPc ? "Update PC" : "Add PC"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPcs.map((pc) => (
          <div key={pc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg p-5 border">
            <h4 className="text-xl font-semibold flex items-center mb-2">{pc.type === "Server" ? <Server size={20} className="mr-2 text-indigo-500"/> : <Laptop size={20} className="mr-2 text-indigo-500"/>}{pc.name}</h4>
            <p className="text-sm text-gray-600 flex items-center"><IpIcon size={14} className="mr-2"/>{pc.ip_address || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><User size={14} className="mr-2"/>{pc.username || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Fingerprint size={14} className="mr-2"/>S/N: {pc.serial_number || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Monitor size={14} className="mr-2"/>Monitor(s): {pc.monitor_model || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Database size={14} className="mr-2"/>Disk(s): {pc.disk_info || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><ClipboardList size={14} className="mr-2"/>Specs: {pc.pc_specification || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center">{pc.in_domain ? <ToggleRight size={14} className="text-green-500 mr-2"/> : <ToggleLeft size={14} className="text-red-500 mr-2"/>}Domain</p>
            <p className="text-sm text-gray-600 flex items-center">{pc.multi_port ? <LinkIcon size={14} className="text-blue-500 mr-2"/> : <Info size={14} className="text-gray-500 mr-2"/>}Multi-Port</p>
            <p className="text-sm text-gray-600 flex items-center"><Cpu size={14} className="mr-2"/>OS: {pc.operating_system || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Tag size={14} className="mr-2"/>Model: {pc.model || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Building2 size={14} className="mr-2"/>Office: {pc.office || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Activity size={14} className="mr-2"/>Usage: {pc.usage || "N/A"}</p>
            {pc.type === "Server" && (
                <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                    <p className="flex items-center"><Columns size={14} className="mr-2"/>Rack: {pc.rack_name || "N/A"}</p>
                    <p className="flex items-center"><Server size={14} className="mr-2"/>Row: {pc.row_in_rack || "N/A"}</p>
                    <p className="flex items-center"><HardDrive size={14} className="mr-2"/>Units: {pc.units_occupied || "N/A"}U</p>
                </div>
            )}
            {canEdit && (
              <div className="flex justify-end space-x-2 mt-4">
                <button onClick={() => handleEditClick(pc)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Edit</button>
                <button onClick={() => onDeleteEntity("pcs", pc.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filteredPcs.length === 0 && <p className="text-center text-gray-500 mt-8">No PCs match your criteria.</p>}
    </div>
  );
}

export default PcList;
