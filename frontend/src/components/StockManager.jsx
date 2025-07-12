// frontend/src/components/StockManager.jsx
// This is a new component to manage stock and resources.
// It features a dashboard, a filterable table, and a modal for CRUD operations.

import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Edit, Trash2, Filter, Package, PackageCheck, PackageX, Wrench, Laptop, Monitor, HardDrive, Keyboard, Mouse, Search } from 'lucide-react';

// Helper to get an icon based on item type
const getItemIcon = (itemType) => {
    const lowerType = itemType.toLowerCase();
    if (lowerType.includes('pc') || lowerType.includes('laptop')) return <Laptop className="mr-2 text-gray-500" />;
    if (lowerType.includes('monitor')) return <Monitor className="mr-2 text-gray-500" />;
    if (lowerType.includes('disk') || lowerType.includes('hdd') || lowerType.includes('ssd')) return <HardDrive className="mr-2 text-gray-500" />;
    if (lowerType.includes('keyboard')) return <Keyboard className="mr-2 text-gray-500" />;
    if (lowerType.includes('mouse')) return <Mouse className="mr-2 text-gray-500" />;
    return <Package className="mr-2 text-gray-500" />;
};

// Form Modal for Adding/Editing Stock Items
const StockFormModal = ({ isOpen, onClose, onSave, item, pcs, showMessage }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (item) {
            setFormData({ ...item, purchase_date: item.purchase_date || '' });
        } else {
            setFormData({
                item_type: 'PC',
                name: '',
                serial_number: '',
                status: 'In Stock',
                quantity: 1,
                notes: '',
                purchase_date: '',
                assigned_to_pc_id: ''
            });
        }
    }, [item, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.item_type) {
            showMessage("Item Name and Type are required.", 3000);
            return;
        }
        onSave(formData, item?.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-bold mb-4">{item ? 'Edit Stock Item' : 'Add New Stock Item'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Item Name (e.g., Dell XPS 15)" className="p-2 border rounded" required />
                            <input name="item_type" value={formData.item_type || ''} onChange={handleChange} placeholder="Item Type (e.g., Laptop)" className="p-2 border rounded" required />
                            <input name="serial_number" value={formData.serial_number || ''} onChange={handleChange} placeholder="Serial Number" className="p-2 border rounded" />
                            <input name="quantity" type="number" value={formData.quantity || 1} onChange={handleChange} placeholder="Quantity" className="p-2 border rounded" min="1" />
                            <select name="status" value={formData.status || 'In Stock'} onChange={handleChange} className="p-2 border rounded">
                                <option>In Stock</option>
                                <option>In Use</option>
                                <option>Defective</option>
                                <option>Retired</option>
                            </select>
                            <select name="assigned_to_pc_id" value={formData.assigned_to_pc_id || ''} onChange={handleChange} className="p-2 border rounded" disabled={formData.status !== 'In Use'}>
                                <option value="">Assign to PC (Optional)</option>
                                {pcs.map(pc => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
                            </select>
                            <input name="purchase_date" type="date" value={formData.purchase_date || ''} onChange={handleChange} className="p-2 border rounded md:col-span-2" />
                            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Notes" className="p-2 border rounded md:col-span-2" rows="3"></textarea>
                        </div>
                    </div>
                    <div className="bg-gray-100 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{item ? 'Update' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// Main Component
const StockManager = ({ showMessage, pcs }) => {
    const [stockItems, setStockItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ item_type: 'all', status: 'all' });
    const { user } = useAuth();

    const canEdit = user && (user.role === 'Admin' || user.role === 'Editor');

    const fetchStockItems = async () => {
        setLoading(true);
        try {
            const data = await api.get('stock_items');
            setStockItems(data);
        } catch (error) {
            showMessage(`Error fetching stock items: ${error.message}`, 5000);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStockItems();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let items = stockItems;
        if (searchTerm) {
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filters.item_type !== 'all') {
            items = items.filter(item => item.item_type === filters.item_type);
        }
        if (filters.status !== 'all') {
            items = items.filter(item => item.status === filters.status);
        }
        setFilteredItems(items);
    }, [searchTerm, filters, stockItems]);

    const handleSave = async (formData, itemId) => {
        try {
            if (itemId) {
                await api.put(`stock_items/${itemId}`, formData);
                showMessage('Stock item updated successfully.');
            } else {
                await api.post('stock_items', formData);
                showMessage('Stock item added successfully.');
            }
            setIsModalOpen(false);
            fetchStockItems();
        } catch (error) {
            showMessage(`Error saving stock item: ${error.message}`, 5000);
        }
    };

    const handleDelete = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this stock item?')) {
            try {
                await api.delete(`stock_items/${itemId}`);
                showMessage('Stock item deleted successfully.');
                fetchStockItems();
            } catch (error) {
                showMessage(`Error deleting stock item: ${error.message}`, 5000);
            }
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const uniqueItemTypes = useMemo(() => [...new Set(stockItems.map(item => item.item_type))], [stockItems]);
    const dashboardStats = useMemo(() => {
        const total = stockItems.reduce((acc, item) => acc + item.quantity, 0);
        const inStock = stockItems.filter(i => i.status === 'In Stock').reduce((acc, item) => acc + item.quantity, 0);
        const inUse = stockItems.filter(i => i.status === 'In Use').reduce((acc, item) => acc + item.quantity, 0);
        const defective = stockItems.filter(i => i.status === 'Defective').reduce((acc, item) => acc + item.quantity, 0);
        return { total, inStock, inUse, defective };
    }, [stockItems]);

    return (
        <div className="space-y-6">
            <StockFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                item={editingItem}
                pcs={pcs}
                showMessage={showMessage}
            />

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg shadow"><h4 className="font-bold text-blue-800">Total Items</h4><p className="text-3xl font-bold text-blue-900">{dashboardStats.total}</p></div>
                <div className="bg-green-100 p-4 rounded-lg shadow"><h4 className="font-bold text-green-800">In Stock</h4><p className="text-3xl font-bold text-green-900">{dashboardStats.inStock}</p></div>
                <div className="bg-yellow-100 p-4 rounded-lg shadow"><h4 className="font-bold text-yellow-800">In Use</h4><p className="text-3xl font-bold text-yellow-900">{dashboardStats.inUse}</p></div>
                <div className="bg-red-100 p-4 rounded-lg shadow"><h4 className="font-bold text-red-800">Defective</h4><p className="text-3xl font-bold text-red-900">{dashboardStats.defective}</p></div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-500" />
                    <select name="item_type" onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
                        <option value="all">All Types</option>
                        {uniqueItemTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <select name="status" onChange={handleFilterChange} className="p-2 border rounded-md text-sm">
                        <option value="all">All Statuses</option>
                        <option>In Stock</option>
                        <option>In Use</option>
                        <option>Defective</option>
                        <option>Retired</option>
                    </select>
                </div>
                <div className="relative flex-grow max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input type="text" placeholder="Search by name or S/N..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border rounded-md" />
                </div>
                {canEdit && (
                    <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">
                        <PlusCircle size={18} className="mr-2" /> Add Stock Item
                    </button>
                )}
            </div>

            {/* Stock Items Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S/N</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-8">Loading...</td></tr>
                        ) : filteredItems.map(item => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getItemIcon(item.item_type)}
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500">{item.item_type}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.serial_number || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                                        item.status === 'In Use' ? 'bg-yellow-100 text-yellow-800' :
                                        item.status === 'Defective' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.assigned_to_pc_name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {canEdit && (
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                        </div>
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

export default StockManager;
