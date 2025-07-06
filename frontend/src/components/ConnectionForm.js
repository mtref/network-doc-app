// frontend/src/components/ConnectionForm.js
// This component provides forms to add new PCs, Patch Panels, Switches,
// and to create or edit network connections between them.
// Now, the PC selection/creation is Step 1, and connection details are Step 2.
// "Add New" forms for Patch Panel and Switch are accessible via dropdowns in Step 2.
// UPDATED: Added rack, row in rack, and units_occupied fields for 'Server' type PCs, Patch Panels, and Switches.

import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Laptop, // Icon for PC (still used for existing PC display)
  Server, // Icon for Switch
  Split, // Icon for Patch Panel
  Cable, // Icon for Connection Cable
  Wifi, // Icon for Port Up
  WifiOff, // Icon for Port Down
  CircleDot, // Icon for Available Port
  Tag, // Icon for Cable Label
  Palette, // Icon for Cable Color
  ArrowRight, // For navigation
  HardDrive, // For PC type Server
  MonitorCheck, // For PC type Workstation
  MapPin, // Icon for Location selection
  Columns, // Icon for Rack
} from "lucide-react";

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

// Wrap the component with memo to prevent unnecessary re-renders
const ConnectionForm = memo(function ConnectionForm({
  pcs, // This prop contains the updated list of PCs
  patchPanels,
  switches,
  connections, // This prop contains the updated list of connections
  onAddConnection,
  onUpdateConnection,
  editingConnection,
  setEditingConnection,
  onAddEntity,
  onShowPortStatus,
  locations,
  racks, // New prop for Racks
  showMessage,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [pcId, setPcId] = useState("");
  const [switchPort, setSwitchPort] = useState("");
  const [isSwitchPortUp, setIsSwitchPortUp] = useState(true);
  const [switchId, setSwitchId] = useState("");
  const [hops, setHops] = useState([]);
  const [cableColor, setCableColor] = useState("");
  const [cableLabel, setCableLabel] = useState("");

  const [availablePcsForConnection, setAvailablePcsForConnection] = useState(
    []
  );

  const [selectedLocationIdForSwitch, setSelectedLocationIdForSwitch] =
    useState("");
  const [filteredSwitchesByLocation, setFilteredSwitchesByLocation] = useState(
    []
  );

  const [cableColorOptions, setCableColorOptions] = useState(
    [
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
    ].sort()
  );
  const [showAddColorInput, setShowAddColorInput] = useState(false);
  const [newCustomColor, setNewCustomColor] = useState("");

  const [isNewPcExpanded, setIsNewPcExpanded] = useState(false);
  const [isNewPpExpanded, setIsNewPpExpanded] = useState(false);
  const [isNewSwitchExpanded, setIsNewSwitchExpanded] = useState(false);

  const [newPcName, setNewPcName] = useState("");
  const [newPcIp, setNewPcIp] = useState("");
  const [newPcUsername, setNewPcUsername] = useState("");
  const [newPcInDomain, setNewPcInDomain] = useState(false);
  const [newPcOs, setNewPcOs] = useState("");
  const [newPcModel, setNewPcModel] = useState("");
  const [newPcOffice, setNewPcOffice] = useState("");
  const [newPcDesc, setNewPcDesc] = useState("");
  const [newPcMultiPort, setNewPcMultiPort] = useState(false);
  const [newPcType, setNewPcType] = useState("Workstation");
  const [newPcUsage, setNewPcUsage] = useState("");
  const [newPcRowInRack, setNewPcRowInRack] = useState("");
  const [newPcRackId, setNewPcRackId] = useState("");
  const [newPcUnitsOccupied, setNewPcUnitsOccupied] = useState(1); // NEW: units_occupied for PC

  const [newPpName, setNewPpName] = useState("");
  const [newPpLocationId, setNewPpLocationId] = useState("");
  const [newPpRowInRack, setNewPpRowInRack] = useState("");
  const [newPpRackId, setNewPpRackId] = useState("");
  const [newPpTotalPorts, setNewPpTotalPorts] = useState(1);
  const [newPpDesc, setNewPpDesc] = useState("");
  const [newPpUnitsOccupied, setNewPpUnitsOccupied] = useState(1); // NEW: units_occupied for Patch Panel

  const [newSwitchName, setNewSwitchName] = useState("");
  const [newSwitchIp, setNewSwitchIp] = useState("");
  const [newSwitchLocationId, setNewSwitchLocationId] = useState("");
  const [newSwitchRowInRack, setNewSwitchRowInRack] = useState("");
  const [newSwitchRackId, setNewSwitchRackId] = useState("");
  const [newSwitchTotalPorts, setNewSwitchTotalPorts] = useState(1);
  const [newSwitchSourcePort, setNewSwitchSourcePort] = useState("");
  const [newSwitchModel, setNewSwitchModel] = useState("");
  const [newSwitchDesc, setNewSwitchDesc] = useState("");
  const [newSwitchUsage, setNewSwitchUsage] = useState("");
  const [newSwitchUnitsOccupied, setNewSwitchUnitsOccupied] = useState(1); // NEW: units_occupied for Switch

  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;

  // Usage options for PC and Switch forms
  const usageOptions = [
    "Production",
    "Development",
    "Test",
    "Staging",
    "Backup",
    "Monitoring",
    "Other",
  ];

  // IMPORTANT: The fetchAvailablePcs callback now depends on 'pcs' and 'connections' props.
  // This ensures it gets recreated and re-executed when these underlying data change.
  const fetchAvailablePcs = useCallback(async () => {
    try {
      const all_pcs = pcs; // Use the pcs prop directly
      const all_connections = connections; // Use the connections prop directly

      // This logic must exactly match your backend's /available_pcs endpoint
      // for consistent filtering on the frontend without extra API calls here.
      const connected_single_port_pc_ids = new Set(
        all_connections
          .filter((conn) => conn.pc && !conn.pc.multi_port)
          .map((conn) => conn.pc.id)
      );

      const filteredPcs = [];
      for (const pc of all_pcs) {
        if (pc.multi_port || !connected_single_port_pc_ids.has(pc.id)) {
          filteredPcs.push(pc);
        }
      }

      setAvailablePcsForConnection(
        filteredPcs.sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Failed to filter available PCs on frontend:", error);
      showMessage(`Error filtering available PCs: ${error.message}`, 5000);
    }
  }, [pcs, connections, showMessage]); // Dependencies: pcs and connections props

  // This useEffect now correctly re-runs fetchAvailablePcs when pcs or connections change
  useEffect(() => {
    fetchAvailablePcs();
  }, [fetchAvailablePcs]); // Dependency: the memoized callback itself

  useEffect(() => {
    if (editingConnection) {
      setPcId(editingConnection.pc_id || "");
      setSwitchId(editingConnection.switch_id || "");
      if (editingConnection.switch?.location_id) {
        setSelectedLocationIdForSwitch(
          String(editingConnection.switch.location_id)
        );
      } else {
        setSelectedLocationIdForSwitch("");
      }

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
          location_id: hop.patch_panel?.location_id
            ? String(hop.patch_panel.location_id)
            : "",
        })) || []
      );

      // When editing, ensure the current PC is always in the dropdown,
      // even if it's a single-port PC that's now "unavailable" for new connections.
      // This allows editing its own connection.
      setAvailablePcsForConnection((prev) => {
        if (
          editingConnection.pc &&
          !prev.some((p) => p.id === editingConnection.pc.id)
        ) {
          return [...prev, editingConnection.pc].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        }
        return prev;
      });
      setCurrentStep(2);
    } else {
      setPcId("");
      setSwitchId("");
      setSelectedLocationIdForSwitch("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setCableColor("");
      setCableLabel("");
      setHops([]);
      setEditingConnection(null);
      setCurrentStep(1);

      // Reset new PC/PP/Switch form fields when connection form is reset
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
      setNewPcRowInRack("");
      setNewPcRackId("");
      setNewPcUnitsOccupied(1); // NEW: Reset units_occupied

      setNewPpName("");
      setNewPpLocationId("");
      setNewPpRowInRack("");
      setNewPpRackId("");
      setNewPpTotalPorts(1);
      setNewPpDesc("");
      setNewPpUnitsOccupied(1); // NEW: Reset units_occupied

      setNewSwitchName("");
      setNewSwitchIp("");
      setNewSwitchLocationId("");
      setNewSwitchRowInRack("");
      setNewSwitchRackId("");
      setNewSwitchTotalPorts(1);
      setNewSwitchSourcePort("");
      setNewSwitchModel("");
      setNewSwitchDesc("");
      setNewSwitchUsage("");
      setNewSwitchUnitsOccupied(1); // NEW: Reset units_occupied

      fetchAvailablePcs(); // Re-fetch available PCs when not editing (now this uses the current state of pcs/connections)
    }
  }, [editingConnection, pcs, connections, switches, fetchAvailablePcs]); // Added pcs and connections to dependencies

  // Effect to automatically select a newly created PC and move to step 2
  const lastCreatedPcIdRef = useRef(null);
  useEffect(() => {
    if (
      lastCreatedPcIdRef.current !== null &&
      availablePcsForConnection.some(
        (pc) => pc.id === lastCreatedPcIdRef.current
      )
    ) {
      setPcId(lastCreatedPcIdRef.current.toString());
      lastCreatedPcIdRef.current = null;
      setCurrentStep(2);
    }
  }, [availablePcsForConnection]);

  const handleHopLocationChange = (index, value) => {
    const updatedHops = [...hops];
    updatedHops[index].location_id = value;
    updatedHops[index].patch_panel_id = ""; // Clear selected patch panel when location changes
    setHops(updatedHops);
  };

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
        location_id: "",
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
    if (
      newCustomColor.trim() &&
      !cableColorOptions.includes(newCustomColor.trim())
    ) {
      setCableColorOptions((prev) => [...prev, newCustomColor.trim()].sort());
      setCableColor(newCustomColor.trim());
      setNewCustomColor("");
      setShowAddColorInput(false);
    } else if (cableColorOptions.includes(newCustomColor.trim())) {
      showMessage("Color already exists.", 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pcId || !switchId || !switchPort.trim()) {
      showMessage(
        "Please select a PC, Switch, and provide a Switch Port.",
        3000
      );
      return;
    }
    const allHopsValid = hops.every(
      (hop) =>
        hop.location_id && hop.patch_panel_id && hop.patch_panel_port.trim()
    );
    if (!allHopsValid) {
      showMessage(
        "Please fill out all location, patch panel, and port details for each hop.",
        3000
      );
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

    if (result.success) {
      setPcId("");
      setSwitchId("");
      setSelectedLocationIdForSwitch("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setCableColor("");
      setCableLabel("");
      setHops([]);
      setEditingConnection(null);
      setCurrentStep(1);
    }
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    setPcId("");
    setSwitchId("");
    setSelectedLocationIdForSwitch("");
    setSwitchPort("");
    setIsSwitchPortUp(true);
    setCableColor("");
    setCableLabel("");
    setHops([]);
    setCurrentStep(1);
  };

  const handleNewPcSaveAndContinue = async (e) => {
    e.preventDefault();
    if (!newPcName.trim()) {
      showMessage("PC Name is required.", 3000);
      return;
    }
    if (newPcIp && !ipRegex.test(newPcIp)) {
      showMessage(
        "Please enter a valid IP address for PC (e.g., 192.168.1.1).",
        5000
      );
      return;
    }

    // Validate rack fields if type is 'Server' for new PC creation
    if (newPcType === "Server") {
      if (!newPcRackId || newPcRowInRack === "" || newPcUnitsOccupied === "") {
        showMessage(
          "For Server type PCs, Rack, Starting Row in Rack, and Units Occupied are required.",
          5000
        );
        return;
      }
      const selectedRack = racks.find((r) => String(r.id) === newPcRackId);
      if (selectedRack) {
        const startRow = parseInt(newPcRowInRack);
        const units = parseInt(newPcUnitsOccupied);

        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`,
            5000
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          showMessage("Units Occupied must be a positive number.", 5000);
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          showMessage(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`,
            5000
          );
          return;
        }
      }
    }

    try {
      const result = await onAddEntity("pcs", {
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
        row_in_rack: newPcType === "Server" ? parseInt(newPcRowInRack) : null, // Parse to int
        rack_id: newPcType === "Server" ? parseInt(newPcRackId) : null,
        units_occupied:
          newPcType === "Server" ? parseInt(newPcUnitsOccupied) : 1, // Parse to int
      });

      if (result.success && result.entity) {
        lastCreatedPcIdRef.current = result.entity.id;
        // No explicit fetchAvailablePcs() here,
        // but the useEffect that depends on `pcs` prop will trigger it.
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
        setNewPcRowInRack("");
        setNewPcRackId("");
        setNewPcUnitsOccupied(1);
        setIsNewPcExpanded(false);
      }
    } catch (error) {
      // showMessage handled by onAddEntity
    }
  };

  const handleAddPp = async (e) => {
    e.preventDefault();
    if (!newPpName.trim() || !newPpLocationId) {
      showMessage("Patch Panel Name and Location are required.", 3000);
      return;
    }

    if (newPpRackId && (newPpRowInRack === "" || newPpUnitsOccupied === "")) {
      showMessage(
        "For rack-mounted Patch Panels, Starting Row in Rack and Units Occupied are required.",
        5000
      );
      return;
    }
    if (newPpRackId) {
      const selectedRack = racks.find((r) => String(r.id) === newPpRackId);
      if (selectedRack) {
        const startRow = parseInt(newPpRowInRack);
        const units = parseInt(newPpUnitsOccupied);

        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`,
            5000
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          showMessage("Units Occupied must be a positive number.", 5000);
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          showMessage(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`,
            5000
          );
          return;
        }
      }
    }

    try {
      await onAddEntity("patch_panels", {
        name: newPpName,
        location_id: parseInt(newPpLocationId),
        row_in_rack: newPpRackId ? parseInt(newPpRowInRack) : null,
        rack_id: newPpRackId ? parseInt(newPpRackId) : null,
        units_occupied: newPpRackId ? parseInt(newPpUnitsOccupied) : 1,
        total_ports: parseInt(newPpTotalPorts),
        description: newPpDesc,
      });
      setNewPpName("");
      setNewPpLocationId("");
      setNewPpRowInRack("");
      setNewPpRackId("");
      setNewPpUnitsOccupied(1);
      setNewPpTotalPorts(1);
      setNewPpDesc("");
      setIsNewPpExpanded(false);
    } catch (error) {
      showMessage(`Error adding patch panel: ${error.message}`, 5000);
    }
  };

  const handleAddSwitch = async (e) => {
    e.preventDefault();
    if (!newSwitchName.trim() || !newSwitchLocationId) {
      showMessage("Switch Name and Location are required.", 3000);
      return;
    }
    if (newSwitchIp && !ipRegex.test(newSwitchIp)) {
      showMessage(
        "Please enter a valid IP address for Switch (e.g., 192.168.1.1).",
        5000
      );
      return;
    }

    if (
      newSwitchRackId &&
      (newSwitchRowInRack === "" || newSwitchUnitsOccupied === "")
    ) {
      showMessage(
        "For rack-mounted Switches, Starting Row in Rack and Units Occupied are required.",
        5000
      );
      return;
    }
    if (newSwitchRackId) {
      const selectedRack = racks.find((r) => String(r.id) === newSwitchRackId);
      if (selectedRack) {
        const startRow = parseInt(newSwitchRowInRack);
        const units = parseInt(newSwitchUnitsOccupied);

        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`,
            5000
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          showMessage("Units Occupied must be a positive number.", 5000);
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          showMessage(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`,
            5000
          );
          return;
        }
      }
    }

    try {
      await onAddEntity("switches", {
        name: newSwitchName,
        ip_address: newSwitchIp,
        location_id: parseInt(newSwitchLocationId),
        row_in_rack: newSwitchRackId ? parseInt(newSwitchRowInRack) : null,
        rack_id: newSwitchRackId ? parseInt(newSwitchRackId) : null,
        units_occupied: newSwitchRackId ? parseInt(newSwitchUnitsOccupied) : 1,
        total_ports: parseInt(newSwitchTotalPorts),
        source_port: newSwitchSourcePort,
        model: newSwitchModel,
        description: newSwitchDesc,
        usage: newSwitchUsage,
      });
      setNewSwitchName("");
      setNewSwitchIp("");
      setNewSwitchLocationId("");
      setNewSwitchRowInRack("");
      setNewSwitchRackId("");
      setNewSwitchUnitsOccupied(1);
      setNewSwitchTotalPorts(1);
      setNewSwitchSourcePort("");
      setNewSwitchModel("");
      setNewSwitchDesc("");
      setNewSwitchUsage("");
      setIsNewSwitchExpanded(false);
    } catch (error) {
      showMessage(`Error adding switch: ${error.message}`, 5000);
    }
  };

  const getPortStatusSummary = useCallback(
    (entityType, entityId) => {
      const entity = (entityType === "switches" ? switches : patchPanels).find(
        (e) => e.id === parseInt(entityId)
      );

      if (!entity) {
        return null;
      }

      let connectedCount = 0;
      if (entityType === "switches") {
        const connectedPorts = new Set(
          connections
            .filter((c) => c.switch_id === entity.id)
            .map((c) => c.switch_port)
        );
        connectedCount = connectedPorts.size;
      } else {
        // entityType === 'patch_panels'
        const connectedPortsSet = new Set();
        connections.forEach((connection) => {
          if (connection.hops && Array.isArray(connection.hops)) {
            connection.hops.forEach((hop) => {
              if (hop.patch_panel && hop.patch_panel.id === entity.id) {
                connectedPortsSet.add(hop.patch_panel_port);
              }
            });
          }
        });
        connectedCount = connectedPortsSet.size;
      }

      const availableCount = (entity.total_ports || 0) - connectedCount;

      return { connected: connectedCount, available: availableCount };
    },
    [switches, patchPanels, connections]
  );

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      {/* PC Selection / Creation Step */}
      {currentStep === 1 && (
        <section className="p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center">
            <Laptop size={24} className="mr-2" /> Step 1: Select or Create PC
          </h2>

          {/* Select Existing PC */}
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              Select Existing PC:
            </h3>
            <label
              htmlFor="pc-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Choose from existing PCs:
            </label>
            <select
              id="pc-select"
              value={pcId}
              onChange={(e) => {
                if (e.target.value === "add-new-pc") {
                  setIsNewPcExpanded(true);
                  // Scroll to the new PC creation section
                  document
                    .getElementById("new-pc-creation-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setPcId(""); // Clear current selection
                } else {
                  setPcId(e.target.value);
                  setCurrentStep(2); // Advance to step 2 after selecting existing PC
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required={currentStep === 1 && !isNewPcExpanded} // Required only if not creating new PC
            >
              <option value="">-- Select a PC --</option>
              {availablePcsForConnection.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name} ({pc.ip_address || "No IP"}){" "}
                  {pc.multi_port ? "(Multi-Port)" : "(Single-Port)"}
                </option>
              ))}
              <option value="add-new-pc" className="italic text-blue-600">
                -- Add New PC --
              </option>
            </select>
            {availablePcsForConnection.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No available PCs. Create a new one below.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Create New PC Section (Collapsible) */}
          <div
            id="new-pc-creation-section"
            className="bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <div
              className="flex justify-between items-center p-5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 rounded-t-lg"
              onClick={() => setIsNewPcExpanded(!isNewPcExpanded)}
            >
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
                <PlusCircle size={20} className="mr-2" /> Create New PC
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
              <form
                onSubmit={handleNewPcSaveAndContinue}
                className="p-5 space-y-3"
              >
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
                  onChange={(e) => {
                    setNewPcType(e.target.value);
                    // Clear rack/row/units if switching from Server to Workstation
                    if (e.target.value === "Workstation") {
                      setNewPcRackId("");
                      setNewPcRowInRack("");
                      setNewPcUnitsOccupied(1);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Workstation">Workstation</option>
                  <option value="Server">Server</option>
                </select>

                {/* Conditional Rack, Row, and Units Occupied fields for Server type PCs */}
                {newPcType === "Server" && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Columns size={20} className="text-gray-500" />
                      <select
                        value={newPcRackId}
                        onChange={(e) => setNewPcRackId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required={newPcType === "Server"}
                      >
                        <option value="">-- Select Rack --</option>
                        {sortedRacks.map((rack) => (
                          <option key={rack.id} value={rack.id}>
                            {rack.name} ({rack.location_name}
                            {rack.location?.door_number &&
                              ` (Door: ${rack.location.door_number})`}
                            )
                          </option>
                        ))}
                      </select>
                    </div>
                    {racks.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No racks available. Add some in the Racks tab.
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Server size={20} className="text-gray-500" />
                      <input
                        type="number" // Changed to number input
                        placeholder="Starting Row in Rack (e.g., 1)"
                        value={newPcRowInRack}
                        onChange={(e) => setNewPcRowInRack(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required={newPcType === "Server"}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <HardDrive size={20} className="text-gray-500" />
                      <input
                        type="number" // Changed to number input
                        placeholder="Units Occupied (e.g., 1, 2, 4)"
                        value={newPcUnitsOccupied}
                        onChange={(e) => setNewPcUnitsOccupied(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required={newPcType === "Server"}
                      />
                    </div>
                  </>
                )}

                <input
                  type="text"
                  placeholder="Operating System (Optional)"
                  value={newPcOs}
                  onChange={(e) => setNewPcOs(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Model (Optional)"
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
                <select // PC Usage dropdown
                  value={newPcUsage}
                  onChange={(e) => setNewPcUsage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Usage (Optional) --</option>
                  {usageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  {/* Option to add custom usage - would require a separate input field to appear */}
                  {/* <option value="other">Add Custom Usage...</option> */}
                </select>
                {newPcUsage === "other" && (
                  <input
                    type="text"
                    placeholder="Enter custom usage"
                    onBlur={(e) => {
                      const customUsage = e.target.value.trim();
                      if (customUsage) {
                        if (!usageOptions.includes(customUsage)) {
                          usageOptions.push(customUsage); // Dynamically add to available options
                        }
                        setNewPcUsage(customUsage);
                      } else {
                        setNewPcUsage(""); // Reset if input is cleared
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
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
                  Save PC and Continue
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Connection Details Step */}
      {currentStep === 2 && (
        <section className="p-6 bg-white rounded-lg shadow-md border border-blue-200">
          <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center">
            <ArrowRight size={24} className="mr-2" /> Step 2: Connection Details
          </h2>

          <div className="mb-6 flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
            <span className="font-semibold text-gray-700">Selected PC:</span>
            {pcId ? (
              <span className="text-blue-600 font-medium">
                {availablePcsForConnection.find(
                  (pc) => pc.id === parseInt(pcId)
                )?.name || "N/A"}
              </span>
            ) : (
              <span className="text-red-500">No PC selected</span>
            )}
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                // Optionally clear pcId if you want to force re-selection
                // setPcId("");
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Change PC
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Filter for Switch */}
              <div>
                <label
                  htmlFor="switch-location-filter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  <MapPin
                    size={16}
                    className="inline-block mr-1 text-gray-500"
                  />
                  Filter Switches by Location:
                </label>
                <select
                  id="switch-location-filter"
                  value={selectedLocationIdForSwitch}
                  onChange={(e) =>
                    setSelectedLocationIdForSwitch(e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- All Locations --</option>
                  {sortedLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}{" "}
                      {loc.door_number && `(Door: ${loc.door_number})`}
                    </option>
                  ))}
                </select>
                {locations.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Please add locations first.
                  </p>
                )}
              </div>

              {/* Switch Selection (now filtered by location) */}
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
                  onChange={async (e) => {
                    if (e.target.value === "add-new-switch") {
                      setIsNewSwitchExpanded(true);
                      document
                        .getElementById("new-switch-creation-section")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      setSwitchId(""); // Clear current selection
                    } else {
                      setSwitchId(e.target.value);
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select a Switch --</option>
                  {filteredSwitchesByLocation.length > 0 ? (
                    filteredSwitchesByLocation.map((_switch) => (
                      <option key={_switch.id} value={_switch.id}>
                        {_switch.name} ({_switch.ip_address})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No switches found for selected location or no switches
                      added.
                    </option>
                  )}
                  <option
                    value="add-new-switch"
                    className="italic text-red-600"
                  >
                    -- Add New Switch --
                  </option>
                </select>
                {switches.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    Please add a Switch first.
                  </p>
                )}
                {/* Port Status Summary for Selected Switch */}
                {switchId &&
                  switches.length > 0 &&
                  getPortStatusSummary("switches", switchId) && (
                    <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                      <span className="flex items-center">
                        <Wifi size={14} className="text-green-500 mr-1" />
                        Connected:{" "}
                        {getPortStatusSummary("switches", switchId).connected}
                      </span>
                      <span className="flex items-center">
                        <CircleDot size={14} className="text-gray-500 mr-1" />
                        Available:{" "}
                        {getPortStatusSummary("switches", switchId).available}
                      </span>
                      <button
                        type="button"
                        onClick={() => onShowPortStatus("switches", switchId)}
                        className="text-blue-500 hover:underline ml-auto"
                      >
                        View Details
                      </button>
                    </div>
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
              </div>

              {/* Main Connection Cable Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full border-t pt-4 mt-4 border-gray-100">
                <h4 className="text-lg font-semibold text-blue-700 col-span-full flex items-center mb-2">
                  <Cable size={20} className="mr-2" /> Connection Cable Details
                </h4>
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
                          if (e.key === "Enter") {
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
            <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <Split size={20} className="mr-2" /> Patch Panel Hops (in
                sequence)
              </h4>

              {hops.length === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center mb-4">
                  Click "Add Patch Panel Hop" to start building the path.
                </p>
              )}
              {hops.map((hop, index) => {
                // Filter patch panels based on THIS hop's selected location
                const filteredPatchPanelsForThisHop = hop.location_id
                  ? patchPanels.filter(
                      (pp) => String(pp.location_id) === hop.location_id
                    )
                  : patchPanels;

                // Sort racks by name for dropdown
                const sortedRacksForPp = Array.isArray(racks)
                  ? [...racks].sort((a, b) => a.name.localeCompare(b.name))
                  : [];

                return (
                  <div
                    key={index}
                    // Outer container for each hop.
                    // This div itself will be flex-col, containing two main "lines"
                    className="flex flex-col mb-4 p-3 border border-gray-100 rounded-md bg-white shadow-sm"
                  >
                    {/* First line: Location, Patch Panel, Port, Port Up */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-3 w-full mb-3">
                      {" "}
                      {/* Added mb-3 for spacing */}
                      <div className="flex-1 min-w-[150px] max-w-xs">
                        {" "}
                        {/* Location dropdown */}
                        <label
                          htmlFor={`hop-location-select-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          <MapPin
                            size={16}
                            className="inline-block mr-1 text-gray-500"
                          />
                          Location for Hop {index + 1}:
                        </label>
                        <select
                          id={`hop-location-select-${index}`}
                          value={hop.location_id}
                          onChange={(e) =>
                            handleHopLocationChange(index, e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        >
                          <option value="">-- Select Location --</option>
                          {sortedLocations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}{" "}
                              {loc.door_number && `(Door: ${loc.door_number})`}
                            </option>
                          ))}
                        </select>
                        {locations.length === 0 && (
                          <p className="text-sm text-red-500 mt-1">
                            Please add locations first.
                          </p>
                        )}
                      </div>
                      <div className="flex-grow min-w-[150px] max-w-xs">
                        {" "}
                        {/* Patch Panel select */}
                        <label
                          htmlFor={`pp-select-${index}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Patch Panel:
                        </label>
                        <select
                          id={`pp-select-${index}`}
                          value={hop.patch_panel_id}
                          onChange={async (e) => {
                            if (e.target.value === "add-new-pp") {
                              setIsNewPpExpanded(true);
                              document
                                .getElementById("new-pp-creation-section")
                                ?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                              handleHopPatchPanelChange(index, "");
                            } else {
                              handleHopPatchPanelChange(index, e.target.value);
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        >
                          <option value="">-- Select Patch Panel --</option>
                          {hop.location_id &&
                          filteredPatchPanelsForThisHop.length > 0 ? (
                            filteredPatchPanelsForThisHop.map((pp) => (
                              <option key={pp.id} value={pp.id}>
                                {pp.name} ({pp.location_name}
                                {pp.location?.door_number &&
                                  ` (Door: ${pp.location.door_number})`}
                                )
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              Select a location first or no patch panels found.
                            </option>
                          )}
                          <option
                            value="add-new-pp"
                            className="italic text-green-600"
                          >
                            -- Add New Patch Panel --
                          </option>
                        </select>
                        {!hop.location_id && (
                          <p className="text-sm text-gray-500 mt-1">
                            Select a location for this hop to see available
                            patch panels.
                          </p>
                        )}
                        {hop.location_id &&
                          filteredPatchPanelsForThisHop.length === 0 && (
                            <p className="text-sm text-red-500 mt-1">
                              No patch panels found in the selected location.
                            </p>
                          )}
                        {/* Port Status Summary for Selected Patch Panel */}
                        {hop.patch_panel_id &&
                          patchPanels.length > 0 &&
                          getPortStatusSummary(
                            "patch_panels",
                            hop.patch_panel_id
                          ) && (
                            <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                              <span className="flex items-center">
                                <Wifi
                                  size={14}
                                  className="text-green-500 mr-1"
                                />
                                Connected:{" "}
                                {
                                  getPortStatusSummary(
                                    "patch_panels",
                                    hop.patch_panel_id
                                  ).connected
                                }
                              </span>
                              <span className="flex items-center">
                                <CircleDot
                                  size={14}
                                  className="text-gray-500 mr-1"
                                />
                                Available:{" "}
                                {
                                  getPortStatusSummary(
                                    "patch_panels",
                                    hop.patch_panel_id
                                  ).available
                                }
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onShowPortStatus(
                                    "patch_panels",
                                    hop.patch_panel_id
                                  )
                                }
                                className="text-blue-500 hover:underline ml-auto"
                              >
                                View Details
                              </button>
                            </div>
                          )}
                      </div>
                      <div className="flex-none w-16">
                        {" "}
                        {/* Port input - fixed width */}
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
                          onChange={(e) =>
                            handleHopPortChange(index, e.target.value)
                          }
                          className="w-16 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        {" "}
                        {/* Port Up checkbox */}
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
                    </div>

                    {/* Second line: Cable Color, Cable Label, Remove Button */}
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-3 w-full mt-3 pt-3 border-t border-gray-100">
                      {" "}
                      {/* Added mt-3 pt-3 border-t for separation */}
                      <div className="flex-1 min-w-[120px]">
                        {" "}
                        {/* Cable Color */}
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
                                handleHopCableColorChange(
                                  index,
                                  e.target.value
                                );
                                setShowAddColorInput(false);
                              }
                            }}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="">-- Select Color --</option>
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
                              onChange={(e) =>
                                setNewCustomColor(e.target.value)
                              }
                              onBlur={handleAddCustomColor}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCustomColor();
                                }
                              }}
                              className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        {" "}
                        {/* Cable Label */}
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
                          onChange={(e) =>
                            handleHopCableLabelChange(index, e.target.value)
                          }
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
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addHop}
                className="w-full mt-2 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Patch Panel Hop
              </button>
            </div>

            {/* Create New Patch Panel Section (Collapsible) */}
            <div
              id="new-pp-creation-section"
              className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6"
            >
              <div
                className="flex justify-between items-center p-5 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors duration-200 rounded-t-lg"
                onClick={() => setIsNewPpExpanded(!isNewPpExpanded)}
              >
                <h3 className="text-lg font-semibold text-green-700 flex items-center">
                  <PlusCircle size={20} className="mr-2" /> Create New Patch
                  Panel
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
                    onChange={(e) => {
                      setNewPpLocationId(e.target.value);
                      setNewPpRackId(""); // Reset rack when location changes
                      setNewPpRowInRack(""); // Reset row
                      setNewPpUnitsOccupied(1); // Reset units
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Select Location --</option>
                    {sortedLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}{" "}
                        {loc.door_number && `(Door: ${loc.door_number})`}
                      </option>
                    ))}
                  </select>
                  {locations.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      Please add locations first.
                    </p>
                  )}
                  {/* Rack, Row, Units Occupied fields for Patch Panel */}
                  <div className="flex items-center space-x-2">
                    <Columns size={20} className="text-gray-500" />
                    <select
                      value={newPpRackId}
                      onChange={(e) => {
                        setNewPpRackId(e.target.value);
                        setNewPpRowInRack(""); // Reset row when rack changes
                        setNewPpUnitsOccupied(1); // Reset units
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Rack (Optional) --</option>
                      {sortedRacks
                        .filter(
                          (rack) =>
                            !newPpLocationId ||
                            (rack.location_id !== undefined &&
                              String(rack.location_id) === newPpLocationId)
                        )
                        .map((rack) => (
                          <option key={rack.id} value={rack.id}>
                            {rack.name} ({rack.location_name}
                            {rack.location?.door_number &&
                              ` (Door: ${rack.location.door_number})`}
                            )
                          </option>
                        ))}
                    </select>
                  </div>
                  {(racks.length === 0 ||
                    (newPpLocationId &&
                      sortedRacks.filter(
                        (rack) => String(rack.location_id) === newPpLocationId
                      ).length === 0)) && (
                    <p className="text-sm text-gray-500 mt-1">
                      No racks available for selected location.
                    </p>
                  )}
                  {newPpRackId && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Server size={20} className="text-gray-500" />
                        <input
                          type="number"
                          placeholder="Starting Row in Rack (e.g., 1)"
                          value={newPpRowInRack}
                          onChange={(e) => setNewPpRowInRack(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required={!!newPpRackId}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <HardDrive size={20} className="text-gray-500" />
                        <input
                          type="number"
                          placeholder="Units Occupied (e.g., 1, 2)"
                          value={newPpUnitsOccupied}
                          onChange={(e) =>
                            setNewPpUnitsOccupied(e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required={!!newPpRackId}
                        />
                      </div>
                    </>
                  )}
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
                    Create Patch Panel
                  </button>
                </form>
              </div>
            </div>

            {/* Create New Switch Section (Collapsible) */}
            <div
              id="new-switch-creation-section"
              className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6"
            >
              <div
                className="flex justify-between items-center p-5 cursor-pointer bg-red-50 hover:bg-red-100 transition-colors duration-200 rounded-t-lg"
                onClick={() => setIsNewSwitchExpanded(!isNewSwitchExpanded)}
              >
                <h3 className="text-lg font-semibold text-red-700 flex items-center">
                  <PlusCircle size={20} className="mr-2" /> Create New Switch
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
                    onChange={(e) => {
                      setNewSwitchLocationId(e.target.value);
                      setNewSwitchRackId(""); // Reset rack when location changes
                      setNewSwitchRowInRack(""); // Reset row
                      setNewSwitchUnitsOccupied(1); // Reset units
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">-- Select Location --</option>
                    {sortedLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}{" "}
                        {loc.door_number && `(Door: ${loc.door_number})`}
                      </option>
                    ))}
                  </select>
                  {locations.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      Please add locations first.
                    </p>
                  )}
                  {/* Rack, Row, Units Occupied fields for Switch */}
                  <div className="flex items-center space-x-2">
                    <Columns size={20} className="text-gray-500" />
                    <select
                      value={newSwitchRackId}
                      onChange={(e) => {
                        setNewSwitchRackId(e.target.value);
                        setNewSwitchRowInRack(""); // Reset row when rack changes
                        setNewSwitchUnitsOccupied(1); // Reset units
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select Rack (Optional) --</option>
                      {sortedRacks
                        .filter(
                          (rack) =>
                            !newSwitchLocationId ||
                            (rack.location_id !== undefined &&
                              String(rack.location_id) === newSwitchLocationId)
                        )
                        .map((rack) => (
                          <option key={rack.id} value={rack.id}>
                            {rack.name} ({rack.location_name}
                            {rack.location?.door_number &&
                              ` (Door: ${rack.location.door_number})`}
                            )
                          </option>
                        ))}
                    </select>
                  </div>
                  {(racks.length === 0 ||
                    (newSwitchLocationId &&
                      sortedRacks.filter(
                        (rack) =>
                          String(rack.location_id) === newSwitchLocationId
                      ).length === 0)) && (
                    <p className="text-sm text-gray-500 mt-1">
                      No racks available for selected location.
                    </p>
                  )}
                  {newSwitchRackId && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Server size={20} className="text-gray-500" />
                        <input
                          type="number"
                          placeholder="Starting Row in Rack (e.g., 1)"
                          value={newSwitchRowInRack}
                          onChange={(e) =>
                            setNewSwitchRowInRack(e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required={!!newSwitchRackId}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <HardDrive size={20} className="text-gray-500" />
                        <input
                          type="number"
                          placeholder="Units Occupied (e.g., 1, 2)"
                          value={newSwitchUnitsOccupied}
                          onChange={(e) =>
                            setNewSwitchUnitsOccupied(e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required={!!newSwitchRackId}
                        />
                      </div>
                    </>
                  )}
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
                  <select // New Switch Usage dropdown
                    value={newSwitchUsage}
                    onChange={(e) => setNewSwitchUsage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Usage (Optional) --</option>
                    {usageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    {/* <option value="other">Add Custom Usage...</option> */}
                  </select>
                  {newSwitchUsage === "other" && (
                    <input
                      type="text"
                      placeholder="Enter custom usage"
                      onBlur={(e) => {
                        const customUsage = e.target.value.trim();
                        if (customUsage) {
                          if (!usageOptions.includes(customUsage)) {
                            usageOptions.push(customUsage);
                          }
                          setNewSwitchUsage(customUsage);
                        } else {
                          setNewSwitchUsage("");
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
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
                    Create Switch
                  </button>
                </form>
              </div>
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
        </section>
      )}
    </div>
  );
});

export default ConnectionForm;
