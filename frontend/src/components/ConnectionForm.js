// frontend/src/components/ConnectionForm.js
// This component provides forms to add new PCs, Patch Panels, Switches,
// and to create or edit network connections between them.
// Now, the "Add New" entity forms are collapsible for a cleaner UI, and
// Patch Panel and Switch creation/editing use a location dropdown.
// PC selection for connections now filters based on multi-port status.

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react"; // Import icons for expand/collapse and add buttons

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

// Wrap the component with memo to prevent unnecessary re-renders
const ConnectionForm = memo(function ConnectionForm({
  pcs, // This 'pcs' prop will now represent ALL PCs for display purposes in the 'Add New PC' section
  patchPanels,
  switches,
  onAddConnection,
  onUpdateConnection,
  editingConnection,
  setEditingConnection,
  onAddEntity,
  onShowPortStatus,
  locations,
  showMessage, // Added showMessage prop
}) {
  const [pcId, setPcId] = useState("");
  const [switchPort, setSwitchPort] = useState("");
  const [isSwitchPortUp, setIsSwitchPortUp] = useState(true);
  const [switchId, setSwitchId] = useState("");
  const [hops, setHops] = useState([]);
  const [cableColor, setCableColor] = useState(""); // New: Main connection cable color
  const [cableLabel, setCableLabel] = useState(""); // New: Main connection cable label

  // State for available PCs for the connection dropdown (filtered by multi-port status)
  const [availablePcsForConnection, setAvailablePcsForConnection] = useState(
    []
  );

  // State for managing the available cable color options
  const [cableColorOptions, setCableColorOptions] = useState([
    "Blue",
    "Green",
    "Red",
    "Yellow",
    "Orange",
    "Black",
    "White",
    "Grey",
    "Purple",
    "Brown",
  ]);
  const [showAddColorInput, setShowAddColorInput] = useState(false);
  const [newCustomColor, setNewCustomColor] = useState("");

  // States for managing the expanded/collapsed state of each "Add New" section
  const [isNewPcExpanded, setIsNewPcExpanded] = useState(false);
  const [isNewPpExpanded, setIsNewPpExpanded] = useState(false);
  const [isNewSwitchExpanded, setIsNewSwitchExpanded] = useState(false);

  // State for new entity forms (these states are ONLY for the collapsible add forms)
  const [newPcName, setNewPcName] = useState("");
  const [newPcIp, setNewPcIp] = useState("");
  const [newPcUsername, setNewPcUsername] = useState("");
  const [newPcInDomain, setNewPcInDomain] = useState(false);
  const [newPcOs, setNewPcOs] = useState("");
  const [newPcModel, setNewPcModel] = useState(""); // Corrected: Renamed from newPcPortsName to newPcModel
  const [newPcOffice, setNewPcOffice] = useState("");
  const [newPcDesc, setNewPcDesc] = useState("");
  const [newPcMultiPort, setNewPcMultiPort] = useState(false); // New state for multi_port
  const [newPcType, setNewPcType] = useState("Workstation"); // New state for PC type
  const [newPcUsage, setNewPcUsage] = useState(""); // New state for PC usage

  const [newPpName, setNewPpName] = useState("");
  const [newPpLocationId, setNewPpLocationId] = useState("");
  const [newPpRowInRack, setNewPpRowInRack] = useState("");
  const [newPpRackName, setNewPpRackName] = useState("");
  const [newPpTotalPorts, setNewPpTotalPorts] = useState(1);
  const [newPpDesc, setNewPpDesc] = useState("");

  const [newSwitchName, setNewSwitchName] = useState("");
  const [newSwitchIp, setNewSwitchIp] = useState("");
  const [newSwitchLocationId, setNewSwitchLocationId] = useState("");
  const [newSwitchRowInRack, setNewSwitchRowInRack] = useState("");
  const [newSwitchRackName, setNewSwitchRackName] = useState("");
  const [newSwitchTotalPorts, setNewSwitchTotalPorts] = useState(1);
  const [newSwitchSourcePort, setNewSwitchSourcePort] = useState("");
  const [newSwitchModel, setNewSwitchModel] = useState("");
  const [newSwitchDesc, setNewSwitchDesc] = useState("");

  // IP Address Regex for validation
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Fetch available PCs for connection dropdown
  const fetchAvailablePcs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/available_pcs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailablePcsForConnection(data);
    } catch (error) {
      console.error("Failed to fetch available PCs:", error);
      showMessage(`Error fetching available PCs: ${error.message}`, 5000);
    }
  }, [showMessage]); // showMessage is a dependency

  useEffect(() => {
    fetchAvailablePcs();
  }, [fetchAvailablePcs, pcs]);

  const isInitialRenderRef = useRef(true);

  useEffect(() => {
    if (isInitialRenderRef.current) {
        isInitialRenderRef.current = false;
        return;
    }

    if (editingConnection) {
      setPcId(editingConnection.pc_id || "");
      setSwitchId(editingConnection.switch_id || "");
      setSwitchPort(editingConnection.switch_port || "");
      setIsSwitchPortUp(
        editingConnection.is_switch_port_up !== undefined
          ? editingConnection.is_switch_port_up
          : true
      );
      setCableColor(editingConnection.cable_color || "");
      setCableLabel(editingConnection.cable_label || "");
      setHops(
        editingConnection.hops.map((hop) => ({
          patch_panel_id: hop.patch_panel?.id || "",
          patch_panel_port: hop.patch_panel_port || "",
          is_port_up: hop.is_port_up,
          cable_color: hop.cable_color || "",
          cable_label: hop.cable_label || "",
        })) || []
      );

      if (
        editingConnection.pc &&
        !availablePcsForConnection.find((p) => p.id === editingConnection.pc.id)
      ) {
        setAvailablePcsForConnection((prev) => [...prev, editingConnection.pc]);
      }
    } else {
      setPcId("");
      setSwitchId("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setCableColor("");
      setCableLabel("");
      setHops([]);
      setNewPcName("");
      setNewPcIp("");
      setNewPcUsername("");
      setNewPcInDomain(false);
      setNewPcOs("");
      setNewPcModel("");
      setNewPcOffice("");
      setNewPcDesc("");
      setNewPcMultiPort(false);
      setNewPcType("Workstation");
      setNewPcUsage("");

      setNewPpName("");
      setNewPpLocationId("");
      setNewPpRowInRack("");
      setNewPpRackName("");
      setNewPpTotalPorts(1);
      setNewPpDesc("");

      setNewSwitchName("");
      setNewSwitchIp("");
      setNewSwitchLocationId("");
      setNewSwitchRowInRack("");
      setNewSwitchRackName("");
      setNewSwitchTotalPorts(1);
      setNewSwitchSourcePort("");
      setNewSwitchModel("");
      setNewSwitchDesc("");
    }
  }, [editingConnection, availablePcsForConnection, pcs]);

  const handleHopPatchPanelChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].patch_panel_id = parseInt(value);
    setHops(updatedHops);
  };

  const handleHopPortChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].patch_panel_port = value;
    setHops(updatedHops);
  };

  const handleHopPortStatusChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].is_port_up = value;
    setHops(updatedHops);
  };

  const handleHopCableColorChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].cable_color = value;
    setHops(updatedHops);
  };

  const handleHopCableLabelChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].cable_label = value;
    setHops(updatedHops);
  };

  const addHop = () => {
    setHops([
      ...hops,
      {
        patch_panel_id: "",
        patch_panel_port: "",
        is_port_up: true,
        cable_color: "",
        cable_label: "",
      },
    ]);
  };

  const removeHop = (index) => {
    setHops(hops.filter((_, i) => i !== index));
  };

  const handleAddCustomColor = () => {
    if (newCustomColor.trim() && !cableColorOptions.includes(newCustomColor.trim())) {
        setCableColorOptions((prev) => [...prev, newCustomColor.trim()]);
        setCableColor(newCustomColor.trim());
        setNewCustomColor("");
        setShowAddColorInput(false);
    } else if (cableColorOptions.includes(newCustomColor.trim())) {
        showMessage("Color already exists.", 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allHopsValid = hops.every(
      (hop) => hop.patch_panel_id && hop.patch_panel_port.trim()
    );
    if (!allHopsValid) {
      alert("Please fill out all patch panel details for each hop.");
      return;
    }

    const connectionData = {
      pc_id: parseInt(pcId),
      switch_id: parseInt(switchId),
      switch_port: switchPort,
      is_switch_port_up: isSwitchPortUp,
      cable_color: cableColor,
      cable_label: cableLabel,
      hops: hops.map((hop) => ({
        patch_panel_id: hop.patch_panel_id,
        patch_panel_port: hop.patch_panel_port,
        is_port_up: hop.is_port_up,
        cable_color: hop.cable_color,
        cable_label: hop.cable_label,
      })),
    };

    let result;
    if (editingConnection) {
      result = await onUpdateConnection(editingConnection.id, connectionData);
    } else {
      result = await onAddConnection(connectionData);
    }

    // Only clear the form if the operation was successful
    if (result.success) {
      setPcId("");
      setSwitchId("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setCableColor("");
      setCableLabel("");
      setHops([]);
      setEditingConnection(null);
      fetchAvailablePcs();
    }
    // If not successful, the form fields will retain their values,
    // and App.js will display the error message.
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    setPcId("");
    setSwitchId("");
    setSwitchPort("");
    setIsSwitchPortUp(true);
    setCableColor("");
    setCableLabel("");
    setHops([]);
    fetchAvailablePcs();
  };

  const handleAddPc = async (e) => {
    e.preventDefault();
    if (newPcIp && !ipRegex.test(newPcIp)) {
      alert("Please enter a valid IP address for PC (e.g., 192.168.1.1).");
      return;
    }
    if (newPcName.trim()) {
      try {
        await onAddEntity("pcs", {
          name: newPcName,
          ip_address: newPcIp,
          username: newPcUsername,
          in_domain: newPcInDomain,
          operating_system: newPcOs,
          model: newPcModel,
          office: newPcOffice,
          description: newPcDesc,
          multi_port: newPcMultiPort,
          type: newPcType,
          usage: newPcUsage,
        });
        setNewPcName("");
        setNewPcIp("");
        setNewPcUsername("");
        setNewPcInDomain(false);
        setNewPcOs("");
        setNewPcModel("");
        setNewPcOffice("");
        setNewPcDesc("");
        setNewPcMultiPort(false);
        setNewPcType("Workstation");
        setNewPcUsage("");
        setIsNewPcExpanded(false);
        fetchAvailablePcs();
      } catch (error) {
        // Error message already shown by onAddEntity
      }
    } else {
      alert("PC Name is required.");
    }
  };

  const handleAddPp = async (e) => {
    e.preventDefault();
    if (newPpName.trim() && newPpLocationId) {
      try {
        await onAddEntity("patch_panels", {
          name: newPpName,
          location_id: parseInt(newPpLocationId),
          row_in_rack: newPpRowInRack,
          rack_name: newPpRackName,
          total_ports: parseInt(newPpTotalPorts),
          description: newPpDesc,
        });
        setNewPpName("");
        setNewPpLocationId("");
        setNewPpRowInRack("");
        setNewPpRackName("");
        setNewPpTotalPorts(1);
        setNewPpDesc("");
        setIsNewPpExpanded(false);
      } catch (error) {
        // Error message already shown by onAddEntity
      }
    } else {
      alert("Patch Panel Name and Location are required.");
    }
  };

  const handleAddSwitch = async (e) => {
    e.preventDefault();
    if (newSwitchIp && !ipRegex.test(newSwitchIp)) {
      alert("Please enter a valid IP address for Switch (e.g., 192.168.1.1).");
      return;
    }
    if (newSwitchName.trim() && newSwitchLocationId) {
      try {
        await onAddEntity("switches", {
          name: newSwitchName,
          ip_address: newSwitchIp,
          location_id: parseInt(newSwitchLocationId),
          row_in_rack: newSwitchRowInRack,
          rack_name: newSwitchRackName,
          total_ports: parseInt(newSwitchTotalPorts),
          source_port: newSwitchSourcePort,
          model: newSwitchModel,
          description: newSwitchDesc,
        });
        setNewSwitchName("");
        setNewSwitchIp("");
        setNewSwitchLocationId("");
        setNewSwitchRowInRack("");
        setNewSwitchRackName("");
        setNewSwitchTotalPorts(1);
        setNewSwitchSourcePort("");
        setNewSwitchModel("");
        setNewSwitchDesc("");
        setIsNewSwitchExpanded(false);
      } catch (error) {
        // Error message already shown by onAddEntity
      }
    } else {
      alert("Switch Name and Location are required.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Collapsible Forms to Add New Entities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New PC Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div
            className="flex justify-between items-center p-5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 rounded-t-lg"
            onClick={() => setIsNewPcExpanded(!isNewPcExpanded)}
          >
            <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> Add New PC
            </h3>
            {isNewPcExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          <div
            className={`collapsible-content ${
              isNewPcExpanded ? "expanded" : ""
            }`}
          >
            <form onSubmit={handleAddPc} className="p-5 space-y-3">
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
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={newPcIp}
                onChange={(e) => setNewPcIp(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Username (Optional)"
                value={newPcUsername}
                onChange={(e) => setNewPcUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    id="new-pc-in-domain"
                    type="checkbox"
                    checked={newPcInDomain}
                    onChange={(e) => setNewPcInDomain(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="new-pc-in-domain"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    In Domain
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="new-pc-multi-port"
                    type="checkbox"
                    checked={newPcMultiPort}
                    onChange={(e) => setNewPcMultiPort(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="new-pc-multi-port"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Multi-Port PC (Can have multiple connections)
                  </label>
                </div>
              </div>
              <select
                value={newPcType}
                onChange={(e) => setNewPcType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Workstation">Workstation</option>
                <option value="Server">Server</option>
              </select>
              <input
                type="text"
                placeholder="Operating System (Optional)"
                value={newPcOs}
                onChange={(e) => setNewPcOs(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Model (e.g., Dell OptiPlex 7010)"
                value={newPcModel}
                onChange={(e) => setNewPcModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Office (Optional)"
                value={newPcOffice}
                onChange={(e) => setNewPcOffice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Usage (Optional)"
                value={newPcUsage}
                onChange={(e) => setNewPcUsage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Description (Optional)"
                value={newPcDesc}
                onChange={(e) => setNewPcDesc(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add PC
              </button>
            </form>
          </div>
        </div>

        {/* Add New Patch Panel Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div
            className="flex justify-between items-center p-5 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg"
            onClick={() => setIsNewPpExpanded(!isNewPpExpanded)}
          >
            <h3 className="text-lg font-semibold text-green-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> Add New Patch Panel
            </h3>
            {isNewPpExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          <div
            className={`collapsible-content ${
              isNewPpExpanded ? "expanded" : ""
            }`}
          >
            <form onSubmit={handleAddPp} className="p-5 space-y-3">
              <input
                type="text"
                placeholder="Patch Panel Name"
                value={newPpName}
                onChange={(e) => setNewPpName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <select
                value={newPpLocationId}
                onChange={(e) => setNewPpLocationId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select Location --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.door_number && `(Door: ${loc.door_number})`}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Please add a location first (Go to Locations tab).
                </p>
              )}
              <input
                type="text"
                placeholder="Row in Rack (Optional)"
                value={newPpRowInRack}
                onChange={(e) => setNewPpRowInRack(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Rack Name (Optional)"
                value={newPpRackName}
                onChange={(e) => setNewPpRackName(e.target.value)}
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
              <textarea
                placeholder="Description (Optional)"
                value={newPpDesc}
                onChange={(e) => setNewPpDesc(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Patch Panel
              </button>
            </form>
          </div>
        </div>

        {/* Add New Switch Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div
            className="flex justify-between items-center p-5 cursor-pointer bg-red-50 hover:bg-red-100 transition-colors duration-200 rounded-t-lg"
            onClick={() => setIsNewSwitchExpanded(!isNewSwitchExpanded)}
          >
            <h3 className="text-lg font-semibold text-red-700 flex items-center">
              <PlusCircle size={20} className="mr-2" /> Add New Switch
            </h3>
            {isNewSwitchExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
          <div
            className={`collapsible-content ${
              isNewSwitchExpanded ? "expanded" : ""
            }`}
          >
            <form onSubmit={handleAddSwitch} className="p-5 space-y-3">
              <input
                type="text"
                placeholder="Switch Name"
                value={newSwitchName}
                onChange={(e) => setNewSwitchName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="text"
                placeholder="IP Address (e.g., 192.168.1.1)"
                value={newSwitchIp}
                onChange={(e) => setNewSwitchIp(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={newSwitchLocationId}
                onChange={(e) => setNewSwitchLocationId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Select Location --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.door_number && `(Door: ${loc.door_number})`}
                  </option>
                ))}
              </select>
              {locations.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  Please add a location first (Go to Locations tab).
                </p>
              )}
              <input
                type="text"
                placeholder="Row in Rack (Optional)"
                value={newSwitchRowInRack}
                onChange={(e) => setNewSwitchRowInRack(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Rack Name (Optional)"
                value={newSwitchRackName}
                onChange={(e) => setNewSwitchRackName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Total Ports (e.g., 4)"
                value={newSwitchTotalPorts}
                onChange={(e) => setNewSwitchTotalPorts(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
                required
              />
              <input
                type="text"
                placeholder="Source Port (Optional)"
                value={newSwitchSourcePort}
                onChange={(e) => setNewSwitchSourcePort(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Model (Optional)"
                value={newSwitchModel}
                onChange={(e) => setNewSwitchModel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Description (Optional)"
                value={newSwitchDesc}
                onChange={(e) => setNewSwitchDesc(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                rows="3"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Add Switch
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Connection Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-blue-200"
      >
        <h3 className="text-xl font-bold text-blue-700 text-center">
          {editingConnection
            ? "Edit Existing Connection"
            : "Create New Connection"}
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
              {availablePcsForConnection.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name} ({pc.ip_address || "No IP"}){" "}
                  {pc.multi_port ? "(Multi-Port)" : "(Single-Port)"}
                </option>
              ))}
            </select>
            {availablePcsForConnection.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No available PCs. Add a new PC or ensure single-port PCs are not
                already connected.
              </p>
            )}
          </div>

          {/* Switch Selection */}
          <div>
            <label
              htmlFor="switch-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Switch:
            </label>
            <select
              id="switch-select"
              value={switchId}
              onChange={(e) => setSwitchId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a Switch --</option>
              {switches.map((_switch) => (
                <option key={_switch.id} value={_switch.id}>
                  {_switch.name} ({_switch.ip_address})
                </option>
              ))}
            </select>
            {switches.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                Please add a Switch first.
              </p>
            )}
          </div>

          {/* Switch Port Input and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
            <div>
              <label
                htmlFor="switch-port"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Switch Port:
              </label>
              <input
                id="switch-port"
                type="text"
                placeholder="e.g., Eth0/1, GigaPort-03"
                value={switchPort}
                onChange={(e) => setSwitchPort(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex items-center pt-5">
              <input
                id="is-switch-port-up"
                type="checkbox"
                checked={isSwitchPortUp}
                onChange={(e) => setIsSwitchPortUp(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is-switch-port-up"
                className="ml-2 block text-sm text-gray-900"
              >
                Port Up
              </label>
            </div>
            {switchId && switches.find((s) => s.id === parseInt(switchId)) && (
              <button
                type="button"
                onClick={() => onShowPortStatus("switches", switchId)}
                className="mt-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 col-span-full"
              >
                View Switch Port Status (
                {switches.find((s) => s.id === parseInt(switchId))?.name})
              </button>
            )}
          </div>

          {/* Main Connection Cable Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
            <div>
              <label
                htmlFor="cable-color"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cable Color:
              </label>
              <div className="flex items-center space-x-2">
                <select
                  id="cable-color"
                  value={cableColor}
                  onChange={(e) => {
                    if (e.target.value === "add-new") {
                        setShowAddColorInput(true);
                        setNewCustomColor("");
                    } else {
                        setCableColor(e.target.value);
                        setShowAddColorInput(false);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Color (Optional) --</option>
                  {cableColorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                  <option value="add-new">-- Add New Color --</option>
                </select>
                {showAddColorInput && (
                    <input
                        type="text"
                        placeholder="Enter new color"
                        value={newCustomColor}
                        onChange={(e) => setNewCustomColor(e.target.value)}
                        onBlur={handleAddCustomColor}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomColor();
                            }
                        }}
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="cable-label"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cable Label:
              </label>
              <input
                id="cable-label"
                type="text"
                placeholder="e.g., A1-B2, Patch-CBL-001"
                value={cableLabel}
                onChange={(e) => setCableLabel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Patch Panel {index + 1}:
                </label>
                <select
                  id={`pp-select-${index}`}
                  value={hop.patch_panel_id}
                  onChange={(e) =>
                    handleHopPatchPanelChange(index, e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">-- Select Patch Panel --</option>
                  {patchPanels.map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {pp.name} ({pp.location_name}{pp.location?.door_number && ` (Door: ${pp.location.door_number})`})
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
                  className="block text-sm font-medium text-gray-700 mb-1"
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

              {/* New: Cable Color for Hop */}
              <div className="flex-grow w-full md:w-auto">
                <label
                  htmlFor={`hop-cable-color-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cable Color (Hop):
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    id={`hop-cable-color-${index}`}
                    value={hop.cable_color}
                    onChange={(e) => {
                        if (e.target.value === "add-new-hop-color") {
                            setShowAddColorInput(true);
                            setNewCustomColor("");
                        } else {
                            handleHopCableColorChange(index, e.target.value);
                            setShowAddColorInput(false);
                        }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">-- Select Color (Optional) --</option>
                    {cableColorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                    <option value="add-new-hop-color">-- Add New Color --</option>
                  </select>
                  {showAddColorInput && (
                    <input
                        type="text"
                        placeholder="Enter new color"
                        value={newCustomColor}
                        onChange={(e) => setNewCustomColor(e.target.value)}
                        onBlur={handleAddCustomColor}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomColor();
                            }
                        }}
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                )}
                </div>
              </div>

              {/* New: Cable Label for Hop */}
              <div className="flex-grow w-full md:w-auto">
                <label
                  htmlFor={`hop-cable-label-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cable Label (Hop):
                </label>
                <input
                  id={`hop-cable-label-${index}`}
                  type="text"
                  placeholder="e.g., PP1-Port5"
                  value={hop.cable_label}
                  onChange={(e) => handleHopCableLabelChange(index, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
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
});

export default ConnectionForm;
