// /frontend/src/components/connection/ConnectionDetailsStep.js
// UPDATED: Reordered sections to be more logical (PC/Wall cable -> Hops -> Switch)
// and added the missing Wall Point cable detail fields.

import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  Cable,
  CircleDot,
  MapPin,
  Palette,
  Server,
  Split,
  Tag,
  Wifi,
  Plus,
  Trash2,
  Laptop,
} from "lucide-react";

// Helper function to format the display name for rack-mounted devices
const formatDeviceDisplay = (device) => {
    let parts = [];
    if (device.name) parts.push(device.name);
    if (device.rack_name) parts.push(`(Rack: ${device.rack_name})`);
    if (device.row_in_rack) parts.push(`(Row: ${device.row_in_rack})`);
    return parts.join(' ') || 'Unnamed Device';
};

// Component for the visual connection path
const PathVisualizer = ({ segments }) => (
  <div className="flex items-center justify-center flex-wrap bg-gray-100 p-4 rounded-lg my-6 border border-gray-200">
    {segments.map((segment, index) => (
      <React.Fragment key={index}>
        <div className="flex flex-col items-center text-center mx-2 md:mx-4 transition-transform duration-300 hover:scale-110">
          <div className="p-3 bg-white rounded-full shadow-md border">{segment.icon}</div>
          <span className="text-xs font-semibold mt-2 text-gray-600">{segment.label}</span>
        </div>
        {index < segments.length - 1 && (
          <div className="flex-1 min-w-[30px] md:min-w-[50px] h-0.5 bg-gray-300"></div>
        )}
      </React.Fragment>
    ))}
  </div>
);


export const ConnectionDetailsStep = ({ formState, formSetters, handlers }) => {
  const {
    pcId,
    switchId,
    switchPort,
    isSwitchPortUp,
    hops,
    cableColor,
    cableLabel,
    wallPointLabel,
    wallPointCableColor,
    wallPointCableLabel,
    availablePcsForConnection = [],
    switches = [],
    patchPanels = [],
    locations = [],
    cableColorOptions = [],
    selectedLocationIdForSwitch,
  } = formState || {};

  const {
    setSwitchId,
    setSwitchPort,
    setIsSwitchPortUp,
    setCableColor,
    setCableLabel,
    setWallPointLabel,
    setWallPointCableColor,
    setWallPointCableLabel,
    setCableColorOptions,
    setSelectedLocationIdForSwitch,
  } = formSetters || {};

  const { handleHopChange, addHop, removeHop, handleSubmit, handleCancelEdit } = handlers || {};

  const [showAddColorInput, setShowAddColorInput] = useState(false);
  const [newCustomColor, setNewCustomColor] = useState("");

  const selectedPc = useMemo(() => availablePcsForConnection.find(p => String(p.id) === String(pcId)), [pcId, availablePcsForConnection]);
  const selectedSwitch = useMemo(() => switches.find(s => String(s.id) === String(switchId)), [switchId, switches]);

  const filteredSwitches = useMemo(() => {
    if (!selectedLocationIdForSwitch) {
        return switches;
    }
    return switches.filter(s => String(s.location_id) === String(selectedLocationIdForSwitch));
  }, [switches, selectedLocationIdForSwitch]);

  const handleColorChange = (e, setter) => {
    const value = e.target.value;
    if (value === 'add_new') {
      setShowAddColorInput(true);
    } else {
      setter(value);
      setShowAddColorInput(false);
    }
  };

  const handleAddCustomColor = (setter) => {
    if (newCustomColor && !cableColorOptions.includes(newCustomColor)) {
      const updatedOptions = [...cableColorOptions, newCustomColor];
      if(setCableColorOptions) setCableColorOptions(updatedOptions);
      if(setter) setter(newCustomColor);
    }
    setShowAddColorInput(false);
    setNewCustomColor("");
  };
  
  const pathSegments = useMemo(() => {
    const segments = [];
    if (selectedPc) {
        segments.push({ icon: <Laptop size={24} className="text-indigo-500" />, label: selectedPc.name });
    }
    hops.forEach(hop => {
        const pp = patchPanels.find(p => String(p.id) === String(hop.patch_panel_id));
        segments.push({ icon: <Split size={24} className="text-gray-500" />, label: pp ? pp.name : 'Patch Panel' });
    });
    if (selectedSwitch) {
        segments.push({ icon: <Server size={24} className="text-red-500" />, label: selectedSwitch.name });
    }
    return segments;
  }, [selectedPc, selectedSwitch, hops, patchPanels]);


  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-xl font-bold text-gray-800 mb-4">Connection Details</h3>
      
      <PathVisualizer segments={pathSegments} />

      {/* REORDERED: Wall Point & Main Cable Details are now first */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
        <div>
          <h4 className="font-semibold mb-2">Wall Point & PC Cable Details</h4>
          <input type="text" placeholder="Wall Point Label (Optional)" value={wallPointLabel} onChange={(e) => setWallPointLabel(e.target.value)} className="w-full p-2 border rounded-md mb-2" />
          <select value={wallPointCableColor} onChange={(e) => handleColorChange(e, setWallPointCableColor)} className="w-full p-2 border rounded-md mb-2">
            <option value="">-- Select Wall Cable Color --</option>
            {cableColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="add_new">Add New Color...</option>
          </select>
          {showAddColorInput && <input type="text" value={newCustomColor} onChange={(e) => setNewCustomColor(e.target.value)} onBlur={() => handleAddCustomColor(setWallPointCableColor)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomColor(setWallPointCableColor))} className="w-full p-2 border rounded-md mb-2" />}
          <input type="text" placeholder="Wall Cable Label (Optional)" value={wallPointCableLabel} onChange={(e) => setWallPointCableLabel(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div>
          <h4 className="font-semibold mb-2">Main Cable Details (PC to first hop)</h4>
          <select value={cableColor} onChange={(e) => handleColorChange(e, setCableColor)} className="w-full p-2 border rounded-md mb-2">
            <option value="">-- Select Main Cable Color --</option>
            {cableColorOptions.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="add_new">Add New Color...</option>
          </select>
          {showAddColorInput && <input type="text" value={newCustomColor} onChange={(e) => setNewCustomColor(e.target.value)} onBlur={() => handleAddCustomColor(setCableColor)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomColor(setCableColor))} className="w-full p-2 border rounded-md mb-2" />}
          <input type="text" placeholder="Main Cable Label (Optional)" value={cableLabel} onChange={(e) => setCableLabel(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
      </div>

      {/* Hops Section */}
      <div className="space-y-4 mt-6 pt-6 border-t">
        <h4 className="font-semibold">Intermediate Hops (Patch Panels)</h4>
        {hops && hops.map((hop, index) => {
          const filteredPatchPanels = patchPanels.filter(
            (pp) => String(pp.location_id) === String(hop.location_id)
          );
          return (
            <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-500 flex-shrink-0">{index + 1}</span>
                <select value={hop.location_id || ""} onChange={(e) => handleHopChange(index, "location_id", e.target.value)} className="p-2 border rounded-md flex-grow min-w-[150px]">
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
                <select value={hop.patch_panel_id || ""} onChange={(e) => handleHopChange(index, "patch_panel_id", e.target.value)} className="p-2 border rounded-md flex-grow min-w-[150px]" disabled={!hop.location_id}>
                  <option value="">-- Select Patch Panel --</option>
                  {filteredPatchPanels.map(pp => <option key={pp.id} value={pp.id}>{formatDeviceDisplay(pp)}</option>)}
                </select>
                <input type="text" placeholder="Port" value={hop.patch_panel_port || ""} onChange={(e) => handleHopChange(index, "patch_panel_port", e.target.value)} className="p-2 border rounded-md w-24" />
                <button type="button" onClick={() => removeHop(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
              </div>
              <div className="flex items-center gap-2 pl-8 flex-wrap">
                <input
                  type="text"
                  placeholder="Hop Cable Color"
                  value={hop.cable_color || ""}
                  onChange={(e) => handleHopChange(index, "cable_color", e.target.value)}
                  className="p-2 border rounded-md flex-grow min-w-[150px]"
                />
                <input
                  type="text"
                  placeholder="Hop Cable Label"
                  value={hop.cable_label || ""}
                  onChange={(e) => handleHopChange(index, "cable_label", e.target.value)}
                  className="p-2 border rounded-md flex-grow min-w-[150px]"
                />
              </div>
            </div>
          );
        })}
        <button type="button" onClick={addHop} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
          <Plus size={16} className="mr-1" /> Add Hop
        </button>
      </div>

      {/* Switch Connection */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold mb-2">Final Destination (Switch Connection)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <select value={selectedLocationIdForSwitch || ""} onChange={(e) => setSelectedLocationIdForSwitch(e.target.value)} className="w-full p-2 border rounded-md mb-2">
                    <option value="">-- Filter by Switch Location (Optional) --</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
            </div>
            <div>
                <select value={switchId} onChange={(e) => setSwitchId(e.target.value)} className="w-full p-2 border rounded-md mb-2">
                    <option value="">-- Select Switch --</option>
                    {filteredSwitches.map(s => <option key={s.id} value={s.id}>{formatDeviceDisplay(s)}</option>)}
                </select>
            </div>
            <div className="md:col-span-2">
                <input type="text" placeholder="Switch Port" value={switchPort} onChange={(e) => setSwitchPort(e.target.value)} className="w-full p-2 border rounded-md" />
            </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        {formState.editingConnection && (
          <button type="button" onClick={handleCancelEdit} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold">
            Cancel Edit
          </button>
        )}
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700">
          {formState.editingConnection ? "Update Connection" : "Add Connection"}
        </button>
      </div>
    </form>
  );
};
