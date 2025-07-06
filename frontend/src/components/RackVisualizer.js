// frontend/src/components/RackVisualizer.js
// This component visually represents a single rack, showing its units
// and which units are occupied by Switches, Patch Panels, or Server-type PCs.
// UPDATED: Now handles devices that occupy multiple rack units.

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
  pcs,
  onShowPortStatus,
  onViewPcDetails,
  isModalView,
}) => {
  // Explicitly ensure props are arrays, even if undefined/null
  const currentSwitches = Array.isArray(switches) ? switches : [];
  const currentPatchPanels = Array.isArray(patchPanels) ? patchPanels : [];
  const currentPcs = Array.isArray(pcs) ? pcs : [];

  const visualizerRef = useRef(null);

  // Effect to prevent scroll propagation for the inline list view
  useEffect(() => {
    const handleWheel = (event) => {
      if (!isModalView && visualizerRef.current) {
        const { clientHeight, scrollHeight, scrollTop } = visualizerRef.current;
        const isContentScrollable = scrollHeight > clientHeight;

        const isAtTop = scrollTop === 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight;

        if (isContentScrollable) {
          if (event.deltaY < 0 && isAtTop) {
            event.preventDefault();
          } else if (event.deltaY > 0 && isAtBottom) {
            event.preventDefault();
          }
        }
      }
    };

    const visualizerElement = visualizerRef.current;
    if (visualizerElement) {
      visualizerElement.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      return () => {
        visualizerElement.removeEventListener("wheel", handleWheel);
      };
    }
  }, [isModalView]);

  if (!rack || !rack.total_units) {
    return (
      <div className="text-sm text-gray-500 mt-2">
        No rack unit information available.
      </div>
    );
  }

  const rawUnits = Array.from({ length: rack.total_units }, (_, i) => i + 1);

  const displayUnits =
    rack.orientation === "top-down" ? rawUnits : [...rawUnits].reverse();

  // Map to store which unit is occupied by which device.
  // Each entry will point to the *same* device object for all units it occupies.
  const occupiedUnitsMap = new Map(); // Map: unitNumber -> { type, name, id, total_ports, data, units_occupied, start_unit }

  // Helper to add a device to the occupiedUnitsMap
  const addDeviceToMap = (device, type) => {
    if (
      device &&
      device.rack_id === rack.id &&
      device.row_in_rack !== null &&
      device.units_occupied !== null
    ) {
      const startUnit = parseInt(device.row_in_rack);
      const units = parseInt(device.units_occupied);

      if (
        !isNaN(startUnit) &&
        !isNaN(units) &&
        startUnit >= 1 &&
        units >= 1 &&
        startUnit + units - 1 <= rack.total_units
      ) {
        for (let i = 0; i < units; i++) {
          const currentUnit = startUnit + i;
          // Store the device data for each unit it occupies
          occupiedUnitsMap.set(currentUnit, {
            type: type,
            name: device.name,
            id: device.id,
            total_ports: device.total_ports, // Only relevant for switches/patch panels
            data: device, // Full device object
            units_occupied: units, // Number of units this device occupies
            start_unit: startUnit, // The starting unit of this device
          });
        }
      }
    }
  };

  currentSwitches.forEach((s) => addDeviceToMap(s, "switch"));
  currentPatchPanels.forEach((pp) => addDeviceToMap(pp, "patchPanel"));
  currentPcs.forEach((pc) => {
    if (pc.type === "Server") {
      // Only Server PCs are rack-mounted
      addDeviceToMap(pc, "pc");
    }
  });

  const orientationTextColor =
    rack.orientation === "top-down" ? "text-blue-600" : "text-purple-600";
  const OrientationIcon =
    rack.orientation === "top-down" ? ArrowDownNarrowWide : ArrowUpWideNarrow;

  return (
    <div
      ref={visualizerRef}
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
          const content = occupiedUnitsMap.get(unit);
          let unitClass = "bg-gray-200 text-gray-600";
          let unitContent = `U${unit}: Free`;
          let Icon = HardDrive;
          let isClickable = false;
          let entityType = null;
          let entityId = null;
          let unitRangeText = "";

          if (content) {
            // Only render if this is the *starting* unit of a multi-unit device,
            // or a single-unit device. This prevents rendering the device name multiple times.
            if (content.start_unit === unit || content.units_occupied === 1) {
              isClickable = true;
              entityId = content.id;
              unitRangeText =
                content.units_occupied > 1
                  ? ` (${content.start_unit}-${
                      content.start_unit + content.units_occupied - 1
                    }U)`
                  : ` (${content.start_unit}U)`;

              if (content.type === "switch") {
                unitClass = "bg-red-100 text-red-800 border border-red-300";
                unitContent = `U${unit}${unitRangeText}: ${content.name} (SW - ${content.total_ports}p)`;
                Icon = Server;
                entityType = "switches";
              } else if (content.type === "patchPanel") {
                unitClass =
                  "bg-green-100 text-green-800 border border-green-300";
                unitContent = `U${unit}${unitRangeText}: ${content.name} (PP - ${content.total_ports}p)`;
                Icon = Split;
                entityType = "patch_panels";
              } else if (content.type === "pc") {
                unitClass =
                  "bg-indigo-100 text-indigo-800 border border-indigo-300";
                unitContent = `U${unit}${unitRangeText}: ${content.name} (Server)`;
                Icon = Server;
                entityType = "pcs";
              }
            } else {
              // This unit is part of a multi-unit device, but not the starting unit.
              // We'll just show it as occupied without repeating the device name.
              unitClass = "bg-gray-300 text-gray-700"; // Slightly darker gray for occupied but not primary unit
              unitContent = `U${unit}: Occupied`;
              Icon = HardDrive; // Generic icon
              isClickable = false; // Not clickable individually
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
                    })${
                      content.units_occupied > 1
                        ? ` occupying ${content.units_occupied} units from U${content.start_unit}`
                        : ""
                    } - ${
                      content.total_ports !== undefined &&
                      content.total_ports !== "N/A"
                        ? `${content.total_ports} ports`
                        : "Rack Mounted"
                    }`
                  : `U${unit}: Free`
              }
              onClick={
                isClickable
                  ? () => {
                      if (content.type === "pc" && onViewPcDetails) {
                        onViewPcDetails(content.data);
                      } else if (onShowPortStatus) {
                        onShowPortStatus(entityType, entityId);
                      }
                    }
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
