// frontend/src/components/ConnectionForm.js
// This component provides forms to add new PCs, Patch Panels, Switches,
// and to create or edit network connections between them.

import React, { useState, useEffect } from "react";

function ConnectionForm({
  pcs,
  patchPanels,
  switches,
  onAddConnection,
  onUpdateConnection,
  editingConnection,
  setEditingConnection,
  onAddEntity,
  onShowPortStatus,
}) {
  // Renamed servers to switches
  const [pcId, setPcId] = useState("");
  const [switchPort, setSwitchPort] = useState("");
  const [isSwitchPortUp, setIsSwitchPortUp] = useState(true);
  const [switchId, setSwitchId] = useState("");
  // State to manage multiple patch panel hops
  const [hops, setHops] = useState([]); // Array of { patch_panel_id, patch_panel_port, is_port_up }

  // State for new entity forms (PC, Patch Panel, Switch)
  const [newPcName, setNewPcName] = useState("");
  const [newPcIp, setNewPcIp] = useState("");
  const [newPcDesc, setNewPcDesc] = useState("");

  const [newPpName, setNewPpName] = useState("");
  const [newPpLocation, setNewPpLocation] = useState("");
  const [newPpTotalPorts, setNewPpTotalPorts] = useState(1);

  const [newSwitchName, setNewSwitchName] = useState(""); // Renamed newServerName
  const [newSwitchIp, setNewSwitchIp] = useState(""); // Renamed newServerIp
  const [newSwitchLocation, setNewSwitchLocation] = useState(""); // Renamed newServerLocation
  const [newSwitchTotalPorts, setNewSwitchTotalPorts] = useState(1); // Renamed newServerTotalPorts

  // Populate form fields if editing an existing connection
  useEffect(() => {
    if (editingConnection) {
      setPcId(editingConnection.pc_id || "");
      setSwitchId(editingConnection.switch_id || ""); // Renamed serverId
      setSwitchPort(editingConnection.switch_port || ""); // Renamed serverPort
      setIsSwitchPortUp(
        editingConnection.is_switch_port_up !== undefined
          ? editingConnection.is_switch_port_up
          : true
      ); // Renamed isServerPortUp
      // When editing, populate hops
      setHops(editingConnection.hops || []);
    } else {
      // Clear form if not editing
      setPcId("");
      setSwitchId("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setHops([]);
    }
  }, [editingConnection]);

  // Handle changes for a specific hop's patch panel ID
  const handleHopPatchPanelChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].patch_panel_id = parseInt(value);
    setHops(updatedHops);
  };

  // Handle changes for a specific hop's patch panel port
  const handleHopPortChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].patch_panel_port = value;
    setHops(updatedHops);
  };

  // Handle changes for a specific hop's port status
  const handleHopPortStatusChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].is_port_up = value;
    setHops(updatedHops);
  };

  // Add a new empty hop to the list
  const addHop = () => {
    setHops([
      ...hops,
      { patch_panel_id: "", patch_panel_port: "", is_port_up: true },
    ]);
  };

  // Remove a hop by index
  const removeHop = (index) => {
    setHops(hops.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate that all hops have selections
    const allHopsValid = hops.every(
      (hop) => hop.patch_panel_id && hop.patch_panel_port.trim()
    );
    if (!allHopsValid) {
      alert("Please fill out all patch panel details for each hop.");
      return;
    }

    const connectionData = {
      pc_id: parseInt(pcId),
      switch_id: parseInt(switchId), // Renamed serverId
      switch_port: switchPort, // Renamed serverPort
      is_switch_port_up: isSwitchPortUp, // Renamed isServerPortUp
      hops: hops.map((hop) => ({
        // Send hops as an array of objects
        patch_panel_id: hop.patch_panel_id,
        patch_panel_port: hop.patch_panel_port,
        is_port_up: hop.is_port_up, // Include hop port status
      })),
    };

    if (editingConnection) {
      await onUpdateConnection(editingConnection.id, connectionData);
    } else {
      await onAddConnection(connectionData);
    }
    // Clear form fields after submission
    setPcId("");
    setSwitchId("");
    setSwitchPort("");
    setIsSwitchPortUp(true);
    setHops([]);
    setEditingConnection(null); // Ensure editing state is cleared
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    // Also clear the form fields
    setPcId("");
    setSwitchId("");
    setSwitchPort("");
    setIsSwitchPortUp(true);
    setHops([]);
  };

  const handleAddPc = async (e) => {
    e.preventDefault();
    if (newPcName.trim()) {
      await onAddEntity("pcs", {
        name: newPcName,
        ip_address: newPcIp,
        description: newPcDesc,
      });
      setNewPcName("");
      setNewPcIp("");
      setNewPcDesc("");
    }
  };

  const handleAddPp = async (e) => {
    e.preventDefault();
    if (newPpName.trim()) {
      await onAddEntity("patch_panels", {
        name: newPpName,
        location: newPpLocation,
        total_ports: parseInt(newPpTotalPorts),
      });
      setNewPpName("");
      setNewPpLocation("");
      setNewPpTotalPorts(1);
    }
  };

  const handleAddSwitch = async (e) => {
    // Renamed handleAddServer
    e.preventDefault();
    if (newSwitchName.trim()) {
      // Renamed newServerName
      await onAddEntity("switches", {
        name: newSwitchName,
        ip_address: newSwitchIp,
        location: newSwitchLocation,
        total_ports: parseInt(newSwitchTotalPorts),
      }); // Renamed newServerName, newServerIp, newServerLocation, newServerTotalPorts and 'servers'
      setNewSwitchName(""); // Renamed newServerName
      setNewSwitchIp(""); // Renamed newServerIp
      setNewSwitchLocation(""); // Renamed newServerLocation
      setNewSwitchTotalPorts(1); // Renamed newServerTotalPorts
    }
  };

  return (
    <div className="space-y-8">
      {/* Forms to Add New Entities (PC, Patch Panel, Switch) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New PC Form */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Add New PC
          </h3>{" "}
          {/* Simplified "Add New PC or Server" */}
          <form onSubmit={handleAddPc} className="space-y-3">
            <input
              type="text"
              placeholder="PC Name"
              value={newPcName}
              onChange={(e) => setNewPcName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (Optional)"
              value={newPcIp}
              onChange={(e) => setNewPcIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newPcDesc}
              onChange={(e) => setNewPcDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add PC
            </button>
          </form>
        </div>

        {/* Add New Patch Panel Form */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Add New Patch Panel
          </h3>
          <form onSubmit={handleAddPp} className="space-y-3">
            <input
              type="text"
              placeholder="Patch Panel Name"
              value={newPpName}
              onChange={(e) => setNewPpName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Location (Optional)"
              value={newPpLocation}
              onChange={(e) => setNewPpLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Total Ports (e.g., 24)"
              value={newPpTotalPorts}
              onChange={(e) => setNewPpTotalPorts(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Patch Panel
            </button>
            {patchPanels.length > 0 /* Only show if existing PPs */ && (
              <select
                onChange={(e) =>
                  onShowPortStatus("patch_panels", e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-2"
                defaultValue=""
              >
                <option value="" disabled>
                  View Port Status for Existing PP
                </option>
                {patchPanels.map((pp) => (
                  <option key={pp.id} value={pp.id}>
                    {pp.name} ({pp.location})
                  </option>
                ))}
              </select>
            )}
          </form>
        </div>

        {/* Add New Switch Form (Renamed from Add New Server Form) */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Add New Switch
          </h3>{" "}
          <form onSubmit={handleAddSwitch} className="space-y-3">
            {" "}
            <input
              type="text"
              placeholder="Switch Name" // Renamed "Server Name"
              value={newSwitchName} // Renamed newServerName
              onChange={(e) => setNewSwitchName(e.target.value)} // Renamed newServerName
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (Optional)"
              value={newSwitchIp} // Renamed newServerIp
              onChange={(e) => setNewSwitchIp(e.target.value)} // Renamed newServerIp
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Location (Optional)"
              value={newSwitchLocation} // Renamed newServerLocation
              onChange={(e) => setNewSwitchLocation(e.target.value)} // Renamed newServerLocation
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Total Ports (e.g., 4)"
              value={newSwitchTotalPorts} // Renamed newServerTotalPorts
              onChange={(e) => setNewSwitchTotalPorts(e.target.value)} // Renamed newServerTotalPorts
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
            <button
              type="submit"
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Add Switch
            </button>
            {switches.length > 0 /* Only show if existing Switches */ && (
              <select
                onChange={(e) => onShowPortStatus("switches", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mt-2"
                defaultValue=""
              >
                <option value="" disabled>
                  View Port Status for Existing Switch
                </option>
                {switches.map((_switch) => (
                  <option key={_switch.id} value={_switch.id}>
                    {_switch.name} ({_switch.ip_address})
                  </option>
                ))}
              </select>
            )}
          </form>
        </div>
      </div>

      {/* Connection Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-blue-200"
      >
        <h3 className="text-xl font-bold text-blue-700 text-center">
          {editingConnection
            ? "Edit Existing Connection"
            : "Add New Connection"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PC Selection */}
          <div>
            <label
              htmlFor="pc-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select PC:
            </label>
            <select
              id="pc-select"
              value={pcId}
              onChange={(e) => setPcId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a PC --</option>
              {pcs.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name} ({pc.ip_address || "No IP"})
                </option>
              ))}
            </select>
            {pcs.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a PC first.
              </p>
            )}
          </div>

          {/* Switch Selection (Renamed from Server Selection) */}
          <div>
            <label
              htmlFor="switch-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Switch:
            </label>{" "}
            <select
              id="switch-select" // Renamed server-select
              value={switchId} // Renamed serverId
              onChange={(e) => setSwitchId(e.target.value)} // Renamed setServerId
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a Switch --</option>
              {switches.map(
                (
                  _switch // Renamed servers to switches, server to _switch
                ) => (
                  <option key={_switch.id} value={_switch.id}>
                    {_switch.name} ({_switch.ip_address})
                  </option>
                )
              )}
            </select>
            {switches.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a Switch first.
              </p>
            )}{" "}
          </div>

          {/* Switch Port Input and Status (Renamed from Server Port Input and Status) */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="switch-port"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Switch Port:
              </label>{" "}
              <input
                id="switch-port" // Renamed server-port
                type="text"
                placeholder="e.g., Eth0/1, GigaPort-03"
                value={switchPort} // Renamed serverPort
                onChange={(e) => setSwitchPort(e.target.value)} // Renamed setServerPort
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex items-center pt-5">
              <input
                id="is-switch-port-up" // Renamed is-server-port-up
                type="checkbox"
                checked={isSwitchPortUp} // Renamed isServerPortUp
                onChange={(e) => setIsSwitchPortUp(e.target.checked)} // Renamed setIsServerPortUp
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is-switch-port-up"
                className="ml-2 block text-sm text-gray-900"
              >
                {" "}
                Port Up
              </label>
            </div>
            {switchId &&
              switches.find((s) => s.id === parseInt(switchId)) && ( // Renamed serverId, servers
                <button
                  type="button"
                  onClick={() => onShowPortStatus("switches", switchId)} // Renamed 'servers', serverId
                  className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 col-span-2"
                >
                  View Switch Port Status (
                  {switches.find((s) => s.id === parseInt(switchId))?.name}) //
                  Renamed Server, servers
                </button>
              )}
          </div>
        </div>

        {/* Dynamic Patch Panel Hops Section */}
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">
            Patch Panel Hops (in sequence)
          </h4>
          {hops.length === 0 && (
            <p className="text-sm text-gray-500 mt-2 text-center mb-4">
              Click "Add Patch Panel Hop" to start building the path.
            </p>
          )}
          {hops.map((hop, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-end md:items-center space-y-3 md:space-y-0 md:space-x-3 mb-4 p-3 border border-gray-100 rounded-md bg-white shadow-sm"
            >
              <div className="flex-grow w-full md:w-auto">
                <label
                  htmlFor={`pp-select-${index}`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Patch Panel {index + 1}:
                </label>
                <select
                  id={`pp-select-${index}`}
                  value={hop.patch_panel_id}
                  onChange={(e) =>
                    handleHopPatchPanelChange(index, e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">-- Select Patch Panel --</option>
                  {patchPanels.map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {pp.name} ({pp.location})
                    </option>
                  ))}
                </select>
                {patchPanels.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Please add a Patch Panel first.
                  </p>
                )}
              </div>
              <div className="flex-grow w-full md:w-auto">
                <label
                  htmlFor={`pp-port-${index}`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Port:
                </label>
                <input
                  id={`pp-port-${index}`}
                  type="text"
                  placeholder="Port"
                  value={hop.patch_panel_port}
                  onChange={(e) => handleHopPortChange(index, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>
              <div className="flex items-center w-full md:w-auto md:pt-5">
                <input
                  id={`is-pp-port-up-${index}`}
                  type="checkbox"
                  checked={hop.is_port_up}
                  onChange={(e) =>
                    handleHopPortStatusChange(index, e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor={`is-pp-port-up-${index}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  Port Up
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeHop(index)}
                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm flex-shrink-0"
              >
                Remove
              </button>
              {hop.patch_panel_id &&
                patchPanels.find(
                  (pp) => pp.id === parseInt(hop.patch_panel_id)
                ) && (
                  <button
                    type="button"
                    onClick={() =>
                      onShowPortStatus("patch_panels", hop.patch_panel_id)
                    }
                    className="w-full md:w-auto mt-2 md:mt-0 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-shrink-0"
                  >
                    View Ports (
                    {
                      patchPanels.find(
                        (pp) => pp.id === parseInt(hop.patch_panel_id)
                      )?.name
                    }
                    )
                  </button>
                )}
            </div>
          ))}
          <button
            type="button"
            onClick={addHop}
            className="w-full mt-2 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Patch Panel Hop
          </button>
        </div>

        {/* Action Buttons for Connection Form */}
        <div className="flex justify-end space-x-3 mt-6">
          {editingConnection && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-200"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {editingConnection ? "Update Connection" : "Add Connection"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConnectionForm;
