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

  const occupiedUnits = new Map();

  currentSwitches.forEach((s) => {
    if (s && s.rack_id === rack.id && s.row_in_rack) {
      const unit = parseInt(s.row_in_rack);
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        occupiedUnits.set(unit, {
          type: "switch",
          name: s.name,
          id: s.id,
          total_ports: s.total_ports,
          data: s,
        });
      }
    }
  });

  currentPatchPanels.forEach((pp) => {
    if (pp && pp.rack_id === rack.id && pp.row_in_rack) {
      const unit = parseInt(pp.row_in_rack);
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        if (!occupiedUnits.has(unit)) {
          occupiedUnits.set(unit, {
            type: "patchPanel",
            name: pp.name,
            id: pp.id,
            total_ports: pp.total_ports,
            data: pp,
          });
        }
      }
    }
  });

  currentPcs.forEach((pc) => {
    if (
      pc &&
      pc.type === "Server" &&
      pc.rack_id === rack.id &&
      pc.row_in_rack
    ) {
      const unit = parseInt(pc.row_in_rack);
      if (!isNaN(unit) && unit >= 1 && unit <= rack.total_units) {
        if (!occupiedUnits.has(unit)) {
          occupiedUnits.set(unit, {
            type: "pc",
            name: pc.name,
            id: pc.id,
            total_ports: "N/A",
            data: pc,
          });
        }
      }
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
          const content = occupiedUnits.get(unit);
          let unitClass = "bg-gray-200 text-gray-600";
          let unitContent = `U${unit}: Free`;
          let Icon = HardDrive;
          let isClickable = false;
          let entityType = null;
          let entityId = null;

          if (content) {
            isClickable = true;
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
              unitClass =
                "bg-indigo-100 text-indigo-800 border border-indigo-300";
              unitContent = `U${unit}: ${content.name} (Server)`;
              Icon = Server;
              entityType = "pcs";
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
