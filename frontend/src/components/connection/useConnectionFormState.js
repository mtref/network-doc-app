// /frontend/src/components/connection/useConnectionFormState.js
// UPDATED: Added state management for the new switch location filter.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const ipRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
const usageOptions = [
  "Production",
  "Development",
  "Test",
  "Staging",
  "Backup",
  "Monitoring",
];

export const useConnectionFormState = (props) => {
  const {
    pcs,
    patchPanels,
    switches,
    connections,
    onAddConnection,
    onUpdateConnection,
    editingConnection,
    setEditingConnection,
    onAddEntity,
    showMessage,
    locations,
    racks,
  } = props;

  // --- Core State ---
  const [currentStep, setCurrentStep] = useState(1);
  const [pcId, setPcId] = useState("");
  const [switchId, setSwitchId] = useState("");
  const [switchPort, setSwitchPort] = useState("");
  const [isSwitchPortUp, setIsSwitchPortUp] = useState(true);
  const [hops, setHops] = useState([]);
  const [cableColor, setCableColor] = useState("");
  const [cableLabel, setCableLabel] = useState("");
  const [wallPointLabel, setWallPointLabel] = useState("");
  const [wallPointCableColor, setWallPointCableColor] = useState("");
  const [wallPointCableLabel, setWallPointCableLabel] = useState("");
  const [availablePcsForConnection, setAvailablePcsForConnection] = useState([]);
  const [cableColorOptions, setCableColorOptions] = useState([]);
  
  // NEW: State for the switch location filter
  const [selectedLocationIdForSwitch, setSelectedLocationIdForSwitch] = useState("");

  // --- State for Inline "Add New" Forms ---
  const [isNewPcExpanded, setIsNewPcExpanded] = useState(false);
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
  const [newPcUnitsOccupied, setNewPcUnitsOccupied] = useState(1);
  const [newPcSerialNumber, setNewPcSerialNumber] = useState("");
  const [newPcSpecification, setNewPcSpecification] = useState("");
  const [newPcMonitorModel, setNewPcMonitorModel] = useState("");
  const [newPcDiskInfo, setNewPcDiskInfo] = useState("");
  const [showNewPcCustomUsageInput, setShowNewPcCustomUsageInput] = useState(false);
  const [newPcCustomUsageValue, setNewPcCustomUsageValue] = useState("");

  const [isNewPpExpanded, setIsNewPpExpanded] = useState(false);
  const [newPpName, setNewPpName] = useState("");
  const [newPpLocationId, setNewPpLocationId] = useState("");
  const [newPpRowInRack, setNewPpRowInRack] = useState("");
  const [newPpRackId, setNewPpRackId] = useState("");
  const [newPpTotalPorts, setNewPpTotalPorts] = useState(24);
  const [newPpDesc, setNewPpDesc] = useState("");
  const [newPpUnitsOccupied, setNewPpUnitsOccupied] = useState(1);

  const [isNewSwitchExpanded, setIsNewSwitchExpanded] = useState(false);
  const [newSwitchName, setNewSwitchName] = useState("");
  const [newSwitchIp, setNewSwitchIp] = useState("");
  const [newSwitchLocationId, setNewSwitchLocationId] = useState("");
  const [newSwitchRowInRack, setNewSwitchRowInRack] = useState("");
  const [newSwitchRackId, setNewSwitchRackId] = useState("");
  const [newSwitchTotalPorts, setNewSwitchTotalPorts] = useState(24);
  const [newSwitchSourcePort, setNewSwitchSourcePort] = useState("");
  const [newSwitchModel, setNewSwitchModel] = useState("");
  const [newSwitchDesc, setNewSwitchDesc] = useState("");
  const [newSwitchUsage, setNewSwitchUsage] = useState("");
  const [newSwitchUnitsOccupied, setNewSwitchUnitsOccupied] = useState(1);

  const lastCreatedPcIdRef = useRef(null);

  useEffect(() => {
    const connectedSinglePortPcIds = new Set(
      connections.filter(c => c.pc && !c.pc.multi_port).map(c => c.pc.id)
    );
    let available = pcs.filter(pc => pc.multi_port || !connectedSinglePortPcIds.has(pc.id));
    if (editingConnection?.pc && !available.some(p => p.id === editingConnection.pc.id)) {
      available.push(editingConnection.pc);
    }
    setAvailablePcsForConnection(available.sort((a, b) => a.name.localeCompare(b.name)));
  }, [pcs, connections, editingConnection]);

  useEffect(() => {
    if (editingConnection) {
      setPcId(String(editingConnection.pc_id || ""));
      setSwitchId(String(editingConnection.switch_id || ""));
      setSelectedLocationIdForSwitch(String(editingConnection.switch?.location_id || ""));
      setSwitchPort(editingConnection.switch_port || "");
      setIsSwitchPortUp(editingConnection.is_switch_port_up ?? true);
      setCableColor(editingConnection.cable_color || "");
      setCableLabel(editingConnection.cable_label || "");
      setWallPointLabel(editingConnection.wall_point_label || "");
      setWallPointCableColor(editingConnection.wall_point_cable_color || "");
      setWallPointCableLabel(editingConnection.wall_point_cable_label || "");
      setHops(editingConnection.hops.map(hop => ({
          ...hop,
          patch_panel_id: String(hop.patch_panel?.id || ""),
          location_id: String(hop.patch_panel?.location_id || "")
      })) || []);
      setCurrentStep(2);
    }
  }, [editingConnection]);

  const handleHopChange = (index, field, value) => {
    const newHops = [...hops];
    newHops[index] = { ...newHops[index], [field]: value };
    if (field === "location_id") newHops[index].patch_panel_id = "";
    setHops(newHops);
  };

  const addHop = () => setHops(prev => [...prev, { location_id: "", patch_panel_id: "", patch_panel_port: "", is_port_up: true, cable_color: "", cable_label: "", sequence: prev.length }]);
  const removeHop = (index) => setHops(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const connectionData = {
        pc_id: parseInt(pcId), switch_id: parseInt(switchId), switch_port: switchPort,
        is_switch_port_up: isSwitchPortUp, cable_color: cableColor, cable_label: cableLabel,
        wall_point_label: wallPointLabel, wall_point_cable_color: wallPointCableColor,
        wall_point_cable_label: wallPointCableLabel,
        hops: hops.map((hop, index) => ({ ...hop, patch_panel_id: parseInt(hop.patch_panel_id), sequence: hop.sequence ?? index })),
    };
    const result = editingConnection
        ? await onUpdateConnection(editingConnection.id, connectionData)
        : await onAddConnection(connectionData);
    
    if (result.success) {
      setEditingConnection(null);
      setCurrentStep(1);
      setPcId("");
      setSwitchId("");
      setSwitchPort("");
      setHops([]);
      // ... reset other fields
    }
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    setCurrentStep(1);
    setPcId("");
    // ... reset all other state fields
  };

  return {
    state: {
      currentStep, pcId, switchId, switchPort, isSwitchPortUp, hops, cableColor, cableLabel, wallPointLabel, wallPointCableColor, wallPointCableLabel,
      availablePcsForConnection, switches, patchPanels, locations, racks, cableColorOptions, editingConnection,
      isNewPcExpanded, newPcName, newPcIp, newPcUsername, newPcInDomain, newPcOs, newPcModel, newPcOffice, newPcDesc, newPcMultiPort, newPcType, newPcUsage, newPcRowInRack, newPcRackId, newPcUnitsOccupied, newPcSerialNumber, newPcSpecification, newPcMonitorModel, newPcDiskInfo, showNewPcCustomUsageInput, newPcCustomUsageValue,
      isNewPpExpanded, newPpName, newPpLocationId, newPpRowInRack, newPpRackId, newPpTotalPorts, newPpDesc, newPpUnitsOccupied,
      isNewSwitchExpanded, newSwitchName, newSwitchIp, newSwitchLocationId, newSwitchRowInRack, newSwitchRackId, newSwitchTotalPorts, newSwitchSourcePort, newSwitchModel, newSwitchDesc, newSwitchUsage, newSwitchUnitsOccupied,
      ipRegex, usageOptions,
      selectedLocationIdForSwitch, // Pass down the new state
    },
    setters: {
      setCurrentStep, setPcId, setSwitchId, setSwitchPort, setIsSwitchPortUp, setHops, setCableColor, setCableLabel, setWallPointLabel, setWallPointCableColor, setWallPointCableLabel, setCableColorOptions,
      setIsNewPcExpanded, setNewPcName, setNewPcIp, setNewPcUsername, setNewPcInDomain, setNewPcOs, setNewPcModel, setNewPcOffice, setNewPcDesc, setNewPcMultiPort, setNewPcType, setNewPcUsage, setNewPcRowInRack, setNewPcRackId, setNewPcUnitsOccupied, setNewPcSerialNumber, setNewPcSpecification, setNewPcMonitorModel, setNewPcDiskInfo, setShowNewPcCustomUsageInput, setNewPcCustomUsageValue,
      setIsNewPpExpanded, setNewPpName, setNewPpLocationId, setNewPpRowInRack, setNewPpRackId, setNewPpTotalPorts, setNewPpDesc, setNewPpUnitsOccupied,
      setIsNewSwitchExpanded, setNewSwitchName, setNewSwitchIp, setNewSwitchLocationId, setNewSwitchRowInRack, setNewSwitchRackId, setNewSwitchTotalPorts, setNewSwitchSourcePort, setNewSwitchModel, setNewSwitchDesc, setNewSwitchUsage, setNewSwitchUnitsOccupied,
      setSelectedLocationIdForSwitch, // Pass down the new setter
    },
    handlers: {
      handleHopChange, addHop, removeHop, handleSubmit, handleCancelEdit
    },
    refs: { lastCreatedPcIdRef }
  };
};
