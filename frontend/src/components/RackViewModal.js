// frontend/src/components/RackViewModal.js
// This modal displays a larger, more detailed view of a single rack,
// including its visual unit representation and key information.
// UPDATED: Imports RackVisualizer from its new dedicated file and passes pcs data.

import React from "react";
import { XCircle, Columns, MapPin, Info } from "lucide-react";
import { RackVisualizer } from "./RackVisualizer"; // NEW: Import RackVisualizer from its own file

function RackViewModal({ isOpen, onClose, rack, switches, patchPanels, pcs }) {
  // Added pcs prop
  if (!isOpen || !rack) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Columns size={24} className="mr-2" /> Rack Details: {rack.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Close"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Modal Content - Rack Details and Visualizer */}
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                General Information:
              </h3>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <MapPin size={16} className="text-gray-500 mr-2" /> Location:{" "}
                {rack.location_name || "N/A"}
                {rack.location?.door_number &&
                  ` (Door: ${rack.location.door_number})`}
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Columns size={16} className="text-gray-500 mr-2" /> Total
                Units: {rack.total_units}U
              </p>
              <p className="text-sm text-gray-700 mb-1 flex items-center">
                <Info size={16} className="text-gray-500 mr-2" /> Orientation:{" "}
                {rack.orientation || "N/A"}
              </p>
              <p className="text-sm text-gray-700 mb-3 flex items-start">
                <Info
                  size={16}
                  className="text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                />{" "}
                Description: {rack.description || "No description"}
              </p>
            </div>

            {/* The larger RackVisualizer */}
            <div className="border border-gray-300 rounded-md p-2 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                Rack Layout:
              </h3>
              <RackVisualizer
                rack={rack}
                switches={Array.isArray(switches) ? switches : []}
                patchPanels={Array.isArray(patchPanels) ? patchPanels : []}
                pcs={Array.isArray(pcs) ? pcs : []}
                // onShowPortStatus might not be needed in this read-only modal context,
                // or you might want to pass it through if you want clickable units in the modal.
                // For now, removing to avoid prop drilling if not strictly necessary.
                // If you want units clickable in the modal, you need to pass it from App.js to this modal.
                isModalView={true} // Explicitly set to true for modal view
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RackViewModal;
