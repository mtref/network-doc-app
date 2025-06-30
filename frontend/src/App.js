// frontend/src/App.js
// This is the main React component for the frontend application.
// It orchestrates the display of various sections (Connections, PCs, Switches, Patch Panels).

import React, { useState, useEffect, useCallback, useRef } from "react";
import ConnectionList from "./components/ConnectionList";
import ConnectionForm from "./components/ConnectionForm";
import PortStatusModal from "./components/PortStatusModal";
import PcList from "./components/PcList";
import SwitchList from "./components/SwitchList";
import PatchPanelList from "./components/PatchPanelList";
import PrintableConnectionForm from "./components/PrintableConnectionForm";
import { Printer } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// Base URL for the backend API. When running in Docker Compose,
// 'backend' is the service name and resolves to the backend container's IP.
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "/api" // In production, proxy requests through Nginx or similar
    : "http://localhost:5004"; // For local development with 'npm start'

function App() {
  // State variables to store fetched data
  const [pcs, setPcs] = useState([]);
  const [patchPanels, setPatchPanels] = useState([]);
  const [switches, setSwitches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [locations, setLocations] = useState([]);

  // State for current active tab
  const [activeTab, setActiveTab] = useState("connections"); // 'connections', 'pcs', 'switches', 'patch_panels', 'locations'

  const [message, setMessage] = useState(""); // General message for success/error
  const [isMessageVisible, setIsMessageVisible] = useState(false); // Controls message visibility

  // State for Port Status Modal
  const [showPortStatusModal, setShowPortStatusModal] = useState(false);
  const [portStatusData, setPortStatusData] = useState(null);
  const [modalEntityType, setModalEntityType] = useState(null);
  const [modalEntityId, setModalEntityId] = useState(null);

  // State for editing a connection in the ConnectionForm
  const [editingConnection, setEditingConnection] = useState(null);

  // State for showing the printable form (used for conditional rendering in main app)
  const [showPrintableForm, setShowPrintableForm] = useState(false);
  // State to store CSS content for injecting into print window
  const [cssContent, setCssContent] = useState("");

  // Function to show a message temporarily
  const showMessage = (msg, duration = 3000) => {
    setMessage(msg);
    setIsMessageVisible(true);
    setTimeout(() => {
      setIsMessageVisible(false);
      setMessage("");
    }, duration);
  };

  // Memoized function to fetch data from the backend
  const fetchData = useCallback(async (endpoint, setter) => {
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
  }, []);

  // Fetch all initial data when the component mounts
  useEffect(() => {
    fetchData("pcs", setPcs);
    fetchData("patch_panels", setPatchPanels);
    fetchData("switches", setSwitches);
    fetchData("connections", setConnections);
    fetchData("locations", setLocations);

    // Fetch CSS content once when component mounts
    fetch("/static/css/main.css") // Path to your compiled CSS file (relative to public folder)
      .then((res) => res.text())
      .then((css) => setCssContent(css))
      .catch((err) => console.error("Failed to load CSS for printing:", err));
  }, [fetchData]);

  // Handle adding a new connection
  const handleAddConnection = async (newConnectionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConnectionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      fetchData("connections", setConnections);
      showMessage("Connection added successfully!");
      setEditingConnection(null);
    } catch (error) {
      console.error("Error adding connection:", error);
      showMessage(`Error adding connection: ${error.message}`, 8000);
    }
  };

  // Handle updating an existing connection
  const handleUpdateConnection = async (id, updatedConnectionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConnectionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      fetchData("connections", setConnections);
      showMessage("Connection updated successfully!");
      setEditingConnection(null);
    } catch (error) {
      console.error("Error updating connection:", error);
      showMessage(`Error updating connection: ${error.message}`, 8000);
    }
  };

  // Handle deleting a connection
  const handleDeleteConnection = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this connection?"
    );
    if (!confirmed) {
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
      setConnections((prev) => prev.filter((conn) => conn.id !== id));
      showMessage("Connection deleted successfully!");
    } catch (error) {
      console.error("Error deleting connection:", error);
      showMessage(`Error deleting connection: ${error.message}`, 5000);
    }
  };

  // Handle editing a connection (set the connection to be edited in state for form pre-fill)
  const handleEditConnection = (connection) => {
    const formattedConnection = {
      id: connection.id,
      pc_id: connection.pc?.id,
      switch_id: connection.switch?.id,
      switch_port: connection.switch_port,
      is_switch_port_up: connection.is_switch_port_up,
      hops: connection.hops.map((hop) => ({
        patch_panel_id: hop.patch_panel?.id,
        patch_panel_port: hop.patch_panel_port,
        is_port_up: hop.is_port_up,
      })),
      pc: connection.pc,
      switch: connection.switch,
    };
    setEditingConnection(formattedConnection);
  };

  // Function to add a new PC, Patch Panel, Switch, or Location
  const handleAddEntity = async (type, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const newEntity = await response.json();
      if (type === "pcs") setPcs((prev) => [...prev, newEntity]);
      if (type === "patch_panels")
        setPatchPanels((prev) => [...prev, newEntity]);
      if (type === "switches") setSwitches((prev) => [...prev, newEntity]);
      if (type === "locations") setLocations((prev) => [...prev, newEntity]);
      showMessage(`${type.slice(0, -1).toUpperCase()} added successfully!`);
      // Re-fetch data relevant to selection dropdowns
      if (type === "patch_panels") fetchData("patch_panels", setPatchPanels);
      if (type === "switches") fetchData("switches", setSwitches);
      if (type === "pcs") fetchData("pcs", setPcs);
      if (type === "locations") fetchData("locations", setLocations);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      showMessage(`Error adding ${type}: ${error.message}`, 5000);
    }
  };

  // Function to update an existing PC, Patch Panel, Switch, or Location
  const handleUpdateEntity = async (type, id, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      const updatedEntity = await response.json();
      if (type === "pcs")
        setPcs((prev) =>
          prev.map((item) => (item.id === id ? updatedEntity : item))
        );
      if (type === "patch_panels")
        setPatchPanels((prev) =>
          prev.map((item) => (item.id === id ? updatedEntity : item))
        );
      if (type === "switches")
        setSwitches((prev) =>
          prev.map((item) => (item.id === id ? updatedEntity : item))
        );
      if (type === "locations")
        setLocations((prev) =>
          prev.map((item) => (item.id === id ? updatedEntity : item))
        );
      showMessage(`${type.slice(0, -1).toUpperCase()} updated successfully!`);
      // Re-fetch connections and other related data as their foreign key info might have changed
      fetchData("connections", setConnections);
      fetchData("patch_panels", setPatchPanels);
      fetchData("switches", setSwitches);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      showMessage(`Error updating ${type}: ${error.message}`, 5000);
    }
  };

  // Function to delete a PC, Patch Panel, Switch, or Location
  const handleDeleteEntity = async (type, id) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${type.slice(
        0,
        -1
      )}? This will also delete associated connections.`
    );
    if (!confirmed) {
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
      if (type === "pcs")
        setPcs((prev) => prev.filter((item) => item.id !== id));
      if (type === "patch_panels")
        setPatchPanels((prev) => prev.filter((item) => item.id !== id));
      if (type === "switches")
        setSwitches((prev) => prev.filter((item) => item.id !== id));
      if (type === "locations")
        setLocations((prev) => prev.filter((item) => item.id !== id));
      showMessage(`${type.slice(0, -1).toUpperCase()} deleted successfully!`);
      // Re-fetch connections and other related data as cascade deletions might have occurred
      fetchData("connections", setConnections);
      fetchData("patch_panels", setPatchPanels);
      fetchData("switches", setSwitches);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showMessage(`Error deleting ${type}: ${error.message}`, 5000);
    }
  };

  // Function to open the port status modal
  const handleShowPortStatus = async (entityType, entityId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${entityType}/${entityId}/ports`
      );
      if (!response.ok) {
        const errorData = await response.json();
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
  };

  const handleClosePortStatusModal = () => {
    setShowPortStatusModal(false);
    setPortStatusData(null);
    setModalEntityType(null);
    setModalEntityId(null);
  };

  // Handle printing the form using an iframe
  const handlePrintForm = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups for printing.");
      return;
    }

    // Render the PrintableConnectionForm component to a static HTML string
    const printableHtml = ReactDOMServer.renderToString(
      <PrintableConnectionForm
      // No longer passing dynamic data to this static form
      />
    );

    // Inject the fetched CSS content directly
    const styleTag = `<style>${cssContent}</style>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Network Connection Form Print</title>
          ${styleTag}
      </head>
      <body>
          <div class="print-only-container">
              ${printableHtml}
          </div>
      </body>
      </html>
    `);
    printWindow.document.close(); // Close the document to ensure content is loaded

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus(); // Focus the new window
      printWindow.print(); // Trigger print
      // printWindow.close(); // Close the window after printing (optional, can be annoying)
    };
  };

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
        />
      )}

      {/* Printable Connection Form (Only visible when printing) */}
      {/* This component is now rendered to string, not conditionally displayed in the main DOM */}
      {/* Removed: {showPrintableForm && (...) } */}

      {/* Main App Content */}
      <div>
        {" "}
        {/* Removed conditional 'no-print' class as iframe handles hiding */}
        {/* Header Section */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight sm:text-5xl">
            Network Device Documentation
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track your network connections from PC to Patch Panel to Switch with
            ease.
          </p>
        </header>
        {/* Main Content Area */}
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
          </div>

          {/* Conditional Tab Content Rendering */}
          {activeTab === "connections" && (
            <>
              {/* Connection Form Section */}
              <section className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                  Add/Edit Connection
                </h2>
                <ConnectionForm
                  pcs={pcs}
                  patchPanels={patchPanels}
                  switches={switches}
                  onAddConnection={handleAddConnection}
                  onUpdateConnection={handleUpdateConnection}
                  editingConnection={editingConnection}
                  setEditingConnection={setEditingConnection}
                  onAddEntity={handleAddEntity}
                  onShowPortStatus={handleShowPortStatus}
                  locations={locations}
                />
              </section>

              {/* Print Form Button */}
              <div className="text-center mb-6">
                <button
                  onClick={handlePrintForm}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center mx-auto"
                >
                  <Printer size={20} className="mr-2" /> Print Empty Form
                </button>
              </div>

              {/* Connection List Section */}
              <section>
                <h2 className="text-2xl font-bold text-blue-700 mb-6">
                  All Connections
                </h2>
                <ConnectionList
                  connections={connections}
                  onDelete={handleDeleteConnection}
                  onEdit={handleEditConnection}
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
              />
            </section>
          )}

          {activeTab === "locations" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                Manage Locations
              </h2>
              {/* Form for adding new locations */}
              <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 mb-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4">
                  Add New Location
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const name = e.target.locationName.value;
                    if (name.trim()) {
                      await handleAddEntity("locations", { name });
                      e.target.locationName.value = "";
                    }
                  }}
                  className="flex space-x-2"
                >
                  <input
                    type="text"
                    name="locationName"
                    placeholder="Location Name (e.g., Data Center)"
                    className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                  >
                    Add Location
                  </button>
                </form>
              </div>

              {/* List of existing locations */}
              <div className="space-y-3">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <div
                      key={location.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex justify-between items-center"
                    >
                      <span className="text-lg font-medium text-gray-800">
                        {location.name}
                      </span>
                      <button
                        onClick={() =>
                          handleDeleteEntity("locations", location.id)
                        }
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                      >
                        Delete
                      </button>
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
        </main>
        {/* Footer (Optional) */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Network Doc App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
