// frontend/src/App.js
// This is the main React component for the frontend application.
// It orchestrates the display of various sections (Connections, PCs, Switches, Patch Panels, Settings).
// REFACTORED: The "Manage Locations" tab now uses a unified, collapsible form.
// UPDATED: Passing modal handlers down to the ConnectionList component.

import React, { useState, useEffect, useCallback, useRef } from "react";
import ConnectionList from "./components/ConnectionList";
import ConnectionForm from "./components/ConnectionForm";
import PortStatusModal from "./components/PortStatusModal";
import PcList from "./components/PcList";
import SwitchList from "./components/SwitchList";
import PatchPanelList from "./components/PatchPanelList";
import SwitchDiagramModal from "./components/SwitchDiagramModal";
import SettingsPage from "./components/SettingsPage";
import RackList from "./components/RackList";
import RackViewModal from "./components/RackViewModal";
import PcDetailsModal from "./components/PcDetailsModal";
import {
  Printer,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

function App() {
  // State variables to store fetched data
  const [pcs, setPcs] = useState([]);
  const [patchPanels, setPatchPanels] = useState([]);
  const [switches, setSwitches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [locations, setLocations] = useState([]);
  const [racks, setRacks] = useState([]);

  // State for current active tab
  const [activeTab, setActiveTab] = useState("connections");

  const [message, setMessage] = useState("");
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  // State for Modals
  const [showPortStatusModal, setShowPortStatusModal] = useState(false);
  const [portStatusData, setPortStatusData] = useState(null);
  const [modalEntityType, setModalEntityType] = useState(null);
  const [modalEntityId, setModalEntityId] = useState(null);
  const [showSwitchDiagramModal, setShowSwitchDiagramModal] = useState(false);
  const [selectedSwitchForDiagram, setSelectedSwitchForDiagram] =
    useState(null);
  const [showRackViewModal, setShowRackViewModal] = useState(false);
  const [selectedRackForView, setSelectedRackForView] = useState(null);
  const [showPcDetailsModal, setShowPcDetailsModal] = useState(false);
  const [selectedPcForDetails, setSelectedPcForDetails] = useState(null);

  // State for editing a connection
  const [editingConnection, setEditingConnection] = useState(null);

  // State for Location Add/Edit Form
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationFormName, setLocationFormName] = useState("");
  const [locationFormDoorNumber, setLocationFormDoorNumber] = useState("");
  const [locationFormDescription, setLocationFormDescription] = useState("");
  const [isAddLocationFormExpanded, setIsAddLocationFormExpanded] =
    useState(false);

  // State to store CSS content for printing
  const [cssContent, setCssContent] = useState("");

  // States for PDF templates and app settings
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [defaultPdfId, setDefaultPdfId] = useState(null);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState(null);

  const showMessage = useCallback((msg, duration = 3000) => {
    setMessage(msg);
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
      setMessage("");
    }, duration);
  }, []);

  const handleViewPcDetails = useCallback((pc) => {
    setSelectedPcForDetails(pc);
    setShowPcDetailsModal(true);
  }, []);

  const handleClosePcDetailsModal = useCallback(() => {
    setShowPcDetailsModal(false);
    setSelectedPcForDetails(null);
  }, []);

  const fetchData = useCallback(
    async (endpoint, setter) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
        const data = await response.json();
        setter(data);
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        showMessage(`Error fetching ${endpoint}: ${error.message}`, 5000);
      }
    },
    [showMessage]
  );

  useEffect(() => {
    const fetchAllInitialData = async () => {
      await fetchData("pcs", setPcs);
      await fetchData("patch_panels", setPatchPanels);
      await fetchData("switches", setSwitches);
      await fetchData("connections", setConnections);
      await fetchData("locations", setLocations);
      await fetchData("racks", setRacks);
      try {
        const pdfResponse = await fetch(`${API_BASE_URL}/pdf_templates`);
        const pdfData = await pdfResponse.json();
        setPdfTemplates(pdfData.templates);
        setDefaultPdfId(pdfData.default_pdf_id);
        setSelectedPrintTemplateId(pdfData.default_pdf_id);
      } catch (error) {
        console.error("Failed to fetch PDF templates or app settings:", error);
        showMessage("Error fetching PDF templates or app settings.", 5000);
      }
    };
    fetchAllInitialData();
    fetch("/static/css/main.css")
      .then((res) => res.text())
      .then((css) => setCssContent(css))
      .catch((err) => console.error("Failed to load CSS for printing:", err));
  }, [fetchData]);

  const handleAddConnection = useCallback(
    async (newConnectionData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/connections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newConnectionData),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          showMessage(
            errorData.error || `HTTP error! status: ${response.status}`,
            8000
          );
          return {
            success: false,
            error: errorData.error || `HTTP error! status: ${response.status}`,
          };
        }
        showMessage("Connection added successfully!");
        setEditingConnection(null);
        await fetchData("connections", setConnections);
        await fetchData("pcs", setPcs);
        return { success: true };
      } catch (error) {
        console.error("Error adding connection:", error);
        showMessage(`Error adding connection: ${error.message}`, 8000);
        return { success: false, error: error.message };
      }
    },
    [fetchData, showMessage]
  );

  const handleUpdateConnection = useCallback(
    async (id, updatedConnectionData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedConnectionData),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          showMessage(
            errorData.error || `HTTP error! status: ${response.status}`,
            8000
          );
          return {
            success: false,
            error: errorData.error || `HTTP error! status: ${response.status}`,
          };
        }
        showMessage("Connection updated successfully!");
        setEditingConnection(null);
        await fetchData("connections", setConnections);
        await fetchData("pcs", setPcs);
        return { success: true };
      } catch (error) {
        console.error("Error updating connection:", error);
        showMessage(`Error updating connection: ${error.message}`, 8000);
        return { success: false, error: error.message };
      }
    },
    [fetchData, showMessage]
  );

  const handleDeleteConnection = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this connection?")) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
        showMessage("Connection deleted successfully!");
        await fetchData("connections", setConnections);
        await fetchData("pcs", setPcs);
      } catch (error) {
        console.error("Error deleting connection:", error);
        showMessage(`Error deleting connection: ${error.message}`, 5000);
      }
    },
    [fetchData, showMessage]
  );

  const handleEditConnection = useCallback((connection) => {
    setEditingConnection(connection);
  }, []);

  const handleAddEntity = useCallback(
    async (type, data) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          showMessage(
            errorData.error || `HTTP error! status: ${response.status}`,
            5000
          );
          return {
            success: false,
            error: errorData.error || `HTTP error! status: ${response.status}`,
          };
        }
        const newEntity = await response.json();
        showMessage(`${type.slice(0, -1).toUpperCase()} added successfully!`);

        const setterMap = {
          pcs: setPcs,
          patch_panels: setPatchPanels,
          switches: setSwitches,
          locations: setLocations,
          racks: setRacks,
        };
        const setterFunction = setterMap[type];
        if (setterFunction) {
          setterFunction((prev) => [...prev, newEntity]);
        } else {
          await fetchData(
            type,
            eval(`set${type.charAt(0).toUpperCase() + type.slice(1)}`)
          );
        }

        await fetchData("connections", setConnections);
        return { success: true, entity: newEntity };
      } catch (error) {
        console.error(`Error adding ${type}:`, error);
        showMessage(`Error adding ${type}: ${error.message}`, 5000);
        return { success: false, error: error.message };
      }
    },
    [fetchData, showMessage]
  );

  const handleUpdateEntity = useCallback(
    async (type, id, data) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          showMessage(
            errorData.error || `HTTP error! status: ${response.status}`,
            5000
          );
          return {
            success: false,
            error: errorData.error || `HTTP error! status: ${response.status}`,
          };
        }
        showMessage(`${type.slice(0, -1).toUpperCase()} updated successfully!`);

        await Promise.all([
          fetchData("pcs", setPcs),
          fetchData("patch_panels", setPatchPanels),
          fetchData("switches", setSwitches),
          fetchData("locations", setLocations),
          fetchData("racks", setRacks),
          fetchData("connections", setConnections),
        ]);

        return { success: true };
      } catch (error) {
        console.error(`Error updating ${type}:`, error);
        showMessage(`Error updating ${type}: ${error.message}`, 5000);
        return { success: false, error: error.message };
      }
    },
    [fetchData, showMessage]
  );

  const handleDeleteEntity = useCallback(
    async (type, id) => {
      if (
        !window.confirm(
          `Are you sure you want to delete this ${type.slice(
            0,
            -1
          )}? This may also affect associated items.`
        )
      ) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }
        showMessage(`${type.slice(0, -1).toUpperCase()} deleted successfully!`);

        await Promise.all([
          fetchData("pcs", setPcs),
          fetchData("patch_panels", setPatchPanels),
          fetchData("switches", setSwitches),
          fetchData("locations", setLocations),
          fetchData("racks", setRacks),
          fetchData("connections", setConnections),
        ]);
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showMessage(`Error deleting ${type}: ${error.message}`, 5000);
      }
    },
    [fetchData, showMessage]
  );

  const handleShowPortStatus = useCallback(
    async (entityType, entityId) => {
      if (entityType === "switches" || entityType === "patch_panels") {
        try {
          const response = await fetch(
            `${API_BASE_URL}/${entityType}/${entityId}/ports`
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `HTTP error! status: ${response.status}`
            );
          }
          const data = await response.json();
          setPortStatusData(data);
          setModalEntityType(entityType);
          setModalEntityId(entityId);
          setShowPortStatusModal(true);
        } catch (error) {
          console.error(`Failed to fetch ${entityType} port status:`, error);
          showMessage(`Error fetching port status: ${error.message}`, 5000);
        }
      } else {
        const pc = pcs.find((p) => p.id === entityId);
        if (pc) {
          handleViewPcDetails(pc);
        } else {
          showMessage("PC details not found.", 3000);
        }
      }
    },
    [showMessage, pcs, handleViewPcDetails]
  );

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationFormName(location.name);
    setLocationFormDoorNumber(location.door_number || "");
    setLocationFormDescription(location.description || "");
    setIsAddLocationFormExpanded(true);
  };

  const handleLocationFormSubmit = async (e) => {
    e.preventDefault();
    if (!locationFormName.trim()) {
      showMessage("Location name is required.", 3000);
      return;
    }
    const locationData = {
      name: locationFormName,
      door_number: locationFormDoorNumber,
      description: locationFormDescription,
    };

    let result;
    if (editingLocation) {
      result = await handleUpdateEntity(
        "locations",
        editingLocation.id,
        locationData
      );
    } else {
      result = await handleAddEntity("locations", locationData);
    }

    if (result && result.success) {
      setEditingLocation(null);
      setLocationFormName("");
      setLocationFormDoorNumber("");
      setLocationFormDescription("");
      setIsAddLocationFormExpanded(false);
    }
  };

  const handleClosePortStatusModal = useCallback(() => {
    setShowPortStatusModal(false);
    setPortStatusData(null);
    setModalEntityType(null);
    setModalEntityId(null);
  }, []);
  const handleViewSwitchDiagram = useCallback((_switch) => {
    setSelectedSwitchForDiagram(_switch);
    setShowSwitchDiagramModal(true);
  }, []);
  const handleCloseSwitchDiagramModal = useCallback(() => {
    setShowSwitchDiagramModal(false);
    setSelectedSwitchForDiagram(null);
  }, []);
  const handleViewRackDetails = useCallback((rack) => {
    setSelectedRackForView(rack);
    setShowRackViewModal(true);
  }, []);
  const handleCloseRackViewModal = useCallback(() => {
    setShowRackViewModal(false);
    setSelectedRackForView(null);
  }, []);

  const handlePrintForm = useCallback(
    (connectionToPrint = null) => {
      const selectedTemplate = pdfTemplates.find(
        (t) => t.id === selectedPrintTemplateId
      );
      if (!selectedTemplate) {
        showMessage(
          "Please select a PDF template to print from the dropdown.",
          5000
        );
        return;
      }
      const pdfUrl = `${API_BASE_URL}/pdf_templates/download/${selectedTemplate.stored_filename}`;
      const printWindow = window.open(pdfUrl, "_blank");
      if (!printWindow) {
        showMessage("Please allow pop-ups to open the PDF.", 5000);
      } else {
        showMessage(
          `Opening "${selectedTemplate.original_filename}" for printing.`,
          3000
        );
      }
    },
    [selectedPrintTemplateId, pdfTemplates, showMessage]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-200 font-inter p-4 sm:p-8">
      {isMessageVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {message}
        </div>
      )}
      {showPortStatusModal && portStatusData && (
        <PortStatusModal
          isOpen={showPortStatusModal}
          onClose={handleClosePortStatusModal}
          data={portStatusData}
          entityType={modalEntityType}
          entityId={modalEntityId}
          cssContent={cssContent}
        />
      )}
      {showSwitchDiagramModal && selectedSwitchForDiagram && (
        <SwitchDiagramModal
          isOpen={showSwitchDiagramModal}
          onClose={handleCloseSwitchDiagramModal}
          selectedSwitch={selectedSwitchForDiagram}
          connections={connections}
          pcs={pcs}
        />
      )}
      {showRackViewModal && selectedRackForView && (
        <RackViewModal
          isOpen={showRackViewModal}
          onClose={handleCloseRackViewModal}
          rack={selectedRackForView}
          switches={switches}
          patchPanels={patchPanels}
          pcs={pcs}
          onShowPortStatus={handleShowPortStatus}
          onViewPcDetails={handleViewPcDetails}
        />
      )}
      {showPcDetailsModal && selectedPcForDetails && (
        <PcDetailsModal
          isOpen={showPcDetailsModal}
          onClose={handleClosePcDetailsModal}
          pc={selectedPcForDetails}
        />
      )}

      <div>
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight sm:text-5xl">
            Network Device Documentation
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your network connections with ease.
          </p>
        </header>
        <main className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {[
              "connections",
              "pcs",
              "switches",
              "patch_panels",
              "locations",
              "racks",
              "settings",
            ].map((tab) => (
              <button
                key={tab}
                className={`py-3 px-4 sm:px-6 text-base sm:text-lg font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-4 border-blue-600 text-blue-800"
                    : "text-gray-600 hover:text-blue-600"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>

          {activeTab === "connections" && (
            <>
              <section className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                  Add/Edit Connection
                </h2>
                <ConnectionForm
                  pcs={pcs}
                  patchPanels={patchPanels}
                  switches={switches}
                  connections={connections}
                  onAddConnection={handleAddConnection}
                  onUpdateConnection={handleUpdateConnection}
                  editingConnection={editingConnection}
                  setEditingConnection={setEditingConnection}
                  onAddEntity={handleAddEntity}
                  onShowPortStatus={handleShowPortStatus}
                  locations={locations}
                  racks={racks}
                  showMessage={showMessage}
                />
              </section>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4">
                  Print Options
                </h3>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="pdf-template-select"
                      className="text-gray-700 font-medium"
                    >
                      PDF Template:
                    </label>
                    <select
                      id="pdf-template-select"
                      value={selectedPrintTemplateId || ""}
                      onChange={(e) =>
                        setSelectedPrintTemplateId(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- None --</option>
                      {pdfTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.original_filename}{" "}
                          {template.id === defaultPdfId && "(Default)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handlePrintForm()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Printer size={20} className="mr-2" /> Print Selected PDF
                  </button>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  This will open the selected PDF template in a new tab for
                  printing.
                </p>
              </div>
              <section>
                <h2 className="text-2xl font-bold text-blue-700 mb-6">
                  All Connections
                </h2>
                <ConnectionList
                  connections={connections}
                  onDelete={handleDeleteConnection}
                  onEdit={handleEditConnection}
                  // ADDED: Pass the modal handlers to the connection list
                  onViewPcDetails={handleViewPcDetails}
                  onShowPortStatus={handleShowPortStatus}
                />
              </section>
            </>
          )}

          {activeTab === "pcs" && (
            <PcList
              pcs={pcs}
              onAddEntity={handleAddEntity}
              onUpdateEntity={handleUpdateEntity}
              onDeleteEntity={handleDeleteEntity}
              locations={locations}
              racks={racks}
            />
          )}
          {activeTab === "switches" && (
            <SwitchList
              switches={switches}
              onAddEntity={handleAddEntity}
              onUpdateEntity={handleUpdateEntity}
              onDeleteEntity={handleDeleteEntity}
              onShowPortStatus={handleShowPortStatus}
              locations={locations}
              racks={racks}
              onViewDiagram={handleViewSwitchDiagram}
            />
          )}
          {activeTab === "patch_panels" && (
            <PatchPanelList
              patchPanels={patchPanels}
              onAddEntity={handleAddEntity}
              onUpdateEntity={handleUpdateEntity}
              onDeleteEntity={handleDeleteEntity}
              onShowPortStatus={handleShowPortStatus}
              locations={locations}
              racks={racks}
            />
          )}

          {activeTab === "locations" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Manage Locations
              </h2>
              <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mb-8">
                <div
                  className="flex justify-center items-center p-3 cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() =>
                    setIsAddLocationFormExpanded(!isAddLocationFormExpanded)
                  }
                >
                  <h3 className="text-xl font-bold flex items-center">
                    <PlusCircle size={20} className="mr-2" />{" "}
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h3>
                  {isAddLocationFormExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
                <div
                  className={`collapsible-content ${
                    isAddLocationFormExpanded ? "expanded" : ""
                  }`}
                >
                  <form
                    onSubmit={handleLocationFormSubmit}
                    className="p-5 space-y-4 border border-gray-300 rounded-b-lg shadow-md bg-gray-50"
                  >
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <input
                        type="text"
                        placeholder="Location Name"
                        value={locationFormName}
                        onChange={(e) => setLocationFormName(e.target.value)}
                        className="flex-grow p-2 border rounded-md"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Door Number (Optional)"
                        value={locationFormDoorNumber}
                        onChange={(e) =>
                          setLocationFormDoorNumber(e.target.value)
                        }
                        className="flex-grow p-2 border rounded-md"
                      />
                    </div>
                    <textarea
                      placeholder="Description (Optional)"
                      value={locationFormDescription}
                      onChange={(e) =>
                        setLocationFormDescription(e.target.value)
                      }
                      className="w-full p-2 border rounded-md resize-y"
                      rows="3"
                    ></textarea>
                    <div className="flex justify-end space-x-3">
                      {editingLocation && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLocation(null);
                            setLocationFormName("");
                            setLocationFormDoorNumber("");
                            setLocationFormDescription("");
                            setIsAddLocationFormExpanded(false);
                          }}
                          className="px-4 py-2 bg-gray-300 rounded-md"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        {editingLocation ? "Update Location" : "Add Location"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="bg-white rounded-lg shadow-sm border p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {location.name}{" "}
                          {location.door_number &&
                            `(Door: ${location.door_number})`}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 flex items-start">
                          <Info
                            size={16}
                            className="text-gray-400 mr-2 mt-0.5"
                          />
                          {location.description || "No description."}
                        </p>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("locations", location.id)
                          }
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "racks" && (
            <RackList
              racks={racks}
              locations={locations}
              switches={switches}
              patchPanels={patchPanels}
              pcs={pcs}
              onAddEntity={handleAddEntity}
              onUpdateEntity={handleUpdateEntity}
              onDeleteEntity={handleDeleteEntity}
              onShowPortStatus={handleShowPortStatus}
              onViewRackDetails={handleViewRackDetails}
              showMessage={showMessage}
            />
          )}
          {activeTab === "settings" && (
            <SettingsPage
              showMessage={showMessage}
              pdfTemplates={pdfTemplates}
              setPdfTemplates={setPdfTemplates}
              defaultPdfId={defaultPdfId}
              setDefaultPdfId={setDefaultPdfId}
              setSelectedPrintTemplateId={setSelectedPrintTemplateId}
              fetchPdfTemplates={fetchData}
            />
          )}
        </main>
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Network Doc App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
