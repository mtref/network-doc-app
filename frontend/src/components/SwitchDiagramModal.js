// frontend/src/components/SwitchDiagramModal.js
// This component displays a modal with a diagram of a selected switch
// in the center and all connected PCs (direct or via patch panels) around it, with lines.

import React from "react";
import {
  XCircle,
  Server,
  Laptop,
  Plug,
  Wifi,
  WifiOff,
  Network,
} from "lucide-react";

function SwitchDiagramModal({
  isOpen,
  onClose,
  selectedSwitch,
  connections,
  pcs,
}) {
  if (!isOpen || !selectedSwitch) return null;

  console.log("--- Debugging SwitchDiagramModal ---");
  console.log("Selected Switch:", selectedSwitch);
  console.log("All Connections:", connections);
  console.log("All PCs:", pcs);

  // Filter connections to find all PCs connected to this switch,
  // regardless of whether they pass through patch panels.
  const connectedPcsInfo = connections
    .filter((conn) => {
      const isConnectedToSelectedSwitch = conn.switch_id === selectedSwitch.id;
      const hasPc = !!conn.pc; // Ensure conn.pc object exists
      console.log(
        `Connection ID: ${conn.id}, Switch ID: ${conn.switch_id}, Selected Switch ID: ${selectedSwitch.id}, PC Exists: ${hasPc}, isConnectedToSelectedSwitch: ${isConnectedToSelectedSwitch}`
      );
      return isConnectedToSelectedSwitch && hasPc;
    })
    .map((conn) => {
      const connectedPc = pcs.find((pc) => pc.id === conn.pc_id);
      console.log(
        `Mapping Connection ID: ${conn.id}, PC ID: ${conn.pc_id}, Found PC:`,
        connectedPc
      );
      return {
        pc: connectedPc,
        switch_port: conn.switch_port,
        is_switch_port_up: conn.is_switch_port_up,
      };
    });

  console.log("Final connectedPcsInfo:", connectedPcsInfo);
  console.log("---------------------------------");

  // Diagram dimensions and positioning (adjust as needed)
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 400;
  const CENTER_X = SVG_WIDTH / 2;
  const CENTER_Y = SVG_HEIGHT / 2;
  const RADIUS = 120; // Radius for placing connected PCs in a circle

  const numConnectedPcs = connectedPcsInfo.length;
  // Distribute PCs evenly around the circle, ensure angleStep is 0 if no PCs to avoid division by zero
  const angleStep = numConnectedPcs > 0 ? (2 * Math.PI) / numConnectedPcs : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
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

        {/* Diagram Area */}
        <div className="relative flex-grow flex items-center justify-center p-4 bg-gray-50">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          >
            {/* Draw lines first so nodes are on top */}
            {connectedPcsInfo.map((pcInfo, index) => {
              const angle = index * angleStep;
              const pcX = CENTER_X + RADIUS * Math.cos(angle);
              const pcY = CENTER_Y + RADIUS * Math.sin(angle);

              return (
                <line
                  key={`line-${pcInfo.pc.id}`}
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={pcX}
                  y2={pcY}
                  stroke={pcInfo.is_switch_port_up ? "green" : "red"}
                  strokeWidth="2"
                />
              );
            })}

            {/* Central Switch Node */}
            <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
              <circle
                cx="0"
                cy="0"
                r="40"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="3"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                Switch
              </text>
              <text x="0" y="25" textAnchor="middle" fill="white" fontSize="10">
                {selectedSwitch.name}
              </text>
              <Server x="-12" y="-30" size={24} color="white" />
            </g>

            {/* Connected PC Nodes */}
            {connectedPcsInfo.map((pcInfo, index) => {
              const angle = index * angleStep;
              const pcX = CENTER_X + RADIUS * Math.cos(angle);
              const pcY = CENTER_Y + RADIUS * Math.sin(angle);

              return (
                <g
                  key={`pc-node-${pcInfo.pc.id}`}
                  transform={`translate(${pcX}, ${pcY})`}
                >
                  <circle
                    cx="0"
                    cy="0"
                    r="30"
                    fill="#6366F1"
                    stroke="#4F46E5"
                    strokeWidth="2"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    PC
                  </text>
                  <text
                    x="0"
                    y="20"
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                  >
                    {pcInfo.pc?.name || "N/A"}
                  </text>
                  <Laptop x="-10" y="-25" size={20} color="white" />
                  {/* Connection Status Icon */}
                  <g transform="translate(15, -15)">
                    {pcInfo.is_switch_port_up ? (
                      <Wifi size={16} color="green" />
                    ) : (
                      <WifiOff size={16} color="red" />
                    )}
                  </g>
                </g>
              );
            })}
          </svg>
          {numConnectedPcs === 0 && (
            <p className="absolute text-xl text-gray-600">
              No PCs found connected to this switch.
            </p>
          )}
        </div>

        {/* Footer for status legend */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-center flex justify-center gap-4">
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
        </div>
      </div>
    </div>
  );
}

export default SwitchDiagramModal;
