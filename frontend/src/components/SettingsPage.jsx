// frontend/src/components/SettingsPage.jsx
import React, { useState } from "react";
import {
  Download,
  Upload,
  Settings,
  FileText,
  HardDrive,
  Server,
  Split,
  Laptop,
  Link,
  MapPin,
  Columns, // Icon for Racks
} from "lucide-react";

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

function SettingsPage({ showMessage }) {
  const [selectedImportEntityType, setSelectedImportEntityType] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null); // { message, errors, error_count, success_count }

  const entityTypes = [
    { id: "locations", name: "Locations", icon: <MapPin size={20} /> },
    { id: "racks", name: "Racks", icon: <Columns size={20} /> }, // New entity type
    { id: "pcs", name: "PCs", icon: <Laptop size={20} /> },
    { id: "patch_panels", name: "Patch Panels", icon: <Split size={20} /> },
    { id: "switches", name: "Switches", icon: <Server size={20} /> },
    { id: "connections", name: "Connections", icon: <Link size={20} /> },
  ];

  const handleExport = async (entityType) => {
    try {
      const response = await fetch(`${API_BASE_URL}/export/${entityType}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, Details: ${errorText}`
        );
      }

      // Get filename from Content-Disposition header, or default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${entityType}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showMessage(`Successfully exported ${entityType} data!`);
    } catch (error) {
      console.error(`Error exporting ${entityType} data:`, error);
      showMessage(
        `Failed to export ${entityType} data: ${error.message}`,
        8000
      );
    }
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImportStatus(null); // Clear previous status

    if (!importFile) {
      showMessage("Please select a CSV file to import.", 3000);
      return;
    }
    if (!selectedImportEntityType) {
      showMessage("Please select an entity type for import.", 3000);
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const response = await fetch(
        `${API_BASE_URL}/import/${selectedImportEntityType}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      setImportStatus(result);
      if (result.error_count > 0) {
        showMessage(
          `Import completed with ${result.error_count} errors. See details below.`,
          8000
        );
      } else {
        showMessage(result.message || "Import completed successfully!");
      }

      // Clear form
      setImportFile(null);
      setSelectedImportEntityType("");
      e.target.reset(); // Reset the file input
    } catch (error) {
      console.error("Error during import:", error);
      setImportStatus({
        message: `Import failed: ${error.message}`,
        errors: error.details || [],
        error_count: 1, // Indicate at least one error
        success_count: 0,
      });
      showMessage(`Import failed: ${error.message}`, 8000);
    }
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center">
        <Settings size={24} className="mr-2" /> Settings & Data Management
      </h2>

      {/* Export Data Section */}
      <section className="p-5 bg-indigo-50 rounded-lg border border-indigo-200 shadow-inner">
        <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center">
          <Download size={20} className="mr-2" /> Export Data to CSV
        </h3>
        <p className="text-gray-700 mb-4">
          Select an entity type to export all its data to a CSV file.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entityTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleExport(type.id)}
              className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium"
            >
              {type.icon} <span className="ml-2">Export {type.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Import Data Section */}
      <section className="p-5 bg-green-50 rounded-lg border border-green-200 shadow-inner">
        <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
          <Upload size={20} className="mr-2" /> Import Data from CSV
        </h3>
        <p className="text-gray-700 mb-4">
          Upload a CSV file to import data. Ensure the CSV format matches the
          exported format. Existing records with matching unique names (for
          Locations, PCs, Patch Panels, Switches, Racks) or matching PC/Switch/Switch
          Port combinations (for Connections) will be skipped.
        </p>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label
              htmlFor="import-file"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select CSV File:
            </label>
            <input
              type="file"
              id="import-file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="import-entity-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Entity Type:
            </label>
            <select
              id="import-entity-type"
              value={selectedImportEntityType}
              onChange={(e) => setSelectedImportEntityType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select Entity Type --</option>
              {entityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            <span className="flex items-center justify-center">
              <Upload size={20} className="mr-2" /> Import Data
            </span>
          </button>
        </form>

        {/* Import Status Display */}
        {importStatus && (
          <div className="mt-6 p-4 rounded-lg bg-gray-100 border border-gray-200">
            <p className="font-semibold text-lg mb-2">Import Summary:</p>
            <p className="text-gray-800">Status: {importStatus.message}</p>
            <p className="text-green-600">
              Successfully Processed: {importStatus.success_count}
            </p>
            {importStatus.error_count > 0 && (
              <div className="text-red-600 mt-2">
                <p>Errors Encountered: {importStatus.error_count}</p>
                <ul className="list-disc list-inside text-sm mt-1 max-h-40 overflow-y-auto">
                  {importStatus.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default SettingsPage;