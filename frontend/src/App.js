// frontend/src/App.js
// This is the main React component for the frontend application.
// It manages the state for PCs, Patch Panels, Switches, and Connections,
// and orchestrates the display of various components.

import React, { useState, useEffect, useCallback } from "react";
import ConnectionList from "./components/ConnectionList";
import ConnectionForm from "./components/ConnectionForm";
import SearchBar from "./components/SearchBar";
import PortStatusModal from "./components/PortStatusModal"; // New component for port status display

// Base URL for the backend API. When running in Docker Compose,
// 'backend' is the service name and resolves to the backend container's IP.
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "/api" // In production, proxy requests through Nginx or similar
    : "http://localhost:5004"; // For local development with 'npm start', updated port to 5004

function App() {
  // State variables to store fetched data
  const [pcs, setPcs] = useState([]);
  const [patchPanels, setPatchPanels] = useState([]);
  const [switches, setSwitches] = useState([]); // Renamed from servers
  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingConnection, setEditingConnection] = useState(null); // State for editing connections
  const [message, setMessage] = useState(""); // General message for success/error
  const [isMessageVisible, setIsMessageVisible] = useState(false); // Controls message visibility

  // State for Port Status Modal
  const [showPortStatusModal, setShowPortStatusModal] = useState(false);
  const [portStatusData, setPortStatusData] = useState(null); // Data for the modal
  const [modalEntityType, setModalEntityType] = useState(null); // 'patch_panel' or 'switch'
  const [modalEntityId, setModalEntityId] = useState(null); // ID of the entity to fetch ports for

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
        // Attempt to parse JSON error message if available
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
    fetchData("switches", setSwitches); // Renamed from servers
    fetchData("connections", setConnections);
  }, [fetchData]);

  // Effect to filter connections whenever connections or searchTerm changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = connections.filter((connection) => {
      // Search across PC name, PC IP Address, Switch name, Switch Port
      const matchesMainConnection =
        (connection.pc?.name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.pc?.ip_address || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (connection.switch?.name || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) || // Renamed from server
        (connection.switch_port || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm); // Renamed from server_port

      // Search through each hop's patch panel name, location, and port
      const matchesHops = connection.hops.some(
        (hop) =>
          (hop.patch_panel?.name || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel?.location || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm) ||
          (hop.patch_panel_port || "")
            .toLowerCase()
            .includes(lowerCaseSearchTerm)
      );

      return matchesMainConnection || matchesHops;
    });
    setFilteredConnections(filtered);
  }, [connections, searchTerm]);

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
      fetchData("connections", setConnections); // Re-fetch all connections to update UI
      showMessage("Connection added successfully!");
    } catch (error) {
      console.error("Error adding connection:", error);
      showMessage(`Error adding connection: ${error.message}`, 8000); // Display error longer
    }
    setEditingConnection(null); // Clear editing state after add
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
      fetchData("connections", setConnections); // Re-fetch all connections to update UI
      showMessage("Connection updated successfully!");
    } catch (error) {
      console.error("Error updating connection:", error);
      showMessage(`Error updating connection: ${error.message}`, 8000); // Display error longer
    }
    setEditingConnection(null); // Clear editing state after update
  };

  // Handle deleting a connection
  const handleDeleteConnection = async (id) => {
    // Implement a custom modal for confirmation instead of alert/confirm
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
    // When editing, transform the hops array back into a format expected by ConnectionForm
    const formattedHops = connection.hops.map((hop) => ({
      patch_panel_id: hop.patch_panel.id,
      patch_panel_port: hop.patch_panel_port,
      is_port_up: hop.is_port_up, // Include status for editing
    }));
    setEditingConnection({
      ...connection,
      pc_id: connection.pc.id,
      switch_id: connection.switch.id, // Renamed from server_id
      switch_port: connection.switch_port, // Renamed from server_port
      is_switch_port_up: connection.is_switch_port_up, // Renamed from is_server_port_up
      hops: formattedHops, // Set formatted hops for the form
    });
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
      if (type === "switches") setSwitches((prev) => [...prev, newEntity]); // Renamed from servers
      showMessage(`${type.slice(0, -1).toUpperCase()} added successfully!`);
      // Re-fetch data relevant to selection dropdowns
      if (type === "patch_panels") fetchData("patch_panels", setPatchPanels);
      if (type === "switches") fetchData("switches", setSwitches); // Renamed from servers
      if (type === "pcs") fetchData("pcs", setPcs);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      showMessage(`Error adding ${type}: ${error.message}`, 5000);
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
      setModalEntityId(entityId); // Store ID for potential re-fetch if modal stays open
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
          // Optionally, add a re-fetch mechanism if the modal supports dynamic updates
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
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        </div>

        {/* Connection Form Section */}
        <section className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            {editingConnection ? "Edit Connection" : "Add New Connection"}
          </h2>
          <ConnectionForm
            pcs={pcs}
            patchPanels={patchPanels}
            switches={switches} // Renamed from servers
            onAddConnection={handleAddConnection}
            onUpdateConnection={handleUpdateConnection}
            editingConnection={editingConnection}
            setEditingConnection={setEditingConnection}
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
            connections={filteredConnections}
            onDelete={handleDeleteConnection}
            onEdit={handleEditConnection}
          />
          {filteredConnections.length === 0 && (
            <p className="text-center text-gray-500 text-lg mt-8">
              No connections found. Start by adding one above or adjust your
              search.
            </p>
          )}
        </section>
      </main>

      {/* Footer (Optional) */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2025 Network Doc App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
