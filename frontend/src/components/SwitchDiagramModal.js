// frontend/src/components/SwitchDiagramModal.js
// This component displays a modal with an interactive diagram of a selected switch
// using Konva, with enhanced visual styling for nodes and edges.
// New features: Node tooltips on hover, animated "down" connections, and UI controls for zoom/pan.
// Node visuals are now Lucide icons (Laptop, Server, Split) instead of simple rectangles.
// UPDATED: Displaying rack and row for server PCs in tooltips and using correct icons,
// and handling units_occupied for all rack-mounted devices.

import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Group,
  Circle,
  Image as KonvaImage,
} from "react-konva";
import Konva from "konva"; // Import Konva directly from the 'konva' package for Konva.Animation
import ReactDOMServer from "react-dom/server"; // Required to render Lucide icons to SVG strings

import {
  XCircle,
  Network,
  Plug,
  WifiOff,
  ZoomIn, // New icon for zoom in
  ZoomOut, // New icon for zoom out
  Maximize, // New icon for reset view
  Server, // Lucide icon for Server/Switch
  Laptop, // Lucide icon for PC
  Split, // Lucide icon for Patch Panel
  MonitorCheck, // New: Icon for PC type: Workstation
  HardDrive, // New: Icon for PC type: Server
  Tag, // New icon for cable label
  Palette, // New icon for cable color
  Download, // New icon for download feature
} from "lucide-react";

// Define consistent sizes for your Konva nodes
const NODE_WIDTH = 100;
const NODE_HEIGHT = 70;
const NODE_PADDING = 10;
const FONT_SIZE_TITLE = 12;
const FONT_SIZE_LABEL = 10;
const STATUS_INDICATOR_SIZE = 16; // Size for the small status circle/text
const ICON_SIZE = 32; // Size for the Lucide icons within the nodes

// Helper function to convert a Lucide icon component to a data URL
const getSvgDataUrl = (IconComponent, color = "currentColor") => {
  // Render the icon component to an SVG string
  const svgString = ReactDOMServer.renderToStaticMarkup(
    <IconComponent size={ICON_SIZE} color={color} />
  );
  // Encode the SVG string as a base64 data URL
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

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

  // Split text into lines to calculate accurate dimensions
  const lines = text.split("\n");
  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), "");

  // Approximate width based on average character width (adjust as needed)
  const approximateTextWidth = longestLine.length * 5.5 + 20; // 5.5px per char + padding
  const textHeight = lines.length * 12 + 10; // 12px per line + padding

  return (
    <Group x={x + NODE_WIDTH / 2 + 10} y={y + NODE_HEIGHT / 2 - textHeight / 2}>
      <Rect
        width={approximateTextWidth}
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
const SwitchNodeKonva = ({
  node,
  onNodeHover,
  onNodeLeave,
  onNodeDragEnd,
  iconImage,
}) => {
  const rectRef = useRef();

  // New fields: row_in_rack, units_occupied, rack_name, source_port, model, description, usage
  const labelText = `${node.label}\n(${node.data.location_name || "N/A"})\n${
    node.data.model || "N/A"
  }`;
  let tooltipText = `Name: ${node.label}\nIP: ${
    node.data.ip_address || "N/A"
  }\nLocation: ${node.data.location_name || "N/A"}${
    node.data.location?.door_number
      ? ` (Door: ${node.data.location.door_number})`
      : ""
  }\nRack: ${node.data.rack_name || "N/A"}`;
  // NEW: Add units_occupied to tooltip
  if (node.data.row_in_rack !== null && node.data.units_occupied !== null) {
    tooltipText += ` (Starting Row: ${node.data.row_in_rack}, Units: ${node.data.units_occupied}U)`;
  }
  tooltipText += `\nModel: ${node.data.model || "N/A"}\nTotal Ports: ${
    node.data.total_ports
  }\nSource Port: ${node.data.source_port || "N/A"}\nUsage: ${
    node.data.usage || "N/A"
  }\nDescription: ${node.data.description || "N/A"}`;

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover({ ...node, text: tooltipText })}
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
      {iconImage && (
        <KonvaImage
          image={iconImage}
          x={(NODE_WIDTH - ICON_SIZE) / 2} // Center the icon
          y={NODE_PADDING / 2} // Position at top with padding
          width={ICON_SIZE}
          height={ICON_SIZE}
        />
      )}
      <Text
        text={labelText}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 + NODE_PADDING - 5} // Position text below icon
        wrap="word"
        ellipsis={true}
      />
    </Group>
  );
};

// Custom Node for PC (Konva Group)
const PcNodeKonva = ({
  node,
  onNodeHover,
  onNodeLeave,
  onNodeDragEnd,
  iconImage, // This will now be dynamically chosen based on PC type
}) => {
  const rectRef = useRef();

  // New fields: username, in_domain, operating_system, model (replaces ports_name), office, multi_port, type, usage
  // UPDATED: Include rack and row in rack, and units_occupied for Server type PCs
  const labelText = `${node.label}\n(${node.data.office || "N/A"})\n${
    node.data.operating_system || "N/A"
  }`;
  let tooltipText = `Name: ${node.label}\nIP: ${
    node.data.ip_address || "N/A"
  }\nUsername: ${node.data.username || "N/A"}\nIn Domain: ${
    node.data.in_domain ? "Yes" : "No"
  }\nOS: ${node.data.operating_system || "N/A"}\nModel: ${
    node.data.model || "N/A"
  }\nOffice: ${node.data.office || "N/A"}\nMulti-Port: ${
    node.data.multi_port ? "Yes" : "No"
  }\nType: ${node.data.type || "N/A"}\nUsage: ${node.data.usage || "N/A"}`;

  // NEW: Add rack and row details to tooltip if it's a Server PC
  if (node.data.type === "Server") {
    tooltipText += `\nRack: ${node.data.rack_name || "N/A"}`;
    if (node.data.row_in_rack !== null && node.data.units_occupied !== null) {
      tooltipText += ` (Starting Row: ${node.data.row_in_rack}, Units: ${node.data.units_occupied}U)`;
    }
  }
  tooltipText += `\nDescription: ${node.data.description || "N/A"}`;

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover({ ...node, text: tooltipText })}
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
      {iconImage && (
        <KonvaImage
          image={iconImage}
          x={(NODE_WIDTH - ICON_SIZE) / 2}
          y={NODE_PADDING / 2}
          width={ICON_SIZE}
          height={ICON_SIZE}
        />
      )}
      <Text
        text={labelText}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 + NODE_PADDING - 5} // Position text below icon
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
  iconImage,
}) => {
  const rectRef = useRef();

  // New fields: row_in_rack, units_occupied, rack_name, description, location.door_number (via location)
  const labelText = `${node.label}\n(${node.data.location_name || "N/A"})\n${
    node.data.rack_name || "N/A"
  }`;
  let tooltipText = `Name: ${node.label}\nLocation: ${
    node.data.location_name || "N/A"
  }${
    node.data.location?.door_number
      ? ` (Door: ${node.data.location.door_number})`
      : ""
  }\nRack: ${node.data.rack_name || "N/A"}`;
  // NEW: Add units_occupied to tooltip
  if (node.data.row_in_rack !== null && node.data.units_occupied !== null) {
    tooltipText += ` (Starting Row: ${node.data.row_in_rack}, Units: ${node.data.units_occupied}U)`;
  }
  tooltipText += `\nTotal Ports: ${node.data.total_ports}\nDescription: ${
    node.data.description || "N/A"
  }`;

  return (
    <Group
      x={node.position.x}
      y={node.position.y}
      draggable
      onMouseEnter={() => onNodeHover({ ...node, text: tooltipText })}
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
      {iconImage && (
        <KonvaImage
          image={iconImage}
          x={(NODE_WIDTH - ICON_SIZE) / 2}
          y={NODE_PADDING / 2}
          width={ICON_SIZE}
          height={ICON_SIZE}
        />
      )}
      <Text
        text={labelText}
        fontSize={FONT_SIZE_LABEL}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        width={NODE_WIDTH - NODE_PADDING}
        height={NODE_HEIGHT / 2}
        x={NODE_PADDING / 2}
        y={NODE_HEIGHT / 2 + NODE_PADDING - 5} // Position text below icon
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

  // States for loaded icon images
  const [workstationIconImage, setWorkstationIconImage] = useState(null); // New icon for Workstation
  const [serverIconImage, setServerIconImage] = useState(null); // New icon for Server
  const [switchIconImage, setSwitchIconImage] = useState(null);
  const [ppIconImage, setPpIconImage] = useState(null);

  // Load SVG images once on component mount
  useEffect(() => {
    const loadImages = async () => {
      const loadImage = (src) =>
        new Promise((resolve) => {
          const img = new window.Image();
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.error("Failed to load image:", src);
            resolve(null); // Resolve with null on error
          };
        });

      // Using a fixed color for icons for better visibility on colored nodes
      const iconColor = "white";

      // Load new PC type icons
      const workstationIconUrl = getSvgDataUrl(MonitorCheck, iconColor);
      const serverIconUrl = getSvgDataUrl(HardDrive, iconColor);

      const switchIconUrl = getSvgDataUrl(Server, iconColor);
      const ppIconUrl = getSvgDataUrl(Split, iconColor);

      const [workstationImg, serverImg, switchImg, ppImg] = await Promise.all([
        loadImage(workstationIconUrl),
        loadImage(serverIconUrl),
        loadImage(switchIconUrl),
        loadImage(ppIconUrl),
      ]);

      setWorkstationIconImage(workstationImg); // Set new state
      setServerIconImage(serverImg); // Set new state
      setSwitchIconImage(switchImg);
      setPpIconImage(ppImg);
    };

    loadImages();
  }, []); // Empty dependency array means this runs once on mount

  // State for tooltip
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  // Handle node hover to show tooltip
  const handleNodeHover = useCallback((node) => {
    // The `node` object passed here now directly includes the `text` property
    // that was pre-formatted in the Konva node components (SwitchNodeKonva, etc.).
    setTooltip({
      visible: true,
      x: node.position.x,
      y: node.position.y,
      text: node.text, // Use the pre-formatted text from the node
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
    const getRectIntersection = (cx, cy, angle, rectWidth, rectHeight) => {
      const halfWidth = rectWidth / 2;
      const halfHeight = rectHeight / 2;

      // Calculate the angle relative to the center of the rectangle's local coordinate system
      const angleInRect = Math.atan2(Math.sin(angle), Math.cos(angle));

      let xIntersect, yIntersect;

      // Determine which edge is hit first
      // Compare the absolute slopes to determine if it hits a vertical or horizontal edge first
      const slope = Math.abs(Math.tan(angleInRect));
      const rectSlope = halfHeight / halfWidth;

      if (slope <= rectSlope) {
        // Hits vertical edges (left/right)
        xIntersect = Math.sign(Math.cos(angleInRect)) * halfWidth;
        yIntersect = Math.tan(angleInRect) * xIntersect;
      } else {
        // Hits horizontal edges (top/bottom)
        yIntersect = Math.sign(Math.sin(angleInRect)) * halfHeight;
        xIntersect = yIntersect / Math.tan(angleInRect);
      }

      return { x: cx + xIntersect, y: cy + yIntersect };
    };

    const angle = Math.atan2(dy, dx);

    // Calculate source and target points on the rectangle edges
    const sourcePoint = getRectIntersection(
      sourceCenterX,
      sourceCenterY,
      angle,
      NODE_WIDTH,
      NODE_HEIGHT
    );
    const targetPoint = getRectIntersection(
      targetCenterX,
      targetCenterY,
      angle + Math.PI,
      NODE_WIDTH,
      NODE_HEIGHT
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
        // Create a temporary array of segments for this connection's path
        const pathSegments = [];
        // Start with the switch node
        pathSegments.push({
          id: currentSwitchNode.id,
          type: "switch",
          position: currentSwitchNode.position,
          data: currentSwitchNode.data,
        });

        // Add all intermediate patch panel hops
        conn.hops.forEach((hop) => {
          const patchPanelNode = currentNodesData.find(
            (n) => n.id === `pp-${hop.patch_panel.id}`
          );
          if (patchPanelNode) {
            pathSegments.push({
              id: patchPanelNode.id,
              type: "patchPanel",
              label: patchPanelNode.label,
              data: patchPanelNode.data,
              isPortUp: hop.is_port_up,
              hopData: hop,
              position: patchPanelNode.position,
            });
          }
        });

        // End with the PC node
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
            position: pcNode.position,
          });
        }

        // Generate edges for each segment in the path
        for (let i = 0; i < pathSegments.length - 1; i++) {
          const sourceSegment = pathSegments[i];
          const targetSegment = pathSegments[i + 1];

          const { source, target } = getKonvaNodeConnectionPoint(
            sourceSegment,
            targetSegment
          );

          let edgeLabel = "";
          let edgeColor = "#4B5563"; // Tailwind gray-700
          let strokeWidth = 2;
          let strokeDasharray = [];
          let isPortUp = true;
          let currentSegmentCableColor = ""; // Default for segment
          let currentSegmentCableLabel = ""; // Default for segment

          // Determine edge details based on the connection and hop data
          if (
            sourceSegment.type === "switch" &&
            targetSegment.type === "patchPanel"
          ) {
            const hop = conn.hops[0]; // First hop
            edgeLabel = `S:${conn.switch_port} -> PP:${hop.patch_panel_port}`;
            isPortUp = hop.is_port_up;
            currentSegmentCableColor = conn.cable_color; // Color from main connection
            currentSegmentCableLabel = conn.cable_label; // Label from main connection
            edgeColor = isPortUp ? "#10B981" : "#EF4444";
            if (!isPortUp) strokeDasharray = [5, 5];
          } else if (
            sourceSegment.type === "patchPanel" &&
            targetSegment.type === "patchPanel"
          ) {
            // Find the current hop in the connection's hops array
            const currentHopIndex = conn.hops.findIndex(
              (h) => `pp-${h.patch_panel.id}` === sourceSegment.id
            );
            const nextHop = conn.hops[currentHopIndex + 1]; // The next hop in the sequence

            if (nextHop) {
              edgeLabel = `PP:${
                sourceSegment.hopData?.patch_panel_port || ""
              } -> PP:${nextHop.patch_panel_port}`;
              isPortUp = nextHop.is_port_up;
              currentSegmentCableColor = nextHop.cable_color; // Color from the next hop
              currentSegmentCableLabel = nextHop.cable_label; // Label from the next hop
              edgeColor = isPortUp ? "#10B981" : "#EF4444";
              if (!isPortUp) strokeDasharray = [5, 5];
            }
          } else if (
            sourceSegment.type === "patchPanel" &&
            targetSegment.type === "pc"
          ) {
            const lastHop = conn.hops[conn.hops.length - 1]; // Last hop in the chain
            edgeLabel = `PP:${lastHop.patch_panel_port} -> PC`;
            isPortUp = conn.is_switch_port_up; // Status of the entire connection to PC
            currentSegmentCableColor = lastHop.cable_color; // Color from the last hop
            currentSegmentCableLabel = lastHop.cable_label; // Label from the last hop
            edgeColor = isPortUp ? "#10B981" : "#EF4444";
            if (!isPortUp) strokeDasharray = [5, 5];
          } else if (
            sourceSegment.type === "switch" &&
            targetSegment.type === "pc"
          ) {
            // Direct Switch to PC connection (no patch panels)
            edgeLabel = `S:${conn.switch_port} -> PC`;
            isPortUp = conn.is_switch_port_up;
            currentSegmentCableColor = conn.cable_color; // Color from main connection
            currentSegmentCableLabel = conn.cable_label; // Label from main connection
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
            cable_color: currentSegmentCableColor, // Include new fields in edge data
            cable_label: currentSegmentCableLabel, // Include new fields in edge data
            isPortUp: isPortUp,
            dashOffset: 0,
          });
        }
      });
      setEdgesData(newEdgesData);
    },
    [connections, pcs, getKonvaNodeConnectionPoint]
  );

  // Effect to generate initial nodes and edges data with hierarchical layout
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
    const nodeMap = new Map(); // To store nodes by ID for quick lookup and avoid duplicates

    // Add the central Switch node
    const switchNodeId = String(selectedSwitch.id);
    const switchNode = {
      id: switchNodeId,
      type: "switch",
      label: selectedSwitch.name,
      position: { x: 0, y: NODE_HEIGHT / 2 }, // Temporary X, will be centered later
      data: selectedSwitch,
      isHovered: false,
      text: "", // Tooltip text will be populated by component
    };
    initialNodes.push(switchNode);
    nodeMap.set(switchNodeId, switchNode);

    const relevantConnections = connections.filter(
      (conn) => conn.switch_id === selectedSwitch.id
    );

    const layerSpacingY = NODE_HEIGHT * 2.5; // Vertical spacing between layers
    const horizontalSpacing = NODE_WIDTH * 1.5; // Base horizontal spacing

    // --- Phase 1: Identify all unique Patch Panels and PCs involved ---
    const uniquePatchPanels = new Map(); // Map: pp_id -> pp_data
    const uniquePcs = new Map(); // Map: pc_id -> pc_data

    relevantConnections.forEach((conn) => {
      conn.hops.forEach((hop) => {
        const ppId = `pp-${hop.patch_panel.id}`;
        if (!uniquePatchPanels.has(ppId)) {
          uniquePatchPanels.set(ppId, { data: hop.patch_panel });
        }
      });
      const pcId = `pc-${conn.pc_id}-${conn.id}`; // Use conn.id for unique PC node if it's connected multiple times
      if (!uniquePcs.has(pcId)) {
        const pcData = pcs.find((p) => p.id === conn.pc_id);
        if (pcData) {
          uniquePcs.set(pcId, {
            data: pcData,
            isPortUp: conn.is_switch_port_up,
            connectionId: conn.id,
          });
        }
      }
    });

    // --- Phase 2: Position nodes hierarchically ---
    // Layer 1: Switch (already added and positioned)

    // Layer 2: Patch Panels and direct PCs
    const layer2Nodes = [];
    let currentLayer2X = 0; // Temp X for layout calculation

    // Add unique Patch Panels to layer 2
    Array.from(uniquePatchPanels.entries())
      .sort((a, b) => a[1].data.name.localeCompare(b[1].data.name))
      .forEach(([ppNodeId, ppData]) => {
        const ppNode = {
          id: ppNodeId,
          type: "patchPanel",
          label: ppData.data.name,
          position: {
            x: currentLayer2X,
            y: switchNode.position.y + layerSpacingY,
          },
          data: ppData.data,
          isHovered: false,
          text: "", // Tooltip text will be populated by component
        };
        initialNodes.push(ppNode);
        nodeMap.set(ppNodeId, ppNode);
        layer2Nodes.push(ppNode);
        currentLayer2X += horizontalSpacing;
      });

    // Add direct PCs (connections with no hops) to layer 2
    relevantConnections
      .filter((conn) => conn.hops.length === 0)
      .forEach((conn) => {
        const pcId = `pc-${conn.pc_id}-${conn.id}`;
        const pcData = uniquePcs.get(pcId);
        if (pcData && !nodeMap.has(pcId)) {
          // Ensure it's not already added
          const pcNode = {
            id: pcId,
            type: "pc",
            label: pcData.data.name,
            position: {
              x: currentLayer2X,
              y: switchNode.position.y + layerSpacingY,
            },
            data: pcData.data,
            isPortUp: pcData.isPortUp,
            isHovered: false,
            text: "", // Tooltip text will be populated by component
          };
          initialNodes.push(pcNode);
          nodeMap.set(pcId, pcNode);
          layer2Nodes.push(pcNode);
          currentLayer2X += horizontalSpacing;
        }
      });

    // Center Layer 2 nodes
    const totalLayer2Width = layer2Nodes.length * horizontalSpacing;
    const layer2OffsetX = (containerDimensions.width - totalLayer2Width) / 2;
    layer2Nodes.forEach((node, index) => {
      node.position.x = layer2OffsetX + index * horizontalSpacing;
    });

    // Layer 3: PCs connected via Patch Panels (only if they are not direct PCs)
    const layer3Nodes = [];
    let currentLayer3X = 0; // Temp X for layout calculation

    // Collect PCs that are connected via patch panels
    const pcsConnectedViaPp = new Map(); // Map: pc_id -> pc_data
    relevantConnections
      .filter((conn) => conn.hops.length > 0)
      .forEach((conn) => {
        const pcId = `pc-${conn.pc_id}-${conn.id}`;
        const pcData = uniquePcs.get(pcId);
        if (pcData && !pcsConnectedViaPp.has(pcId)) {
          pcsConnectedViaPp.set(pcId, pcData);
        }
      });

    Array.from(pcsConnectedViaPp.entries())
      .sort((a, b) => a[1].data.name.localeCompare(b[1].data.name))
      .forEach(([pcNodeId, pcData]) => {
        // Ensure this PC isn't already placed in Layer 2 as a direct connection
        const isDirectPc = relevantConnections.some(
          (conn) =>
            conn.hops.length === 0 && `pc-${conn.pc_id}-${conn.id}` === pcNodeId
        );
        if (!isDirectPc && !nodeMap.has(pcNodeId)) {
          // Also check nodeMap to prevent true duplicates
          const pcNode = {
            id: pcNodeId,
            type: "pc",
            label: pcData.data.name,
            position: {
              x: currentLayer3X,
              y: switchNode.position.y + layerSpacingY * 2,
            },
            data: pcData.data,
            isPortUp: pcData.isPortUp,
            isHovered: false,
            text: "", // Tooltip text will be populated by component
          };
          initialNodes.push(pcNode);
          nodeMap.set(pcNodeId, pcNode);
          layer3Nodes.push(pcNode);
          currentLayer3X += horizontalSpacing;
        }
      });

    // Center Layer 3 nodes
    const totalLayer3Width = layer3Nodes.length * horizontalSpacing;
    const layer3OffsetX = (containerDimensions.width - totalLayer3Width) / 2;
    layer3Nodes.forEach((node, index) => {
      node.position.x = layer3OffsetX + index * horizontalSpacing;
    });

    setNodesData(initialNodes);
    updateEdges(initialNodes); // Call updateEdges with the fully positioned nodes

    // Auto-fit view logic for Konva - ONLY on initial load/switch change
    if (initialNodes.length > 0) {
      let minXFinal = Infinity,
        minYFinal = Infinity,
        maxXFinal = -Infinity,
        maxYFinal = -Infinity;

      initialNodes.forEach((node) => {
        minXFinal = Math.min(minXFinal, node.position.x);
        minYFinal = Math.min(minYFinal, node.position.y);
        maxXFinal = Math.max(maxXFinal, node.position.x + NODE_WIDTH);
        maxYFinal = Math.max(maxYFinal, node.position.y + NODE_HEIGHT);
      });

      const diagramWidth = maxXFinal - minXFinal + NODE_WIDTH; // Add node width to ensure padding
      const diagramHeight = maxYFinal - minYFinal + NODE_HEIGHT; // Add node height to ensure padding

      const paddingFactor = 0.9; // 10% padding
      const scaleX = (containerDimensions.width / diagramWidth) * paddingFactor;
      const scaleY =
        (containerDimensions.height / diagramHeight) * paddingFactor;
      const newScale = Math.min(scaleX, scaleY, 1.0); // Limit max zoom to 1.0 (no scaling up past actual size)

      const centerX = (minXFinal + maxXFinal) / 2;
      const centerY = (minYFinal + maxYFinal) / 2;

      const newPosX = containerDimensions.width / 2 - centerX * newScale;
      const newPosY = containerDimensions.height / 2 - centerY * newScale;

      setStageScale(newScale);
      setStagePos({ x: newPosX, y: newPosY });
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

      const diagramWidth = maxX - minX + NODE_WIDTH; // Add node width to ensure padding
      const diagramHeight = maxY - minY + NODE_HEIGHT; // Add node height to ensure padding

      const paddingFactor = 0.95; // Add 10% padding
      const scaleX = (containerDimensions.width / diagramWidth) * paddingFactor;
      const scaleY =
        (containerDimensions.height / diagramHeight) * paddingFactor;
      const newScale = Math.min(scaleX, scaleY, 1.0); // Limit max zoom to 1.0 (no scaling up past actual size)

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const newPosX = containerDimensions.width / 2 - centerX * newScale;
      const newPosY = containerDimensions.height / 2 - centerY * newScale;

      setStageScale(newScale);
      setStagePos({ x: newPosX, y: newPosY });
    } else {
      setStageScale(1);
      setStagePos({ x: 0, y: 0 });
    }
  }, [containerDimensions, nodesData]); // Added nodesData as a dependency here to ensure it uses latest positions

  // Reset view when modal opens or switch changes
  useEffect(() => {
    // Only call handleResetView if there are nodes to fit
    if (isOpen && selectedSwitch && nodesData.length > 0) {
      handleResetView();
    }
  }, [isOpen, selectedSwitch, handleResetView, nodesData.length]); // Added nodesData.length as dependency here

  // Handle download of the diagram as a high-resolution image
  const handleDownloadDiagram = () => {
    if (stageRef.current) {
      // Use a higher pixelRatio for high-resolution download
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 }); // Adjust pixelRatio for desired resolution (e.g., 2, 3, 4)
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = `network-diagram-${selectedSwitch?.name || "unknown"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Network size={24} className="mr-2" /> Network Diagram:{" "}
            {selectedSwitch?.name || "N/A"}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadDiagram}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              title="Download Diagram"
            >
              <Download size={24} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              title="Close Diagram"
            >
              <XCircle size={24} />
            </button>
          </div>
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
                      let iconToUse = null;
                      if (node.type === "switch") {
                        iconToUse = switchIconImage;
                      } else if (node.type === "pc") {
                        // Choose PC icon based on type
                        iconToUse =
                          node.data.type === "Server"
                            ? serverIconImage
                            : workstationIconImage;
                      } else if (node.type === "patchPanel") {
                        iconToUse = ppIconImage;
                      }

                      const NodeComponent =
                        node.type === "switch"
                          ? SwitchNodeKonva
                          : node.type === "pc"
                          ? PcNodeKonva
                          : PatchPanelNodeKonva;

                      return (
                        <NodeComponent
                          key={node.id}
                          node={node}
                          onNodeHover={handleNodeHover}
                          onNodeLeave={handleNodeLeave}
                          onNodeDragEnd={handleNodeDragEnd}
                          iconImage={iconToUse} // Pass dynamically selected icon
                        />
                      );
                    })}

                    {/* Render Edge Labels (Port information + Cable info) */}
                    {edgesData.map((edge) => {
                      // Calculate midpoint of the line for label positioning
                      const midX = (edge.points[0] + edge.points[2]) / 2;
                      const midY = (edge.points[1] + edge.points[3]) / 2;

                      // Combine label, color, and label info
                      let fullLabel = edge.label;
                      if (edge.cable_color) {
                        fullLabel += ` [${edge.cable_color}]`;
                      }
                      if (edge.cable_label) {
                        fullLabel += ` (${edge.cable_label})`;
                      }

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
                          text={fullLabel} // Use combined label
                          x={midX}
                          y={midY - 10} // Offset slightly above the line
                          fontSize={9}
                          fill="gray"
                          align="center"
                          rotation={rotation}
                          // Adjust offsets based on rotation and desired alignment
                          offsetX={(fullLabel.length * 9) / 2} // Approximate center based on font size
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
            <Laptop size={16} className="text-indigo-500 mr-1" /> Workstation
          </div>
          <div className="flex items-center">
            <HardDrive size={16} className="text-indigo-500 mr-1" /> Server
          </div>
          <div className="flex items-center">
            <Split size={16} className="text-gray-500 mr-1" /> Via Patch Panel
          </div>
          <div className="flex items-center">
            <Palette size={16} className="text-purple-500 mr-1" /> Cable Color
          </div>
          <div className="flex items-center">
            <Tag size={16} className="text-orange-500 mr-1" /> Cable Label
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwitchDiagramModal;
