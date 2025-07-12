// frontend/src/components/SwitchList.js
// REFACTORED: Logic separated into custom hooks.
// UPDATED: All form fields for adding and editing a Switch have been fully restored.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import SearchBar from "./SearchBar";
import { Server, Router as IpIcon, MapPin, Info, PlusCircle, ChevronDown, ChevronUp, Columns, HardDrive, Link as LinkIcon, Filter, Network, Cpu, Activity } from "lucide-react";

// --- Custom Hooks for Logic Abstraction ---

const useSwitchFilters = (switches, racks, filters) => {
  const [filteredSwitches, setFilteredSwitches] = useState([]);

  useEffect(() => {
    const { searchTerm, location, rack, model, usage } = filters;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filtered = switches.filter((sw) => {
      const switchRackName = sw.rack ? `${sw.rack.name} (${sw.rack.location_name || ''})` : "";
      
      const matchesSearch = lowerCaseSearchTerm === '' || [
        sw.name, sw.ip_address, sw.location_name, sw.rack_name, 
        sw.model, sw.usage, sw.description, switchRackName, sw.source_port
      ].some(field => (field || '').toString().toLowerCase().includes(lowerCaseSearchTerm));

      const locationNameWithDoor = `${sw.location_name || ''}${sw.location?.door_number ? ` (Door: ${sw.location.door_number})` : ''}`;
      const matchesLocation = location === "all" || locationNameWithDoor === location;
      const matchesRack = rack === "all" || switchRackName === rack;
      const matchesModel = model === "all" || sw.model === model;
      const matchesUsage = usage === "all" || sw.usage === usage;

      return matchesSearch && matchesLocation && matchesRack && matchesModel && matchesUsage;
    });

    setFilteredSwitches(filtered);
  }, [switches, racks, filters]);

  return filteredSwitches;
};

const useSwitchForm = (editingSwitch, onFormClose) => {
  const initialUsageOptions = ["Production", "Development", "Test", "Staging", "Backup", "Monitoring"];
  const initialFormState = {
    name: "", ip_address: "", location_id: "", row_in_rack: "", rack_id: "", 
    units_occupied: 1, total_ports: 24, source_port: "", model: "", 
    description: "", usage: ""
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [customUsage, setCustomUsage] = useState({ show: false, value: "" });

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setCustomUsage({ show: false, value: "" });
    if(onFormClose) onFormClose();
  }, [onFormClose]);
  
  useEffect(() => {
    if (editingSwitch) {
      // Ensure all fields from editingSwitch are copied, falling back to initial state for any missing ones
      const editingData = { ...initialFormState, ...editingSwitch };
      setFormData({
        ...editingData,
        location_id: String(editingData.location_id || ""),
        rack_id: String(editingData.rack_id || "")
      });

      const usage = editingSwitch.usage || "";
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
  }, [editingSwitch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleUsageChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, usage: value }));
    setCustomUsage(prev => ({ ...prev, show: value === 'Other', value: value === 'Other' ? prev.value : '' }));
  };

  const handleCustomUsageChange = (e) => {
    setCustomUsage(prev => ({ ...prev, value: e.target.value }));
  };

  return { formData, handleInputChange, handleUsageChange, customUsage, handleCustomUsageChange, resetForm };
};

// --- Main Component ---

function SwitchList({ switches, onAddEntity, onUpdateEntity, onDeleteEntity, onShowPortStatus, locations, racks, onViewDiagram, user }) {
  const [editingSwitch, setEditingSwitch] = useState(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: "", location: "all", rack: "all", model: "all", usage: "all" });

  const filteredSwitches = useSwitchFilters(switches, racks, filters);
  const { formData, handleInputChange, handleUsageChange, customUsage, handleCustomUsageChange, resetForm } = useSwitchForm(editingSwitch, () => {
    setEditingSwitch(null);
    setIsFormExpanded(false);
  });
  
  const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({...prev, [name]: value}));
  };
  
  const handleEditClick = (sw) => {
    setEditingSwitch(sw);
    setIsFormExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const finalData = {
        ...formData,
        usage: formData.usage === 'Other' ? customUsage.value : formData.usage,
        location_id: parseInt(formData.location_id),
        rack_id: formData.rack_id ? parseInt(formData.rack_id) : null,
        row_in_rack: formData.rack_id ? parseInt(formData.row_in_rack) : null,
        units_occupied: formData.rack_id ? parseInt(formData.units_occupied) : 1,
        total_ports: parseInt(formData.total_ports),
    };
    if (editingSwitch) {
      onUpdateEntity("switches", editingSwitch.id, finalData);
    } else {
      onAddEntity("switches", finalData);
    }
    resetForm();
  };
  
  const availableOptions = useMemo(() => ({
    location: [...new Set(locations.map(loc => `${loc.name}${loc.door_number ? ` (Door: ${loc.door_number})` : ""}`))].sort(),
    rack: [...new Set(racks.map(rack => `${rack.name} (${rack.location_name || ''})`))].sort(),
    model: [...new Set(switches.map(s => s.model).filter(Boolean))].sort(),
    usage: [...new Set(["Production", "Development", "Test", "Staging", "Backup", "Monitoring", ...switches.map(s => s.usage).filter(Boolean)])].sort(),
  }), [switches, locations, racks]);
  
  const sortedLocations = useMemo(() => [...locations].sort((a,b) => a.name.localeCompare(b.name)), [locations]);
  const availableRacks = useMemo(() => {
    if (!formData.location_id) return [];
    return racks.filter(r => String(r.location_id) === String(formData.location_id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [racks, formData.location_id]);

  return (
    <div className="space-y-6">
      <SearchBar searchTerm={filters.searchTerm} onSearchChange={(val) => setFilters(prev => ({...prev, searchTerm: val}))} />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-wrap gap-4 items-center">
        <Filter size={20} className="text-gray-600 flex-shrink-0" />
        <span className="font-semibold text-gray-700 mr-2">Filter By:</span>
        {Object.keys(availableOptions).map(key => (
          <select key={key} name={key} value={filters[key]} onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
            <option value="all">{`${key.charAt(0).toUpperCase() + key.slice(1)}: All`}</option>
            {availableOptions[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ))}
      </div>

      {canEdit && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full md:w-2/3">
          <div className="flex justify-center items-center p-3 cursor-pointer bg-red-50 hover:bg-red-100" onClick={() => setIsFormExpanded(!isFormExpanded)}>
            <h3 className="text-xl font-bold text-red-700 flex items-center"><PlusCircle size={20} className="mr-2" /> {editingSwitch ? "Edit Switch" : "Add New Switch"}</h3>
            {isFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          <div className={`collapsible-content ${isFormExpanded ? "expanded" : ""}`}>
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 border-t bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" placeholder="Switch Name *" value={formData.name || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" required />
                <input type="text" name="ip_address" placeholder="IP Address" value={formData.ip_address || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <select name="location_id" value={formData.location_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" required>
                  <option value="">-- Select Location * --</option>
                  {sortedLocations.map((loc) => (<option key={loc.id} value={loc.id}>{loc.name} {loc.door_number && `(Door: ${loc.door_number})`}</option>))}
                </select>
                <div className="p-3 border rounded-md bg-gray-100 space-y-2 md:col-span-2">
                  <h4 className="font-semibold text-gray-600">Rack Information (Optional)</h4>
                  <select name="rack_id" value={formData.rack_id || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" disabled={!formData.location_id}>
                    <option value="">-- Select Rack --</option>
                    {availableRacks.map((rack) => (<option key={rack.id} value={rack.id}>{rack.name}</option>))}
                  </select>
                  {formData.rack_id && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <input type="number" name="row_in_rack" placeholder="Starting Row" value={formData.row_in_rack || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" min="1" required />
                      <input type="number" name="units_occupied" placeholder="Units Occupied" value={formData.units_occupied || 1} onChange={handleInputChange} className="w-full p-2 border rounded-md" min="1" required />
                    </div>
                  )}
                </div>
                <input type="number" name="total_ports" placeholder="Total Ports" value={formData.total_ports || 24} onChange={handleInputChange} className="w-full p-2 border rounded-md" min="1" required />
                <input type="text" name="source_port" placeholder="Source Port" value={formData.source_port || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <input type="text" name="model" placeholder="Model" value={formData.model || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
                <select name="usage" value={formData.usage || ''} onChange={handleUsageChange} className="w-full p-2 border rounded-md">
                  <option value="">-- Select Usage --</option>
                  {availableOptions.usage.map(o => (<option key={o} value={o}>{o}</option>))}<option value="Other">Other...</option>
                </select>
                {customUsage.show && (<input type="text" name="custom_usage" placeholder="Enter custom usage" value={customUsage.value} onChange={handleCustomUsageChange} className="w-full p-2 border rounded-md md:col-span-2" />)}
                <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full p-2 border rounded-md md:col-span-2" rows="3"></textarea>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">{editingSwitch ? "Update Switch" : "Add Switch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSwitches.map((_switch) => (
          <div key={_switch.id} className="bg-white rounded-lg shadow-md hover:shadow-lg p-5 border">
            <h4 className="text-xl font-semibold flex items-center mb-2"><Server size={20} className="mr-2 text-red-500" />{_switch.name}</h4>
            <p className="text-sm text-gray-600 flex items-center"><IpIcon size={14} className="mr-2"/>IP: {_switch.ip_address || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><MapPin size={14} className="mr-2"/>{_switch.location_name || "N/A"}{_switch.location?.door_number && ` (Door: ${_switch.location.door_number})`}</p>
            <p className="text-sm text-gray-600 flex items-center"><Cpu size={14} className="mr-2"/>Model: {_switch.model || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><Activity size={14} className="mr-2"/>Usage: {_switch.usage || "N/A"}</p>
            <p className="text-sm text-gray-600 flex items-center"><LinkIcon size={14} className="mr-2"/>Source Port: {_switch.source_port || "N/A"}</p>
            {_switch.rack_name && (
                <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                    <p className="flex items-center"><Columns size={14} className="mr-2"/>Rack: {_switch.rack_name || "N/A"}</p>
                    <p className="flex items-center"><Server size={14} className="mr-2"/>Row: {_switch.row_in_rack || "N/A"}</p>
                    <p className="flex items-center"><HardDrive size={14} className="mr-2"/>Units: {_switch.units_occupied || "N/A"}U</p>
                </div>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => onShowPortStatus("switches", _switch.id)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">Ports</button>
              <button onClick={() => onViewDiagram(_switch)} className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md flex items-center"><Network size={16} className="mr-1"/>Diagram</button>
              {canEdit && (
                <>
                  <button onClick={() => handleEditClick(_switch)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Edit</button>
                  <button onClick={() => onDeleteEntity("switches", _switch.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {filteredSwitches.length === 0 && <p className="text-center text-gray-500 mt-8">No switches match your criteria.</p>}
    </div>
  );
}

export default SwitchList;
