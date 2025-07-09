// /frontend/src/components/connection/ConnectionDetailsStep.js
import React from "react";
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

// New component for the visual connection path
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

export const ConnectionDetailsStep = ({
  formState,
  formSetters,
  handlers,
  onShowPortStatus,
}) => {
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
    availablePcsForConnection,
    selectedLocationIdForSwitch,
    filteredSwitchesByLocation,
    cableColorOptions,
    showAddColorInput,
    newCustomColor,
    locations,
    patchPanels,
  } = formState;

  const {
    setCurrentStep,
    setSwitchId,
    setSwitchPort,
    setIsSwitchPortUp,
    setSelectedLocationIdForSwitch,
    setCableColor,
    setCableLabel,
    setWallPointLabel,
    setWallPointCableColor,
    setWallPointCableLabel,
    setShowAddColorInput,
    setNewCustomColor,
  } = formSetters;

  const {
    handleHopChange,
    addHop,
    removeHop,
    handleAddCustomColor,
    handleSubmit,
    handleCancelEdit,
    getPortStatusSummary,
  } = handlers;

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const currentPatchPanels = Array.isArray(patchPanels) ? patchPanels : [];
  
  // Build segments for the visualizer
  const pathSegments = [
      { icon: <Laptop size={24} className="text-indigo-500" />, label: 'PC' },
      { icon: <Tag size={24} className="text-gray-500" />, label: 'Wall Point' },
  ];

  hops.forEach((hop, index) => {
      pathSegments.push({ icon: <Split size={24} className="text-green-500" />, label: `Hop ${index + 1}` });
  });

  pathSegments.push({ icon: <Server size={24} className="text-red-500" />, label: 'Switch' });

  return (
    <section className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700 flex items-center">
            <ArrowRight size={24} className="mr-2" /> Step 2: Define Connection Path
        </h2>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300"
        >
          Change PC
        </button>
      </div>
      <div className="mb-6 p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
        <span className="font-semibold text-blue-800">Selected PC:</span>
        <span className="ml-2 font-bold text-blue-900">
          {availablePcsForConnection.find((pc) => String(pc.id) === pcId)?.name || "N/A"}
        </span>
      </div>

      <PathVisualizer segments={pathSegments} />

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Wall Point Details Card */}
        <div className="p-5 border rounded-lg shadow-sm bg-white">
            <h4 className="text-lg font-semibold text-gray-800 col-span-full flex items-center mb-4 border-b pb-2">
                <Tag size={20} className="mr-3 text-gray-500" /> Wall Point & PC Cable
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="wall-point-label" className="block text-sm font-medium text-gray-700 mb-1">Wall Point Label</label>
                    <input id="wall-point-label" type="text" placeholder="e.g., W101-A" value={wallPointLabel} onChange={(e) => setWallPointLabel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="wall-point-cable-color" className="block text-sm font-medium text-gray-700 mb-1">Cable Color</label>
                    <select id="wall-point-cable-color" value={wallPointCableColor} onChange={(e) => setWallPointCableColor(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="">-- Optional --</option>
                        {cableColorOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                </div>
                <div>
                    <label htmlFor="wall-point-cable-label" className="block text-sm font-medium text-gray-700 mb-1">Cable Label</label>
                    <input id="wall-point-cable-label" type="text" placeholder="Optional" value={wallPointCableLabel} onChange={(e) => setWallPointCableLabel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
            </div>
        </div>

        {/* Hops Section Card */}
        <div className="p-5 border rounded-lg shadow-sm bg-white">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <Split size={20} className="mr-3 text-green-500" /> Patch Panel Hops (Infrastructure Cabling)
            </h4>
            <div className="space-y-4">
            {hops.map((hop, index) => {
                const filteredPatchPanelsForThisHop = hop.location_id ? currentPatchPanels.filter((pp) => String(pp.location_id) === hop.location_id) : currentPatchPanels;
                return (
                <div key={index} className="flex flex-col p-4 border rounded-md bg-gray-50 relative">
                    <span className="absolute -top-3 -left-3 bg-green-500 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-sm">{index + 1}</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <select value={hop.location_id} onChange={(e) => handleHopChange(index, "location_id", e.target.value)} className="w-full p-2 border rounded-md text-sm" required>
                                <option value="">-- Select Location --</option>
                                {sortedLocations.map((loc) => (<option key={loc.id} value={String(loc.id)}>{loc.name}</option>))}
                            </select>
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Patch Panel</label>
                            <select value={hop.patch_panel_id} onChange={(e) => handleHopChange(index, "patch_panel_id", e.target.value)} className="w-full p-2 border rounded-md text-sm" required>
                                <option value="">-- Select Patch Panel --</option>
                                {filteredPatchPanelsForThisHop.map((pp) => (<option key={pp.id} value={String(pp.id)}>{pp.name}</option>))}
                            </select>
                            {hop.patch_panel_id && getPortStatusSummary("patch_panels", hop.patch_panel_id) && (
                                <div className="mt-1 text-xs text-gray-600 flex items-center space-x-2">
                                    <span className="flex items-center"><Wifi size={14} className="text-green-500 mr-1" />Connected: {getPortStatusSummary("patch_panels", hop.patch_panel_id).connected}</span>
                                    <span className="flex items-center"><CircleDot size={14} className="text-gray-500 mr-1" />Available: {getPortStatusSummary("patch_panels", hop.patch_panel_id).available}</span>
                                    <button type="button" onClick={() => onShowPortStatus("patch_panels", hop.patch_panel_id)} className="text-blue-500 hover:underline ml-auto">View Details</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                            <input type="text" value={hop.patch_panel_port} onChange={(e) => handleHopChange(index, "patch_panel_port", e.target.value)} className="w-full p-2 border rounded-md text-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cable Color</label>
                            <select value={hop.cable_color} onChange={(e) => handleHopChange(index, "cable_color", e.target.value)} className="w-full p-2 border rounded-md text-sm">
                                <option value="">-- Optional --</option>
                                {cableColorOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cable Label</label>
                            <input type="text" value={hop.cable_label} onChange={(e) => handleHopChange(index, "cable_label", e.target.value)} className="w-full p-2 border rounded-md" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input type="checkbox" checked={hop.is_port_up} onChange={(e) => handleHopChange(index, "is_port_up", e.target.checked)} className="h-4 w-4" />
                                <label className="ml-2 text-sm">Up</label>
                            </div>
                            <button type="button" onClick={() => removeHop(index)} className="p-2 text-red-500 hover:text-red-700" title="Remove Hop"><Trash2 size={18} /></button>
                        </div>
                    </div>
                </div>
                );
            })}
            <button type="button" onClick={addHop} className="w-full mt-2 py-2 px-4 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-semibold flex items-center justify-center">
                <Plus size={18} className="mr-2" /> Add Patch Panel Hop
            </button>
            </div>
        </div>

        {/* Switch and Final Cable Card */}
        <div className="p-5 border rounded-lg shadow-sm bg-white">
            <h4 className="text-lg font-semibold text-gray-800 col-span-full flex items-center mb-4 border-b pb-2">
                <Server size={20} className="mr-3 text-red-500" /> Final Destination (Switch)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="switch-location-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter Switches by Location:</label>
                    <select id="switch-location-filter" value={selectedLocationIdForSwitch} onChange={(e) => setSelectedLocationIdForSwitch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="">-- All Locations --</option>
                        {sortedLocations.map((loc) => (<option key={loc.id} value={String(loc.id)}>{loc.name} {loc.door_number && `(Door: ${loc.door_number})`}</option>))}
                    </select>
                </div>
                <div>
                    <label htmlFor="switch-select" className="block text-sm font-medium text-gray-700 mb-1">Select Switch:</label>
                    <select id="switch-select" value={switchId} onChange={(e) => setSwitchId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
                        <option value="">-- Select a Switch --</option>
                        {filteredSwitchesByLocation.map((_switch) => (<option key={_switch.id} value={String(_switch.id)}>{_switch.name} ({_switch.ip_address})</option>))}
                    </select>
                    {switchId && getPortStatusSummary("switches", switchId) && (
                        <div className="mt-1 text-xs text-gray-600 flex items-center space-x-2">
                            <span className="flex items-center"><Wifi size={14} className="text-green-500 mr-1" />Connected: {getPortStatusSummary("switches", switchId).connected}</span>
                            <span className="flex items-center"><CircleDot size={14} className="text-gray-500 mr-1" />Available: {getPortStatusSummary("switches", switchId).available}</span>
                            <button type="button" onClick={() => onShowPortStatus("switches", switchId)} className="text-blue-500 hover:underline ml-auto">View Details</button>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
                    <div>
                        <label htmlFor="switch-port" className="block text-sm font-medium text-gray-700 mb-1">Switch Port:</label>
                        <input id="switch-port" type="text" placeholder="e.g., Eth0/1" value={switchPort} onChange={(e) => setSwitchPort(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div className="flex items-center pt-5">
                        <input id="is-switch-port-up" type="checkbox" checked={isSwitchPortUp} onChange={(e) => setIsSwitchPortUp(e.target.checked)} className="h-4 w-4 text-blue-600" />
                        <label htmlFor="is-switch-port-up" className="ml-2 text-sm">Port Up</label>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full border-t pt-4 mt-4">
                    <h5 className="text-md font-semibold text-gray-700 col-span-full mb-2 flex items-center"><Cable size={18} className="mr-2" /> Final Cable Details</h5>
                    <div>
                        <label htmlFor="cable-color" className="block text-sm font-medium mb-1">Cable Color:</label>
                        <div className="flex items-center space-x-2">
                            <select id="cable-color" value={cableColor} onChange={(e) => e.target.value === "add-new" ? setShowAddColorInput(true) : (setCableColor(e.target.value), setShowAddColorInput(false))} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="">-- Optional --</option>
                                {cableColorOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
                                <option value="add-new">-- Add New --</option>
                            </select>
                            {showAddColorInput && (<input type="text" value={newCustomColor} onChange={(e) => setNewCustomColor(e.target.value)} onBlur={handleAddCustomColor} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomColor())} className="p-2 border border-gray-300 rounded-md" />)}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="cable-label" className="block text-sm font-medium mb-1">Cable Label:</label>
                        <input id="cable-label" type="text" placeholder="Optional" value={cableLabel} onChange={(e) => setCableLabel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {formState.editingConnection && (
            <button type="button" onClick={handleCancelEdit} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-semibold">
              Cancel Edit
            </button>
          )}
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            {formState.editingConnection ? "Update Connection" : "Add Connection"}
          </button>
        </div>
      </form>
    </section>
  );
};
