// frontend/src/components/SwitchDiagramModal.js
// This component displays a modal with an interactive diagram of a selected switch
// using React Flow. It now explicitly shows Patch Panel nodes for connections that
// pass through them, creating a more detailed and accurate network path.

import React, { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  XCircle,
  Server,
  Laptop,
  Plug,
  Wifi,
  WifiOff,
  Network,
  Split,
  HardDrive,
} from "lucide-react"; // Added HardDrive for Patch Panel icon

// Custom Node for Switch
const SwitchNode = ({ data }) => {
  return (
    <div
      className="bg-red-600 text-white p-3 rounded-full shadow-lg flex flex-col items-center justify-center border-2 border-red-800"
      style={{ width: "80px", height: "80px" }}
    >
      <Server size={32} />
      <div className="text-xs font-bold mt-1 text-center truncate w-full px-1">
        {data.label}
      </div>
    </div>
  );
};

// Custom Node for PC
const PcNode = ({ data }) => {
  return (
    <div
      className="bg-indigo-600 text-white p-3 rounded-full shadow-lg flex flex-col items-center justify-center border-2 border-indigo-800"
      style={{ width: "70px", height: "70px" }}
    >
      <Laptop size={28} />
      <div className="text-xs font-bold mt-1 text-center truncate w-full px-1">
        {data.label}
      </div>
      {data.isPortUp !== undefined && (
        <div className="absolute -bottom-2 right-0 bg-white rounded-full p-0.5 shadow-md">
          {data.isPortUp ? (
            <Wifi size={16} className="text-green-500" title="Port Up" />
          ) : (
            <WifiOff size={16} className="text-red-500" title="Port Down" />
          )}
        </div>
      )}
    </div>
  );
};

// Custom Node for Patch Panel
const PatchPanelNode = ({ data }) => {
  return (
    <div
      className="bg-green-600 text-white p-3 rounded-full shadow-lg flex flex-col items-center justify-center border-2 border-green-800"
      style={{ width: "70px", height: "70px" }}
    >
      <Split size={28} /> {/* Using Split icon for Patch Panel */}
      <div className="text-xs font-bold mt-1 text-center truncate w-full px-1">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  switchNode: SwitchNode,
  pcNode: PcNode,
  patchPanelNode: PatchPanelNode, // Register the new node type
};

function SwitchDiagramModal({
  isOpen,
  onClose,
  selectedSwitch,
  connections,
  pcs,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const { fitView } = useReactFlow();

  // Define relevantConnections at the component level or within useEffect,
  // but if needed outside useEffect for rendering logic, it needs to be state or derived.
  // For simplicity and direct debugging, let's derive it in useEffect and use its values.
  const [currentRelevantConnections, setCurrentRelevantConnections] = useState(
    []
  );

  console.log(
    "SwitchDiagramModal: Component rendered. isOpen:",
    isOpen,
    "selectedSwitch:",
    selectedSwitch
  );

  useEffect(() => {
    console.log("SwitchDiagramModal: useEffect triggered.");
    if (!isOpen || !selectedSwitch) {
      console.log(
        "SwitchDiagramModal: Modal is not open or no switch selected. Resetting nodes/edges."
      );
      setNodes([]);
      setEdges([]);
      setCurrentRelevantConnections([]); // Also reset this state
      return;
    }

    console.log("SwitchDiagramModal: Processing data for diagram...");
    const newNodes = [];
    const newEdges = [];
    // const addedPatchPanels = new Set(); // Not currently used, can remove or keep for future optimization

    // Add the central Switch node
    const switchNodeId = String(selectedSwitch.id);
    const centralSwitchNode = {
      id: switchNodeId,
      type: "switchNode",
      data: { label: selectedSwitch.name, switchData: selectedSwitch },
      position: { x: 0, y: 0 }, // Central position
      draggable: true,
    };
    newNodes.push(centralSwitchNode);
    console.log("SwitchDiagramModal: Added Switch Node:", centralSwitchNode);

    // Filter connections relevant to the selected switch
    const relevantConnections = connections.filter(
      (conn) => conn.switch_id === selectedSwitch.id
    );
    // Update state for access outside useEffect
    setCurrentRelevantConnections(relevantConnections);

    console.log(
      "SwitchDiagramModal: Relevant connections (filtered by switch ID):",
      relevantConnections
    );

    // Process each relevant connection
    relevantConnections.forEach((conn, connIndex) => {
      const pc = pcs.find((p) => p.id === conn.pc_id);
      if (!pc) {
        console.warn(
          `SwitchDiagramModal: PC with ID ${conn.pc_id} not found for connection ${conn.id}. Skipping.`
        );
        return;
      }

      // Determine the path for this connection (Switch -> PP1 -> PP2 -> ... -> PC)
      const pathNodes = [];
      pathNodes.push({ id: switchNodeId, type: "switch" }); // Start with the switch

      conn.hops.forEach((hop) => {
        const patchPanel = hop.patch_panel;
        if (patchPanel) {
          pathNodes.push({
            id: `pp-${patchPanel.id}`,
            type: "patchPanel",
            data: patchPanel,
            hopData: hop,
          });
        }
      });
      pathNodes.push({
        id: `pc-${pc.id}-${conn.id}`,
        type: "pc",
        data: pc,
        connData: conn,
      }); // End with the PC (unique ID for PC per connection)

      // Calculate positions for nodes in this path
      // Simple linear layout for now, radiating from switch
      const totalPathSegments = pathNodes.length - 1;
      const segmentLength = 150; // Distance between nodes in a segment
      const baseAngle =
        ((2 * Math.PI) / relevantConnections.length) * connIndex; // Angle for this connection's path

      pathNodes.forEach((nodeInfo, nodeIndex) => {
        const nodeId = nodeInfo.id;
        const nodeType = nodeInfo.type;
        let nodeLabel = "";
        let nodeComponentType = "";
        let nodeData = {};
        let nodeIsPortUp = true; // Default for intermediate nodes

        if (nodeType === "switch") {
          nodeLabel = selectedSwitch.name;
          nodeComponentType = "switchNode";
          nodeData = selectedSwitch;
        } else if (nodeType === "pc") {
          nodeLabel = pc.name;
          nodeComponentType = "pcNode";
          nodeData = pc;
          nodeIsPortUp = conn.is_switch_port_up;
        } else if (nodeType === "patchPanel") {
          nodeLabel = nodeInfo.data.name;
          nodeComponentType = "patchPanelNode";
          nodeData = nodeInfo.data;
          nodeIsPortUp = nodeInfo.hopData.is_port_up;
        }

        // Calculate position: radiating outwards from the center (0,0)
        // Adjust radius based on segment index
        const currentRadius = nodeIndex * segmentLength;
        const x = currentRadius * Math.cos(baseAngle);
        const y = currentRadius * Math.sin(baseAngle);

        // Add node if not already present (for shared patch panels)
        if (!newNodes.some((n) => n.id === nodeId)) {
          newNodes.push({
            id: nodeId,
            type: nodeComponentType,
            data: { label: nodeLabel, ...nodeData, isPortUp: nodeIsPortUp },
            position: { x: x - 35, y: y - 35 }, // Adjust for node size
            draggable: true,
          });
          console.log(
            `SwitchDiagramModal: Added node:`,
            newNodes[newNodes.length - 1]
          );
        }
      });

      // Create edges for the path
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const sourceNode = pathNodes[i];
        const targetNode = pathNodes[i + 1];
        // const isLastSegment = i === pathNodes.length - 2; // Not used

        let edgeLabel = "";
        // FORCED DEBUG STYLES
        let edgeColor = "purple"; // DEBUG COLOR
        let edgeStyle = { stroke: "purple", strokeWidth: 10 }; // DEBUG STYLE

        // Determine edge properties based on source and target node types
        // Original logic for edgeLabel is kept, but color/style are overridden for debugging
        if (sourceNode.type === "switch" && targetNode.type === "patchPanel") {
          const hop = conn.hops[0];
          edgeLabel = `Port: ${hop.patch_panel_port}`;
          // edgeAnimated = !hop.is_port_up; // Original, now forced false
          // edgeColor = hop.is_port_up ? "lime" : "orange"; // Original, now forced purple
          // edgeStyle = { stroke: edgeColor, strokeWidth: 5, strokeDasharray: "10 10", }; // Original, now forced purple/10
        } else if (
          sourceNode.type === "patchPanel" &&
          targetNode.type === "patchPanel"
        ) {
          const hopIndex = conn.hops.findIndex(
            (h) => `pp-${h.patch_panel.id}` === sourceNode.id
          );
          const hop = conn.hops[hopIndex + 1];
          if (hop) {
            edgeLabel = `Port: ${hop.patch_panel_port}`;
            // edgeAnimated = !hop.is_port_up; // Original, now forced false
            // edgeColor = hop.is_port_up ? "lime" : "orange"; // Original, now forced purple
            // edgeStyle = { stroke: edgeColor, strokeWidth: 5, strokeDasharray: "10 10", }; // Original, now forced purple/10
          }
        } else if (
          sourceNode.type === "patchPanel" &&
          targetNode.type === "pc"
        ) {
          edgeLabel = `Switch Port: ${conn.switch_port}`;
          // edgeAnimated = !conn.is_switch_port_up; // Original, now forced false
          // edgeColor = conn.is_switch_port_up ? "lime" : "orange"; // Original, now forced purple
          // edgeStyle = { stroke: edgeColor, strokeWidth: 5 }; // Original, now forced purple/10
        } else if (sourceNode.type === "switch" && targetNode.type === "pc") {
          // Direct Switch to PC connection (no hops)
          edgeLabel = `Port: ${conn.switch_port}`;
          // edgeAnimated = !conn.is_switch_port_up; // Original, now forced false
          // edgeColor = conn.is_switch_port_up ? "lime" : "orange"; // Original, now forced purple
          // edgeStyle = { stroke: edgeColor, strokeWidth: 5 }; // Original, now forced purple/10
        }

        newEdges.push({
          id: `e-${sourceNode.id}-${targetNode.id}-${conn.id}`, // Unique edge ID including connection ID
          source: sourceNode.id,
          target: targetNode.id,
          type: "default", // Changed to default for simplicity
          label: edgeLabel,
          animated: false, // Turned off for debugging
          style: edgeStyle, // Use aggressive debug style
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
          data: {
            /* ... edge specific data ... */
          },
        });
        console.log(
          `SwitchDiagramModal: Added edge:`,
          newEdges[newEdges.length - 1]
        );
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);

    // Add the console.logs here, after setNodes and setEdges have been called
    console.log("Final Nodes state for React Flow:", newNodes);
    console.log("Final Edges state for React Flow:", newEdges);

    const fitViewTimeout = setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 50);

    return () => {
      clearTimeout(fitViewTimeout);
    };
  }, [isOpen, selectedSwitch, connections, pcs, setNodes, setEdges, fitView]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Network size={24} className="mr-2" /> Network Diagram:{" "}
            {selectedSwitch?.name || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Close Diagram"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* React Flow Diagram Area */}
        {isOpen && selectedSwitch ? (
          <div
            className="flex-grow w-full bg-gray-100 reactflow-container"
            style={{ height: "500px" }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <MiniMap />
              <Controls />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          </div>
        ) : (
          <div
            className="flex-grow w-full flex items-center justify-center bg-gray-100"
            style={{ height: "500px" }}
          >
            <p className="text-xl text-gray-600">
              Select a switch to view its network diagram.
            </p>
          </div>
        )}

        {/* Conditional message for no connections */}
        {/* Check currentRelevantConnections instead of nodes.length for connections-related message */}
        {isOpen &&
          selectedSwitch &&
          currentRelevantConnections.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-xl text-gray-600">
              No connections found for this switch to display in diagram.
            </p>
          )}

        {/* Footer for status legend */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-center flex justify-center gap-4 flex-wrap flex-shrink-0">
          <div className="flex items-center">
            <Plug size={16} className="text-green-500 mr-1" /> Port Up
          </div>
          <div className="flex items-center">
            <WifiOff size={16} className="text-red-500 mr-1" /> Port Down
          </div>
          <div className="flex items-center">
            <Server size={16} className="text-red-500 mr-1" /> Switch
          </div>
          <div className="flex items-center">
            <Laptop size={16} className="text-indigo-500 mr-1" /> PC
          </div>
          <div className="flex items-center">
            <Split size={16} className="text-gray-500 mr-1" /> Via Patch Panel
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwitchDiagramModal;
