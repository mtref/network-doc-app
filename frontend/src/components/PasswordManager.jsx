// frontend/src/components/PasswordManager.jsx
// This component provides the main UI for the Password Manager feature.
// UPDATED: Replaced navigator.clipboard with a more compatible copy-to-clipboard method.

import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import SearchBar from "./SearchBar";
import PasswordFormModal from "./PasswordFormModal";
import {
  KeyRound,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Clipboard,
} from "lucide-react";

const PasswordManager = ({ showMessage }) => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const fetchEntries = useCallback(async () => {
    try {
      const data = await api("passwords");
      setEntries(data);
    } catch (error) {
      showMessage(`Error fetching passwords: ${error.message}`, 5000);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = entries.filter(
      (entry) =>
        (entry.service || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (entry.server_or_url || "")
          .toLowerCase()
          .includes(lowerCaseSearchTerm) ||
        (entry.username || "").toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleAddClick = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleEditClick = async (entry) => {
    try {
      const fullEntry = await api(`passwords/${entry.id}`);
      setEditingEntry(fullEntry);
      setIsModalOpen(true);
    } catch (error) {
      showMessage(`Error fetching password details: ${error.message}`, 5000);
    }
  };

  const handleDeleteClick = async (entryId) => {
    if (
      window.confirm("Are you sure you want to delete this password entry?")
    ) {
      try {
        await api(`passwords/${entryId}`, { method: "DELETE" });
        showMessage("Entry deleted successfully.");
        fetchEntries();
      } catch (error) {
        showMessage(`Error deleting entry: ${error.message}`, 5000);
      }
    }
  };

  const handleSave = async (formData, entryId) => {
    try {
      if (entryId) {
        await api(`passwords/${entryId}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        showMessage("Entry updated successfully.");
      } else {
        await api("passwords", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        showMessage("Entry created successfully.");
      }
      setIsModalOpen(false);
      fetchEntries();
    } catch (error) {
      showMessage(`Error saving entry: ${error.message}`, 5000);
    }
  };

  const togglePasswordVisibility = async (entryId) => {
    if (revealedPasswords[entryId]) {
      setRevealedPasswords((prev) => ({ ...prev, [entryId]: null }));
      return;
    }
    try {
      const entry = await api(`passwords/${entryId}`);
      setRevealedPasswords((prev) => ({ ...prev, [entryId]: entry.password }));
    } catch (error) {
      showMessage(`Could not retrieve password: ${error.message}`, 5000);
    }
  };

  // CORRECTED: Use document.execCommand for broader compatibility
  const copyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        showMessage("Copied to clipboard!", 2000);
      } else {
        showMessage("Failed to copy.", 3000);
      }
    } catch (err) {
      showMessage("Failed to copy.", 3000);
      console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <PasswordFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingEntry={editingEntry}
        showMessage={showMessage}
      />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <KeyRound className="mr-3 text-gray-500" /> Password Manager
        </h3>
        <button
          onClick={handleAddClick}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
        >
          <PlusCircle size={18} className="mr-2" />
          Add New Entry
        </button>
      </div>

      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Server / URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.service}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.server_or_url}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      {revealedPasswords[entry.id]
                        ? revealedPasswords[entry.id]
                        : "••••••••"}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      title={revealedPasswords[entry.id] ? "Hide" : "Show"}
                    >
                      {revealedPasswords[entry.id] ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    {revealedPasswords[entry.id] && (
                      <button
                        onClick={() =>
                          copyToClipboard(revealedPasswords[entry.id])
                        }
                        title="Copy"
                      >
                        <Clipboard size={16} />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditClick(entry)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edit Entry"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(entry.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PasswordManager;
