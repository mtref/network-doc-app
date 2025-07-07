// /frontend/src/components/connection/useConnectionFormState.js
import { useState, useEffect, useCallback, useRef } from "react";

const ipRegex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
const usageOptions = [
  "Production",
  "Development",
  "Test",
  "Staging",
  "Backup",
  "Monitoring",
  "Other",
];

export const useConnectionFormState = ({
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
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pcId, setPcId] = useState("");
  const [switchPort, setSwitchPort] = useState("");
  const [isSwitchPortUp, setIsSwitchPortUp] = useState(true);
  const [switchId, setSwitchId] = useState("");
  const [hops, setHops] = useState([]);

  // Cable from Switch to last hop
  const [cableColor, setCableColor] = useState("");
  const [cableLabel, setCableLabel] = useState("");

  // Cable from PC to Wall Point
  const [wallPointLabel, setWallPointLabel] = useState("");
  // ADDED: State for the new wall point cable fields
  const [wallPointCableColor, setWallPointCableColor] = useState("");
  const [wallPointCableLabel, setWallPointCableLabel] = useState("");

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

  // State for the "Add New PC" form
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

  // State for the "Add New Patch Panel" form
  const [newPpName, setNewPpName] = useState("");
  const [newPpLocationId, setNewPpLocationId] = useState("");
  const [newPpRowInRack, setNewPpRowInRack] = useState("");
  const [newPpRackId, setNewPpRackId] = useState("");
  const [newPpTotalPorts, setNewPpTotalPorts] = useState(1);
  const [newPpDesc, setNewPpDesc] = useState("");
  const [newPpUnitsOccupied, setNewPpUnitsOccupied] = useState(1);

  // State for the "Add New Switch" form
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
  const [newSwitchUnitsOccupied, setNewSwitchUnitsOccupied] = useState(1);

  const lastCreatedPcIdRef = useRef(null);

  const fetchAvailablePcs = useCallback(async () => {
    try {
      const all_pcs = pcs;
      const all_connections = connections;
      const connected_single_port_pc_ids = new Set(
        all_connections
          .filter((conn) => conn.pc && !conn.pc.multi_port)
          .map((conn) => conn.pc.id)
      );
      const filteredPcs = all_pcs.filter(
        (pc) => pc.multi_port || !connected_single_port_pc_ids.has(pc.id)
      );
      setAvailablePcsForConnection(
        filteredPcs.sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error("Failed to filter available PCs on frontend:", error);
      showMessage(`Error filtering available PCs: ${error.message}`, 5000);
    }
  }, [pcs, connections, showMessage]);

  useEffect(() => {
    fetchAvailablePcs();
  }, [fetchAvailablePcs]);

  useEffect(() => {
    if (selectedLocationIdForSwitch) {
      const filtered = switches.filter(
        (s) => String(s.location_id) === selectedLocationIdForSwitch
      );
      setFilteredSwitchesByLocation(filtered);
    } else {
      setFilteredSwitchesByLocation(switches);
    }
    if (!editingConnection) {
      setSwitchId("");
    }
  }, [selectedLocationIdForSwitch, switches, editingConnection]);

  useEffect(() => {
    if (editingConnection) {
      setPcId(String(editingConnection.pc_id || ""));
      setSwitchId(String(editingConnection.switch_id || ""));
      setSelectedLocationIdForSwitch(
        String(editingConnection.switch?.location_id || "")
      );
      setSwitchPort(editingConnection.switch_port || "");
      setIsSwitchPortUp(editingConnection.is_switch_port_up ?? true);
      setCableColor(editingConnection.cable_color || "");
      setCableLabel(editingConnection.cable_label || "");
      setWallPointLabel(editingConnection.wall_point_label || "");
      // ADDED: Set new wall point cable fields when editing
      setWallPointCableColor(editingConnection.wall_point_cable_color || "");
      setWallPointCableLabel(editingConnection.wall_point_cable_label || "");
      setHops(
        editingConnection.hops.map((hop) => ({
          patch_panel_id: String(hop.patch_panel?.id || ""),
          patch_panel_port: hop.patch_panel_port || "",
          is_port_up: hop.is_port_up ?? true,
          cable_color: hop.cable_color || "",
          cable_label: hop.cable_label || "",
          location_id: String(hop.patch_panel?.location_id || ""),
        })) || []
      );

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
      // Reset all form states
      setCurrentStep(1);
      setPcId("");
      setSwitchId("");
      setSelectedLocationIdForSwitch("");
      setSwitchPort("");
      setIsSwitchPortUp(true);
      setCableColor("");
      setCableLabel("");
      setWallPointLabel("");
      // ADDED: Reset new wall point cable fields
      setWallPointCableColor("");
      setWallPointCableLabel("");
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
      setNewPcRowInRack("");
      setNewPcRackId("");
      setNewPcUnitsOccupied(1);
      setNewPpName("");
      setNewPpLocationId("");
      setNewPpRowInRack("");
      setNewPpRackId("");
      setNewPpTotalPorts(1);
      setNewPpDesc("");
      setNewPpUnitsOccupied(1);
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
      setNewSwitchUnitsOccupied(1);

      fetchAvailablePcs();
    }
  }, [editingConnection, fetchAvailablePcs, setEditingConnection]);

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

  const handleHopChange = (index, field, value) => {
    const updatedHops = [...hops];
    updatedHops[index][field] = value;
    if (field === "location_id") {
      updatedHops[index].patch_panel_id = "";
    }
    setHops(updatedHops);
  };

  const addHop = () =>
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
  const removeHop = (index) => setHops(hops.filter((_, i) => i !== index));

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
    if (
      hops.length > 0 &&
      !hops.every(
        (hop) =>
          hop.location_id && hop.patch_panel_id && hop.patch_panel_port.trim()
      )
    ) {
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
      wall_point_label: wallPointLabel,
      // ADDED: Include new wall point cable fields in submitted data
      wall_point_cable_color: wallPointCableColor,
      wall_point_cable_label: wallPointCableLabel,
      hops: hops.map((hop) => ({
        ...hop,
        patch_panel_id: parseInt(hop.patch_panel_id),
      })),
    };
    const result = editingConnection
      ? await onUpdateConnection(editingConnection.id, connectionData)
      : await onAddConnection(connectionData);
    if (result.success) {
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
  };

  const getPortStatusSummary = useCallback(
    (entityType, entityId) => {
      const entity = (entityType === "switches" ? switches : patchPanels).find(
        (e) => e.id === parseInt(entityId)
      );
      if (!entity) return null;
      let connectedCount = 0;
      if (entityType === "switches") {
        connectedCount = new Set(
          connections
            .filter((c) => c.switch_id === entity.id)
            .map((c) => c.switch_port)
        ).size;
      } else {
        const connectedPortsSet = new Set();
        connections.forEach((c) =>
          c.hops?.forEach(
            (h) =>
              h.patch_panel?.id === entity.id &&
              connectedPortsSet.add(h.patch_panel_port)
          )
        );
        connectedCount = connectedPortsSet.size;
      }
      return {
        connected: connectedCount,
        available: (entity.total_ports || 0) - connectedCount,
      };
    },
    [switches, patchPanels, connections]
  );

  return {
    state: {
      currentStep,
      pcId,
      switchPort,
      isSwitchPortUp,
      switchId,
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
      isNewPcExpanded,
      isNewPpExpanded,
      isNewSwitchExpanded,
      newPcName,
      newPcIp,
      newPcUsername,
      newPcInDomain,
      newPcOs,
      newPcModel,
      newPcOffice,
      newPcDesc,
      newPcMultiPort,
      newPcType,
      newPcUsage,
      newPcRowInRack,
      newPcRackId,
      newPcUnitsOccupied,
      newPpName,
      newPpLocationId,
      newPpRowInRack,
      newPpRackId,
      newPpTotalPorts,
      newPpDesc,
      newPpUnitsOccupied,
      newSwitchName,
      newSwitchIp,
      newSwitchLocationId,
      newSwitchRowInRack,
      newSwitchRackId,
      newSwitchTotalPorts,
      newSwitchSourcePort,
      newSwitchModel,
      newSwitchDesc,
      newSwitchUsage,
      newSwitchUnitsOccupied,
      editingConnection,
      ipRegex,
      usageOptions,
      locations,
      racks,
      patchPanels,
    },
    setters: {
      setCurrentStep,
      setPcId,
      setSwitchPort,
      setIsSwitchPortUp,
      setSwitchId,
      setHops,
      setCableColor,
      setCableLabel,
      setWallPointLabel,
      setWallPointCableColor,
      setWallPointCableLabel,
      setSelectedLocationIdForSwitch,
      setShowAddColorInput,
      setNewCustomColor,
      setIsNewPcExpanded,
      setIsNewPpExpanded,
      setIsNewSwitchExpanded,
      setNewPcName,
      setNewPcIp,
      setNewPcUsername,
      setNewPcInDomain,
      setNewPcOs,
      setNewPcModel,
      setNewPcOffice,
      setNewPcDesc,
      setNewPcMultiPort,
      setNewPcType,
      setNewPcUsage,
      setNewPcRowInRack,
      setNewPcRackId,
      setNewPcUnitsOccupied,
      setNewPpName,
      setNewPpLocationId,
      setNewPpRowInRack,
      setNewPpRackId,
      setNewPpTotalPorts,
      setNewPpDesc,
      setNewPpUnitsOccupied,
      setNewSwitchName,
      setNewSwitchIp,
      setNewSwitchLocationId,
      setNewSwitchRowInRack,
      setNewSwitchRackId,
      setNewSwitchTotalPorts,
      setNewSwitchSourcePort,
      setNewSwitchModel,
      setNewSwitchDesc,
      setNewSwitchUsage,
      setNewSwitchUnitsOccupied,
    },
    handlers: {
      handleHopChange,
      addHop,
      removeHop,
      handleAddCustomColor,
      handleSubmit,
      handleCancelEdit,
      getPortStatusSummary,
    },
    refs: {
      lastCreatedPcIdRef,
    },
  };
};
