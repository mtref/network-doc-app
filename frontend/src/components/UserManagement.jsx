// frontend/src/components/UserManagement.jsx
// This component provides a UI for Admins to manage users (CRUD operations).
// UPDATED: All API calls have been corrected to use the new service methods (api.get, api.post, etc.).

import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserFormModal from './UserFormModal';
import { Users, Edit, Trash2, UserPlus } from 'lucide-react';

const UserManagement = ({ showMessage }) => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      // CORRECTED: Use api.get() to fetch the list of users.
      const data = await api.get('users');
      setUsers(data);
    } catch (error) {
      showMessage(`Error fetching users: ${error.message}`, 5000);
    }
  }, [showMessage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (userToEdit = null) => {
    setEditingUser(userToEdit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSaveUser = async (userData, userId) => {
    try {
      if (userId) {
        // CORRECTED: Use api.put() to update an existing user.
        await api.put(`users/${userId}`, userData);
        showMessage('User updated successfully.');
      } else {
        // CORRECTED: Use api.post() to create a new user.
        await api.post('users', userData);
        showMessage('User created successfully.');
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      showMessage(`Error saving user: ${error.message}`, 5000);
    }
  };

  const handleDeleteClick = async (userId) => {
    // Using window.confirm for simplicity, but a custom modal would be better for UX.
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // CORRECTED: Use api.delete() to remove a user.
        await api.delete(`users/${userId}`);
        showMessage('User deleted successfully.');
        fetchUsers();
      } catch (error) {
        showMessage(`Error deleting user: ${error.message}`, 5000);
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        userToEdit={editingUser}
        showMessage={showMessage}
      />
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="mr-3 text-indigo-500" /> User Accounts
        </h3>
        <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
        >
          <UserPlus size={18} className="mr-2" />
          Add New User
        </button>
      </div>

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
                  <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit User">
                    <Edit size={18} />
                  </button>
                  {currentUser && currentUser.id !== user.id && (
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
