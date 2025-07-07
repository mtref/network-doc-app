// frontend/src/components/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Upload,
  Settings,
  FileText,
  Trash2, // New icon for delete
  ExternalLink, // New icon for opening PDF
  CheckCircle, // New icon for default PDF
  XCircle, // New icon for not default
  HardDrive,
  Server,
  Split,
  Laptop,
  Link,
  MapPin,
  Columns, // Icon for Racks
} from "lucide-react";
import SystemLogViewer from "./SystemLogViewer"; // Import the new log viewer component

// Base URL for the backend API.
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5004";

function SettingsPage({ showMessage }) {
  const [selectedImportEntityType, setSelectedImportEntityType] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null); // { message, errors, error_count, success_count }

  // New states for PDF template management
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [defaultPdfId, setDefaultPdfId] = useState(null);
  const [uploadPdfFile, setUploadPdfFile] = useState(null);
  const [pdfUploadMessage, setPdfUploadMessage] = useState("");

  const entityTypes = [
    { id: "locations", name: "Locations", icon: <MapPin size={20} /> },
    { id: "racks", name: "Racks", icon: <Columns size={20} /> },
    { id: "pcs", name: "PCs", icon: <Laptop size={20} /> },
    { id: "patch_panels", name: "Patch Panels", icon: <Split size={20} /> },
    { id: "switches", name: "Switches", icon: <Server size={20} /> },
    { id: "connections", name: "Connections", icon: <Link size={20} /> },
  ];

  // --- PDF Template Management Functions ---

  const fetchPdfTemplates = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pdf_templates`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPdfTemplates(data.templates);
      setDefaultPdfId(data.default_pdf_id);
    } catch (error) {
      console.error("Failed to fetch PDF templates:", error);
      showMessage(`Error fetching PDF templates: ${error.message}`, 5000);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPdfTemplates();
  }, [fetchPdfTemplates]);

  const handlePdfFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadPdfFile) {
      setPdfUploadMessage("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadPdfFile);

    try {
      const response = await fetch(`${API_BASE_URL}/pdf_templates/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      setPdfUploadMessage(result.message || "PDF uploaded successfully!");
      setUploadPdfFile(null); // Clear file input
      e.target.reset(); // Reset the file input field in the form
      fetchPdfTemplates(); // Re-fetch list to show new PDF
      showMessage("PDF uploaded successfully!", 3000);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setPdfUploadMessage(`Failed to upload PDF: ${error.message}`);
      showMessage(`Failed to upload PDF: ${error.message}`, 5000);
    }
  };

  const handleDeletePdfTemplate = async (pdfId) => {
    if (!window.confirm("Are you sure you want to delete this PDF template?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/pdf_templates/${pdfId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      showMessage("PDF template deleted successfully!", 3000);
      fetchPdfTemplates(); // Re-fetch list
    } catch (error) {
      console.error("Error deleting PDF template:", error);
      showMessage(`Error deleting PDF template: ${error.message}`, 5000);
    }
  };

  const handleSetDefaultPdf = async (pdfId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/app_settings/default_pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_pdf_id: pdfId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }
      showMessage("Default PDF template set successfully!", 3000);
      setDefaultPdfId(pdfId); // Update local state immediately
    } catch (error) {
      console.error("Error setting default PDF:", error);
      showMessage(`Error setting default PDF: ${error.message}`, 5000);
    }
  };

  const handleOpenPdf = (storedFilename) => {
    window.open(
      `${API_BASE_URL}/pdf_templates/download/${storedFilename}`,
      "_blank"
    );
  };

  // --- CSV Import/Export Functions (Existing) ---

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
          Locations, PCs, Patch Panels, Switches, Racks) or matching
          PC/Switch/Switch Port combinations (for Connections) will be skipped.
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

      {/* PDF Template Management Section */}
      <section className="p-5 bg-purple-50 rounded-lg border border-purple-200 shadow-inner">
        <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center">
          <FileText size={20} className="mr-2" /> PDF Template Management
        </h3>

        {/* Upload New PDF Template */}
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <Upload size={18} className="mr-2" /> Upload New PDF Template
          </h4>
          <form onSubmit={handlePdfFileUpload} className="space-y-3">
            <div>
              <label
                htmlFor="pdf-upload"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select PDF File:
              </label>
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={(e) => setUploadPdfFile(e.target.files[0])}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
            >
              Upload PDF
            </button>
            {pdfUploadMessage && (
              <p className="mt-2 text-sm text-center text-gray-600">
                {pdfUploadMessage}
              </p>
            )}
          </form>
        </div>

        {/* List Existing PDF Templates */}
        <div className="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <FileText size={18} className="mr-2" /> Existing PDF Templates
          </h4>
          {pdfTemplates.length > 0 ? (
            <ul className="space-y-2">
              {pdfTemplates.map((template) => (
                <li
                  key={template.id}
                  className="flex items-center justify-between p-2 border border-gray-100 rounded-md bg-gray-50"
                >
                  <div className="flex-grow flex items-center">
                    {defaultPdfId === template.id ? (
                      <CheckCircle
                        size={18}
                        className="text-green-500 mr-2"
                        title="Default PDF"
                      />
                    ) : (
                      <XCircle
                        size={18}
                        className="text-gray-400 mr-2"
                        title="Not Default"
                      />
                    )}
                    <span className="text-sm text-gray-800 font-medium truncate">
                      {template.original_filename}
                      {defaultPdfId === template.id && (
                        <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenPdf(template.stored_filename)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      title="Open PDF"
                    >
                      <ExternalLink size={20} />
                    </button>
                    {defaultPdfId !== template.id ? (
                      <button
                        onClick={() => handleSetDefaultPdf(template.id)}
                        className="p-1 text-purple-600 hover:text-purple-800 transition-colors duration-200"
                        title="Set as Default"
                      >
                        <CheckCircle size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSetDefaultPdf(null)} // Option to unset default
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        title="Unset Default"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePdfTemplate(template.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors duration-200"
                      title="Delete PDF"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 text-sm">
              No PDF templates uploaded yet.
            </p>
          )}
        </div>
      </section>

      {/* NEW: System Log Viewer Section */}
      <SystemLogViewer showMessage={showMessage} />
    </div>
  );
}

export default SettingsPage;
