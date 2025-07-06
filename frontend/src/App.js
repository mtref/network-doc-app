// frontend/src/App.js
// This is the main React component for the frontend application.
// It orchestrates the display of various sections (Connections, PCs, Switches, Patch Panels, Settings).
// Optimized data fetching to prevent excessive re-renders.
// UPDATED: Ensuring locations and racks are fetched and passed to relevant components.

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
import { Printer } from "lucide-react";

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

// Robust deep comparison helper function
const deepEqual = (a, b) => {
  if (a === b) return true;

  if (a && b && typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
};

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

  // State for Port Status Modal
  const [showPortStatusModal, setShowPortStatusModal] = useState(false);
  const [portStatusData, setPortStatusData] = useState(null);
  const [modalEntityType, setModalEntityType] = useState(null);
  const [modalEntityId, setModalEntityId] = useState(null);

  // State for Switch Diagram Modal
  const [showSwitchDiagramModal, setShowSwitchDiagramModal] = useState(false);
  const [selectedSwitchForDiagram, setSelectedSwitchForDiagram] =
    useState(null);

  // State for Rack View Modal
  const [showRackViewModal, setShowRackViewModal] = useState(false);
  const [selectedRackForView, setSelectedRackForView] = useState(null);

  // State for PC Details Modal
  const [showPcDetailsModal, setShowPcDetailsModal] = useState(false);
  const [selectedPcForDetails, setSelectedPcForDetails] = useState(null);

  // State for editing a connection in the ConnectionForm
  const [editingConnection, setEditingConnection] = useState(null);

  // State to store CSS content for injecting into print window
  const [cssContent, setCssContent] = useState("");

  // States for PDF templates and app settings
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [defaultPdfId, setDefaultPdfId] = useState(null);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState(null);

  // Memoized showMessage function
  const showMessage = useCallback((msg, duration = 3000) => {
    setMessage(msg);
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
      setMessage("");
    }, duration);
  }, []);

  // Handler for viewing PC details
  const handleViewPcDetails = useCallback((pc) => {
    setSelectedPcForDetails(pc);
    setShowPcDetailsModal(true);
  }, []);

  // Handler for closing PC details modal
  const handleClosePcDetailsModal = useCallback(() => {
    setShowPcDetailsModal(false);
    setSelectedPcForDetails(null);
  }, []);

  // Centralized data fetching function
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

  // Effect to fetch all initial data on component mount
  useEffect(() => {
    const fetchAllInitialData = async () => {
      await fetchData("pcs", setPcs);
      await fetchData("patch_panels", setPatchPanels);
      await fetchData("switches", setSwitches);
      await fetchData("connections", setConnections);
      await fetchData("locations", setLocations);
      await fetchData("racks", setRacks); // Ensure racks are fetched

      // Fetch PDF templates and default settings
      try {
        const pdfResponse = await fetch(`${API_BASE_URL}/pdf_templates`);
        const pdfData = await pdfResponse.json();
        setPdfTemplates(pdfData.templates);
        setDefaultPdfId(pdfData.default_pdf_id);
        // Set the default selected print template to the app's default PDF if available
        setSelectedPrintTemplateId(pdfData.default_pdf_id);
      } catch (error) {
        console.error("Failed to fetch PDF templates or app settings:", error);
        showMessage("Error fetching PDF templates or app settings.", 5000);
      }
    };
    fetchAllInitialData();

    // Fetch CSS for printing
    fetch("/static/css/main.css")
      .then((res) => res.text())
      .then((css) => setCssContent(css))
      .catch((err) => console.error("Failed to load CSS for printing:", err));
  }, [fetchData]);

  // Handlers for CRUD operations - explicitly trigger re-fetches after changes
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
        await fetchData("pcs", setPcs); // Re-fetch PCs to update availability status
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
        await fetchData("pcs", setPcs); // Re-fetch PCs to update availability status
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
        await fetchData("pcs", setPcs); // Re-fetch PCs to update availability status
      } catch (error) {
        console.error("Error deleting connection:", error);
        showMessage(`Error deleting connection: ${error.message}`, 5000);
      }
    },
    [fetchData, showMessage]
  );

  const handleEditConnection = useCallback((connection) => {
    const formattedConnection = {
      id: connection.id,
      pc_id: connection.pc?.id,
      switch_id: connection.switch?.id,
      switch_port: connection.switch_port,
      is_switch_port_up:
        connection.is_switch_port_up !== undefined
          ? connection.is_switch_port_up
          : true,
      cable_color: connection.cable_color || "",
      cable_label: connection.cable_label || "",
      hops: connection.hops.map((hop) => ({
        patch_panel_id: hop.patch_panel?.id,
        patch_panel_port: hop.patch_panel_port,
        is_port_up: hop.is_port_up,
        cable_color: hop.cable_color || "",
        cable_label: hop.cable_label || "",
        location_id: hop.patch_panel?.location_id
          ? String(hop.patch_panel.location_id)
          : "",
      })),
      pc: connection.pc,
      switch: connection.switch,
    };
    setEditingConnection(formattedConnection);
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
        // Re-fetch data for relevant lists
        if (type === "pcs") setPcs((prev) => [...prev, newEntity]);
        if (type === "patch_panels")
          setPatchPanels((prev) => [...prev, newEntity]);
        if (type === "switches") setSwitches((prev) => [...prev, newEntity]);
        if (type === "locations") setLocations((prev) => [...prev, newEntity]);
        if (type === "racks") setRacks((prev) => [...prev, newEntity]);
        await fetchData("connections", setConnections); // Connections might depend on any new entity

        // Specific re-fetches for lists that depend on newly added entities
        if (type === "racks") await fetchData("racks", setRacks);
        if (type === "patch_panels")
          await fetchData("patch_panels", setPatchPanels);
        if (type === "switches") await fetchData("switches", setSwitches);
        if (type === "pcs") await fetchData("pcs", setPcs); // Re-fetch PCs to update their rack details

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
        // Re-fetch data for relevant lists
        if (type === "pcs") await fetchData("pcs", setPcs);
        if (type === "patch_panels")
          await fetchData("patch_panels", setPatchPanels);
        if (type === "switches") await fetchData("switches", setSwitches);
        if (type === "locations") await fetchData("locations", setLocations);
        if (type === "racks") await fetchData("racks", setRacks);
        await fetchData("connections", setConnections);
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
          )}? This will also delete associated connections.`
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
        // Re-fetch data for relevant lists
        if (type === "pcs") await fetchData("pcs", setPcs);
        if (type === "patch_panels")
          await fetchData("patch_panels", setPatchPanels);
        if (type === "switches") await fetchData("switches", setSwitches);
        if (type === "locations") await fetchData("locations", setLocations);
        if (type === "racks") await fetchData("racks", setRacks);
        await fetchData("connections", setConnections);
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        showMessage(`Error deleting ${type}: ${error.message}`, 5000);
      }
    },
    [fetchData, showMessage]
  );

  const handleShowPortStatus = useCallback(
    async (entityType, entityId) => {
      // Only attempt to fetch ports for switches and patch panels
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
        // For PCs, we want to show PC details, not port status
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

  // Handler for viewing full Rack details
  const handleViewRackDetails = useCallback((rack) => {
    setSelectedRackForView(rack);
    setShowRackViewModal(true);
  }, []);

  // Handler for closing Rack View Modal
  const handleCloseRackViewModal = useCallback(() => {
    setShowRackViewModal(false);
    setSelectedRackForView(null);
  }, []);

  // Modified handlePrintForm: Now only opens the selected PDF template
  const handlePrintForm = useCallback(
    (connectionToPrint = null) => {
      // connectionToPrint is now optional, as we're just opening a template
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

      // Open the PDF in a new tab
      const printWindow = window.open(pdfUrl, "_blank");
      if (!printWindow) {
        showMessage("Please allow pop-ups to open the PDF.", 5000);
      } else {
        showMessage(
          `Opening "${selectedTemplate.original_filename}" for printing.`,
          3000
        );
        // Note: Direct programmatic printing of an opened PDF might not be universally supported
        // or desirable for user experience. Users typically print from the PDF viewer.
      }
    },
    [selectedPrintTemplateId, pdfTemplates, showMessage]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-200 font-inter p-4 sm:p-8">
      {/* Global Message Box */}
      {isMessageVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {message}
        </div>
      )}

      {/* Port Status Modal */}
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

      {/* Switch Diagram Modal */}
      {showSwitchDiagramModal && selectedSwitchForDiagram && (
        <SwitchDiagramModal
          isOpen={showSwitchDiagramModal}
          onClose={handleCloseSwitchDiagramModal}
          selectedSwitch={selectedSwitchForDiagram}
          connections={connections}
          pcs={pcs}
        />
      )}

      {/* Rack View Modal */}
      {showRackViewModal && selectedRackForView && (
        <RackViewModal
          isOpen={showRackViewModal}
          onClose={handleCloseRackViewModal}
          rack={selectedRackForView}
          switches={switches}
          patchPanels={patchPanels}
          pcs={pcs}
          onShowPortStatus={handleShowPortStatus} // Pass to RackViewModal
          onViewPcDetails={handleViewPcDetails} // Pass to RackViewModal
        />
      )}

      {/* PC Details Modal */}
      {showPcDetailsModal && selectedPcForDetails && (
        <PcDetailsModal
          isOpen={showPcDetailsModal}
          onClose={handleClosePcDetailsModal}
          pc={selectedPcForDetails}
        />
      )}

      {/* Main App Content */}
      <div>
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight sm:text-5xl">
            Network Device Documentation
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your network connections from PC to Patch Panel to Switch with
            ease.
          </p>
        </header>
        <main className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "connections"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("connections")}
            >
              Connections
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "pcs"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("pcs")}
            >
              PCs
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "switches"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("switches")}
            >
              Switches
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "patch_panels"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("patch_panels")}
            >
              Patch Panels
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "locations"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("locations")}
            >
              Locations
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "racks"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("racks")}
            >
              Racks
            </button>
            <button
              className={`py-3 px-6 text-lg font-medium ${
                activeTab === "settings"
                  ? "border-b-4 border-blue-600 text-blue-800"
                  : "text-gray-600 hover:text-blue-600"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </button>
          </div>

          {/* Conditional Tab Content Rendering */}
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
                  {/* PDF Template Selector */}
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
                      <option value="">-- None (No PDF Template) --</option>
                      {pdfTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.original_filename}{" "}
                          {template.id === defaultPdfId && "(Default)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Print Button (now opens selected PDF template) */}
                  <button
                    onClick={() => handlePrintForm()} // No connection data here, just open the template
                    className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
                  >
                    <Printer size={20} className="mr-2" /> Print Selected PDF
                    Template
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
                  // onPrint is now passed, but its functionality is simplified to open PDF template
                  onPrint={handlePrintForm}
                />
                {connections.length === 0 && (
                  <p className="text-center text-gray-500 text-lg mt-8">
                    No connections found. Start by adding one above.
                  </p>
                )}
              </section>
            </>
          )}

          {activeTab === "pcs" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">All PCs</h2>
              <PcList
                pcs={pcs}
                onAddEntity={handleAddEntity}
                onUpdateEntity={handleUpdateEntity}
                onDeleteEntity={handleDeleteEntity}
                locations={locations}
                racks={racks}
              />
            </section>
          )}

          {activeTab === "switches" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                All Switches
              </h2>
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
            </section>
          )}

          {activeTab === "patch_panels" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                All Patch Panels
              </h2>
              <PatchPanelList
                patchPanels={patchPanels}
                onAddEntity={handleAddEntity}
                onUpdateEntity={handleUpdateEntity}
                onDeleteEntity={handleDeleteEntity}
                onShowPortStatus={handleShowPortStatus}
                locations={locations}
                racks={racks}
              />
            </section>
          )}

          {activeTab === "locations" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Manage Locations
              </h2>
              <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-inner">
                <h3 className="text-xl font-bold text-blue-700 mb-4">
                  Add New Location
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = e.target.locationName.value;
                    const door_number = e.target.doorNumber.value;
                    if (name.trim()) {
                      await handleAddEntity("locations", { name, door_number });
                      e.target.locationName.value = "";
                      e.target.doorNumber.value = "";
                    }
                  }}
                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2"
                >
                  <input
                    type="text"
                    name="locationName"
                    placeholder="Location Name (e.g., Data Center)"
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="doorNumber"
                    placeholder="Door Number (Optional)"
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    Add Location
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex justify-between items-center"
                    >
                      <span className="text-lg font-medium text-gray-800">
                        {location.name}
                        {location.door_number
                          ? ` (Door: ${location.door_number})`
                          : ""}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const newName = prompt(
                              "Enter new name for location:",
                              location.name
                            );
                            const newDoorNumber = prompt(
                              "Enter new door number for location:",
                              location.door_number || ""
                            );
                            if (newName !== null && newName.trim()) {
                              handleUpdateEntity("locations", location.id, {
                                name: newName,
                                door_number: newDoorNumber,
                              });
                            }
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("locations", location.id)
                          }
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-lg">
                    No locations added yet. Add some to get started!
                  </p>
                )}
              </div>
            </section>
          )}

          {activeTab === "racks" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Manage Racks
              </h2>
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
              />
            </section>
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
