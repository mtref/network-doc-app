// frontend/src/components/RackVisualizer.js
// This component visually represents a single rack, showing its units
// and which units are occupied by Switches, Patch Panels, or Server-type PCs.

import React, { useRef, useEffect } from "react";
import {
  Server, // Icon for Switch and Server-type PC
  Split, // Icon for Patch Panel
  HardDrive, // Generic device icon for unknown type / placeholder
  ArrowDownNarrowWide, // Icon for top-down orientation
  ArrowUpWideNarrow, // Icon for bottom-up orientation
  Laptop, // Icon for Workstation (not directly used here, but good to have)
} from "lucide-react";

export const RackVisualizer = ({
  rack,
  switches,
  patchPanels,
  pcs, // Added pcs prop
  onShowPortStatus,
  isModalView,
}) => {
  // --- DEBUG LOGS ---
  console.log("--- RackVisualizer Render Start ---");
  console.log("Current Rack:", rack);
  console.log("All Switches passed:", switches);
  console.log("All Patch Panels passed:", patchPanels);
  console.log("All PCs passed:", pcs); // CRITICAL: Check the content of this array
  // --- END DEBUG LOGS ---

  // Explicitly ensure props are arrays, even if undefined/null
  const currentSwitches = Array.isArray(switches) ? switches : [];
  const currentPatchPanels = Array.isArray(patchPanels) ? patchPanels : [];
  const currentPcs = Array.isArray(pcs) ? pcs : []; // NEW: Ensure pcs is an array

  const visualizerRef = useRef(null); // Create a ref for the visualizer div

  // Effect to prevent scroll propagation for the inline list view
  // This prevents the main page from scrolling when scrolling within the small rack visualizer.
  useEffect(() => {
    const handleWheel = (event) => {
      // Only apply this fix for the inline list view, not the modal
      if (!isModalView && visualizerRef.current) {
        const { clientHeight, scrollHeight, scrollTop } = visualizerRef.current;
        const isContentScrollable = scrollHeight > clientHeight;

        // Determine if the scroll is at the top or bottom
        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

        if (isContentScrollable) {
          // Prevent default only if scrolling up from top or down from bottom
          if (event.deltaY < 0 && isAtTop) {
            // Scrolling up at top
            event.preventDefault();
          } else if (event.deltaY > 0 && isAtBottom) {
            // Scrolling down at bottom
            event.preventDefault();
          }
        }
      }
    };

    const visualizerElement = visualizerRef.current;
    if (visualizerElement) {
      // Use passive: false to allow preventDefault
      visualizerElement.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      return () => {
        visualizerElement.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isModalView]); // Re-run effect if isModalView changes

  if (!rack || !rack.total_units) {
    console.log("RackVisualizer: No rack or total_units data.");
    return (
      <div className="text-sm text-gray-500 mt-2">
        No rack unit information available.
      </div>
    );
  }

  // Create an array of units from 1 to total_units
  const rawUnits = Array.from({ length: rack.total_units }, (_, i) => i + 1);

  // Reverse the units for display if orientation is 'bottom-up' (standard rack view)
  // Or keep as is if 'top-down'
  const displayUnits =
    rack.orientation === "top-down" ? rawUnits : [...rawUnits].reverse();

  // Create a map of occupied units for quick lookup
  const occupiedUnits = new Map(); // Map: unitNumber -> { type: 'switch'|'patchPanel'|'pc', name: 'DeviceName', id: deviceId, total_ports: number }

  // Switches in this rack
  currentSwitches.forEach((s) => {
    if (s && s.rack_id === rack.id && s.row_in_rack) {
      const unit = parseInt(s.row_in_rack);
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        occupiedUnits.set(unit, {
          type: "switch",
          name: s.name,
          id: s.id,
          total_ports: s.total_ports,
        });
        console.log(`Mapping Switch: ${s.name} to U${unit}`);
      } else {
        console.warn(
          `Switch ${s.name}: Invalid row_in_rack ${s.row_in_rack} or out of bounds for rack U${rack.total_units}`
        );
      }
    }
  });

  // Patch Panels in this rack
  currentPatchPanels.forEach((pp) => {
    if (pp && pp.rack_id === rack.id && pp.row_in_rack) {
      const unit = parseInt(pp.row_in_rack);
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        // Only add if the unit is not already occupied by a switch (switches take precedence)
        if (!occupiedUnits.has(unit)) {
          occupiedUnits.set(unit, {
            type: "patchPanel",
            name: pp.name,
            id: pp.id,
            total_ports: pp.total_ports,
          });
          console.log(`Mapping Patch Panel: ${pp.name} to U${unit}`);
        } else {
          console.log(
            `Unit U${unit} already occupied by ${
              occupiedUnits.get(unit).name
            }. Skipping Patch Panel ${pp.name}.`
          );
        }
      } else {
        console.warn(
          `Patch Panel ${pp.name}: Invalid row_in_rack ${pp.row_in_rack} or out of bounds for rack U${rack.total_units}`
        );
      }
    }
  });

  // NEW: Server-type PCs in this rack
  currentPcs.forEach((pc) => {
    // Log each PC being considered by RackVisualizer
    console.log(
      `Considering PC: Name: ${pc?.name}, Type: ${pc?.type}, PC Rack ID: ${pc?.rack_id}, PC Row: ${pc?.row_in_rack}, Current Rack ID: ${rack.id}`
    );

    if (
      pc &&
      pc.type === "Server" && // Check if it's a Server type
      pc.rack_id === rack.id && // Check if it belongs to this specific rack
      pc.row_in_rack // Check if it has a row assigned
    ) {
      const unit = parseInt(pc.row_in_rack);
      console.log(
        `  -> Server PC "${pc.name}" matches criteria. Parsed Unit: ${unit}`
      );
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        // Only add if the unit is not already occupied by a switch or patch panel
        if (!occupiedUnits.has(unit)) {
          occupiedUnits.set(unit, {
            type: "pc",
            name: pc.name,
            id: pc.id,
            total_ports: "N/A",
          }); // Servers don't have "ports" in the same way
          console.log(
            `    -> Successfully Mapped Server PC: ${pc.name} to U${unit}`
          );
        } else {
          console.warn(
            `    -> Unit U${unit} already occupied by ${
              occupiedUnits.get(unit).name
            }. Skipping Server PC ${pc.name} due to precedence.`
          );
        }
      } else {
        console.warn(
          `  -> Server PC ${pc.name}: Invalid row_in_rack "${pc.row_in_rack}" (parsed: ${unit}) or out of bounds for rack U${rack.total_units}.`
        );
      }
    } else {
      console.log(
        `  -> PC "${pc?.name}" did NOT match criteria (type="Server", rack_id=${rack.id}, row_in_rack set).`
      );
    }
  });

  console.log(
    `Final occupiedUnits map for Rack "${rack.name}" (ID: ${rack.id}):`,
    Object.fromEntries(occupiedUnits.entries())
  );
  console.log("--- RackVisualizer Render End ---");

  // Determine text color based on orientation
  const orientationTextColor =
    rack.orientation === "top-down" ? "text-blue-600" : "text-purple-600";
  const OrientationIcon =
    rack.orientation === "top-down" ? ArrowDownNarrowWide : ArrowUpWideNarrow;

  return (
    // Conditional classes for height and overflow
    <div
      ref={visualizerRef} // Assign the ref here
      className={`mt-4 border border-gray-300 rounded-md p-2 bg-gray-50 ${
        isModalView ? "" : "max-h-64 overflow-y-auto"
      }`}
    >
      <h5 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1 flex items-center justify-between">
        <span>Rack Units ({rack.total_units}U)</span>
        <span
          className={`text-xs font-normal flex items-center ${orientationTextColor}`}
        >
          <OrientationIcon size={14} className="mr-1" />
          {rack.orientation === "top-down" ? "Top-Down" : "Bottom-Up"}
        </span>
      </h5>
      <div className="space-y-0.5">
        {displayUnits.map((unit) => {
          const content = occupiedUnits.get(unit);
          let unitClass = "bg-gray-200 text-gray-600"; // Free slot
          let unitContent = `U${unit}: Free`;
          let Icon = HardDrive; // Default generic icon
          let isClickable = false;
          let entityType = null;
          let entityId = null;

          if (content) {
            isClickable = true; // Make occupied units clickable
            entityId = content.id;
            if (content.type === "switch") {
              unitClass = "bg-red-100 text-red-800 border border-red-300";
              unitContent = `U${unit}: ${content.name} (SW - ${content.total_ports}p)`;
              Icon = Server;
              entityType = "switches";
            } else if (content.type === "patchPanel") {
              unitClass = "bg-green-100 text-green-800 border border-green-300";
              unitContent = `U${unit}: ${content.name} (PP - ${content.total_ports}p)`;
              Icon = Split;
              entityType = "patch_panels";
            } else if (content.type === "pc") {
              // NEW: Server PC type
              unitClass =
                "bg-indigo-100 text-indigo-800 border border-indigo-300";
              unitContent = `U${unit}: ${content.name} (Server)`;
              Icon = Server; // Using Server icon for server PCs
              entityType = "pcs"; // New entity type for onShowPortStatus if you want to implement it for PCs
            }
          }

          return (
            <div
              key={unit}
              className={`flex items-center text-xs p-1 rounded ${unitClass} ${
                isClickable
                  ? "cursor-pointer hover:shadow-md transition-shadow duration-200"
                  : ""
              }`}
              title={
                content
                  ? `${content.name} (${
                      content.type === "switch"
                        ? "Switch"
                        : content.type === "patchPanel"
                        ? "Patch Panel"
                        : "Server PC"
                    }) - ${
                      content.total_ports !== "N/A"
                        ? `${content.total_ports} ports`
                        : "Rack Mounted"
                    }`
                  : `U${unit}: Free`
              }
              onClick={
                isClickable && onShowPortStatus
                  ? () => onShowPortStatus(entityType, entityId)
                  : null
              }
            >
              <Icon size={12} className="mr-1 flex-shrink-0" />
              <span className="flex-grow truncate">{unitContent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
