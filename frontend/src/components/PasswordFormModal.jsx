// frontend/src/components/PasswordFormModal.jsx
// This component provides a modal form for creating and editing password entries.

import React, { useState, useEffect } from 'react';
import { XCircle, UserPlus, Edit, KeyRound } from 'lucide-react';

const PasswordFormModal = ({ isOpen, onClose, onSave, editingEntry, showMessage }) => {
  const [service, setService] = useState('');
  const [serverOrUrl, setServerOrUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen && editingEntry) {
      setService(editingEntry.service || '');
      setServerOrUrl(editingEntry.server_or_url || '');
      setUsername(editingEntry.username || '');
      // For edits, the password field is for entering a *new* password.
      // The existing password is not displayed for security.
      setPassword('');
    } else if (isOpen && !editingEntry) {
      // Reset form for new entry
      setService('');
      setServerOrUrl('');
      setUsername('');
      setPassword('');
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!service.trim()) {
      showMessage('Service name is required.', 3000);
      return;
    }
    if (!editingEntry && !password) {
      showMessage('Password is required for a new entry.', 3000);
      return;
    }

    const formData = { service, server_or_url: serverOrUrl, username, password };
    onSave(formData, editingEntry ? editingEntry.id : null);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            {editingEntry ? <Edit className="mr-2" /> : <KeyRound className="mr-2" />}
            {editingEntry ? 'Edit Password Entry' : 'Add New Password Entry'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XCircle size={24} className="text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700">Service / Application</label>
            <input
              id="service"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., Firewall, Router-Main, Office 365"
              required
            />
          </div>
          <div>
            <label htmlFor="server_or_url" className="block text-sm font-medium text-gray-700">Server / URL</label>
            <input
              id="server_or_url"
              type="text"
              value={serverOrUrl}
              onChange={(e) => setServerOrUrl(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., 192.168.1.1, login.microsoft.com"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., admin, user@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingEntry ? 'Leave blank to keep unchanged' : ''}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              autoComplete="new-password"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordFormModal;
