// frontend/src/App.js
// This is the main React component for the frontend application.
// It orchestrates the display of various sections (Connections, PCs, Switches).

import React, { useState, useEffect, useCallback } from "react";
import ConnectionList from "./components/ConnectionList";
import ConnectionForm from "./components/ConnectionForm";
import PortStatusModal from "./components/PortStatusModal";
import PcList from "./components/PcList"; // New: Import PcList component
import SwitchList from "./components/SwitchList"; // New: Import SwitchList component

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

  // State for current active tab
  const [activeTab, setActiveTab] = useState("connections"); // 'connections', 'pcs', 'switches'

  const [message, setMessage] = useState(""); // General message for success/error
  const [isMessageVisible, setIsMessageVisible] = useState(false); // Controls message visibility

  // State for Port Status Modal
  const [showPortStatusModal, setShowPortStatusModal] = useState(false);
  const [portStatusData, setPortStatusData] = useState(null);
  const [modalEntityType, setModalEntityType] = useState(null);
  const [modalEntityId, setModalEntityId] = useState(null);

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

  // Handle editing a connection (set the connection to be edited in state)
  const handleEditConnection = (connection) => {
    const formattedHops = connection.hops.map((hop) => ({
      patch_panel_id: hop.patch_panel.id,
      patch_panel_port: hop.patch_panel_port,
      is_port_up: hop.is_port_up,
    }));
    // Note: editingConnection is managed by ConnectionForm now
    // Passing this up just to trigger the form to open/populate
    // A more robust solution might use a shared state or context for editing.
  };

  // Function to add a new PC, Patch Panel, or Switch
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
      showMessage(`${type.slice(0, -1).toUpperCase()} added successfully!`);
      // Re-fetch data relevant to selection dropdowns
      if (type === "patch_panels") fetchData("patch_panels", setPatchPanels);
      if (type === "switches") fetchData("switches", setSwitches);
      if (type === "pcs") fetchData("pcs", setPcs);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      showMessage(`Error adding ${type}: ${error.message}`, 5000);
    }
  };

  // Function to update an existing PC, Patch Panel, or Switch
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
      showMessage(`${type.slice(0, -1).toUpperCase()} updated successfully!`);
      // Re-fetch connections as well, in case associated entity data has changed
      fetchData("connections", setConnections);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      showMessage(`Error updating ${type}: ${error.message}`, 5000);
    }
  };

  // Function to delete a PC, Patch Panel, or Switch
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
      showMessage(`${type.slice(0, -1).toUpperCase()} deleted successfully!`);
      // Re-fetch connections as well, as some might have been deleted due to cascade
      fetchData("connections", setConnections);
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
                // No longer passing editingConnection state directly from App.js
                // ConnectionForm manages its own editing state or receives initial editing data
                editingConnection={null} // Set to null or a dedicated state for the form if needed
                setEditingConnection={() => {}} // Placeholder, as form manages internally for new/edit flow
                onAddEntity={handleAddEntity}
                onShowPortStatus={handleShowPortStatus}
              />
            </section>

            {/* Connection List Section */}
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                All Connections
              </h2>
              <ConnectionList
                connections={connections} // Pass all connections, let ConnectionList handle its own search/filter
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
            />
          </section>
        )}

        {activeTab === "patch_panels" && (
          <section>
            <h2 className="text-2xl font-bold text-blue-700 mb-6">
              All Patch Panels
            </h2>
            {/* You'll need to create a PatchPanelList component similar to PcList/SwitchList */}
            {/* For now, let's add a placeholder or a simple list here */}
            <div className="bg-white rounded-lg shadow-md p-4">
              {/* Add New Patch Panel Form (from ConnectionForm, made directly available here if needed, or create a dedicated form) */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Add New Patch Panel
                </h3>
                {/* Simplified form for adding just Patch Panels directly in this tab */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = e.target.name.value;
                    const location = e.target.location.value;
                    const totalPorts = parseInt(e.target.totalPorts.value);
                    handleAddEntity("patch_panels", {
                      name,
                      location,
                      total_ports: totalPorts,
                    });
                    e.target.reset(); // Clear form
                  }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    name="name"
                    placeholder="Patch Panel Name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="location"
                    placeholder="Location (Optional)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    name="totalPorts"
                    placeholder="Total Ports (e.g., 24)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Add Patch Panel
                  </button>
                </form>
              </div>

              {/* List of existing Patch Panels */}
              <div className="space-y-4">
                {patchPanels.length > 0 ? (
                  patchPanels.map((pp) => (
                    <div
                      key={pp.id}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-md shadow-sm border border-gray-100"
                    >
                      <div>
                        <p className="font-semibold text-lg">{pp.name}</p>
                        <p className="text-sm text-gray-600">
                          Location: {pp.location || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total Ports: {pp.total_ports}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleShowPortStatus("patch_panels", pp.id)
                          }
                          className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600"
                        >
                          View Ports
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteEntity("patch_panels", pp.id)
                          }
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    No patch panels added yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer (Optional) */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Network Doc App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
