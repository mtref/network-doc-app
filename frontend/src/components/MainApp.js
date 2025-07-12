// frontend/src/components/MainApp.js
// This component contains the main application layout and logic.
// UPDATED: The header has been redesigned with a logo, title, and subtitle aligned to the left.

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import ConnectionList from "./ConnectionList";
import ConnectionForm from "./ConnectionForm";
import PortStatusModal from "./PortStatusModal";
import PcList from "./PcList";
import SwitchList from "./SwitchList";
import PatchPanelList from "./PatchPanelList";
import SwitchDiagramModal from "./SwitchDiagramModal";
import SettingsPage from "./SettingsPage";
import RackList from "./RackList";
import RackViewModal from "./RackViewModal";
import PcDetailsModal from "./PcDetailsModal";
import PasswordManager from "./PasswordManager";
import StockManager from "./StockManager";
import {
  Printer,
  Info,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  User as UserIcon,
  BookOpen,
  Package,
  Link as LinkIcon,
  Laptop,
  Server,
  Split,
  Columns,
  MapPin,
  KeyRound,
  Settings,
} from "lucide-react";

// Icon mapping for tabs
const tabIcons = {
    connections: <LinkIcon size={18} className="inline-block mr-2" />,
    pcs: <Laptop size={18} className="inline-block mr-2" />,
    switches: <Server size={18} className="inline-block mr-2" />,
    patch_panels: <Split size={18} className="inline-block mr-2" />,
    racks: <Columns size={18} className="inline-block mr-2" />,
    locations: <MapPin size={18} className="inline-block mr-2" />,
    stock: <Package size={18} className="inline-block mr-2" />,
    passwords: <KeyRound size={18} className="inline-block mr-2" />,
    settings: <Settings size={18} className="inline-block mr-2" />,
};


function MainApp() {
  const { user, logout } = useAuth();

  const [pcs, setPcs] = useState([]);
  const [patchPanels, setPatchPanels] = useState([]);
  const [switches, setSwitches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [locations, setLocations] = useState([]);
  const [racks, setRacks] = useState([]);
  const [activeTab, setActiveTab] = useState("connections");
  const [message, setMessage] = useState("");
  const [isMessageVisible, setIsMessageVisible] = useState(false);
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
  const [editingConnection, setEditingConnection] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationFormName, setLocationFormName] = useState("");
  const [locationFormDoorNumber, setLocationFormDoorNumber] = useState("");
  const [locationFormDescription, setLocationFormDescription] = useState("");
  const [isAddLocationFormExpanded, setIsAddLocationFormExpanded] =
    useState(false);
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

  const fetchAllData = useCallback(async () => {
    try {
      const [
        pcsData,
        ppsData,
        switchesData,
        connsData,
        locsData,
        racksData,
        pdfData,
      ] = await Promise.all([
        api.get("pcs"),
        api.get("patch_panels"),
        api.get("switches"),
        api.get("connections"),
        api.get("locations"),
        api.get("racks"),
        api.get("pdf_templates"),
      ]);
      setPcs(pcsData);
      setPatchPanels(ppsData);
      setSwitches(switchesData);
      setConnections(connsData);
      setLocations(locsData);
      setRacks(racksData);
      setPdfTemplates(pdfData.templates);
      setDefaultPdfId(pdfData.default_pdf_id);
      if (
        !selectedPrintTemplateId ||
        !pdfData.templates.some((t) => t.id === selectedPrintTemplateId)
      ) {
        setSelectedPrintTemplateId(pdfData.default_pdf_id);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showMessage(`Error fetching data: ${error.message}`, 5000);
    }
  }, [showMessage, selectedPrintTemplateId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleAddEntity = useCallback(
    async (type, data) => {
      try {
        const newEntity = await api.post(type, data);
        showMessage(`${type.slice(0, -1).replace("_", " ")} added successfully!`);
        await fetchAllData();
        return { success: true, entity: newEntity };
      } catch (error) {
        showMessage(`Error adding ${type}: ${error.message}`, 5000);
        return { success: false, error: error.message };
      }
    },
    [fetchAllData, showMessage]
  );

  const handleUpdateEntity = useCallback(
    async (type, id, data) => {
      try {
        await api.put(`${type}/${id}`, data);
        showMessage(`${type.slice(0, -1).replace("_", " ")} updated successfully!`);
        await fetchAllData();
        return { success: true };
      } catch (error) {
        showMessage(`Error updating ${type}: ${error.message}`, 5000);
        return { success: false, error: error.message };
      }
    },
    [fetchAllData, showMessage]
  );

  const handleDeleteEntity = useCallback(
    async (type, id) => {
      if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`))
        return;
      try {
        await api.delete(`${type}/${id}`);
        showMessage(`${type.slice(0, -1).replace("_", " ")} deleted successfully!`);
        await fetchAllData();
      } catch (error) {
        showMessage(`Error deleting ${type}: ${error.message}`, 5000);
      }
    },
    [fetchAllData, showMessage]
  );

  const handleAddConnection = useCallback(
    (newConnectionData) => handleAddEntity("connections", newConnectionData),
    [handleAddEntity]
  );

  const handleUpdateConnection = useCallback(
    (id, updatedConnectionData) => handleUpdateEntity("connections", id, updatedConnectionData),
    [handleUpdateEntity]
  );

  const handleDeleteConnection = useCallback(
    (id) => handleDeleteEntity("connections", id),
    [handleDeleteEntity]
  );

  const handleEditConnection = useCallback((connection) => {
    setEditingConnection(connection);
  }, []);

  const handleShowPortStatus = useCallback(
    async (entityType, entityId) => {
      if (entityType === "switches" || entityType === "patch_panels") {
        try {
          const data = await api.get(`${entityType}/${entityId}/ports`);
          setPortStatusData(data);
          setModalEntityType(entityType);
          setModalEntityId(entityId);
          setShowPortStatusModal(true);
        } catch (error) {
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
    const result = editingLocation
      ? await handleUpdateEntity("locations", editingLocation.id, locationData)
      : await handleAddEntity("locations", locationData);
    if (result.success) {
      setEditingLocation(null);
      setLocationFormName("");
      setLocationFormDoorNumber("");
      setLocationFormDescription("");
      setIsAddLocationFormExpanded(false);
    }
  };

  const handleClosePortStatusModal = useCallback(() => setShowPortStatusModal(false), []);
  const handleViewSwitchDiagram = useCallback((_switch) => {
    setSelectedSwitchForDiagram(_switch);
    setShowSwitchDiagramModal(true);
  }, []);
  const handleCloseSwitchDiagramModal = useCallback(() => setShowSwitchDiagramModal(false), []);
  const handleViewRackDetails = useCallback((rack) => {
    setSelectedRackForView(rack);
    setShowRackViewModal(true);
  }, []);
  const handleCloseRackViewModal = useCallback(() => setShowRackViewModal(false), []);

  const handlePrintForm = useCallback(async () => {
    const selectedTemplate = pdfTemplates.find(
      (t) => String(t.id) === String(selectedPrintTemplateId)
    );
    if (!selectedTemplate) {
      showMessage("Please select a PDF template to print.", 5000);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showMessage("Authentication token not found. Please log in again.", 5000);
        return;
    }

    const pdfUrl = `${
      process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004"
    }/pdf_templates/download/${selectedTemplate.stored_filename}`;

    try {
        const response = await fetch(pdfUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.msg || errData.error || errorMsg;
            } catch (e) {
                // Ignore if response is not JSON
            }
            throw new Error(errorMsg);
        }

        const blob = await response.blob();
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
        setTimeout(() => URL.revokeObjectURL(fileURL), 1000);

    } catch (error) {
        console.error("Error downloading PDF:", error);
        showMessage(`Error downloading PDF: ${error.message}`, 5000);
    }
  }, [selectedPrintTemplateId, pdfTemplates, showMessage]);

  const tabs = ["connections", "pcs", "switches", "patch_panels", "racks", "locations", "stock"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-200 font-inter p-4 sm:p-8">
      {isMessageVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {message}
        </div>
      )}
      {showPortStatusModal && (
        <PortStatusModal
          isOpen={showPortStatusModal}
          onClose={handleClosePortStatusModal}
          data={portStatusData}
          entityType={modalEntityType}
          entityId={modalEntityId}
        />
      )}
      {showSwitchDiagramModal && (
        <SwitchDiagramModal
          isOpen={showSwitchDiagramModal}
          onClose={handleCloseSwitchDiagramModal}
          selectedSwitch={selectedSwitchForDiagram}
          connections={connections}
          pcs={pcs}
        />
      )}
      {showRackViewModal && (
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
      {showPcDetailsModal && (
        <PcDetailsModal
          isOpen={showPcDetailsModal}
          onClose={handleClosePcDetailsModal}
          pc={selectedPcForDetails}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
            {/* Left Side: Logo, Title, Subtitle */}
            <div>
                <div className="flex items-center gap-4">
                    <img src={`${process.env.PUBLIC_URL}/favicon.svg`} alt="NetDoc Logo" className="h-12 w-12" />
                    <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
                        NetDoc
                    </h1>
                </div>
                <p className="mt-2 text-lg text-gray-600">
                    Documenting your network and manage stocks and passwords
                </p>
            </div>

            {/* Right Side: User Panel */}
            <div className="flex items-center space-x-3 bg-white p-2 rounded-lg shadow-sm border">
                <UserIcon size={20} className="text-gray-500" />
                <div className="text-sm">
                <span className="font-semibold text-gray-800">{user.username}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${user.role === "Admin" ? "bg-red-100 text-red-800" : user.role === "Editor" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                    {user.role}
                </span>
                </div>
                {user.role !== 'Viewer' && (
                <button onClick={() => handleTabClick('settings')} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200" title="Settings">
                    <Settings size={20} />
                </button>
                )}
                <a href="/manual" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200" title="User Manual">
                <BookOpen size={20} />
                </a>
                <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200" title="Logout">
                <LogOut size={20} />
                </button>
            </div>
        </header>
        <main className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`flex items-center py-3 px-4 sm:px-6 text-base sm:text-lg font-medium whitespace-nowrap ${activeTab === tab ? "border-b-4 border-blue-600 text-blue-800" : "text-gray-600 hover:text-blue-600"}`}
                onClick={() => handleTabClick(tab)}
              >
                {tabIcons[tab]}
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace("_", " ")}
              </button>
            ))}
            {user.role === "Admin" && (
              <button
                className={`flex items-center py-3 px-4 sm:px-6 text-base sm:text-lg font-medium whitespace-nowrap ${activeTab === "passwords" ? "border-b-4 border-blue-600 text-blue-800" : "text-gray-600 hover:text-blue-600"}`}
                onClick={() => handleTabClick("passwords")}
              >
                {tabIcons.passwords}
                Passwords
              </button>
            )}
            {user.role !== "Viewer" && (
              <button
                className={`flex items-center py-3 px-4 sm:px-6 text-base sm:text-lg font-medium whitespace-nowrap ${activeTab === "settings" ? "border-b-4 border-blue-600 text-blue-800" : "text-gray-600 hover:text-blue-600"}`}
                onClick={() => handleTabClick("settings")}
              >
                {tabIcons.settings}
                Settings
              </button>
            )}
          </div>

          {activeTab === "connections" && (
            <>
              {user.role !== "Viewer" && (
                <section className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-inner">
                  <h2 className="text-2xl font-bold text-blue-700 mb-4">Add/Edit Connection</h2>
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
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-blue-700 mb-4">Print Options</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="pdf-template-select" className="text-gray-700 font-medium">PDF Template:</label>
                    <select
                      id="pdf-template-select"
                      value={selectedPrintTemplateId || ""}
                      onChange={(e) => setSelectedPrintTemplateId(e.target.value ? parseInt(e.target.value) : null)}
                      className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- None --</option>
                      {pdfTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.original_filename}{" "}{template.id === defaultPdfId && "(Default)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handlePrintForm} className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 flex items-center justify-center">
                    <Printer size={20} className="mr-2" /> Print Selected PDF
                  </button>
                </div>
              </div>
              <section>
                <h2 className="text-2xl font-bold text-blue-700 mb-6">All Connections</h2>
                <ConnectionList
                  connections={connections}
                  onDelete={handleDeleteConnection}
                  onEdit={handleEditConnection}
                  onViewPcDetails={handleViewPcDetails}
                  onShowPortStatus={handleShowPortStatus}
                  user={user}
                />
              </section>
            </>
          )}

          {activeTab === "pcs" && (<PcList pcs={pcs} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} racks={racks} user={user}/>)}
          {activeTab === "switches" && (<SwitchList switches={switches} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} onShowPortStatus={handleShowPortStatus} locations={locations} racks={racks} onViewDiagram={handleViewSwitchDiagram} user={user}/>)}
          {activeTab === "patch_panels" && (<PatchPanelList patchPanels={patchPanels} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} onShowPortStatus={handleShowPortStatus} locations={locations} racks={racks} user={user}/>)}
          {activeTab === "locations" && (
            <section>
              <h2 className="text-2xl font-bold text-blue-700 mb-6">Manage Locations</h2>
              {user.role !== "Viewer" && (
                <div className="bg-white rounded-lg shadow-sm border border-blue-200 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mb-8">
                  <div className="flex justify-center items-center p-3 cursor-pointer bg-blue-500 text-white hover:bg-blue-600" onClick={() => setIsAddLocationFormExpanded(!isAddLocationFormExpanded)}>
                    <h3 className="text-xl font-bold flex items-center"><PlusCircle size={20} className="mr-2" />{editingLocation ? "Edit Location" : "Add New Location"}</h3>
                    {isAddLocationFormExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  <div className={`collapsible-content ${isAddLocationFormExpanded ? "expanded" : ""}`}>
                    <form onSubmit={handleLocationFormSubmit} className="p-5 space-y-4 border border-gray-300 rounded-b-lg shadow-md bg-gray-50">
                      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <input type="text" placeholder="Location Name" value={locationFormName} onChange={(e) => setLocationFormName(e.target.value)} className="flex-grow p-2 border rounded-md" required/>
                        <input type="text" placeholder="Door Number (Optional)" value={locationFormDoorNumber} onChange={(e) => setLocationFormDoorNumber(e.target.value)} className="flex-grow p-2 border rounded-md"/>
                      </div>
                      <textarea placeholder="Description (Optional)" value={locationFormDescription} onChange={(e) => setLocationFormDescription(e.target.value)} className="w-full p-2 border rounded-md resize-y" rows="3"></textarea>
                      <div className="flex justify-end space-x-3">
                        {editingLocation && (<button type="button" onClick={() => {setEditingLocation(null); setLocationFormName(""); setLocationFormDoorNumber(""); setLocationFormDescription(""); setIsAddLocationFormExpanded(false);}} className="px-4 py-2 bg-gray-300 rounded-md">Cancel Edit</button>)}
                        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">{editingLocation ? "Update Location" : "Add Location"}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="mt-8 space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">{location.name}{" "}{location.door_number && `(Door: ${location.door_number})`}</h4>
                        <p className="text-sm text-gray-600 mt-1 flex items-start"><Info size={16} className="text-gray-400 mr-2 mt-0.5" />{location.description || "No description."}</p>
                      </div>
                      {user.role !== "Viewer" && (
                        <div className="flex space-x-2 flex-shrink-0 ml-4">
                          <button onClick={() => handleEditLocation(location)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">Edit</button>
                          <button onClick={() => handleDeleteEntity("locations", location.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded-md">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {activeTab === "racks" && (<RackList racks={racks} locations={locations} switches={switches} patchPanels={patchPanels} pcs={pcs} onAddEntity={handleAddEntity} onUpdateEntity={handleUpdateEntity} onDeleteEntity={handleDeleteEntity} onShowPortStatus={handleShowPortStatus} onViewRackDetails={handleViewRackDetails} showMessage={showMessage} onViewPcDetails={handleViewPcDetails} user={user}/>)}
          {activeTab === "stock" && (<StockManager showMessage={showMessage} pcs={pcs} />)}
          {activeTab === "settings" && user.role !== "Viewer" && (<SettingsPage showMessage={showMessage} user={user} />)}
          {activeTab === "passwords" && user.role === "Admin" && (<PasswordManager showMessage={showMessage} />)}
        </main>
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Network Doc App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default MainApp;
