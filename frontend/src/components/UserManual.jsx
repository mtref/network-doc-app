// frontend/src/components/UserManual.jsx
// This component displays a user manual page for the application.

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, LogIn, Users, Shield, Link as LinkIcon, Laptop, Server, KeyRound, Settings, Download, Upload, FileText, Activity, Edit, Eye } from 'lucide-react';

const ManualSection = ({ title, icon, children }) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-200 flex items-center">
      {icon}
      <span className="ml-3">{title}</span>
    </h2>
    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
      {children}
    </div>
  </div>
);

const RoleCard = ({ title, icon, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 flex items-center mb-3">{icon}<span className="ml-2">{title}</span></h3>
        <p className="text-gray-600">{children}</p>
    </div>
);


const UserManual = () => {
    const { user } = useAuth();

    // A simple function to navigate back to the main app
    const goBack = () => {
        window.location.href = '/';
    };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900 ml-3">
                        Application User Manual
                    </h1>
                </div>
                <button
                    onClick={goBack}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to App
                </button>
            </div>
        </header>

        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <ManualSection title="Getting Started" icon={<LogIn size={32} className="text-blue-500" />}>
                    <p>Welcome! This guide will walk you through all the features and functionalities of the system. To begin, you must log in with the credentials provided by your administrator.</p>
                </ManualSection>

                <ManualSection title="Understanding User Roles" icon={<Users size={32} className="text-indigo-500" />}>
                    <p>The application has three distinct user roles, each with different permissions:</p>
                    <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <RoleCard title="Admin" icon={<Shield size={24} className="text-red-500" />}>
                            Full access to all features, including creating/editing all items, managing users, managing passwords, uploading templates, and reverting system logs.
                        </RoleCard>
                        <RoleCard title="Editor" icon={<Edit size={24} className="text-yellow-500" />}>
                            Can create, edit, and delete all network assets (Connections, PCs, Switches, etc.). Can view system logs but cannot revert actions or manage users.
                        </RoleCard>
                        <RoleCard title="Viewer" icon={<Eye size={24} className="text-green-500" />}>
                            Read-only access. Can view all network assets and their details but cannot create, edit, or delete anything. Cannot see Settings or Passwords.
                        </RoleCard>
                    </div>
                </ManualSection>

                <ManualSection title="Connections Tab" icon={<LinkIcon size={32} className="text-green-500" />}>
                    <p>This is the main dashboard where you manage how all your devices are connected. Adding or editing a connection is a two-step process:</p>
                    <ol className="list-decimal list-inside mt-4 space-y-2">
                        <li><strong>Select PC:</strong> Use the searchable dropdown to find an existing PC, or expand the "Create New PC" section to add one on the fly.</li>
                        <li><strong>Define Connection Path:</strong> Detail the connection's journey from the wall point, through any patch panels, to its final destination on a switch port.</li>
                    </ol>
                </ManualSection>

                <ManualSection title="Managing Assets" icon={<Laptop size={32} className="text-purple-500" />}>
                     <p>The <strong>PCs</strong>, <strong>Switches</strong>, <strong>Patch Panels</strong>, <strong>Locations</strong>, and <strong>Racks</strong> tabs all follow a similar, consistent layout:</p>
                     <ul className="list-disc list-inside mt-4 space-y-2">
                        <li><strong>Filter & Search:</strong> Use the search bar and filter dropdowns to quickly find any item.</li>
                        <li><strong>Add/Edit Form:</strong> A collapsible form at the top allows Admins and Editors to add or edit items.</li>
                        <li><strong>Item Cards:</strong> Each item is displayed on a card with its key information and relevant action buttons.</li>
                     </ul>
                </ManualSection>

                {user && user.role === 'Admin' && (
                    <ManualSection title="Password Manager" icon={<KeyRound size={32} className="text-gray-700" />}>
                        <p>This Admin-only tab provides a secure, centralized location to store credentials for network devices and services. All passwords are encrypted in the database.</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li>Click the 👁️ (Eye) icon to temporarily view a password. This action is logged.</li>
                            <li>Click the 📋 (Clipboard) icon to copy a revealed password.</li>
                        </ul>
                    </ManualSection>
                )}

                {user && user.role !== 'Viewer' && (
                    <ManualSection title="Settings" icon={<Settings size={32} className="text-gray-500" />}>
                        <p>This page provides administrative functions. The options you see depend on your role.</p>
                        <ul className="list-disc list-inside mt-4 space-y-2">
                            <li><strong>User Management (Admin Only):</strong> Create, edit, and delete user accounts and assign roles.</li>
                            <li><strong>Data Import (Admin Only):</strong> Upload CSV files to bulk-add items.</li>
                            <li><strong>Data Export:</strong> Download a complete CSV file of all items in a category.</li>
                            <li><strong>PDF Template Management:</strong> Upload and manage PDF templates for printing.</li>
                            <li><strong>System Activity Log:</strong> View a complete audit trail of all actions performed in the system. Admins can revert changes from this log.</li>
                        </ul>
                    </ManualSection>
                )}
            </div>
        </main>
    </div>
  );
};

export default UserManual;
