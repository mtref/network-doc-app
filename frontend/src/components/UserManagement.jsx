// frontend/src/components/UserManagement.jsx
// This component provides a UI for Admins to manage users (CRUD operations).

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, PlusCircle, Edit, Trash2, Shield, KeyRound, UserPlus } from 'lucide-react';

const UserManagement = ({ showMessage }) => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');

  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api('users');
      setUsers(data);
    } catch (error) {
      showMessage(`Error fetching users: ${error.message}`, 5000);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('Viewer');
  };

  const handleEditClick = (userToEdit) => {
    setEditingUser(userToEdit);
    setUsername(userToEdit.username);
    setRole(userToEdit.role);
    setPassword(''); // Clear password field for security
  };

  const handleDeleteClick = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api(`users/${userId}`, { method: 'DELETE' });
        showMessage('User deleted successfully.');
        fetchUsers();
      } catch (error) {
        showMessage(`Error deleting user: ${error.message}`, 5000);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showMessage('Username is required.', 3000);
      return;
    }
    if (!editingUser && !password) {
        showMessage('Password is required for new users.', 3000);
        return;
    }

    const userData = { username, role };
    if (password) {
      userData.password = password;
    }

    try {
      if (editingUser) {
        await api(`users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(userData),
        });
        showMessage('User updated successfully.');
      } else {
        await api('users', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
        showMessage('User created successfully.');
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      showMessage(`Error saving user: ${error.message}`, 5000);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Users className="mr-3 text-indigo-500" /> User Management
      </h3>

      {/* Add/Edit User Form */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg bg-gray-50 space-y-4">
        <h4 className="text-lg font-semibold text-gray-700 flex items-center">
            {editingUser ? <Edit className="mr-2" /> : <UserPlus className="mr-2" />}
            {editingUser ? `Editing: ${editingUser.username}` : 'Add New User'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder={editingUser ? 'Leave blank to keep unchanged' : ''}
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
        </div>
        <div className="flex justify-end space-x-3">
            {editingUser && (
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                    Cancel Edit
                </button>
            )}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {editingUser ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>

      {/* Users List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Editor' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                        {user.role}
                    </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit User">
                    <Edit size={18} />
                  </button>
                  {currentUser.id !== user.id && (
                    <button onClick={() => handleDeleteClick(user.id)} className="text-red-600 hover:text-red-900" title="Delete User">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
