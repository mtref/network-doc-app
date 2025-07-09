// frontend/src/components/SettingsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Upload,
  Settings,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Users,
  Link as LinkIcon,
  Laptop,
  Server,
  Split,
  MapPin,
  Columns
} from "lucide-react";
import SystemLogViewer from './SystemLogViewer';
import UserManagement from './UserManagement';

// Helper component for creating collapsible sections
const CollapsibleSection = ({ title, icon, children, isExpanded, setIsExpanded, bgColorClass = 'bg-gray-50', hoverBgColorClass = 'hover:bg-gray-100', textColorClass = 'text-gray-700' }) => {
  return (
    <section className={`rounded-lg border border-gray-200 shadow-inner ${bgColorClass}`}>
      <div
        className={`flex justify-between items-center p-5 cursor-pointer ${hoverBgColorClass} transition-colors duration-200 rounded-t-lg`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={`text-xl font-bold flex items-center ${textColorClass}`}>
          {icon} {title}
        </h3>
        {isExpanded ? <ChevronUp size={20} className={textColorClass} /> : <ChevronDown size={20} className={textColorClass} />}
      </div>
      <div className={`collapsible-content ${isExpanded ? "expanded" : ""}`}>
        {children}
      </div>
    </section>
  );
};

function SettingsPage({ showMessage }) {
  const { user } = useAuth();

  // State for collapsible sections
  const [isImportExpanded, setIsImportExpanded] = useState(false);
  const [isExportExpanded, setIsExportExpanded] = useState(false);
  const [isPdfMgmtExpanded, setIsPdfMgmtExpanded] = useState(false);
  const [isLogViewerExpanded, setIsLogViewerExpanded] = useState(false);
  const [isUserMgmtExpanded, setIsUserMgmtExpanded] = useState(false); // CORRECTED: Default to collapsed

  // State for PDF templates
  const [pdfTemplates, setPdfTemplates] = useState([]);
  const [defaultPdfId, setDefaultPdfId] = useState(null);

  const fetchPdfTemplates = useCallback(async () => {
    try {
      const data = await api('pdf_templates');
      setPdfTemplates(data.templates);
      setDefaultPdfId(data.default_pdf_id);
    } catch (error) {
      showMessage(`Error fetching PDF templates: ${error.message}`, 5000);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchPdfTemplates();
  }, [fetchPdfTemplates]);

  const handleFileUpload = async (event, entityType) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api(`import/${entityType}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': null, 
        },
      });
      showMessage(response.message || 'Import successful!');
      if (response.errors && response.errors.length > 0) {
        console.error("Import errors:", response.errors);
      }
    } catch (error) {
      showMessage(`Error importing data: ${error.message}`, 8000);
    } finally {
      event.target.value = null;
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api('pdf_templates/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': null },
      });
      showMessage('PDF template uploaded successfully.');
      fetchPdfTemplates();
    } catch (error) {
      showMessage(`Error uploading PDF: ${error.message}`, 5000);
    } finally {
      event.target.value = null;
    }
  };

  const handleDeletePdfTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this PDF template?')) {
      try {
        await api(`pdf_templates/${templateId}`, { method: 'DELETE' });
        showMessage('PDF template deleted successfully.');
        fetchPdfTemplates();
      } catch (error) {
        showMessage(`Error deleting PDF: ${error.message}`, 5000);
      }
    }
  };

  const handleSetDefaultPdf = async (templateId) => {
    try {
      await api('app_settings/default_pdf', {
        method: 'POST',
        body: JSON.stringify({ default_pdf_id: templateId }),
      });
      showMessage('Default PDF template updated.');
      fetchPdfTemplates();
    } catch (error) {
      showMessage(`Error setting default PDF: ${error.message}`, 5000);
    }
  };

  const exportData = (entityType) => {
    const token = localStorage.getItem('token');
    // Use a temporary link to trigger download, including token for auth
    const link = document.createElement('a');
    link.href = `${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5004'}/api/export/${entityType}?token=${token}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const entityTypes = [
    { name: 'Connections', type: 'connections', icon: <LinkIcon size={20} className="mr-2" /> },
    { name: 'PCs', type: 'pcs', icon: <Laptop size={20} className="mr-2" /> },
    { name: 'Switches', type: 'switches', icon: <Server size={20} className="mr-2" /> },
    { name: 'Patch Panels', type: 'patch_panels', icon: <Split size={20} className="mr-2" /> },
    { name: 'Locations', type: 'locations', icon: <MapPin size={20} className="mr-2" /> },
    { name: 'Racks', type: 'racks', icon: <Columns size={20} className="mr-2" /> },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center">
        <Settings className="mr-3" /> Application Settings
      </h2>

      {/* User Management Section (Admin only) */}
      {user.role === 'Admin' && (
        <CollapsibleSection
            title="User Accounts"
            icon={<Users size={20} className="mr-2" />}
            isExpanded={isUserMgmtExpanded}
            setIsExpanded={setIsUserMgmtExpanded}
            bgColorClass="bg-indigo-50"
            hoverBgColorClass="hover:bg-indigo-100"
            textColorClass="text-indigo-700"
        >
            <UserManagement showMessage={showMessage} />
        </CollapsibleSection>
      )}

      {/* Import Data Section */}
      {user.role !== 'Viewer' && (
        <CollapsibleSection
          title="Import Data"
          icon={<Upload size={20} className="mr-2" />}
          isExpanded={isImportExpanded}
          setIsExpanded={setIsImportExpanded}
          bgColorClass="bg-blue-50"
          hoverBgColorClass="hover:bg-blue-100"
          textColorClass="text-blue-700"
        >
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entityTypes.map(entity => (
              <div key={`import-${entity.type}`} className="flex items-center justify-between p-3 border rounded-md bg-white">
                <span className="font-medium flex items-center">{entity.icon} {entity.name}</span>
                <label className="cursor-pointer px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
                  Import CSV
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileUpload(e, entity.type)} />
                </label>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Export Data Section */}
      <CollapsibleSection
        title="Export Data"
        icon={<Download size={20} className="mr-2" />}
        isExpanded={isExportExpanded}
        setIsExpanded={setIsExportExpanded}
        bgColorClass="bg-green-50"
        hoverBgColorClass="hover:bg-green-100"
        textColorClass="text-green-700"
      >
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entityTypes.map(entity => (
            <div key={`export-${entity.type}`} className="flex items-center justify-between p-3 border rounded-md bg-white">
              <span className="font-medium flex items-center">{entity.icon} {entity.name}</span>
              <button onClick={() => exportData(entity.type)} className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* PDF Management Section */}
      {user.role !== 'Viewer' && (
        <CollapsibleSection
          title="Manage PDF Templates"
          icon={<FileText size={20} className="mr-2" />}
          isExpanded={isPdfMgmtExpanded}
          setIsExpanded={setIsPdfMgmtExpanded}
          bgColorClass="bg-yellow-50"
          hoverBgColorClass="hover:bg-yellow-100"
          textColorClass="text-yellow-700"
        >
          <div className="p-6 space-y-4">
            {user.role === 'Admin' && (
                <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg">
                <label className="cursor-pointer flex flex-col items-center space-y-2 text-gray-600 hover:text-blue-600">
                    <Upload size={32} />
                    <span className="font-medium text-sm">Click to upload a PDF Template</span>
                    <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                </label>
                </div>
            )}
            {pdfTemplates.length > 0 ? (
              <ul className="space-y-2">
                {pdfTemplates.map(template => (
                  <li key={template.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
                    <span className="font-medium text-sm flex items-center"><FileText size={16} className="mr-2" />{template.original_filename}</span>
                    <div className="flex items-center space-x-2">
                      {defaultPdfId === template.id ? (
                        <span className="flex items-center text-green-600 text-sm font-semibold"><CheckCircle size={18} className="mr-1"/> Default</span>
                      ) : (
                        <button onClick={() => handleSetDefaultPdf(template.id)} className="p-1 text-gray-500 hover:text-green-600" title="Set as Default"><CheckCircle size={20} /></button>
                      )}
                      {defaultPdfId === template.id && (
                          <button onClick={() => handleSetDefaultPdf(null)} className="p-1 text-gray-500 hover:text-gray-700" title="Unset Default"><XCircle size={20} /></button>
                      )}
                      {user.role === 'Admin' && (
                        <button onClick={() => handleDeletePdfTemplate(template.id)} className="p-1 text-red-600 hover:text-red-800" title="Delete PDF"><Trash2 size={20} /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 text-sm">No PDF templates uploaded yet.</p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* System Log Section */}
      {user.role !== 'Viewer' && (
        <CollapsibleSection
          title="System Activity Log"
          icon={<Activity size={20} className="mr-2" />}
          isExpanded={isLogViewerExpanded}
          setIsExpanded={setIsLogViewerExpanded}
        >
          <SystemLogViewer showMessage={showMessage} />
        </CollapsibleSection>
      )}
    </div>
  );
}

export default SettingsPage;
