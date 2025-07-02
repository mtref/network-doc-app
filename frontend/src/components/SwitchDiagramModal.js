// frontend/src/components/SwitchDiagramModal.js
// This component displays a modal with an interactive diagram of a selected switch
// using Konva, with enhanced visual styling for nodes and edges.
// New features: Node tooltips on hover, animated "down" connections, and UI controls for zoom/pan.

import React, { useCallback, useState, useEffect, useRef } from "react";
// Corrected import: Konva is often a global or accessed as a default export,
// or its components are imported directly. For Konva.Animation, it's typically
// accessed via the Konva global object or a named import if the library provides it.
// Given the error, it's likely not a named export. We'll import all as Konva.
import { Stage, Layer, Rect, Line, Text, Group, Circle } from "react-konva";
import Konva from "konva"; // Import Konva directly from the 'konva' package for Konva.Animation

import {
  XCircle,
  Network,
  Plug,
  WifiOff,
  ZoomIn, // New icon for zoom in
  ZoomOut, // New icon for zoom out
  Maximize, // New icon for reset view
  Server,
  Laptop,
  Split,
} from "lucide-react";

// Define consistent sizes for your Konva nodes
const NODE_WIDTH = 100;
const NODE_HEIGHT = 70;
const NODE_PADDING = 10;
const FONT_SIZE_TITLE = 12;
const FONT_SIZE_LABEL = 10;
const STATUS_INDICATOR_SIZE = 16; // Size for the small status circle/text

// Helper function to draw a custom arrow head for the line
const drawArrow = (ctx, points, color) => {
  const headLength = 10;
  const headWidth = 7;

  // Get the end point of the line
  const endX = points[points.length - 2];
  const endY = points[points.length - 1];

  // Get the point before the end point
  const prevX = points[points.length - 4];
  const prevY = points[points.length - 3];

  // Ensure there are enough points for the arrow and prevent NaN for angle
  if (points.length < 4 || (endX === prevX && endY === prevY)) {
    return;
  }

  // Calculate the angle of the line
  const angle = Math.atan2(endY - prevY, endX - prevX);

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.translate(endX, endY);
  ctx.rotate(angle);
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLength, headWidth / 2);
  ctx.lineTo(-headLength, -headWidth / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// Tooltip component for Konva nodes
const NodeTooltip = ({ x, y, text, visible }) => {
  if (!visible || !text) return null;

  // Calculate tooltip dimensions based on text length
  const textWidth = text.length * 5 + 20; // Approximate width
  const textHeight = 20; // Fixed height

  return (
    <Group x={x + NODE_WIDTH / 2 + 10} y={y + NODE_HEIGHT / 2 - textHeight / 2}>
      <Rect
        width={textWidth}
        height={textHeight}
        fill="rgba(0, 0, 0, 0.7)"
        cornerRadius={4}
      />
      <Text
        text={text}
        fontSize={10}
        fontFamily="Arial"
        fill="white"
        padding={5}
      />
    </Group>
  );
};

// Custom Node for Switch (Konva Group)
const SwitchNodeKonva = ({ node, onNodeHover, onNodeLeave, onNodeDragEnd }) => {
  const rectRef = useRef();

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover(node)}
      onMouseLeave={onNodeLeave}
      onDragEnd={(e) => onNodeDragEnd(node.id, e.target.x(), e.target.y())}
    >
      <Rect
        ref={rectRef}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        fill="#EF4444" // Tailwind red-500
        stroke="#B91C1C" // Tailwind red-800
        strokeWidth={2}
        cornerRadius={8}
        shadowColor={node.isHovered ? "black" : undefined}
        shadowBlur={node.isHovered ? 10 : 0}
        shadowOpacity={node.isHovered ? 0.6 : 0}
        shadowOffsetX={node.isHovered ? 5 : 0}
        shadowOffsetY={node.isHovered ? 5 : 0}
        scaleX={node.isHovered ? 1.05 : 1}
        scaleY={node.isHovered ? 1.05 : 1}
        perfectDrawEnabled={false} // For performance with shadow/scale
        listening={true}
        hitStrokeWidth={0} // Make hit area only the fill, not stroke
      />
      <Text
        text="SWITCH"
        fontSize={FONT_SIZE_TITLE}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH}
        height={NODE_HEIGHT / 2}
        x={0}
        y={NODE_PADDING / 2}
        fontStyle="bold"
      />
      <Text
        text={node.label}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 - NODE_PADDING}
        wrap="word"
        ellipsis={true}
      />
    </Group>
  );
};

// Custom Node for PC (Konva Group)
const PcNodeKonva = ({ node, onNodeHover, onNodeLeave, onNodeDragEnd }) => {
  const rectRef = useRef();

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover(node)}
      onMouseLeave={onNodeLeave}
      onDragEnd={(e) => onNodeDragEnd(node.id, e.target.x(), e.target.y())}
    >
      <Rect
        ref={rectRef}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        fill="#6366F1" // Tailwind indigo-500
        stroke="#4338CA" // Tailwind indigo-800
        strokeWidth={2}
        cornerRadius={8}
        shadowColor={node.isHovered ? "black" : undefined}
        shadowBlur={node.isHovered ? 10 : 0}
        shadowOpacity={node.isHovered ? 0.6 : 0}
        shadowOffsetX={node.isHovered ? 5 : 0}
        shadowOffsetY={node.isHovered ? 5 : 0}
        scaleX={node.isHovered ? 1.05 : 1}
        scaleY={node.isHovered ? 1.05 : 1}
        perfectDrawEnabled={false}
        listening={true}
        hitStrokeWidth={0}
      />
      <Text
        text="PC"
        fontSize={FONT_SIZE_TITLE}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH}
        height={NODE_HEIGHT / 2}
        x={0}
        y={NODE_PADDING / 2}
        fontStyle="bold"
      />
      <Text
        text={node.label}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 - NODE_PADDING}
        wrap="word"
        ellipsis={true}
      />
      {node.data.isPortUp !== undefined && (
        <Group
          x={NODE_WIDTH - STATUS_INDICATOR_SIZE / 2}
          y={-STATUS_INDICATOR_SIZE / 2}
        >
          <Circle
            radius={STATUS_INDICATOR_SIZE / 2 + 2}
            fill="white"
            stroke="#D1D5DB"
            strokeWidth={1}
          />
          <Text
            text={node.data.isPortUp ? "↑" : "↓"}
            fontSize={STATUS_INDICATOR_SIZE}
            fontFamily="Arial"
            fill={node.data.isPortUp ? "#10B981" : "#EF4444"} // Green/Red
            align="center"
            verticalAlign="middle"
            width={STATUS_INDICATOR_SIZE}
            height={STATUS_INDICATOR_SIZE}
            x={-STATUS_INDICATOR_SIZE / 2}
            y={-STATUS_INDICATOR_SIZE / 2}
            fontStyle="bold"
          />
        </Group>
      )}
    </Group>
  );
};

// Custom Node for Patch Panel (Konva Group)
const PatchPanelNodeKonva = ({
  node,
  onNodeHover,
  onNodeLeave,
  onNodeDragEnd,
}) => {
  const rectRef = useRef();

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover(node)}
      onMouseLeave={onNodeLeave}
      onDragEnd={(e) => onNodeDragEnd(node.id, e.target.x(), e.target.y())}
    >
      <Rect
        ref={rectRef}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        fill="#22C55E" // Tailwind green-500
        stroke="#16A34A" // Tailwind green-800
        strokeWidth={2}
        cornerRadius={8}
        shadowColor={node.isHovered ? "black" : undefined}
        shadowBlur={node.isHovered ? 10 : 0}
        shadowOpacity={node.isHovered ? 0.6 : 0}
        shadowOffsetX={node.isHovered ? 5 : 0}
        shadowOffsetY={node.isHovered ? 5 : 0}
        scaleX={node.isHovered ? 1.05 : 1}
        scaleY={node.isHovered ? 1.05 : 1}
        perfectDrawEnabled={false}
        listening={true}
        hitStrokeWidth={0}
      />
      <Text
        text="PP"
        fontSize={FONT_SIZE_TITLE}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH}
        height={NODE_HEIGHT / 2}
        x={0}
        y={NODE_PADDING / 2}
        fontStyle="bold"
      />
      <Text
        text={node.label}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 - NODE_PADDING}
        wrap="word"
        ellipsis={true}
      />
    </Group>
  );
};

function SwitchDiagramModal({
  isOpen,
  onClose,
  selectedSwitch,
  connections,
  pcs,
}) {
  const [nodesData, setNodesData] = useState([]);
  const [edgesData, setEdgesData] = useState([]);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const stageRef = useRef(null); // Ref for Konva Stage to access its methods
  const animationRef = useRef(null); // Ref for Konva Animation

  // State for tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  // Handle node hover to show tooltip
  const handleNodeHover = useCallback((node) => {
    let tooltipText = "";
    if (node.type === "switch") {
      tooltipText = `${node.label} (IP: ${node.data.ip_address || "N/A"})`;
    } else if (node.type === "pc") {
      tooltipText = `${node.label} (IP: ${node.data.ip_address || "N/A"})`;
    } else if (node.type === "patchPanel") {
      tooltipText = `${node.label} (Ports: ${node.data.total_ports || "N/A"})`;
    }

    setTooltip({
      visible: true,
      x: node.position.x,
      y: node.position.y,
      text: tooltipText,
    });
    setNodesData((prevNodes) =>
      prevNodes.map((n) => (n.id === node.id ? { ...n, isHovered: true } : n))
    );
  }, []);

  const handleNodeLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, text: "" });
    setNodesData((prevNodes) =>
      prevNodes.map((n) => ({ ...n, isHovered: false }))
    );
  }, []);

  // Utility function to get connection points on the circumference/edge of nodes
  const getKonvaNodeConnectionPoint = useCallback((sourceNode, targetNode) => {
    // sourceNode.position and targetNode.position are top-left corners of the Rects
    const sourceRect = {
      x: sourceNode.position.x,
      y: sourceNode.position.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
    const targetRect = {
      x: targetNode.position.x,
      y: targetNode.position.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };

    // Find center of source node
    const sourceCenterX = sourceRect.x + sourceRect.width / 2;
    const sourceCenterY = sourceRect.y + sourceRect.height / 2;

    // Find center of target node
    const targetCenterX = targetRect.x + targetRect.width / 2;
    const targetCenterY = targetRect.y + targetRect.height / 2;

    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    // Function to find intersection point of line (from center) with a rectangle's border
    const getRectIntersection = (cx, cy, angle) => {
      // Adjusted to take center coordinates directly
      const halfWidth = NODE_WIDTH / 2;
      const halfHeight = NODE_HEIGHT / 2;

      let x = cx;
      let y = cy;

      // Calculate intersection with horizontal lines (top/bottom)
      // Check if the line is more horizontal than vertical
      if (Math.abs(Math.tan(angle)) <= halfHeight / halfWidth) {
        x = cx + Math.sign(Math.cos(angle)) * halfWidth;
        y = cy + Math.tan(angle) * halfWidth * Math.sign(Math.cos(angle));
      } else {
        // Intersects vertical lines (left/right)
        y = cy + Math.sign(Math.sin(angle)) * halfHeight;
        x = cx + (halfHeight / Math.tan(angle)) * Math.sign(Math.sin(angle));
      }

      return { x: x, y: y };
    };

    const angle = Math.atan2(dy, dx);

    // Calculate source and target points on the rectangle edges
    const sourcePoint = getRectIntersection(
      sourceCenterX,
      sourceCenterY,
      angle
    );
    const targetPoint = getRectIntersection(
      targetCenterX,
      targetCenterY,
      angle + Math.PI
    ); // Opposite angle for target

    return { source: sourcePoint, target: targetPoint };
  }, []);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions(); // Initial dimensions
    window.addEventListener("resize", updateDimensions); // Update on resize
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Function to generate and update edges based on current node positions
  const updateEdges = useCallback(
    (currentNodesData) => {
      const newEdgesData = [];
      const currentSwitchNode = currentNodesData.find(
        (n) => n.type === "switch"
      );

      if (!currentSwitchNode) return; // Should not happen if switch is always present

      const relevantConnections = connections.filter(
        (conn) => conn.switch_id === currentSwitchNode.data.id
      );

      relevantConnections.forEach((conn) => {
        const pathSegments = [];
        pathSegments.push({
          id: currentSwitchNode.id,
          type: "switch",
          position: currentSwitchNode.position,
          data: currentSwitchNode.data, // Include data for getKonvaNodeConnectionPoint
        });

        conn.hops.forEach((hop) => {
          const patchPanel = currentNodesData.find(
            (n) => n.id === `pp-${hop.patch_panel.id}`
          );
          if (patchPanel) {
            pathSegments.push({
              id: patchPanel.id,
              type: "patchPanel",
              label: patchPanel.label,
              data: patchPanel.data,
              isPortUp: hop.is_port_up,
              hopData: hop,
              position: patchPanel.position, // Use updated position
            });
          }
        });

        const pcNode = currentNodesData.find(
          (n) => n.id === `pc-${conn.pc_id}-${conn.id}`
        );
        if (pcNode) {
          pathSegments.push({
            id: pcNode.id,
            type: "pc",
            label: pcNode.label,
            data: pcNode.data,
            isPortUp: conn.is_switch_port_up,
            position: pcNode.position, // Use updated position
          });
        }

        for (let i = 0; i < pathSegments.length - 1; i++) {
          const sourceSegment = pathSegments[i];
          const targetSegment = pathSegments[i + 1];

          const { source, target } = getKonvaNodeConnectionPoint(
            sourceSegment, // Use segments with updated positions
            targetSegment
          );

          let edgeLabel = "";
          let edgeColor = "#4B5563"; // Tailwind gray-700
          let strokeWidth = 2;
          let strokeDasharray = [];
          let isPortUp = true;

          // Logic to determine edge details (color, label, animation)
          // This part is the same as before
          if (
            sourceSegment.type === "switch" &&
            targetSegment.type === "patchPanel"
          ) {
            const hop = conn.hops[0];
            edgeLabel = `S:${conn.switch_port} -> PP:${hop.patch_panel_port}`;
            isPortUp = hop.is_port_up;
            edgeColor = isPortUp ? "#10B981" : "#EF4444"; // Green/Red
            if (!isPortUp) strokeDasharray = [5, 5];
          } else if (
            sourceSegment.type === "patchPanel" &&
            targetSegment.type === "patchPanel"
          ) {
            const hopIndex = conn.hops.findIndex(
              (h) => `pp-${h.patch_panel.id}` === sourceSegment.id
            );
            const nextHop = conn.hops[hopIndex + 1];
            if (nextHop) {
              edgeLabel = `PP:${
                sourceSegment.hopData?.patch_panel_port || ""
              } -> PP:${nextHop.patch_panel_port}`;
              isPortUp = nextHop.is_port_up;
              edgeColor = isPortUp ? "#10B981" : "#EF4444";
              if (!isPortUp) strokeDasharray = [5, 5];
            }
          } else if (
            sourceSegment.type === "patchPanel" &&
            targetSegment.type === "pc"
          ) {
            const lastHop = conn.hops[conn.hops.length - 1];
            edgeLabel = `PP:${lastHop.patch_panel_port} -> PC`;
            isPortUp = conn.is_switch_port_up; // Connection status to PC
            edgeColor = isPortUp ? "#10B981" : "#EF4444";
            if (!isPortUp) strokeDasharray = [5, 5];
          } else if (
            sourceSegment.type === "switch" &&
            targetSegment.type === "pc"
          ) {
            // Direct Switch to PC connection
            edgeLabel = `S:${conn.switch_port} -> PC`;
            isPortUp = conn.is_switch_port_up;
            edgeColor = isPortUp ? "#10B981" : "#EF4444";
            if (!isPortUp) strokeDasharray = [5, 5];
          }

          newEdgesData.push({
            id: `e-${sourceSegment.id}-${targetSegment.id}-${conn.id}`,
            points: [source.x, source.y, target.x, target.y],
            stroke: edgeColor,
            strokeWidth: strokeWidth,
            dash: strokeDasharray,
            label: edgeLabel,
            isPortUp: isPortUp,
            dashOffset: 0,
          });
        }
      });
      setEdgesData(newEdgesData);
    },
    [connections, pcs, getKonvaNodeConnectionPoint]
  );

  // Effect to generate initial nodes and edges data
  useEffect(() => {
    if (
      !isOpen ||
      !selectedSwitch ||
      !containerDimensions.width ||
      !containerDimensions.height
    ) {
      setNodesData([]);
      setEdgesData([]);
      return;
    }

    const initialNodes = [];
    const addedNodeIds = new Set();

    const switchNodeId = String(selectedSwitch.id);
    const switchNodePos = {
      x: containerDimensions.width / 2 - NODE_WIDTH / 2,
      y: containerDimensions.height / 2 - NODE_HEIGHT / 2,
    };
    initialNodes.push({
      id: switchNodeId,
      type: "switch",
      label: selectedSwitch.name,
      position: switchNodePos,
      data: selectedSwitch,
      isHovered: false,
    });
    addedNodeIds.add(switchNodeId);

    const relevantConnections = connections.filter(
      (conn) => conn.switch_id === selectedSwitch.id
    );

    const angleIncrement = (2 * Math.PI) / (relevantConnections.length || 1);
    const radialOffsetPerHop = 200;

    relevantConnections.forEach((conn, connIndex) => {
      const baseAngle = angleIncrement * connIndex;
      const pc = pcs.find((p) => p.id === conn.pc_id);
      if (!pc) return;

      const pathSegments = [];
      pathSegments.push({
        id: switchNodeId,
        type: "switch",
        position: switchNodePos,
      });

      conn.hops.forEach((hop) => {
        const patchPanel = hop.patch_panel;
        if (patchPanel) {
          const ppNodeId = `pp-${patchPanel.id}`;
          pathSegments.push({
            id: ppNodeId,
            type: "patchPanel",
            label: patchPanel.name,
            data: patchPanel,
            isPortUp: hop.is_port_up,
            hopData: hop,
          });
        }
      });

      const pcNodeId = `pc-${pc.id}-${conn.id}`;
      pathSegments.push({
        id: pcNodeId,
        type: "pc",
        label: pc.name,
        data: pc,
        isPortUp: conn.is_switch_port_up,
      });

      pathSegments.forEach((segment, segmentIndex) => {
        let xPos = 0;
        let yPos = 0;

        if (segmentIndex > 0) {
          const currentDistance = segmentIndex * radialOffsetPerHop;
          xPos =
            containerDimensions.width / 2 +
            currentDistance * Math.cos(baseAngle + 0.1 * segmentIndex) -
            NODE_WIDTH / 2;
          yPos =
            containerDimensions.height / 2 +
            currentDistance * Math.sin(baseAngle + 0.1 * segmentIndex) -
            NODE_HEIGHT / 2;
        } else {
          xPos = switchNodePos.x;
          yPos = switchNodePos.y;
        }

        if (!addedNodeIds.has(segment.id)) {
          const nodeToAdd = {
            id: segment.id,
            type: segment.type,
            label: segment.label,
            position: { x: xPos, y: yPos },
            data: segment.data,
            isHovered: false,
          };
          if (segment.type !== "switch") {
            nodeToAdd.data = { ...nodeToAdd.data, isPortUp: segment.isPortUp };
          }
          initialNodes.push(nodeToAdd);
          addedNodeIds.add(segment.id);
        }
      });
    });

    setNodesData(initialNodes);
    // Now, call updateEdges to calculate and set the edges based on these initial nodes
    // This will update the edgesData state
    updateEdges(initialNodes);

    // Auto-fit view logic for Konva
    if (initialNodes.length > 0) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      initialNodes.forEach((node) => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
        maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
      });

      const diagramWidth = maxX - minX;
      const diagramHeight = maxY - minY;

      const paddingFactor = 1.1;
      const scaleX = (containerDimensions.width / diagramWidth) * paddingFactor;
      const scaleY =
        (containerDimensions.height / diagramHeight) * paddingFactor;
      const newScale = Math.min(scaleX, scaleY);

      const centeredX =
        containerDimensions.width / 2 - (minX + diagramWidth / 2) * newScale;
      const centeredY =
        containerDimensions.height / 2 - (minY + diagramHeight / 2) * newScale;

      setStageScale(newScale);
      setStagePos({ x: centeredX, y: centeredY });
    } else {
      setStageScale(1);
      setStagePos({ x: 0, y: 0 });
    }
  }, [
    isOpen,
    selectedSwitch,
    connections,
    pcs,
    containerDimensions,
    getKonvaNodeConnectionPoint,
    updateEdges, // This dependency is crucial for the initial edge calculation
  ]);

  // Separate useEffect for animation, dependent on edgesData
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    const animatedLines = edgesData.filter((edge) => edge.dash.length > 0);
    if (animatedLines.length > 0 && stageRef.current) {
      const layer = stageRef.current.getLayers()[0];
      animationRef.current = new Konva.Animation((frame) => {
        const speed = 20; // pixels per second
        const distance = (frame.time * speed) / 1000; // distance covered by dash offset

        setEdgesData((prevEdges) =>
          prevEdges.map((edge) => {
            if (edge.dash.length > 0) {
              return {
                ...edge,
                dashOffset: -distance % (edge.dash[0] + edge.dash[1]),
              };
            }
            return edge;
          })
        );
      }, layer);
      animationRef.current.start();
    }
  }, [edgesData]); // This effect runs whenever edgesData changes

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  // Handle node drag end to update node position and redraw edges
  const handleNodeDragEnd = useCallback(
    (nodeId, newX, newY) => {
      setNodesData((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === nodeId
            ? { ...node, position: { x: newX, y: newY } }
            : node
        );
        updateEdges(updatedNodes); // Re-calculate and set edges based on updated node positions
        return updatedNodes;
      });
    },
    [updateEdges]
  ); // updateEdges is a dependency

  // Handle stage drag for panning (Konva's built-in draggable prop handles this for Stage)
  const handleStageDragEnd = (e) => {
    setStagePos({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // Handle stage wheel for zooming
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage(); // Correctly get the stage object here
    const pointer = stage.getPointerPosition();

    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleZoomIn = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = stageScale * 1.2; // Zoom in by 20%
    setStageScale(newScale);
    // Keep the center of the view roughly the same
    const centerX = containerDimensions.width / 2;
    const centerY = containerDimensions.height / 2;
    setStagePos({
      x: centerX - ((centerX - stagePos.x) / stageScale) * newScale,
      y: centerY - ((centerY - stagePos.y) / stageScale) * newScale,
    });
  };

  const handleZoomOut = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const newScale = stageScale / 1.2; // Zoom out by 20%
    setStageScale(newScale);
    // Keep the center of the view roughly the same
    const centerX = containerDimensions.width / 2;
    const centerY = containerDimensions.height / 2;
    setStagePos({
      x: centerX - ((centerX - stagePos.x) / stageScale) * newScale,
      y: centerY - ((centerY - stagePos.y) / stageScale) * newScale,
    });
  };

  const handleResetView = useCallback(() => {
    // Recalculate and reset to fit all nodes
    if (
      nodesData.length > 0 &&
      containerDimensions.width > 0 &&
      containerDimensions.height > 0
    ) {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      nodesData.forEach((node) => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
        maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
      });

      const diagramWidth = maxX - minX;
      const diagramHeight = maxY - minY;

      const paddingFactor = 1.1; // Add 10% padding
      const scaleX = (containerDimensions.width / diagramWidth) * paddingFactor;
      const scaleY =
        (containerDimensions.height / diagramHeight) * paddingFactor;
      const newScale = Math.min(scaleX, scaleY);

      const centeredX =
        containerDimensions.width / 2 - (minX + diagramWidth / 2) * newScale;
      const centeredY =
        containerDimensions.height / 2 - (minY + diagramHeight / 2) * newScale;

      setStageScale(newScale);
      setStagePos({ x: centeredX, y: centeredY });
    } else {
      setStageScale(1);
      setStagePos({ x: 0, y: 0 });
    }
  }, [nodesData, containerDimensions]);

  // Reset view when modal opens or switch changes
  useEffect(() => {
    if (isOpen && selectedSwitch) {
      handleResetView();
    }
  }, [isOpen, selectedSwitch, handleResetView]);

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

        {/* Konva Diagram Area */}
        {isOpen && selectedSwitch ? (
          <div
            ref={containerRef}
            className="flex-grow w-full bg-gray-100 konva-container relative" // Added relative for absolute positioning of controls
            style={{ height: "500px" }} // Fixed height for the container
          >
            {/* Zoom/Pan Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 bg-white p-2 rounded-md shadow-md">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
                title="Reset View"
              >
                <Maximize size={18} />
              </button>
            </div>

            {/* Render Stage only when container dimensions are known */}
            {containerDimensions.width > 0 &&
              containerDimensions.height > 0 && (
                <Stage
                  width={containerDimensions.width}
                  height={containerDimensions.height}
                  onWheel={handleWheel}
                  draggable // Enable dragging of the stage for panning
                  x={stagePos.x}
                  y={stagePos.y}
                  scaleX={stageScale}
                  scaleY={stageScale}
                  onDragEnd={handleStageDragEnd}
                  ref={stageRef} // Assign ref to Stage
                >
                  <Layer>
                    {/* Background: Custom dotted pattern */}
                    <Rect
                      width={containerDimensions.width / stageScale} // Fill visible area regardless of zoom
                      height={containerDimensions.height / stageScale}
                      fillPatternImage={(() => {
                        // Create a simple dot pattern
                        const canvas = document.createElement("canvas");
                        canvas.width = 24; // 2 * gap
                        canvas.height = 24;
                        const ctx = canvas.getContext("2d");
                        ctx.fillStyle = "#E5E7EB"; // Light gray background
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "#D1D5DB"; // Slightly darker dot color
                        ctx.beginPath();
                        ctx.arc(12, 12, 1, 0, Math.PI * 2); // Center dot
                        ctx.fill();
                        return canvas;
                      })()}
                      x={-stagePos.x / stageScale} // Adjust background position with pan/zoom
                      y={-stagePos.y / stageScale}
                    />

                    {/* Render Edges (Lines) first so nodes appear on top */}
                    {edgesData.map((edge) => (
                      <Line
                        key={edge.id}
                        points={edge.points}
                        stroke={edge.stroke}
                        strokeWidth={edge.strokeWidth}
                        dash={edge.dash}
                        dashOffset={edge.dashOffset} // Apply animated dash offset
                        lineCap="round"
                        lineJoin="round"
                        // Draw custom arrow head using sceneFunc
                        sceneFunc={(ctx, shape) => {
                          const points = shape.points();
                          if (points.length < 4) {
                            // Needs at least two points (x1,y1,x2,y2)
                            shape.fillEnabled(false); // Do not draw shape if not enough points
                            return;
                          }

                          ctx.beginPath();
                          ctx.moveTo(points[0], points[1]);
                          for (let i = 2; i < points.length; i += 2) {
                            ctx.lineTo(points[i], points[i + 1]);
                          }
                          ctx.stroke(); // Draw the line segment

                          // Draw arrow head at the end point
                          drawArrow(ctx, points, edge.stroke);
                        }}
                      />
                    ))}

                    {/* Render Nodes */}
                    {nodesData.map((node) => {
                      if (node.type === "switch") {
                        return (
                          <SwitchNodeKonva
                            key={node.id}
                            node={node}
                            onNodeHover={handleNodeHover}
                            onNodeLeave={handleNodeLeave}
                            onNodeDragEnd={handleNodeDragEnd}
                          />
                        );
                      } else if (node.type === "pc") {
                        return (
                          <PcNodeKonva
                            key={node.id}
                            node={node}
                            onNodeHover={handleNodeHover}
                            onNodeLeave={handleNodeLeave}
                            onNodeDragEnd={handleNodeDragEnd}
                          />
                        );
                      } else if (node.type === "patchPanel") {
                        return (
                          <PatchPanelNodeKonva
                            key={node.id}
                            node={node}
                            onNodeHover={handleNodeHover}
                            onNodeLeave={handleNodeLeave}
                            onNodeDragEnd={handleNodeDragEnd}
                          />
                        );
                      }
                      return null;
                    })}

                    {/* Render Edge Labels (Port information) */}
                    {edgesData.map((edge) => {
                      // Calculate midpoint of the line for label positioning
                      const midX = (edge.points[0] + edge.points[2]) / 2;
                      const midY = (edge.points[1] + edge.points[3]) / 2;

                      // Calculate angle for rotating the text along the line
                      const angleRad = Math.atan2(
                        edge.points[3] - edge.points[1],
                        edge.points[2] - edge.points[0]
                      );
                      // Convert to degrees and adjust for Konva's coordinate system if necessary
                      let rotation = (angleRad * 180) / Math.PI;

                      // Adjust text rotation to always be readable (not upside down)
                      if (rotation > 90 || rotation < -90) {
                        rotation += 180;
                      }

                      return (
                        <Text
                          key={`label-${edge.id}`}
                          text={edge.label}
                          x={midX}
                          y={midY - 10} // Offset slightly above the line
                          fontSize={9}
                          fill="gray"
                          align="center"
                          rotation={rotation}
                          // Adjust offsets based on rotation and desired alignment
                          offsetX={(edge.label.length * 9) / 2} // Approximate center based on font size
                          offsetY={-5}
                        />
                      );
                    })}

                    {/* Render Tooltip */}
                    <NodeTooltip
                      x={tooltip.x}
                      y={tooltip.y}
                      text={tooltip.text}
                      visible={tooltip.visible}
                    />
                  </Layer>
                </Stage>
              )}
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
        {isOpen &&
          selectedSwitch &&
          connections.filter((conn) => conn.switch_id === selectedSwitch.id)
            .length === 0 && (
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
