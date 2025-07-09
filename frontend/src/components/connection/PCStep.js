// /frontend/src/components/connection/PCStep.js
import React from "react";
import {
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Laptop,
  Server,
  HardDrive,
  MonitorCheck,
  Columns,
  Router,
  User,
  Globe,
  Tag,
  Building2,
  Activity,
  Info,
  Fingerprint,
  ClipboardList,
  Database,
  Monitor,
} from "lucide-react";
import { SearchableSelect } from './SearchableSelect'; // Import the new component

export const PCStep = ({ formState, formSetters, handlers, refs }) => {
  const {
    pcId,
    availablePcsForConnection,
    isNewPcExpanded,
    newPcName,
    newPcIp,
    newPcUsername,
    newPcInDomain,
    newPcOs,
    newPcModel,
    newPcOffice,
    newPcDesc,
    newPcMultiPort,
    newPcType,
    newPcUsage,
    newPcRowInRack,
    newPcRackId,
    newPcUnitsOccupied,
    newPcSerialNumber,
    newPcSpecification,
    newPcMonitorModel,
    newPcDiskInfo,
    showNewPcCustomUsageInput,
    newPcCustomUsageValue,
    ipRegex,
    usageOptions,
    racks,
  } = formState;
  const {
    setPcId,
    setCurrentStep,
    setIsNewPcExpanded,
    setNewPcName,
    setNewPcIp,
    setNewPcUsername,
    setNewPcInDomain,
    setNewPcOs,
    setNewPcModel,
    setNewPcOffice,
    setNewPcDesc,
    setNewPcMultiPort,
    setNewPcType,
    setNewPcUsage,
    setNewPcRowInRack,
    setNewPcRackId,
    setNewPcUnitsOccupied,
    setNewPcSerialNumber,
    setNewPcSpecification,
    setNewPcMonitorModel,
    setNewPcDiskInfo,
    setShowNewPcCustomUsageInput,
    setNewPcCustomUsageValue,
  } = formSetters;
  const { onAddEntity, showMessage } = handlers;
  const { lastCreatedPcIdRef } = refs;

  const sortedRacks = [...racks].sort((a, b) => a.name.localeCompare(b.name));

  const handleNewPcSaveAndContinue = async (e) => {
    e.preventDefault();
    if (!newPcName.trim()) {
      showMessage("PC Name is required.", 3000);
      return;
    }
    if (newPcIp && !ipRegex.test(newPcIp)) {
      showMessage(
        "Please enter a valid IP address for PC (e.g., 192.168.1.1).",
        5000
      );
      return;
    }
    if (newPcType === "Server") {
      if (!newPcRackId || newPcRowInRack === "" || newPcUnitsOccupied === "") {
        showMessage(
          "For Server type PCs, Rack, Starting Row in Rack, and Units Occupied are required.",
          5000
        );
        return;
      }
      const selectedRack = racks.find((r) => String(r.id) === newPcRackId);
      if (selectedRack) {
        const startRow = parseInt(newPcRowInRack);
        const units = parseInt(newPcUnitsOccupied);
        if (
          isNaN(startRow) ||
          startRow < 1 ||
          startRow > selectedRack.total_units
        ) {
          showMessage(
            `Starting Row in Rack must be a number between 1 and ${selectedRack.total_units} for the selected rack.`,
            5000
          );
          return;
        }
        if (isNaN(units) || units < 1) {
          showMessage("Units Occupied must be a positive number.", 5000);
          return;
        }
        if (startRow + units - 1 > selectedRack.total_units) {
          showMessage(
            `Device extends beyond total units of the rack (${selectedRack.total_units}U).`,
            5000
          );
          return;
        }
      }
    }
    const result = await onAddEntity("pcs", {
      name: newPcName,
      ip_address: newPcIp,
      username: newPcUsername,
      in_domain: newPcInDomain,
      operating_system: newPcOs,
      model: newPcModel,
      office: newPcOffice,
      description: newPcDesc,
      multi_port: newPcMultiPort,
      type: newPcType,
      usage: newPcUsage === 'Other' ? newPcCustomUsageValue : newPcUsage,
      row_in_rack: newPcType === "Server" ? parseInt(newPcRowInRack) : null,
      rack_id: newPcType === "Server" ? parseInt(newPcRackId) : null,
      units_occupied: newPcType === "Server" ? parseInt(newPcUnitsOccupied) : 1,
      serial_number: newPcSerialNumber,
      pc_specification: newPcSpecification,
      monitor_model: newPcMonitorModel,
      disk_info: newPcDiskInfo,
    });
    if (result.success && result.entity) {
      lastCreatedPcIdRef.current = result.entity.id;
      // Reset form fields
      setNewPcName("");
      setNewPcIp("");
      setNewPcUsername("");
      setNewPcInDomain(false);
      setNewPcOs("");
      setNewPcModel("");
      setNewPcOffice("");
      setNewPcDesc("");
      setNewPcMultiPort(false);
      setNewPcType("Workstation");
      setNewPcUsage("");
      setNewPcRowInRack("");
      setNewPcRackId("");
      setNewPcUnitsOccupied(1);
      setNewPcSerialNumber("");
      setNewPcSpecification("");
      setNewPcMonitorModel("");
      setNewPcDiskInfo("");
      setShowNewPcCustomUsageInput(false);
      setNewPcCustomUsageValue("");
      setIsNewPcExpanded(false);
    }
  };

  const handleUsageChange = (e) => {
    const value = e.target.value;
    setNewPcUsage(value);
    if (value === 'Other') {
        setShowNewPcCustomUsageInput(true);
    } else {
        setShowNewPcCustomUsageInput(false);
        setNewPcCustomUsageValue("");
    }
  };

  const handlePcSelect = (selectedPcId) => {
    setPcId(selectedPcId);
    if (selectedPcId) {
      setCurrentStep(2);
    }
  };

  return (
    <section className="p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center">
        <Laptop size={24} className="mr-2" /> Step 1: Select or Create PC
      </h2>
      <div className="mb-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Select Existing PC:
        </h3>
        {/* UPDATED: Replaced select with SearchableSelect */}
        <SearchableSelect
            options={availablePcsForConnection}
            value={pcId}
            onChange={handlePcSelect}
            placeholder="-- Search and select a PC --"
        />
      </div>
      <div className="relative flex py-5 items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-gray-500">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <div
        id="new-pc-creation-section"
        className="bg-white rounded-lg shadow-sm border border-gray-100"
      >
        <div
          className="flex justify-between items-center p-5 cursor-pointer bg-indigo-50 hover:bg-indigo-100"
          onClick={() => setIsNewPcExpanded(!isNewPcExpanded)}
        >
          <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
            <PlusCircle size={20} className="mr-2" /> Create New PC
          </h3>
          {isNewPcExpanded ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </div>
        <div
          className={`collapsible-content ${isNewPcExpanded ? "expanded" : ""}`}
        >
          <form onSubmit={handleNewPcSaveAndContinue} className="p-5 space-y-3">
            <input type="text" placeholder="PC Name" value={newPcName} onChange={(e) => setNewPcName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            <input type="text" placeholder="IP Address" value={newPcIp} onChange={(e) => setNewPcIp(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Username" value={newPcUsername} onChange={(e) => setNewPcUsername(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Serial Number" value={newPcSerialNumber} onChange={(e) => setNewPcSerialNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <textarea placeholder="PC Specification (e.g., CPU, RAM, GPU)" value={newPcSpecification} onChange={(e) => setNewPcSpecification(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
            <input type="text" placeholder="Monitor Model(s)" value={newPcMonitorModel} onChange={(e) => setNewPcMonitorModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Disk Info (e.g., 1x 512GB NVMe, 2x 1TB SSD)" value={newPcDiskInfo} onChange={(e) => setNewPcDiskInfo(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input id="new-pc-in-domain" type="checkbox" checked={newPcInDomain} onChange={(e) => setNewPcInDomain(e.target.checked)} className="h-4 w-4 text-blue-600" />
                <label htmlFor="new-pc-in-domain" className="ml-2 text-sm">In Domain</label>
              </div>
              <div className="flex items-center">
                <input id="new-pc-multi-port" type="checkbox" checked={newPcMultiPort} onChange={(e) => setNewPcMultiPort(e.target.checked)} className="h-4 w-4 text-blue-600" />
                <label htmlFor="new-pc-multi-port" className="ml-2 text-sm">Multi-Port PC</label>
              </div>
            </div>
            <select value={newPcType} onChange={(e) => {setNewPcType(e.target.value); if (e.target.value === "Workstation") {setNewPcRackId(""); setNewPcRowInRack(""); setNewPcUnitsOccupied(1);}}} className="w-full p-2 border border-gray-300 rounded-md" required>
              <option value="Workstation">Workstation</option>
              <option value="Server">Server</option>
            </select>
            {newPcType === "Server" && (
              <>
                <div className="flex items-center space-x-2">
                  <Columns size={20} className="text-gray-500" />
                  <select value={newPcRackId} onChange={(e) => setNewPcRackId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required>
                    <option value="">-- Select Rack --</option>
                    {sortedRacks.map((rack) => (<option key={rack.id} value={String(rack.id)}>{rack.name} ({rack.location_name})</option>))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Server size={20} className="text-gray-500" />
                  <input type="number" placeholder="Starting Row in Rack" value={newPcRowInRack} onChange={(e) => setNewPcRowInRack(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive size={20} className="text-gray-500" />
                  <input type="number" placeholder="Units Occupied" value={newPcUnitsOccupied} onChange={(e) => setNewPcUnitsOccupied(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" min="1" required />
                </div>
              </>
            )}
            <input type="text" placeholder="OS" value={newPcOs} onChange={(e) => setNewPcOs(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Model" value={newPcModel} onChange={(e) => setNewPcModel(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <input type="text" placeholder="Office" value={newPcOffice} onChange={(e) => setNewPcOffice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            <select value={newPcUsage} onChange={handleUsageChange} className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">-- Select Usage (Optional) --</option>
              {usageOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
              <option value="Other">Other...</option>
            </select>
            {showNewPcCustomUsageInput && (
              <input type="text" placeholder="Enter custom usage" value={newPcCustomUsageValue} onChange={(e) => setNewPcCustomUsageValue(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            )}
            <textarea placeholder="Description" value={newPcDesc} onChange={(e) => setNewPcDesc(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows="3"></textarea>
            <button type="submit" className="w-full bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600">
              Save PC and Continue
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
