// frontend/src/components/PcDetailsModal.js
// This modal displays detailed information about a selected PC.
// UPDATED: Now displays new fields: Serial Number, PC Specification, Monitor Model, and Disk Info.

import React from "react";
import {
  XCircle,
  Laptop,
  Server,
  MapPin,
  Columns,
  Info,
  User,
  HardDrive,
  ToggleRight,
  ToggleLeft,
  MonitorCheck,
  Activity,
  Tag,
  Link,
  Router,
  Globe,
  Fingerprint,
  ClipboardList,
  Database,
  Monitor,
} from "lucide-react";

function PcDetailsModal({ isOpen, onClose, pc }) {
  if (!isOpen || !pc) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            {pc.type === "Server" ? (
              <Server size={24} className="mr-2 text-indigo-500" />
            ) : (
              <Laptop size={24} className="mr-2 text-indigo-500" />
            )}
            PC Details: {pc.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            title="Close"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Modal Content - PC Details */}
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <p className="text-sm text-gray-700 flex items-center">
              <Router size={16} className="text-gray-500 mr-2" /> IP Address:{" "}
              <span className="font-medium">{pc.ip_address || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <User size={16} className="text-gray-500 mr-2" /> Username:{" "}
              <span className="font-medium">{pc.username || "N/A"}</span>
            </p>
             <p className="text-sm text-gray-700 flex items-center col-span-full">
              <Fingerprint size={16} className="text-gray-500 mr-2" /> Serial Number:{" "}
              <span className="font-medium">{pc.serial_number || "N/A"}</span>
            </p>
             <p className="text-sm text-gray-700 flex items-center col-span-full">
              <Monitor size={16} className="text-gray-500 mr-2" /> Monitor(s):{" "}
              <span className="font-medium">{pc.monitor_model || "N/A"}</span>
            </p>
             <p className="text-sm text-gray-700 flex items-center col-span-full">
              <Database size={16} className="text-gray-500 mr-2" /> Disk(s):{" "}
              <span className="font-medium">{pc.disk_info || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              {pc.in_domain ? (
                <ToggleRight size={16} className="text-green-500 mr-2" />
              ) : (
                <ToggleLeft size={16} className="text-red-500 mr-2" />
              )}{" "}
              In Domain:{" "}
              <span className="font-medium">{pc.in_domain ? "Yes" : "No"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <MonitorCheck size={16} className="text-gray-500 mr-2" /> OS:{" "}
              <span className="font-medium">
                {pc.operating_system || "N/A"}
              </span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <Tag size={16} className="text-gray-500 mr-2" /> Model:{" "}
              <span className="font-medium">{pc.model || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <MapPin size={16} className="text-gray-500 mr-2" /> Office:{" "}
              <span className="font-medium">{pc.office || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <Link size={16} className="text-gray-500 mr-2" /> Multi-Port:{" "}
              <span className="font-medium">
                {pc.multi_port ? "Yes" : "No"}
              </span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <HardDrive size={16} className="text-gray-500 mr-2" /> Type:{" "}
              <span className="font-medium">{pc.type || "N/A"}</span>
            </p>
            <p className="text-sm text-gray-700 flex items-center">
              <Activity size={16} className="text-gray-500 mr-2" /> Usage:{" "}
              <span className="font-medium">{pc.usage || "N/A"}</span>
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
              <ClipboardList size={18} className="mr-2" /> PC Specification:
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {pc.pc_specification || "No specification provided."}
            </p>
          </div>

          {pc.type === "Server" && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
                <Columns size={18} className="mr-2" /> Rack Information:
              </h3>
              <p className="text-sm text-gray-700 flex items-center mb-1">
                <Columns size={16} className="text-gray-500 mr-2" /> Rack Name:{" "}
                <span className="font-medium">{pc.rack_name || "N/A"}</span>
              </p>
              <p className="text-sm text-gray-700 flex items-center mb-1">
                <Info size={16} className="text-gray-500 mr-2" /> Starting Row:{" "}
                <span className="font-medium">{pc.row_in_rack || "N/A"}</span>
              </p>
              <p className="text-sm text-gray-700 flex items-center">
                <HardDrive size={16} className="text-gray-500 mr-2" /> Units
                Occupied:{" "}
                <span className="font-medium">
                  {pc.units_occupied || "N/A"}U
                </span>
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
              <Info size={18} className="mr-2" /> Description:
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {pc.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PcDetailsModal;
