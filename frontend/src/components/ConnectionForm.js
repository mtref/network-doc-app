// frontend/src/components/ConnectionForm.js
// This component provides forms to add new PCs, Patch Panels, Servers,
// and to create or edit network connections between them.

import React, { useState, useEffect } from 'react';

function ConnectionForm({ pcs, patchPanels, servers, onAddConnection, onUpdateConnection, editingConnection, setEditingConnection, onAddEntity }) {
  const [pcId, setPcId] = useState('');
  const [patchPanelId, setPatchPanelId] = useState('');
  const [patchPanelPort, setPatchPanelPort] = useState('');
  const [serverId, setServerId] = useState('');
  const [serverPort, setServerPort] = useState('');

  // State for new entity forms (PC, Patch Panel, Server)
  const [newPcName, setNewPcName] = useState('');
  const [newPcIp, setNewPcIp] = useState(''); // New state for PC IP address
  const [newPcDesc, setNewPcDesc] = useState('');
  const [newPpName, setNewPpName] = useState('');
  const [newPpLocation, setNewPpLocation] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerIp, setNewServerIp] = useState('');
  const [newServerLocation, setNewServerLocation] = useState('');

  // Populate form fields if editing an existing connection
  useEffect(() => {
    if (editingConnection) {
      setPcId(editingConnection.pc?.id || '');
      setPatchPanelId(editingConnection.patch_panel?.id || '');
      setPatchPanelPort(editingConnection.patch_panel_port || '');
      setServerId(editingConnection.server?.id || '');
      setServerPort(editingConnection.server_port || '');
    } else {
      // Clear form if not editing
      setPcId('');
      setPatchPanelId('');
      setPatchPanelPort('');
      setServerId('');
      setServerPort('');
    }
  }, [editingConnection]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const connectionData = {
      pc_id: parseInt(pcId),
      patch_panel_id: parseInt(patchPanelId),
      patch_panel_port: patchPanelPort,
      server_id: parseInt(serverId),
      server_port: serverPort,
    };

    if (editingConnection) {
      onUpdateConnection(editingConnection.id, connectionData);
    } else {
      onAddConnection(connectionData);
    }
    // Clear form fields after submission
    setPcId('');
    setPatchPanelId('');
    setPatchPanelPort('');
    setServerId('');
    setServerPort('');
    setEditingConnection(null); // Ensure editing state is cleared
  };

  const handleCancelEdit = () => {
    setEditingConnection(null);
    // Also clear the form fields
    setPcId('');
    setPatchPanelId('');
    setPatchPanelPort('');
    setServerId('');
    setServerPort('');
  };

  const handleAddPc = (e) => {
    e.preventDefault();
    if (newPcName.trim()) {
      onAddEntity('pcs', { name: newPcName, ip_address: newPcIp, description: newPcDesc }); // Pass newPcIp
      setNewPcName('');
      setNewPcIp(''); // Clear IP field
      setNewPcDesc('');
    }
  };

  const handleAddPp = (e) => {
    e.preventDefault();
    if (newPpName.trim()) {
      onAddEntity('patch_panels', { name: newPpName, location: newPpLocation });
      setNewPpName('');
      setNewPpLocation('');
    }
  };

  const handleAddServer = (e) => {
    e.preventDefault();
    if (newServerName.trim()) {
      onAddEntity('servers', { name: newServerName, ip_address: newServerIp, location: newServerLocation });
      setNewServerName('');
      setNewServerIp('');
      setNewServerLocation('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Forms to Add New Entities (PC, Patch Panel, Server) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New PC Form */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New PC</h3>
          <form onSubmit={handleAddPc} className="space-y-3">
            <input
              type="text"
              placeholder="PC Name"
              value={newPcName}
              onChange={(e) => setNewPcName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (Optional)"
              value={newPcIp}
              onChange={(e) => setNewPcIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Description (Optional)"
              value={newPcDesc}
              onChange={(e) => setNewPcDesc(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white p-2 rounded-md hover:bg-indigo-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add PC
            </button>
          </form>
        </div>

        {/* Add New Patch Panel Form */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Patch Panel</h3>
          <form onSubmit={handleAddPp} className="space-y-3">
            <input
              type="text"
              placeholder="Patch Panel Name"
              value={newPpName}
              onChange={(e) => setNewPpName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Location (Optional)"
              value={newPpLocation}
              onChange={(e) => setNewPpLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Patch Panel
            </button>
          </form>
        </div>

        {/* Add New Server Form */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Add New Server</h3>
          <form onSubmit={handleAddServer} className="space-y-3">
            <input
              type="text"
              placeholder="Server Name"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="IP Address (Optional)"
              value={newServerIp}
              onChange={(e) => setNewServerIp(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Location (Optional)"
              value={newServerLocation}
              onChange={(e) => setNewServerLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Add Server
            </button>
          </form>
        </div>
      </div>

      {/* Connection Form */}
      <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md border border-blue-200">
        <h3 className="text-xl font-bold text-blue-700 text-center">
          {editingConnection ? 'Edit Existing Connection' : 'Create New Connection'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PC Selection */}
          <div>
            <label htmlFor="pc-select" className="block text-sm font-medium text-gray-700 mb-1">Select PC:</label>
            <select
              id="pc-select"
              value={pcId}
              onChange={(e) => setPcId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a PC --</option>
              {pcs.map((pc) => (
                <option key={pc.id} value={pc.id}>
                  {pc.name} ({pc.ip_address || 'No IP'})
                </option>
              ))}
            </select>
            {pcs.length === 0 && <p className="text-sm text-red-500 mt-1">Please add a PC first.</p>}
          </div>

          {/* Patch Panel Selection */}
          <div>
            <label htmlFor="patch-panel-select" className="block text-sm font-medium text-gray-700 mb-1">Select Patch Panel:</label>
            <select
              id="patch-panel-select"
              value={patchPanelId}
              onChange={(e) => setPatchPanelId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a Patch Panel --</option>
              {patchPanels.map((pp) => (
                <option key={pp.id} value={pp.id}>
                  {pp.name} ({pp.location})
                </option>
              ))}
            </select>
            {patchPanels.length === 0 && <p className="text-sm text-red-500 mt-1">Please add a Patch Panel first.</p>}
          </div>

          {/* Patch Panel Port Input */}
          <div>
            <label htmlFor="pp-port" className="block text-sm font-medium text-gray-700 mb-1">Patch Panel Port:</label>
            <input
              id="pp-port"
              type="text"
              placeholder="e.g., Port 1, A12"
              value={patchPanelPort}
              onChange={(e) => setPatchPanelPort(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Server Selection */}
          <div>
            <label htmlFor="server-select" className="block text-sm font-medium text-gray-700 mb-1">Select Server:</label>
            <select
              id="server-select"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a Server --</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} ({server.ip_address})
                </option>
              ))}
            </select>
            {servers.length === 0 && <p className="text-sm text-red-500 mt-1">Please add a Server first.</p>}
          </div>

          {/* Server Port Input */}
          <div>
            <label htmlFor="server-port" className="block text-sm font-medium text-gray-700 mb-1">Server Port:</label>
            <input
              id="server-port"
              type="text"
              placeholder="e.g., Eth0/1, GigaPort-03"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Action Buttons for Connection Form */}
        <div className="flex justify-end space-x-3 mt-6">
          {editingConnection && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors duration-200"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {editingConnection ? 'Update Connection' : 'Add Connection'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ConnectionForm;
