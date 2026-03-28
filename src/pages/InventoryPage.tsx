import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Package, Apple, Search, Check, X, Filter } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { PageHeader } from '../components/layout/PageHeader';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { parseShoppingItem } from '../utils/shoppingItems';

interface InventoryPageProps {
  onMenuClick: () => void;
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'ingredient' | 'supply';
  quantity?: string;
  unit?: string;
  location?: string;
  purchasedOn?: string;
  notes?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export const InventoryPage = ({ onMenuClick }: InventoryPageProps) => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'supplies'>('ingredients');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    location: '',
    purchasedOn: '',
    notes: ''
  });
  const [smartInput, setSmartInput] = useState('');
  const [useSmartInput, setUseSmartInput] = useState(true);

  // Common units for ingredients and supplies
  const commonUnits = {
    ingredients: ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'L', 'pieces', 'cans', 'bottles', 'bags'],
    supplies: ['pieces', 'rolls', 'boxes', 'packs', 'sets', 'bottles', 'tubes', 'sheets']
  };

  // Location options for filtering and forms
  const locationOptions = {
    ingredients: ['Freezer', 'Refrigerator', 'Pantry'],
    supplies: ['Pantry', 'Closet', 'Washroom']
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'inventory'),
      where('userId', '==', user.uid),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
      setItems(inventoryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
    });

    return unsubscribe;
  }, [user]);

  const filteredItems = items.filter(item => {
    const matchesTab = item.category === (activeTab === 'ingredients' ? 'ingredient' : 'supply');
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || item.location === locationFilter;
    return matchesTab && matchesSearch && matchesLocation;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !user) return;

    try {
      const itemData: any = {
        name: formData.name.trim(),
        category: activeTab === 'ingredients' ? 'ingredient' : 'supply',
        userId: user.uid,
        updatedAt: Timestamp.now()
      };

      // Only add optional fields if they have values
      if (formData.quantity.trim()) {
        itemData.quantity = formData.quantity.trim();
      }
      if (formData.unit.trim()) {
        itemData.unit = formData.unit.trim();
      }
      if (formData.location.trim()) {
        itemData.location = formData.location.trim();
      }
      if (formData.purchasedOn) {
        itemData.purchasedOn = formData.purchasedOn;
      }
      if (formData.notes.trim()) {
        itemData.notes = formData.notes.trim();
      }

      if (editingItem) {
        await updateDoc(doc(db, 'inventory', editingItem.id), itemData);
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...itemData,
          createdAt: Timestamp.now()
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error handling inventory item:', error);
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'inventory');
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'inventory', item.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'inventory/' + item.id);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity || '',
      unit: item.unit || '',
      location: item.location || '',
      purchasedOn: item.purchasedOn || '',
      notes: item.notes || ''
    });
    // Initialize smart input with existing item data
    const smartValue = [item.quantity, item.unit, item.name].filter(Boolean).join(' ');
    setSmartInput(smartValue);
    setUseSmartInput(true);
    setIsAddingItem(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: '',
      unit: '',
      location: '',
      purchasedOn: '',
      notes: ''
    });
    setSmartInput('');
    setUseSmartInput(true);
    setIsAddingItem(false);
    setEditingItem(null);
  };

  // Reset location filter when switching tabs
  const handleTabSwitch = (tab: 'ingredients' | 'supplies') => {
    setActiveTab(tab);
    setLocationFilter('all');
    setSearchQuery('');
    setShowFilterDropdown(false);
  };

  // Handle filter selection
  const handleLocationFilterSelect = (location: string) => {
    setLocationFilter(location);
    setShowFilterDropdown(false);
  };

  // Handle smart input parsing on blur or Enter key
  const handleSmartInputParse = () => {
    if (activeTab !== 'ingredients') return; // Only parse for ingredients
    
    const value = smartInput.trim();
    if (value) {
      const parsed = parseShoppingItem(value);
      setFormData(prev => ({
        ...prev,
        name: parsed.name,
        quantity: parsed.amount,
        unit: parsed.unit
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        quantity: '',
        unit: ''
      }));
    }
  };

  // Handle key down for Enter key parsing
  const handleSmartKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSmartInputParse();
    }
  };

  // Toggle between smart input and individual fields
  const toggleInputMode = () => {
    if (useSmartInput) {
      // Switching to individual fields - update smart input with current values
      const smartValue = [formData.quantity, formData.unit, formData.name].filter(Boolean).join(' ');
      setSmartInput(smartValue);
    }
    setUseSmartInput(!useSmartInput);
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <PageHeader title="Inventory" onMenuClick={onMenuClick} />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Package size={64} className="mx-auto mb-6 text-m3-on-surface-variant/30" />
            <p className="text-xl font-bold text-m3-on-surface-variant">Please sign in to manage your inventory</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <PageHeader title="Inventory" onMenuClick={onMenuClick} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 lg:mb-12">
            <h2 className="text-4xl font-black text-m3-on-surface tracking-tight mb-2">Inventory</h2>
            <p className="text-m3-on-surface-variant font-medium">Track your ingredients and kitchen supplies.</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-m3-on-surface-variant/50" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-[20px] outline-none focus:border-m3-primary font-medium"
              />
            </div>

            {/* Filter Icon */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`p-3 rounded-full hover:bg-m3-surface-variant/30 transition-all relative ${
                  locationFilter !== 'all' ? 'text-m3-primary' : 'text-m3-on-surface-variant'
                }`}
                title={locationFilter === 'all' ? 'Filter by Location' : `Filtered by: ${locationFilter}`}
              >
                <Filter size={20} />
                {locationFilter !== 'all' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-m3-primary rounded-full" />
                )}
              </button>

              {/* Filter Dropdown */}
              <AnimatePresence>
                {showFilterDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowFilterDropdown(false)}
                    />
                    
                    {/* Dropdown Content */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute top-full mt-2 right-0 bg-m3-surface border border-m3-outline/20 rounded-[16px] shadow-lg z-50 min-w-48 overflow-hidden"
                    >
                      <div className="p-2">
                        <button
                          onClick={() => handleLocationFilterSelect('all')}
                          className={`w-full text-left px-3 py-2 rounded-[12px] text-sm font-medium transition-all ${
                            locationFilter === 'all'
                              ? 'bg-m3-primary/10 text-m3-primary'
                              : 'text-m3-on-surface hover:bg-m3-surface-variant/30'
                          }`}
                        >
                          All Locations
                        </button>
                        
                        <div className="border-t border-m3-outline/10 my-2" />
                        
                        {locationOptions[activeTab as keyof typeof locationOptions].map((location) => (
                          <button
                            key={location}
                            onClick={() => handleLocationFilterSelect(location)}
                            className={`w-full text-left px-3 py-2 rounded-[12px] text-sm font-medium transition-all ${
                              locationFilter === location
                                ? 'bg-m3-primary/10 text-m3-primary'
                                : 'text-m3-on-surface hover:bg-m3-surface-variant/30'
                            }`}
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 bg-m3-surface-variant/20 p-1 rounded-[20px]">
              <button
                onClick={() => handleTabSwitch('ingredients')}
                className={`flex-1 px-6 py-3 rounded-[16px] text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ingredients'
                    ? 'bg-m3-primary text-m3-on-primary shadow-md'
                    : 'text-m3-on-surface-variant hover:bg-m3-surface-variant/30'
                }`}
              >
                <Apple size={16} />
                Ingredients
              </button>
              <button
                onClick={() => handleTabSwitch('supplies')}
                className={`flex-1 px-6 py-3 rounded-[16px] text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'supplies'
                    ? 'bg-m3-primary text-m3-on-primary shadow-md'
                    : 'text-m3-on-surface-variant hover:bg-m3-surface-variant/30'
                }`}
              >
                <Package size={16} />
                Supplies
              </button>
            </div>
          </div>

          {/* Items Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  className="bg-m3-surface border border-m3-outline/10 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-black text-lg text-m3-on-surface truncate flex-1 mr-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-2 text-m3-on-surface-variant/40 hover:text-m3-primary rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-m3-on-surface-variant/40 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {item.quantity && (
                      <div className="flex items-center gap-2">
                        <span className="text-m3-on-surface-variant/60">Quantity:</span>
                        <span className="font-bold text-m3-on-surface">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-m3-on-surface-variant/60">Location:</span>
                        <span className="font-medium text-m3-on-surface">{item.location}</span>
                      </div>
                    )}
                    {item.purchasedOn && (
                      <div className="flex items-center gap-2">
                        <span className="text-m3-on-surface-variant/60">Purchased:</span>
                        <span className="font-medium text-m3-on-surface">
                          {new Date(item.purchasedOn).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="pt-2">
                        <p className="text-m3-on-surface-variant/80 text-xs italic line-clamp-2">
                          {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-m3-surface-variant/10 rounded-[32px] border-2 border-dashed border-m3-outline/20">
              <div className="w-24 h-24 bg-m3-surface-variant/30 text-m3-on-surface-variant/40 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'ingredients' ? <Apple size={48} /> : <Package size={48} />}
              </div>
              <h3 className="text-2xl font-bold text-m3-on-surface mb-3">
                No {activeTab} found
              </h3>
              <p className="text-m3-on-surface-variant font-medium">
                {searchQuery || locationFilter !== 'all'
                  ? `No ${activeTab} match your filters.`
                  : `Start by adding your first ${activeTab === 'ingredients' ? 'ingredient' : 'supply'}!`
                }
              </p>
            </div>
          )}

          {/* Add/Edit Modal */}
          <AnimatePresence>
            {isAddingItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={(e) => {
                  if (e.target === e.currentTarget) resetForm();
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-m3-surface rounded-[32px] p-6 lg:p-8 w-full max-w-lg shadow-xl border border-m3-outline/10"
                >
                  <h3 className="text-2xl font-black text-m3-on-surface mb-6">
                    {editingItem ? 'Edit' : 'Add'} {activeTab === 'ingredients' ? 'Ingredient' : 'Supply'}
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Smart Input for Ingredients */}
                    {activeTab === 'ingredients' && useSmartInput ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-bold text-m3-on-surface-variant">
                            Ingredient *
                          </label>
                          <button
                            type="button"
                            onClick={toggleInputMode}
                            className="text-xs text-m3-primary font-bold hover:text-m3-primary/80"
                          >
                            Individual Fields
                          </button>
                        </div>
                        <input
                          autoFocus
                          type="text"
                          placeholder="e.g. 1 bottle olive oil"
                          value={smartInput}
                          onChange={(e) => setSmartInput(e.target.value)}
                          onBlur={handleSmartInputParse}
                          onKeyDown={handleSmartKeyDown}
                          className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                          required
                        />
                        <p className="text-xs text-m3-on-surface-variant/60 mt-1">
                          Type ingredient with quantity & unit (e.g. "1 bottle olive oil"). Press Enter or click away to parse.
                        </p>
                        
                        {/* Show parsed values */}
                        {(formData.name || formData.quantity || formData.unit) && (
                          <div className="mt-3 p-3 bg-m3-surface-variant/10 rounded-xl">
                            <div className="text-xs text-m3-on-surface-variant/60 mb-1">Parsed:</div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-m3-on-surface-variant/60">Quantity</div>
                                <div className="font-medium">{formData.quantity || 'None'}</div>
                              </div>
                              <div>
                                <div className="text-m3-on-surface-variant/60">Unit</div>
                                <div className="font-medium">{formData.unit || 'None'}</div>
                              </div>
                              <div>
                                <div className="text-m3-on-surface-variant/60">Name</div>
                                <div className="font-medium">{formData.name || 'None'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Individual Fields */
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-bold text-m3-on-surface-variant">
                              Name *
                            </label>
                            {activeTab === 'ingredients' && (
                              <button
                                type="button"
                                onClick={toggleInputMode}
                                className="text-xs text-m3-primary font-bold hover:text-m3-primary/80"
                              >
                                Smart Input
                              </button>
                            )}
                          </div>
                          <input
                            autoFocus={!useSmartInput}
                            type="text"
                            placeholder={`e.g. ${activeTab === 'ingredients' ? 'Extra Virgin Olive Oil' : 'Paper Towels'}`}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-bold text-m3-on-surface-variant mb-2">
                              Quantity
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 2"
                              value={formData.quantity}
                              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                              className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-m3-on-surface-variant mb-2">
                              Unit
                            </label>
                            <select
                              value={formData.unit}
                              onChange={(e) => setFormData({...formData, unit: e.target.value})}
                              className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                            >
                              <option value="">Select unit</option>
                              {commonUnits[activeTab as keyof typeof commonUnits].map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-m3-on-surface-variant mb-2">
                        Location
                      </label>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                      >
                        <option value="">Select location</option>
                        {locationOptions[activeTab as keyof typeof locationOptions].map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>

                    {activeTab === 'ingredients' && (
                      <div>
                        <label className="block text-sm font-bold text-m3-on-surface-variant mb-2">
                          Purchased On (Optional)
                        </label>
                        <input
                          type="date"
                          value={formData.purchasedOn}
                          onChange={(e) => setFormData({...formData, purchasedOn: e.target.value})}
                          className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-m3-on-surface-variant mb-2">
                        Notes
                      </label>
                      <textarea
                        placeholder="Additional notes or details..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="w-full px-4 py-3 bg-m3-surface-variant/20 border border-m3-outline/20 rounded-2xl outline-none focus:border-m3-primary font-medium resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-6 py-3 bg-m3-surface-variant/20 text-m3-on-surface-variant rounded-2xl font-bold hover:bg-m3-surface-variant/30 transition-all flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-m3-primary text-m3-on-primary rounded-2xl font-bold hover:bg-m3-primary/90 shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        {editingItem ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}          </AnimatePresence>

          {/* Floating Action Button */}
          <div className="fixed bottom-10 right-10 z-40">
            <button 
              onClick={() => {
                setUseSmartInput(activeTab === 'ingredients'); // Default to smart input for ingredients
                setIsAddingItem(true);
              }}
              className="w-16 h-16 bg-m3-primary text-m3-on-primary rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
              title={`Add ${activeTab === 'ingredients' ? 'Ingredient' : 'Supply'}`}
            >
              <Plus size={28} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};