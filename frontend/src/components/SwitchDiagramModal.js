// frontend/src/components/SwitchDiagramModal.js
// This component displays a modal with an interactive diagram of a selected switch
// using React Flow. It shows the central switch and all connected PCs (direct or via patch panels).

import React, { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css"; // Import React Flow styles
import {
  XCircle,
  Server,
  Laptop,
  Plug,
  Wifi,
  WifiOff,
  Network,
  Split,
} from "lucide-react";

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

const nodeTypes = {
  switchNode: SwitchNode,
  pcNode: PcNode,
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

  useEffect(() => {
    if (!isOpen || !selectedSwitch) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = [];
    const newEdges = [];

    // Add the central Switch node
    newNodes.push({
      id: String(selectedSwitch.id),
      type: "switchNode",
      data: { label: selectedSwitch.name, switchData: selectedSwitch },
      position: { x: 300, y: 150 }, // Central position
      draggable: true,
    });

    // Find all PCs connected to this switch
    const connectedPcsInfo = connections.filter(
      (conn) => conn.switch_id === selectedSwitch.id
    );

    // Filter out connections that have a hop to a patch panel
    // These connections are for direct PC-to-Switch or PC-to-PatchPanel-to-Switch (single hop) connections
    const directConnections = connectedPcsInfo.filter(
      (conn) => conn.hops.length === 0
    );
    const viaPatchPanelConnections = connectedPcsInfo.filter(
      (conn) => conn.hops.length > 0
    );

    // Position direct PCs around the switch in a circle
    const directPcCount = directConnections.length;
    const directAngleStep =
      directPcCount > 0 ? (2 * Math.PI) / directPcCount : 0;
    const directRadius = 200; // Radius for direct PCs

    directConnections.forEach((conn, index) => {
      const pc = pcs.find((p) => p.id === conn.pc_id);
      if (pc) {
        const angle = index * directAngleStep;
        const x = 300 + directRadius * Math.cos(angle);
        const y = 150 + directRadius * Math.sin(angle);

        newNodes.push({
          id: `pc-${pc.id}`,
          type: "pcNode",
          data: {
            label: pc.name,
            pcData: pc,
            isPortUp: conn.is_switch_port_up,
          },
          position: { x: x - 35, y: y - 35 }, // Adjust for node size
          draggable: true,
        });

        newEdges.push({
          id: `e-switch-${selectedSwitch.id}-pc-${pc.id}`,
          source: String(selectedSwitch.id),
          target: `pc-${pc.id}`,
          type: "smoothstep",
          label: `Port: ${conn.switch_port}`,
          animated: !conn.is_switch_port_up,
          style: { stroke: conn.is_switch_port_up ? "#22C55E" : "#EF4444" }, // Green for up, red for down
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: conn.is_switch_port_up ? "#22C55E" : "#EF4444",
          },
          // Add tooltip-like information on hover
          data: {
            sourcePort: conn.switch_port,
            status: conn.is_switch_port_up ? "Up" : "Down",
            connectedTo: pc.name,
            connectionId: conn.id,
          },
        });
      }
    });

    // Handle connections via patch panels
    // For now, let's just create nodes for these PCs and link them, without explicitly showing patch panels
    // A more complex layout would be needed to show intermediate patch panel nodes
    const viaPpRadius = directRadius + 100; // Larger radius for PCs via patch panels
    const viaPpAngleStep =
      viaPatchPanelConnections.length > 0
        ? (2 * Math.PI) / viaPatchPanelConnections.length
        : 0;

    viaPatchPanelConnections.forEach((conn, index) => {
      const pc = pcs.find((p) => p.id === conn.pc_id);
      if (pc) {
        const angle = index * viaPpAngleStep;
        const x = 300 + viaPpRadius * Math.cos(angle);
        const y = 150 + viaPpRadius * Math.sin(angle);

        newNodes.push({
          id: `pc-via-pp-${pc.id}`, // Unique ID for PCs connected via PP
          type: "pcNode",
          data: {
            label: `${pc.name} (via PP)`,
            pcData: pc,
            isPortUp: conn.is_switch_port_up,
          },
          position: { x: x - 35, y: y - 35 },
          draggable: true,
        });

        // For simplicity, draw a line from the PC (via PP) to the Switch
        // In a more advanced diagram, you might insert Patch Panel nodes
        newEdges.push({
          id: `e-switch-${selectedSwitch.id}-pc-via-pp-${pc.id}`,
          source: String(selectedSwitch.id),
          target: `pc-via-pp-${pc.id}`,
          type: "smoothstep",
          label: `Port: ${conn.switch_port} (via PP)`,
          animated: !conn.is_switch_port_up,
          style: {
            stroke: conn.is_switch_port_up ? "#22C55E" : "#EF4444",
            strokeDasharray: "5 5",
          }, // Dashed line for via PP
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: conn.is_switch_port_up ? "#22C55E" : "#EF4444",
          },
          data: {
            sourcePort: conn.switch_port,
            status: conn.is_switch_port_up ? "Up" : "Down",
            connectedTo: `${pc.name} (via Patch Panel)`,
            connectionId: conn.id,
          },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [isOpen, selectedSwitch, connections, pcs, setNodes, setEdges]); // Dependencies for useEffect

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Network size={24} className="mr-2" /> Network Diagram:{" "}
            {selectedSwitch.name}
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
        <div className="flex-grow w-full h-full bg-gray-100 reactflow-container">
          {selectedSwitch && ( // Ensure selectedSwitch exists before rendering ReactFlow
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView // Zoom and pan to fit all nodes into view
              attributionPosition="bottom-left"
            >
              <MiniMap />
              <Controls />
              <Background variant="dots" gap={12} size={1} />
            </ReactFlow>
          )}
          {nodes.length <= 1 && ( // Only the switch node exists if length is 1
            <p className="absolute inset-0 flex items-center justify-center text-xl text-gray-600">
              No PCs found connected to this switch to display in diagram.
            </p>
          )}
        </div>

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
