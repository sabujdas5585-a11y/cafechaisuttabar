import React, { useState, useEffect } from 'react';
import { MenuItem, Booking, Ingredient, Order, Testimonial } from '../types';
import { triggerPushNotification } from './NotificationCenter';
import {
  Coffee, Users, DollarSign, AlertCircle, Trash2, Edit2, Plus, X,
  Check, Play, Utensils, Clipboard, Package, RotateCcw, Image, ShoppingBag, Eye,
  Star, MessageSquare
} from 'lucide-react';

interface AdminPanelProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  testimonials: Testimonial[];
  setTestimonials: React.Dispatch<React.SetStateAction<Testimonial[]>>;
  onClose: () => void;
}

export default function AdminPanel({
  menuItems,
  setMenuItems,
  bookings,
  setBookings,
  ingredients,
  setIngredients,
  orders,
  setOrders,
  testimonials,
  setTestimonials,
  onClose
}: AdminPanelProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'bookings' | 'inventory' | 'reviews'>('dashboard');

  // Menu Form States
  const [isEditingMenu, setIsEditingMenu] = useState<boolean>(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState<string>('chai');
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [newUrlInput, setNewUrlInput] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Ingredient Form State
  const [isEditingIngredient, setIsEditingIngredient] = useState<boolean>(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState<Ingredient['category']>('dry');
  const [ingredientQty, setIngredientQty] = useState(0);
  const [ingredientMinQty, setIngredientMinQty] = useState(0);
  const [ingredientUnit, setIngredientUnit] = useState('');

  // Table assignment states for bookings
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [assignedTable, setAssignedTable] = useState('Table 1');

  // Reset Menu Form
  const resetMenuForm = (item?: MenuItem) => {
    if (item) {
      setEditingMenuItemId(item.id);
      setFormName(item.name);
      setFormDescription(item.description);
      setFormPrice(item.price);
      setFormCategory(item.category);
      setFormImageUrls([...item.imageUrls]);
      setFormIsAvailable(item.isAvailable);
    } else {
      setEditingMenuItemId(null);
      setFormName('');
      setFormDescription('');
      setFormPrice(25);
      setFormCategory('chai');
      setFormImageUrls([]);
      setFormIsAvailable(true);
    }
    setNewUrlInput('');
  };

  // Reset Ingredient Form
  const resetIngredientForm = (ing?: Ingredient) => {
    if (ing) {
      setEditingIngredientId(ing.id);
      setIngredientName(ing.name);
      setIngredientCategory(ing.category);
      setIngredientQty(ing.currentQty);
      setIngredientMinQty(ing.minQty);
      setIngredientUnit(ing.unit);
    } else {
      setEditingIngredientId(null);
      setIngredientName('');
      setIngredientCategory('dry');
      setIngredientQty(5);
      setIngredientMinQty(2);
      setIngredientUnit('Kgs');
    }
  };

  // 1. Menu Management Handlers
  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formPrice <= 0) return;

    const urls = [...formImageUrls];
    if (newUrlInput.trim() && !urls.includes(newUrlInput.trim())) {
      urls.push(newUrlInput.trim());
    }

    if (urls.length === 0) {
      // Add a fallback food image placeholder
      urls.push('https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600');
    }

    if (editingMenuItemId) {
      // Edit
      setMenuItems(prev => prev.map(item =>
        item.id === editingMenuItemId
          ? {
              ...item,
              name: formName,
              description: formDescription,
              price: formPrice,
              category: formCategory,
              imageUrls: urls,
              isAvailable: formIsAvailable
            }
          : item
      ));
      triggerPushNotification(
        'Dish Updated Successfully',
        `The culinary details of "${formName}" have been updated.`,
        'system'
      );
    } else {
      // Create
      const newItem: MenuItem = {
        id: 'new_' + Math.random().toString(36).substring(2, 9),
        name: formName,
        description: formDescription,
        price: formPrice,
        category: formCategory,
        imageUrls: urls,
        isAvailable: formIsAvailable
      };
      setMenuItems(prev => [newItem, ...prev]);
      triggerPushNotification(
        'New Dish Added to Menu',
        `"${formName}" is now available to order at ₹${formPrice}!`,
        'system'
      );
    }

    setIsEditingMenu(false);
    resetMenuForm();
  };

  const handleDeleteMenuItem = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${name}"?`)) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
      triggerPushNotification(
        'Dish Deleted from Kitchen',
        `"${name}" has been successfully retired from the digital menu.`,
        'system'
      );
    }
  };

  const handleAddImageUrl = () => {
    if (newUrlInput.trim() && !formImageUrls.includes(newUrlInput.trim())) {
      setFormImageUrls(prev => [...prev, newUrlInput.trim()]);
      setNewUrlInput('');
    }
  };

  const handleRemoveImageUrlAt = (index: number) => {
    setFormImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 2. Booking Management Handlers
  const handleConfirmBooking = (id: string, name: string) => {
    setBookings(prev => prev.map(bk => bk.id === id ? { ...bk, status: 'confirmed' } : bk));
    const targetBooking = bookings.find(b => b.id === id);
    triggerPushNotification(
      'Reservation Confirmed!',
      `Hi ${name}, your table request at Cafe Chai Sutta Bar has been Confirmed!`,
      'booking',
      targetBooking?.userId || undefined
    );
  };

  const handleCancelBooking = (id: string, name: string) => {
    setBookings(prev => prev.map(bk => bk.id === id ? { ...bk, status: 'cancelled' } : bk));
    const targetBooking = bookings.find(b => b.id === id);
    triggerPushNotification(
      'Reservation Cancelled',
      `Table request for ${name} has been marked as Cancelled.`,
      'booking',
      targetBooking?.userId || undefined
    );
  };

  const handleAssignTable = (id: string) => {
    setBookings(prev => prev.map(bk =>
      bk.id === id ? { ...bk, tableNo: assignedTable, status: 'confirmed' } : bk
    ));
    const targetBooking = bookings.find(b => b.id === id);
    const bkName = targetBooking?.customerName || 'Customer';
    setAssigningBookingId(null);
    triggerPushNotification(
      'Table Assigned!',
      `Table assigned: ${assignedTable} is now locked in for ${bkName}!`,
      'booking',
      targetBooking?.userId || undefined
    );
  };

  // 3. Ingredient / Inventory Management Handlers
  const adjustIngredientQty = (id: string, amount: number) => {
    setIngredients(prev => prev.map(ing => {
      if (ing.id === id) {
        const nextQty = Math.max(0, parseFloat((ing.currentQty + amount).toFixed(1)));
        // Alert if stock drops below threshold
        if (nextQty <= ing.minQty && ing.currentQty > ing.minQty) {
          triggerPushNotification(
            '⚠️ Critical Ingredient Alert',
            `Inventory of "${ing.name}" has critical low stock of ${nextQty} ${ing.unit}!`,
            'system'
          );
        }
        return { ...ing, currentQty: nextQty };
      }
      return ing;
    }));
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim() || ingredientQty < 0) return;

    if (editingIngredientId) {
      setIngredients(prev => prev.map(ing =>
        ing.id === editingIngredientId
          ? {
              ...ing,
              name: ingredientName,
              category: ingredientCategory,
              currentQty: ingredientQty,
              minQty: ingredientMinQty,
              unit: ingredientUnit
            }
          : ing
      ));
    } else {
      const newIng: Ingredient = {
        id: 'ing_' + Math.random().toString(36).substring(2, 9),
        name: ingredientName,
        category: ingredientCategory,
        currentQty: ingredientQty,
        minQty: ingredientMinQty,
        unit: ingredientUnit
      };
      setIngredients(prev => [...prev, newIng]);
    }
    setIsEditingIngredient(false);
    setEditingIngredientId(null);
  };

  // 4. Live Order status updates
  const handleUpdateOrderStatus = (orderId: string, nextStatus: Order['status']) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        let title = '';
        let msg = '';
        if (nextStatus === 'preparing') {
          title = '🍳 Cooking Begun!';
          msg = `Cafe Chai Sutta Bar matches your mood! Staff is brewing & preparing your order fresh.`;
        } else if (nextStatus === 'ready') {
          title = '🛎️ Order Sizzling & Ready!';
          msg = `Order #${orderId.slice(-4)} is ready to serve. Grab your smoky clay Kulhads!`;
        } else if (nextStatus === 'completed') {
          title = '💖 Servings Delivered';
          msg = `Thank you for choosing Cafe Chai Sutta Bar! Hope you loved your cozy teatime.`;
        }

        triggerPushNotification(title, msg, 'order', ord.userId || undefined);
        return { ...ord, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return ord;
    }));
  };

  // Calculated Stats
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const activeOrders = orders.filter(o => o.status !== 'completed').length;
  const lowStockIngredientsCount = ingredients.filter(i => i.currentQty <= i.minQty).length;

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-w-4xl mx-auto my-6">
      {/* Top Header Row representing high-end cafe branding */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-stone-900 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-stone-950 text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Staff Only Access
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-stone-400 text-xs font-mono font-medium">Live sync active</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-amber-100 mt-1">
            Chai Sutta Bar Portal
          </h2>
          <p className="text-xs text-stone-300 font-sans mt-0.5">
            Registered Admin Email: <span className="text-amber-400 underline font-mono">admincafe@gmail.com</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium text-xs px-4 py-2.5 rounded-xl transition duration-200 self-stretch sm:self-auto cursor-pointer"
        >
          Exit Admin Mode
        </button>
      </div>

      {/* Tabs navigation list */}
      <div className="bg-stone-950 border-b border-stone-800/80 px-4 flex overflow-x-auto gap-1 py-1 text-xs">
        <button
          onClick={() => { setActiveTab('dashboard'); setIsEditingMenu(false); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          Dashboard Stats
        </button>
        <button
          onClick={() => { setActiveTab('menu'); setIsEditingMenu(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'menu'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Coffee className="w-4 h-4" />
          Menu Items ({menuItems.length})
        </button>
        <button
          onClick={() => { setActiveTab('bookings'); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'bookings'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Bookings ({bookings.length})
          {pendingBookings > 0 && (
            <span className="bg-amber-500 text-stone-950 text-[10px] px-1.5 py-0.1 font-mono rounded font-black">
              {pendingBookings}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('inventory'); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Ingredient Stock
          {lowStockIngredientsCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.1 font-mono rounded font-black">
              {lowStockIngredientsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab('reviews'); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Customer Reviews ({testimonials.length})
        </button>
      </div>

      {/* Primary Panels Content */}
      <div className="p-6 flex-1 min-h-[450px]">
        {/* =============== A. DASHBOARD TAB =============== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-mono">Bookings Requests</span>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-100">{bookings.length}</span>
                  {pendingBookings > 0 && (
                    <span className="text-xs font-bold text-amber-500">({pendingBookings} pending)</span>
                  )}
                </div>
              </div>

              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-mono">Kitchen Orders</span>
                  <Utensils className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-stone-100">{orders.length}</span>
                  {activeOrders > 0 && (
                    <span className="text-xs font-bold text-amber-400">({activeOrders} packing)</span>
                  )}
                </div>
              </div>

              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-mono">Low Stocks Alert</span>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${lowStockIngredientsCount > 0 ? 'text-red-400' : 'text-stone-100'}`}>
                    {lowStockIngredientsCount}
                  </span>
                  <span className="text-xs text-stone-500">items</span>
                </div>
              </div>

              <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400 font-mono">Est. Sales Cash</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">
                    ₹{orders.reduce((sum, ord) => sum + ord.totalAmount, 0)}
                  </span>
                  <span className="text-[10px] text-stone-500">today</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Active orders tracking list & Ingredient Coverage Mini Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kitchen Board: Left Columns (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-500" />
                    Interactive Kitchen Order Board
                  </h3>
                  <span className="text-[11px] text-stone-500">Status changes send push alerts immediately</span>
                </div>

                {orders.length === 0 ? (
                  <div className="p-10 border border-dashed border-stone-800 text-center text-stone-500 rounded-2xl bg-stone-900/40">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-stone-600 stroke-1" />
                    <p className="text-xs">No online meal orders have been submitted yet.</p>
                    <p className="text-[11px] text-stone-600 mt-1">Customers can order items from the front-end Menu and track food status.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice().reverse().map(order => (
                      <div
                        key={order.id}
                        className="bg-stone-800/20 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-stone-500 font-mono uppercase tracking-wider block">
                              Order ID: #{order.id.slice(-6)} • {order.type === 'dine_in' ? 'Dine In' : 'Takeaway'} {order.tableNo ? `(${order.tableNo})` : ''}
                            </span>
                            <h4 className="text-sm font-bold text-stone-200 mt-1">
                              {order.customerName} <span className="font-mono text-xs text-stone-400 font-normal">({order.customerPhone})</span>
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                            <span className="text-stone-400 mr-2 font-mono">
                              ₹{order.totalAmount}
                            </span>
                            {order.status === 'placed' && (
                              <span className="bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded font-medium">
                                Received
                              </span>
                            )}
                            {order.status === 'preparing' && (
                              <span className="bg-amber-950 text-amber-400 border border-amber-900 px-2 py-0.5 rounded font-medium animate-pulse">
                                Brewing
                              </span>
                            )}
                            {order.status === 'ready' && (
                              <span className="bg-emerald-950 text-emerald-400 border border-emerald-950 px-2 py-0.5 rounded font-bold">
                                Ready
                              </span>
                            )}
                            {order.status === 'completed' && (
                              <span className="bg-stone-800 text-stone-500 px-2 py-0.5 rounded font-medium">
                                Collected
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order items bullet checklist */}
                        <div className="my-3 pl-1 text-xs text-stone-300 grid grid-cols-1 sm:grid-cols-2 gap-1 py-2 border-y border-stone-800/60 font-mono">
                          {order.items.map((item, index) => (
                            <span key={index} className="flex items-center gap-1">
                              <span className="text-amber-500 font-bold">×{item.quantity}</span>
                              <span className="truncate">{item.name}</span>
                            </span>
                          ))}
                        </div>

                        {/* Order status triggers */}
                        <div className="mt-2 flex items-center justify-between text-xs gap-3 flex-wrap">
                          <span className="text-stone-500 text-[10px] font-mono">
                            Stamp: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className="flex gap-2">
                            {order.status === 'placed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold px-3 py-1.5 rounded transition flex items-center gap-1"
                              >
                                <Play className="w-3 h-3 fill-stone-900" /> Start Brewing
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-stone-950 font-bold px-3 py-1.5 rounded transition flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-stone-950" /> Set Ready
                              </button>
                            )}
                            {order.status === 'ready' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded transition flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Collected
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <span className="text-stone-500 italic text-[11px] font-sans">Delivered successfully</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingredient Coverage visual metrics: Right Sidebar */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-4">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest font-mono">
                  Inventory Stock Distribution
                </h4>
                
                {/* Custom bar chart representation of stock coverage levels */}
                <div id="coverage-bar-chart" className="space-y-3 font-sans">
                  {ingredients.slice(0, 5).map(ing => {
                    const pct = Math.min(100, Math.round((ing.currentQty / (ing.minQty * 3)) * 100));
                    const isLow = ing.currentQty <= ing.minQty;
                    return (
                      <div key={ing.id} className="text-xs space-y-1">
                        <div className="flex justify-between items-center text-stone-300">
                          <span className="font-semibold truncate">{ing.name}</span>
                          <span className={`font-mono text-[10px] ${isLow ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                            {ing.currentQty} / {ing.minQty * 3} {ing.unit}
                          </span>
                        </div>
                        <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-amber-500'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-stone-800/80 text-center">
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="text-amber-500 hover:text-amber-400 text-xs font-bold font-mono transition inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      Refill stock levels & ingred. →
                    </button>
                  </div>
                </div>

                {/* Cozy Ambient Status card */}
                <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 tracking-wider block font-mono">Cozy Cafe Mood Info</span>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    Most popular item of the day: <strong className="text-amber-200">Adrak Elaichi Kulhad Chai</strong> with 68 clay pot servings sold since 10 AM morning opening.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============== B. MENU ITEMS MANAGEMENT TAB =============== */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-500" />
                  Menu Items Database
                </h3>
                <p className="text-xs text-stone-400">Add, edit, or delete cafe menu options. Each item supports multiple visual photographs.</p>
              </div>
              {!isEditingMenu && (
                <button
                  onClick={() => { resetMenuForm(); setIsEditingMenu(true); }}
                  className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add New Dish
                </button>
              )}
            </div>

            {/* Menu Form Block (Toggle) */}
            {isEditingMenu && (
              <form onSubmit={handleSaveMenuItem} className="bg-stone-950/80 p-5 rounded-2xl border border-stone-800 space-y-4 max-w-2xl">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                    {editingMenuItemId ? '📝 Edit Dish Details' : '✨ Add New Culinary Treat'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setIsEditingMenu(false); resetMenuForm(); }}
                    className="text-stone-400 hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-stone-400 block">Dish Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. Elaichi Kulhad Tea"
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-stone-400 block">Category *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formCategory}
                          onChange={e => setFormCategory(e.target.value.toLowerCase())}
                          placeholder="e.g. pizza, pasta"
                          className="w-1/2 bg-stone-900 border border-stone-800 rounded-lg px-2 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                        />
                        <select
                          value={['chai', 'sutta', 'snacks', 'fast_food', 'beverages'].includes(formCategory) ? formCategory : 'custom'}
                          onChange={e => {
                            if (e.target.value !== 'custom') {
                              setFormCategory(e.target.value);
                            }
                          }}
                          className="w-1/2 bg-stone-900 border border-stone-800 rounded-lg px-1.5 py-2 text-stone-300 text-xs focus:outline-none focus:border-amber-500 transition"
                        >
                          <option value="custom">Custom...</option>
                          <option value="chai">Kulhad Chai</option>
                          <option value="sutta">Herbal Sutta</option>
                          <option value="snacks">Teatime Snacks</option>
                          <option value="fast_food">Fast Food</option>
                          <option value="beverages">Cool Sips</option>
                          {Array.from(new Set(menuItems.map(item => item.category)))
                            .filter(cat => !['chai', 'sutta', 'snacks', 'fast_food', 'beverages'].includes(cat))
                            .map(cat => (
                              <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono text-stone-400 block">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formPrice}
                        onChange={e => setFormPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-stone-400 block">Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="Enter short description of tastes, spices, and tea brewing method..."
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Multiple image gallery urls section */}
                <div id="multi-images-section" className="space-y-2 bg-stone-900 p-4 rounded-xl border border-stone-800">
                  <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <Image className="w-4 h-4" />
                    Dish Image URLs (Multiple Photo Support)
                  </label>
                  <p className="text-[10px] text-stone-400">
                    Add visual photos to display in carousel slider on patient screen. Check the Unsplash layout preview below:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newUrlInput}
                      onChange={e => setNewUrlInput(e.target.value)}
                      placeholder="Paste Unsplash or food photo image URL..."
                      className="flex-grow bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg px-3 text-xs transition font-semibold cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>

                  {/* Thumbnail Previews with individual Delete buttons */}
                  {formImageUrls.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                      {formImageUrls.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-800 bg-stone-950">
                          <img
                            src={url}
                            alt="preview"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrlAt(idx)}
                            className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 rounded text-white"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic mt-1 font-mono">No images added. Placeholders will be auto-generated.</p>
                  )}
                </div>

                <div className="flex items-center gap-6 text-xs pt-1">
                  <label className="flex items-center gap-2 text-stone-300 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsAvailable}
                      onChange={e => setFormIsAvailable(e.target.checked)}
                      className="rounded border-stone-800 text-amber-500 focus:ring-amber-500 bg-stone-900 w-4 h-4"
                    />
                    In Stock / Available for Sale
                  </label>
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-800/60 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsEditingMenu(false); resetMenuForm(); }}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-stone-950 rounded-xl px-5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Dishes Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className="bg-stone-950/40 border border-stone-800/80 rounded-2xl p-4 flex gap-4 hover:border-stone-700 transition"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-900 border border-stone-800 relative">
                    <img
                      src={item.imageUrls[0] || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=200'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {item.imageUrls.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-stone-950/80 text-[9px] text-amber-400 font-mono px-1 rounded-sm">
                        +{item.imageUrls.length - 1} imgs
                      </span>
                    )}
                  </div>

                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-amber-950 text-amber-400 text-[10px] px-2 py-0.2 rounded uppercase font-mono font-bold tracking-wider">
                          {item.category === 'chai' ? 'Chai' : item.category === 'sutta' ? 'Sutta' : item.category}
                        </span>
                        <span className="text-xs font-bold text-amber-400 font-mono">₹{item.price}</span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-100 truncate mt-1">{item.name}</h4>
                      <p className="text-[11px] text-stone-400 leading-normal line-clamp-2 mt-0.5">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-stone-800/40">
                      <span className={`text-[10px] font-mono ${item.isAvailable ? 'text-emerald-500' : 'text-red-400'}`}>
                        ● {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { resetMenuForm(item); setIsEditingMenu(true); window.scrollTo({ top: 150, behavior: 'smooth' }); }}
                          className="p-1.5 text-stone-400 hover:text-amber-500 hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded transition cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =============== C. BOOKINGS TABLE RESERVATION TAB =============== */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Table Reservation Logs
              </h3>
              <p className="text-xs text-stone-400">View and manages incoming seating reservations. Confirm dining status or assign specific tables.</p>
            </div>

            {/* Seating Table Assignment Popover */}
            {assigningBookingId && (
              <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="text-xs text-stone-300">
                  <p className="font-bold text-amber-400 text-sm">Assign Seating Table</p>
                  Confirming reservation for <strong>{bookings.find(b => b.id === assigningBookingId)?.customerName}</strong>
                </div>
                <div className="flex gap-2 items-center text-xs">
                  <select
                    value={assignedTable}
                    onChange={e => setAssignedTable(e.target.value)}
                    className="bg-stone-900 border border-stone-800 rounded-lg text-stone-200 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Table 1 (2-Seater, Window)">Table 1 (2 guests)</option>
                    <option value="Table 2 (2-Seater, Lounge)">Table 2 (2 guests)</option>
                    <option value="Table 3 (4-Seater, Cabin)">Table 3 (4 guests)</option>
                    <option value="Table 4 (4-Seater, Cozy Corner)">Table 4 (4 guests)</option>
                    <option value="Table 5 (6-Seater, VIP Lights)">Table 5 (6 guests)</option>
                    <option value="Table 6 (6-Seater, Cozy Sofa)">Table 6 (6 guests)</option>
                    <option value="Clay Counter Bench (Open Air)">Clay Counter Bench</option>
                  </select>
                  <button
                    onClick={() => handleAssignTable(assigningBookingId)}
                    className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold px-3 py-2 rounded transition"
                  >
                    Lock Seat & Confirm
                  </button>
                  <button
                    onClick={() => setAssigningBookingId(null)}
                    className="p-2 text-stone-400 hover:text-stone-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Booking table list */}
            <div className="overflow-x-auto bg-stone-950 rounded-2xl border border-stone-800/80">
              <table className="w-full text-left border-collapse text-stone-300 text-xs font-sans">
                <thead>
                  <tr className="bg-stone-900 border-b border-stone-800 text-stone-400 text-[10px] font-mono uppercase tracking-wider">
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4 text-center">Guests</th>
                    <th className="p-4">Seat Assigned</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500 italic">No bookings are currently present in system log.</td>
                    </tr>
                  ) : (
                    bookings.slice().reverse().map(bk => (
                      <tr key={bk.id} className="hover:bg-stone-900/40 transition">
                        <td className="p-4">
                          <div className="font-bold text-stone-150 text-xs">{bk.customerName}</div>
                          <div className="text-[10px] text-stone-400 font-mono">{bk.phone}</div>
                          {bk.notes && (
                            <div className="text-[11px] text-amber-500/80 italic mt-0.5 max-w-xs truncate">
                              Note: "{bk.notes}"
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-mono text-stone-200">{bk.date}</div>
                          <div className="text-[11px] text-stone-400 font-mono">{bk.time} IST</div>
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-amber-400">{bk.guests} pax</td>
                        <td className="p-4">
                          <div className="font-bold text-amber-200">{bk.tableNo || 'Not Assigned'}</div>
                        </td>
                        <td className="p-4">
                          {bk.status === 'pending' && (
                            <span className="bg-amber-950 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-900">
                              Pending
                            </span>
                          )}
                          {bk.status === 'confirmed' && (
                            <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-emerald-900">
                              Confirmed
                            </span>
                          )}
                          {bk.status === 'cancelled' && (
                            <span className="bg-stone-800 text-stone-500 text-[10px] px-2 py-0.5 rounded uppercase">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {bk.status === 'pending' && (
                            <>
                              <button
                                onClick={() => { setAssigningBookingId(bk.id); setAssignedTable('Table 4 (4-Seater, Cozy Corner)'); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-stone-950 text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Assign Table
                              </button>
                              <button
                                onClick={() => handleConfirmBooking(bk.id, bk.customerName)}
                                className="bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-200 px-2.5 py-1 rounded transition cursor-pointer"
                              >
                                Auto Conf.
                              </button>
                              <button
                                onClick={() => handleCancelBooking(bk.id, bk.customerName)}
                                className="text-stone-400 hover:text-red-400 p-1 rounded hover:bg-stone-800 transition cursor-pointer"
                                title="Reject booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {bk.status !== 'pending' && (
                            <button
                              onClick={() => {
                                setBookings(prev => prev.map(item => item.id === bk.id ? { ...item, status: 'pending', tableNo: undefined } : item));
                              }}
                              className="text-[10px] text-stone-400 hover:text-stone-200 border border-stone-800 px-2 py-0.5 rounded hover:bg-stone-800 transition cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============== D. INGREDIENTS / INVENTORY MONITORING TAB =============== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" />
                  Real-time Inventory & Ingredient Monitor
                </h3>
                <p className="text-xs text-stone-400">Track and manage essential cafe ingredients in real-time. Adjust levels with instant warning alarms.</p>
              </div>

              {!isEditingIngredient && (
                <button
                  onClick={() => { resetIngredientForm(); setIsEditingIngredient(true); }}
                  className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Ingredient
                </button>
              )}
            </div>

            {/* Ingredient Form (Toggle) */}
            {isEditingIngredient && (
              <form onSubmit={handleSaveIngredient} className="bg-stone-950 p-5 rounded-2xl border border-stone-800/80 space-y-4 max-w-xl">
                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest font-mono">
                  {editingIngredientId ? '📝 Update Stock specs' : '📦 Provision New Raw Ingredient'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 font-mono">Ingredient Name *</label>
                    <input
                      type="text"
                      required
                      value={ingredientName}
                      onChange={e => setIngredientName(e.target.value)}
                      placeholder="e.g. Cardamom Elaichi Seeds"
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-stone-400 font-mono">Category</label>
                      <select
                        value={ingredientCategory}
                        onChange={e => setIngredientCategory(e.target.value as Ingredient['category'])}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none"
                      >
                        <option value="dairy">Dairy Products</option>
                        <option value="dry">Dry Groceries</option>
                        <option value="fresh">Fresh Greens</option>
                        <option value="packaging">Cups & Slabs</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-stone-400 font-mono">Unit Measure</label>
                      <input
                        type="text"
                        required
                        value={ingredientUnit}
                        onChange={e => setIngredientUnit(e.target.value)}
                        placeholder="e.g. Kgs"
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 font-mono">Current Stock Qty *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={ingredientQty}
                      onChange={e => setIngredientQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-stone-400 font-mono">Min Threshold Limit *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={ingredientMinQty}
                      onChange={e => setIngredientMinQty(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-stone-100 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-stone-800/50">
                  <button
                    type="button"
                    onClick={() => { setIsEditingIngredient(false); setEditingIngredientId(null); }}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-stone-950 rounded-lg px-4 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Save Stock
                  </button>
                </div>
              </form>
            )}

            {/* List of Ingredients with interactive + and - buttons for real-time monitoring */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ingredients.map(ing => {
                const isUnderStock = ing.currentQty <= ing.minQty;
                return (
                  <div
                    key={ing.id}
                    className={`bg-stone-950/40 border rounded-2xl p-4 flex flex-col justify-between transition ${
                      isUnderStock
                        ? 'border-red-500/50 bg-red-950/5'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-stone-500">
                          {ing.category}
                        </span>
                        {isUnderStock && (
                          <span className="bg-red-500 text-white text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-black tracking-wider animate-pulse">
                            Low Stock Alert
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-stone-150 truncate mt-1">{ing.name}</h4>
                      
                      <div className="mt-2 text-2xl font-black text-amber-500 font-mono">
                        {ing.currentQty} <span className="text-xs text-stone-400 font-normal">{ing.unit}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Min safe threshold: {ing.minQty} {ing.unit}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 mt-4 border-t border-stone-800/40">
                      <button
                        onClick={() => { resetIngredientForm(ing); setIsEditingIngredient(true); }}
                        className="text-[11px] text-stone-400 hover:text-amber-500 font-mono cursor-pointer"
                      >
                        Details
                      </button>

                      {/* Interactive adjust stock buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => adjustIngredientQty(ing.id, -1)}
                          className="w-7 h-7 bg-stone-800 hover:bg-stone-700 active:scale-90 text-stone-200 border border-stone-700 rounded-lg flex items-center justify-center font-bold font-mono transition cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => adjustIngredientQty(ing.id, 1)}
                          className="w-7 h-7 bg-stone-800 hover:bg-stone-700 active:scale-90 text-stone-200 border border-stone-700 rounded-lg flex items-center justify-center font-bold font-mono transition cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${ing.name}" from stock sheets?`)) {
                              setIngredients(prev => prev.filter(i => i.id !== ing.id));
                            }
                          }}
                          className="p-1.5 text-stone-500 hover:text-red-400 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =============== E. REVIEWS TAB =============== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="text-xl font-black text-stone-100 font-serif">Customer Testimonials & Reviews</h3>
                <p className="text-xs text-stone-400 mt-1">Manage guest journals and toggle which review cards are featured on the public home page.</p>
              </div>

              {/* Review metrics summary bubbles */}
              <div className="flex gap-2 text-[11px] font-mono">
                <span className="bg-stone-900 border border-stone-850 px-3 py-1.5 rounded-xl text-stone-300">
                  Total Journals: <strong className="text-amber-500">{testimonials.length}</strong>
                </span>
                <span className="bg-emerald-950/40 border border-emerald-900/30 px-3 py-1.5 rounded-xl text-emerald-450">
                  Visible On Home: <strong className="text-emerald-400 font-black">{testimonials.filter(t => t.isVisible !== false).length}</strong>
                </span>
                <span className="bg-red-950/40 border border-red-900/30 px-3 py-1.5 rounded-xl text-red-400">
                  Hidden: <strong className="text-red-400 font-black">{testimonials.filter(t => t.isVisible === false).length}</strong>
                </span>
              </div>
            </div>

            {testimonials.length === 0 ? (
              <div className="bg-stone-900/40 rounded-2xl border border-stone-800/80 p-8 text-center text-stone-450 space-y-2">
                <MessageSquare className="w-8 h-8 text-stone-600 mx-auto" />
                <p className="text-xs font-semibold">No feedback records found</p>
                <p className="text-[10px] leading-relaxed text-stone-500 max-w-xs mx-auto">
                  Encourage customers to submit a write-up using the home page guest journal forms!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testimonials.map(item => {
                  const isVisibleOnHome = item.isVisible !== false;
                  return (
                    <div 
                      key={item.id}
                      className={`bg-stone-900 border rounded-2xl p-5 hover:scale-[1.002] transition flex flex-col justify-between gap-4 ${
                        isVisibleOnHome 
                          ? 'border-emerald-900/30 bg-stone-900/80 shadow-md' 
                          : 'border-stone-800 opacity-60'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-stone-200 block">{item.name}</span>
                            <span className="text-[10px] text-stone-500 font-mono mt-0.5 block">Published: {item.date}</span>
                          </div>
                          
                          {/* Rating stars display */}
                          <div className="flex items-center gap-2">
                            {item.status === 'working' ? (
                              <span className="bg-amber-550/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-black animate-pulse flex items-center gap-1">
                                🛠️ WORKING
                              </span>
                            ) : item.status === 'resolved' ? (
                              <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-bold flex items-center gap-1">
                                ✅ RESOLVED
                              </span>
                            ) : (
                              <span className="bg-stone-950/60 text-stone-500 border border-stone-850 px-2 py-0.5 rounded text-[8.5px] uppercase font-mono font-bold">
                                📥 PENDING
                              </span>
                            )}

                            <div className="flex items-center gap-0.5 bg-stone-950/40 px-2 py-1 rounded-lg border border-stone-850">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-700'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-stone-300 text-xs italic leading-relaxed font-sans">
                          "{item.text}"
                        </p>
                      </div>

                      {/* WORK STATUS CONTROL ROW & STAFF FEEDBACK */}
                      <div className="bg-stone-950/40 rounded-xl p-3 border border-stone-850/80 space-y-2.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-stone-400">
                          <span>Service Action Status:</span>
                          <span className={
                            item.status === 'working' ? 'text-amber-500' :
                            item.status === 'resolved' ? 'text-emerald-450' : 'text-stone-500'
                          }>
                            {item.status === 'working' ? '🛠️ Working on it' :
                             item.status === 'resolved' ? '✅ Resolved' : '📥 Pending Review'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setTestimonials(prev => prev.map(test => {
                                if (test.id === item.id) {
                                  const nextStatus = test.status === 'working' ? 'none' : 'working';
                                  triggerPushNotification(
                                    nextStatus === 'working' ? 'Working On Your Feedback! 🛠️' : 'Feedback Pending Update 📥',
                                    `Our lounge staff marked your review "${test.name}" as: ${nextStatus === 'working' ? 'Currently working on resolving issues!' : 'Under Review'}`,
                                    nextStatus === 'working' ? 'booking' : 'general',
                                    test.userId || undefined
                                  );
                                  return { ...test, status: nextStatus };
                                }
                                return test;
                              }));
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer text-center ${
                              item.status === 'working'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-550/30'
                                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800/80'
                            }`}
                          >
                            🛠️ {item.status === 'working' ? 'STOP WORK' : 'WORK ON IT'}
                          </button>

                          <button
                            onClick={() => {
                              setTestimonials(prev => prev.map(test => {
                                if (test.id === item.id) {
                                  const nextStatus = test.status === 'resolved' ? 'none' : 'resolved';
                                  triggerPushNotification(
                                    nextStatus === 'resolved' ? 'Feedback Resolved! 🎉' : 'Feedback Reopened 📥',
                                    `Awesome news! Our staff completed adjustments and marked review "${test.name}" as resolved!`,
                                    nextStatus === 'resolved' ? 'booking' : 'general',
                                    test.userId || undefined
                                  );
                                  return { ...test, status: nextStatus };
                                }
                                return test;
                              }));
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer text-center ${
                              item.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-550/30'
                                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800/80'
                            }`}
                          >
                            ✅ {item.status === 'resolved' ? 'REOPEN' : 'RESOLVE'}
                          </button>
                        </div>

                        {/* Optional Manager Reply Response Input */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-stone-500 font-mono scale-90 origin-left block uppercase">Reply Response To Customer View</label>
                          <input
                            type="text"
                            placeholder="e.g. Thanks! Adjusting tea recipe... or Table cleaned."
                            value={item.adminNotes || ''}
                            onChange={(e) => {
                              setTestimonials(prev => prev.map(test => 
                                test.id === item.id ? { ...test, adminNotes: e.target.value } : test
                              ));
                            }}
                            className="w-full bg-stone-950 border border-stone-850 text-[10px] text-stone-200 rounded px-2 py-1 placeholder-stone-600 focus:outline-none focus:border-stone-750"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-stone-850 text-xs mt-1">
                        {/* Display state label */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                          {isVisibleOnHome ? (
                            <span className="text-emerald-450 bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Featured on Home
                            </span>
                          ) : (
                            <span className="text-stone-400 bg-stone-950 border border-stone-800 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
                              Hidden
                            </span>
                          )}
                        </div>

                        {/* Control actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTestimonials(prev => prev.map(test => {
                                if (test.id === item.id) {
                                  const nextVisibility = test.isVisible === false ? true : false;
                                  triggerPushNotification(
                                    'Visibility Updated',
                                    `Review by ${test.name} is now ${nextVisibility ? 'Visible' : 'Hidden'} on the home screen.`,
                                    'system'
                                  );
                                  return { ...test, isVisible: nextVisibility };
                                }
                                return test;
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-xl border font-bold text-[10px] font-mono transition duration-150 cursor-pointer flex items-center gap-1 ${
                              isVisibleOnHome
                                ? 'bg-amber-950/20 text-amber-500 border-amber-900/30 hover:bg-amber-950/50 hover:text-amber-450'
                                : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30 hover:bg-emerald-950/50 hover:text-emerald-450'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            {isVisibleOnHome ? 'HIDE FROM HOME' : 'SHOW ON HOME'}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete "${item.name}"'s review entry?`)) {
                                setTestimonials(prev => prev.filter(t => t.id !== item.id));
                                triggerPushNotification(
                                  'Review Removed',
                                  'Feedback entry has been permanently deleted.',
                                  'system'
                                );
                              }
                            }}
                            className="p-1.5 bg-stone-950 hover:bg-red-950/40 border border-stone-850 hover:border-red-900/50 text-stone-500 hover:text-red-400 rounded-xl transition cursor-pointer"
                            title="Delete review record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-950 border-t border-stone-800/50 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-400 gap-2 font-mono">
        <span>© Cafe Chai Sutta Bar • Port Control Office</span>
        <span className="flex items-center gap-1">
          <Utensils className="w-3.5 h-3.5 text-amber-500" />
          Keep food steaming & sips bubbling
        </span>
      </div>
    </div>
  );
}
