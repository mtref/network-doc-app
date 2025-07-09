// frontend/src/components/UserFormModal.jsx
// This component provides a modal form for creating and editing users.

import React, { useState, useEffect } from 'react';
import { XCircle, UserPlus, Edit } from 'lucide-react';

const UserFormModal = ({ isOpen, onClose, onSave, userToEdit, showMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setRole(userToEdit.role);
      setPassword(''); // Always clear password for security
    } else {
      setUsername('');
      setPassword('');
      setRole('Viewer');
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showMessage('Username is required.', 3000);
      return;
    }
    if (!userToEdit && !password) {
      showMessage('Password is required for new users.', 3000);
      return;
    }

    const userData = { username, role };
    if (password) {
      userData.password = password;
    }
    
    onSave(userData, userToEdit ? userToEdit.id : null);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            {userToEdit ? <Edit className="mr-2" /> : <UserPlus className="mr-2" />}
            {userToEdit ? 'Edit User' : 'Add New User'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XCircle size={24} className="text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userToEdit ? 'Leave blank to keep unchanged' : ''}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {userToEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
