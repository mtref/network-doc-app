// /frontend/src/components/connection/ConnectionDetailsStep.js
import React from "react";
import { AddPatchPanelForm } from "./AddPatchPanelForm";
import { AddSwitchForm } from "./AddSwitchForm";
import {
  ArrowRight,
  Cable,
  CircleDot,
  MapPin,
  Palette,
  Server,
  Split,
  Tag,
  Wifi,
} from "lucide-react";

export const ConnectionDetailsStep = ({
  formState,
  formSetters,
  handlers,
  onAddEntity,
  onShowPortStatus,
}) => {
  const {
    pcId,
    switchId,
    switchPort,
    isSwitchPortUp,
    hops,
    cableColor,
    cableLabel,
    wallPointLabel,
    availablePcsForConnection,
    selectedLocationIdForSwitch,
    filteredSwitchesByLocation,
    cableColorOptions,
    showAddColorInput,
    newCustomColor,
    isNewPpExpanded,
    isNewSwitchExpanded,
    locations,
    racks,
    patchPanels,
  } = formState;

  const {
    setCurrentStep,
    setSwitchId,
    setSwitchPort,
    setIsSwitchPortUp,
    setSelectedLocationIdForSwitch,
    setCableColor,
    setCableLabel,
    setWallPointLabel,
    setShowAddColorInput,
    setNewCustomColor,
    setIsNewPpExpanded,
    setIsNewSwitchExpanded,
  } = formSetters;

  const {
    handleHopChange,
    addHop,
    removeHop,
    handleAddCustomColor,
    handleSubmit,
    handleCancelEdit,
    getPortStatusSummary,
  } = handlers;

  const sortedLocations = [...locations].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const currentPatchPanels = Array.isArray(patchPanels) ? patchPanels : [];

  return (
    <section className="p-6 bg-white rounded-lg shadow-md border border-blue-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center flex items-center justify-center">
        <ArrowRight size={24} className="mr-2" /> Step 2: Connection Details
      </h2>
      <div className="mb-6 flex items-center justify-between p-3 bg-gray-50 rounded-md border">
        <span className="font-semibold text-gray-700">Selected PC:</span>
        <span className="text-blue-600 font-medium">
          {availablePcsForConnection.find((pc) => String(pc.id) === pcId)
            ?.name || "N/A"}
        </span>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
        >
          Change PC
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full">
            <label
              htmlFor="wall-point-label"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <Tag size={16} className="inline-block mr-1 text-gray-500" />
              Wall Point Label (Optional):
            </label>
            <input
              id="wall-point-label"
              type="text"
              placeholder="e.g., W101-A, Office-1-Port-3"
              value={wallPointLabel}
              onChange={(e) => setWallPointLabel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="switch-location-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <MapPin size={16} className="inline-block mr-1" /> Filter Switches
              by Location:
            </label>
            <select
              id="switch-location-filter"
              value={selectedLocationIdForSwitch}
              onChange={(e) => setSelectedLocationIdForSwitch(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">-- All Locations --</option>
              {sortedLocations.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.name} {loc.door_number && `(Door: ${loc.door_number})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="switch-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Switch:
            </label>
            <select
              id="switch-select"
              value={switchId}
              onChange={(e) =>
                e.target.value === "add-new-switch"
                  ? (setIsNewSwitchExpanded(true), setSwitchId(""))
                  : setSwitchId(e.target.value)
              }
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">-- Select a Switch --</option>
              {filteredSwitchesByLocation.map((_switch) => (
                <option key={_switch.id} value={String(_switch.id)}>
                  {_switch.name} ({_switch.ip_address})
                </option>
              ))}
              <option value="add-new-switch" className="italic text-red-600">
                -- Add New Switch --
              </option>
            </select>
            {switchId && getPortStatusSummary("switches", switchId) && (
              <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                <span className="flex items-center">
                  <Wifi size={14} className="text-green-500 mr-1" />
                  Connected:{" "}
                  {getPortStatusSummary("switches", switchId).connected}
                </span>
                <span className="flex items-center">
                  <CircleDot size={14} className="text-gray-500 mr-1" />
                  Available:{" "}
                  {getPortStatusSummary("switches", switchId).available}
                </span>
                <button
                  type="button"
                  onClick={() => onShowPortStatus("switches", switchId)}
                  className="text-blue-500 hover:underline ml-auto"
                >
                  View Details
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
            <div>
              <label
                htmlFor="switch-port"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Switch Port:
              </label>
              <input
                id="switch-port"
                type="text"
                placeholder="e.g., Eth0/1"
                value={switchPort}
                onChange={(e) => setSwitchPort(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex items-center pt-5">
              <input
                id="is-switch-port-up"
                type="checkbox"
                checked={isSwitchPortUp}
                onChange={(e) => setIsSwitchPortUp(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="is-switch-port-up" className="ml-2 text-sm">
                Port Up
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full border-t pt-4 mt-4">
            <h4 className="text-lg font-semibold text-blue-700 col-span-full mb-2">
              <Cable size={20} className="mr-2" /> Connection Cable Details
            </h4>
            <div>
              <label
                htmlFor="cable-color"
                className="block text-sm font-medium mb-1"
              >
                Cable Color:
              </label>
              <div className="flex items-center space-x-2">
                <select
                  id="cable-color"
                  value={cableColor}
                  onChange={(e) =>
                    e.target.value === "add-new"
                      ? setShowAddColorInput(true)
                      : (setCableColor(e.target.value),
                        setShowAddColorInput(false))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Optional --</option>
                  {cableColorOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="add-new">-- Add New --</option>
                </select>
                {showAddColorInput && (
                  <input
                    type="text"
                    value={newCustomColor}
                    onChange={(e) => setNewCustomColor(e.target.value)}
                    onBlur={handlers.handleAddCustomColor}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handlers.handleAddCustomColor())
                    }
                    className="p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="cable-label"
                className="block text-sm font-medium mb-1"
              >
                Cable Label:
              </label>
              <input
                id="cable-label"
                type="text"
                placeholder="Optional"
                value={cableLabel}
                onChange={(e) => setCableLabel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-6">
          <h4 className="text-lg font-semibold mb-3">
            <Split size={20} className="mr-2" /> Patch Panel Hops
          </h4>
          {hops.map((hop, index) => {
            const filteredPatchPanelsForThisHop = hop.location_id
              ? currentPatchPanels.filter(
                  (pp) => String(pp.location_id) === hop.location_id
                )
              : currentPatchPanels;
            return (
              <div
                key={index}
                className="flex flex-col mb-4 p-3 border rounded-md bg-white"
              >
                <div className="flex flex-wrap items-center gap-3 w-full mb-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm mb-1">
                      <MapPin size={16} className="inline mr-1" /> Location (Hop{" "}
                      {index + 1}):
                    </label>
                    <select
                      value={hop.location_id}
                      onChange={(e) =>
                        handlers.handleHopChange(
                          index,
                          "location_id",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md text-sm"
                      required
                    >
                      <option value="">-- Select --</option>
                      {sortedLocations.map((loc) => (
                        <option key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-grow min-w-[150px]">
                    <label className="block text-sm mb-1">Patch Panel:</label>
                    <select
                      value={hop.patch_panel_id}
                      onChange={(e) =>
                        e.target.value === "add-new-pp"
                          ? setIsNewPpExpanded(true)
                          : handlers.handleHopChange(
                              index,
                              "patch_panel_id",
                              e.target.value
                            )
                      }
                      className="w-full p-2 border rounded-md text-sm"
                      required
                    >
                      <option value="">-- Select --</option>
                      {filteredPatchPanelsForThisHop.map((pp) => (
                        <option key={pp.id} value={String(pp.id)}>
                          {pp.name}
                        </option>
                      ))}
                      <option value="add-new-pp" className="italic">
                        -- Add New --
                      </option>
                    </select>
                    {/* *** ADDED BACK: Port Status Summary for each selected Patch Panel *** */}
                    {hop.patch_panel_id &&
                      getPortStatusSummary(
                        "patch_panels",
                        hop.patch_panel_id
                      ) && (
                        <div className="mt-2 text-xs text-gray-600 flex items-center space-x-2">
                          <span className="flex items-center">
                            <Wifi size={14} className="text-green-500 mr-1" />
                            Connected:{" "}
                            {
                              getPortStatusSummary(
                                "patch_panels",
                                hop.patch_panel_id
                              ).connected
                            }
                          </span>
                          <span className="flex items-center">
                            <CircleDot
                              size={14}
                              className="text-gray-500 mr-1"
                            />
                            Available:{" "}
                            {
                              getPortStatusSummary(
                                "patch_panels",
                                hop.patch_panel_id
                              ).available
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onShowPortStatus(
                                "patch_panels",
                                hop.patch_panel_id
                              )
                            }
                            className="text-blue-500 hover:underline ml-auto"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                  </div>
                  <div className="flex-none w-16">
                    <label className="block text-sm mb-1">Port:</label>
                    <input
                      type="text"
                      value={hop.patch_panel_port}
                      onChange={(e) =>
                        handlers.handleHopChange(
                          index,
                          "patch_panel_port",
                          e.target.value
                        )
                      }
                      className="w-16 p-2 border rounded-md text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hop.is_port_up}
                      onChange={(e) =>
                        handlers.handleHopChange(
                          index,
                          "is_port_up",
                          e.target.checked
                        )
                      }
                      className="h-4 w-4"
                    />
                    <label className="ml-2 text-sm">Up</label>
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-3 w-full mt-3 pt-3 border-t">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-sm mb-1">Cable Color:</label>
                    <select
                      value={hop.cable_color}
                      onChange={(e) =>
                        handlers.handleHopChange(
                          index,
                          "cable_color",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md text-sm"
                    >
                      <option value="">-- Optional --</option>
                      {cableColorOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-sm mb-1">Cable Label:</label>
                    <input
                      type="text"
                      value={hop.cable_label}
                      onChange={(e) =>
                        handlers.handleHopChange(
                          index,
                          "cable_label",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handlers.removeHop(index)}
                    className="p-2 bg-red-500 text-white rounded-md text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={handlers.addHop}
            className="w-full mt-2 py-2 px-4 bg-blue-500 text-white rounded-md"
          >
            Add Patch Panel Hop
          </button>
        </div>
        <AddPatchPanelForm
          isExpanded={isNewPpExpanded}
          toggleExpanded={setIsNewPpExpanded}
          formState={formState}
          formSetters={formSetters}
          onAddEntity={onAddEntity}
          showMessage={handlers.showMessage}
          locations={locations}
          racks={racks}
        />
        <AddSwitchForm
          isExpanded={isNewSwitchExpanded}
          toggleExpanded={setIsNewSwitchExpanded}
          formState={formState}
          formSetters={formSetters}
          onAddEntity={onAddEntity}
          showMessage={handlers.showMessage}
          locations={locations}
          racks={racks}
        />
        <div className="flex justify-end space-x-3 mt-6">
          {formState.editingConnection && (
            <button
              type="button"
              onClick={handlers.handleCancelEdit}
              className="px-5 py-2 border rounded-md"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-md"
          >
            {formState.editingConnection
              ? "Update Connection"
              : "Add Connection"}
          </button>
        </div>
      </form>
    </section>
  );
};
