import React, { useState, useEffect } from 'react';
import { MenuItem, Booking, Ingredient, Order, Testimonial, GalleryImage } from '../types';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { triggerPushNotification } from './NotificationCenter';
import {
  Coffee, Users, DollarSign, AlertCircle, Trash2, Edit2, Plus, X,
  Check, Play, Utensils, Clipboard, Package, RotateCcw, Image, ShoppingBag, Eye,
  Star, MessageSquare
} from 'lucide-react';
import SupportChatAdmin from './SupportChatAdmin';

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
  galleryImages: GalleryImage[];
  setGalleryImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;
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
  galleryImages,
  setGalleryImages,
  onClose
}: AdminPanelProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'bookings' | 'inventory' | 'reviews' | 'orders' | 'support' | 'gallery'>('dashboard');

  // Custom non-blocking confirmation dialog state to bypass browser iframe blocks
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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

  // Gallery Form State
  const [isEditingGalleryImage, setIsEditingGalleryImage] = useState<boolean>(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryUrl, setGalleryUrl] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [galleryColor, setGalleryColor] = useState('blue');
  const [galleryLikes, setGalleryLikes] = useState(0);
  const [galleryViews, setGalleryViews] = useState(0);

  const resetGalleryForm = (item?: GalleryImage) => {
    if (item) {
      setEditingGalleryId(item.id);
      setGalleryUrl(item.url);
      setGalleryCaption(item.caption);
      setGalleryColor(item.color);
      setGalleryLikes(item.likes);
      setGalleryViews(item.views);
    } else {
      setEditingGalleryId(null);
      setGalleryUrl('');
      setGalleryCaption('');
      setGalleryColor('blue');
      setGalleryLikes(0);
      setGalleryViews(0);
    }
  };

  const handleSaveGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryUrl || !galleryCaption) return;

    let finalUrl = galleryUrl;
    if (galleryUrl.startsWith('data:image')) {
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `gallery-${Date.now()}.png`,
            data: galleryUrl.split(',')[1] // Base64 data
          }),
        });
        const data = await response.json();
        finalUrl = data.url;
      } catch (error) {
        console.error('Failed to upload image:', error);
        return;
      }
    }

    let glowColor = 'rgba(6,182,212,0.3)';
    let borderClass = 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.45)] text-cyan-400';
    if (galleryColor === 'pink') {
      glowColor = 'rgba(236,72,153,0.3)';
      borderClass = 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.45)] text-pink-400';
    } else if (galleryColor === 'amber') {
      glowColor = 'rgba(245,158,11,0.3)';
      borderClass = 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.45)] text-amber-400';
    } else if (galleryColor === 'purple') {
      glowColor = 'rgba(168,85,247,0.3)';
      borderClass = 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.45)] text-purple-400';
    } else if (galleryColor === 'green') {
      glowColor = 'rgba(16,185,129,0.3)';
      borderClass = 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.45)] text-emerald-400';
    }

    const updatedImage: GalleryImage = {
      id: editingGalleryId || `g${Date.now()}`,
      url: finalUrl,
      caption: galleryCaption,
      likes: galleryLikes,
      views: galleryViews,
      color: galleryColor,
      borderClass,
      glowColor
    };

    if (editingGalleryId) {
      setGalleryImages(prev => prev.map(img => img.id === editingGalleryId ? updatedImage : img));
    } else {
      setGalleryImages(prev => [...prev, updatedImage]);
    }

    setIsEditingGalleryImage(false);
    resetGalleryForm();
  };

  const handleDeleteGalleryImage = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Image',
      message: 'Are you sure you want to permanently delete this gallery image?',
      onConfirm: () => {
        setGalleryImages(prev => prev.filter(img => img.id !== id));
      }
    });
  };

  // Table assignment states for bookings
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const [assignedTable, setAssignedTable] = useState('Table 1');

  // Orders Section Filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');

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
    setConfirmModal({
      isOpen: true,
      title: 'Delete Menu Item',
      message: `Are you absolutely sure you want to permanently delete "${name}" from the digital menu? This action cannot be undone.`,
      onConfirm: () => {
        setMenuItems(prev => prev.filter(item => item.id !== id));
        triggerPushNotification(
          'Dish Deleted from Kitchen',
          `"${name}" has been successfully retired from the digital menu.`,
          'system'
        );
      }
    });
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

  const handlePendingDeleteBooking = (id: string, name: string) => {
    setBookings(prev => prev.map(bk => bk.id === id ? { ...bk, status: 'pending_delete' } : bk));
    const targetBooking = bookings.find(b => b.id === id);
    triggerPushNotification(
      'Reservation Pending Delete',
      `Booking request for ${name} has been marked as Pending Delete.`,
      'booking',
      targetBooking?.userId || undefined
    );
  };

  const handleDeleteBookingPermanently = (id: string, name: string) => {
    setBookings(prev => prev.filter(bk => bk.id !== id));
    triggerPushNotification(
      'Reservation Deleted',
      `Booking for ${name} has been permanently deleted from systems.`,
      'booking'
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
        } else if (nextStatus === 'accepted') {
          title = '✅ Order Accepted';
          msg = `Great news! Kitchen team accepted your Order #${orderId.slice(-4)}. Brewing now!`;
        } else if (nextStatus === 'rejected') {
          title = '❌ Order Rejected';
          msg = `We regret to inform you that your Order #${orderId.slice(-4)} was rejected due to rush.`;
        } else if (nextStatus === 'pending') {
          title = '📋 Status Set Back to Pending';
          msg = `Order #${orderId.slice(-4)} status has been reset back to pending review by staff.`;
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
          onClick={() => { setActiveTab('orders'); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          Culinary Orders ({orders.length})
          {activeOrders > 0 && (
            <span className="bg-amber-500 text-stone-950 text-[10px] px-1.5 py-0.1 font-mono rounded font-black">
              {activeOrders}
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
          <Star className="w-4 h-4" />
          Customer Reviews ({testimonials.length})
        </button>
        <button
          onClick={() => { setActiveTab('support'); setIsEditingIngredient(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'support'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Support Chat
        </button>
        <button
          onClick={() => { setActiveTab('gallery'); setIsEditingIngredient(false); setIsEditingGalleryImage(false); }}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'gallery'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-stone-400 hover:text-stone-100'
          }`}
        >
          <Image className="w-4 h-4" />
          Gallery
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
                            {order.deliverBefore && (
                              <span className="text-[11px] text-amber-500 font-mono font-black mt-0.5 block">
                                ⏱️ Deliver Before: {order.deliverBefore}
                              </span>
                            )}
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
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Delete Culinary Order',
                                  message: `Are you sure you want to permanently delete culinary Order #${order.id.slice(-6).toUpperCase()} for "${order.customerName}"? This action cannot be undone.`,
                                  onConfirm: () => {
                                    setOrders(prev => prev.filter(o => o.id !== order.id));
                                    triggerPushNotification(
                                      'Order Deleted',
                                      `Culinary order for "${order.customerName}" was removed from the list.`,
                                      'system'
                                    );
                                  }
                                });
                              }}
                              className="p-1.5 text-stone-500 hover:text-red-400 rounded hover:bg-stone-800 transition cursor-pointer flex items-center justify-center shrink-0"
                              title="Delete Order Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {(order.status === 'placed' || order.status === 'pending') && (
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

                {/* Multiple image gallery urls section with Direct Upload and presets */}
                <div id="multi-images-section" className="space-y-4 bg-stone-900 p-4 rounded-xl border border-stone-800">
                  <div>
                    <label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Image className="w-4 h-4" />
                      Dish Images (Direct Upload & Premium Presets)
                    </label>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Add delicious photos for the dish. You can upload photos directly, click any premium preset below, or paste custom Unsplash URLs.
                    </p>
                  </div>

                  {/* 1. Direct Local File Upload Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="relative group border-2 border-dashed border-stone-800 hover:border-amber-500/40 rounded-xl p-4.5 text-center transition bg-stone-950/40 flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i];
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                const base64String = reader.result;
                                setFormImageUrls(prev => {
                                  if (prev.includes(base64String)) return prev;
                                  return [...prev, base64String];
                                });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="space-y-1 z-0 pointer-events-none">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-900 text-amber-550 mx-auto border border-stone-800 shadow">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-[10px] font-bold text-stone-200">Upload Device Photos</p>
                        <p className="text-[8px] text-stone-500 font-mono">JPG, PNG, WebP (Base64)</p>
                      </div>
                    </div>

                    {/* 2. Direct URL pasting option */}
                    <div className="bg-stone-950/40 border border-stone-800 rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-stone-400 block">External Net Photo Link</label>
                        <input
                          type="url"
                          value={newUrlInput}
                          onChange={e => setNewUrlInput(e.target.value)}
                          placeholder="Paste custom Unsplash or web photo URL..."
                          className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition font-mono placeholder-stone-650"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="w-full bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-750 rounded-lg py-1.5 text-xs transition font-black tracking-wider uppercase cursor-pointer text-center mt-3"
                      >
                        Add URL to List
                      </button>
                    </div>
                  </div>

                  {/* 3. Preset Food library selector (One click selection) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest block font-mono">
                      ✨ Preset Cozy Cafe Stock Library:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-stone-950/40 p-2 rounded-lg border border-stone-800/60">
                      {[
                        { name: 'Adrak Chai', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400' },
                        { name: 'Incandescent Ambient', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400' },
                        { name: 'Clay Kulhad', url: 'https://images.unsplash.com/photo-1563887530-6893dd0f177c?q=80&w=400' },
                        { name: 'Tea Spout', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=400' },
                        { name: 'Samosas', url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=400' },
                        { name: 'Cheese Maggi', url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=400' },
                        { name: 'Golden Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=400' },
                        { name: 'Bun Maska', url: 'https://images.unsplash.com/photo-1600431521340-491dea880813?q=80&w=400' },
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            if (!formImageUrls.includes(preset.url)) {
                              setFormImageUrls(prev => [...prev, preset.url]);
                            }
                          }}
                          className="relative aspect-square rounded overflow-hidden border border-stone-850 hover:border-amber-500 transition group active:scale-95 cursor-pointer"
                          title={`Add preset: ${preset.name}`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 text-[7px] text-stone-300 py-0.5 truncate text-center">
                            {preset.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail Previews with individual Delete buttons */}
                  <div className="pt-2 border-t border-stone-850/60">
                    <span className="text-[10px] font-bold text-stone-400 block mb-1.5 font-mono">
                      Selected Photos for this Dish ({formImageUrls.length}):
                    </span>
                    {formImageUrls.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {formImageUrls.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-stone-800 bg-stone-950">
                            <img
                              src={url}
                              alt="preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-stone-950/70 text-[8px] text-stone-400 py-0.5 text-center font-mono pointer-events-none truncate px-1">
                              {url.startsWith('data:') ? 'uploaded image' : 'web link'}
                            </div>
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
                      <p className="text-xs text-stone-600 italic mt-1 font-mono">No images selected yet. Tap a preset above or upload device photos!</p>
                    )}
                  </div>
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
                            <span className="bg-red-950/60 text-red-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-red-950">
                              Cancelled
                            </span>
                          )}
                          {bk.status === 'pending_delete' && (
                            <span className="bg-rose-950 text-rose-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-rose-800 animate-pulse">
                              Pending Delete
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Accept Booking Option */}
                          {bk.status !== 'confirmed' && (
                            <button
                              onClick={() => handleConfirmBooking(bk.id, bk.customerName)}
                              className="bg-emerald-600/20 hover:bg-emerald-600 hover:text-stone-950 text-[10px] text-emerald-400 font-bold px-2 py-1 rounded transition cursor-pointer border border-emerald-500/20"
                              title="Accept Reservation"
                            >
                              Accept
                            </button>
                          )}

                          {/* Cancel Option */}
                          {bk.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(bk.id, bk.customerName)}
                              className="bg-red-950/20 hover:bg-red-600 hover:text-stone-950 text-[10px] text-red-400 font-bold px-2 py-1 rounded transition cursor-pointer border border-red-500/20"
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Reset Option */}
                          {bk.status !== 'pending' && (
                            <button
                              onClick={() => {
                                setBookings(prev => prev.map(item => item.id === bk.id ? { ...item, status: 'pending', tableNo: undefined } : item));
                              }}
                              className="text-[10px] text-stone-400 hover:text-stone-200 border border-stone-800 px-2 py-0.5 rounded hover:bg-stone-800 transition cursor-pointer"
                              title="Reset back to pending approval"
                            >
                              Reset
                            </button>
                          )}

                          {/* Quick Assign Seating Table Option */}
                          {bk.status === 'pending' && (
                            <button
                              onClick={() => { setAssigningBookingId(bk.id); setAssignedTable('Table 4 (4-Seater, Cozy Corner)'); }}
                              className="bg-amber-600/20 hover:bg-amber-600 hover:text-stone-950 text-[10px] text-amber-400 font-bold px-2 py-1 rounded transition cursor-pointer border border-amber-500/20"
                              title="Assign Table"
                            >
                              Assign Seat
                            </button>
                          )}

                          {/* Permanent Deletion Option */}
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete Booking Permanently',
                                message: `Are you absolutely sure you want to permanently delete the reservation record for "${bk.customerName}"? This action cannot be undone.`,
                                onConfirm: () => {
                                  handleDeleteBookingPermanently(bk.id, bk.customerName);
                                }
                              });
                            }}
                            className="bg-stone-900 hover:bg-stone-800 text-stone-500 hover:text-red-400 p-1 rounded transition cursor-pointer align-middle inline-flex items-center"
                            title="Delete booking permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete Inventory Item',
                              message: `Are you sure you want to permanently delete "${ing.name}" from the inventory stock sheets? This will delete its tracking entry.`,
                              onConfirm: () => {
                                setIngredients(prev => prev.filter(i => i.id !== ing.id));
                              }
                            });
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
                              setConfirmModal({
                                isOpen: true,
                                title: 'Delete Customer Review',
                                message: `Are you sure you want to permanently delete the review entry submitted by "${item.name}"? This action cannot be undone.`,
                                onConfirm: () => {
                                  setTestimonials(prev => prev.filter(t => t.id !== item.id));
                                  triggerPushNotification(
                                    'Review Removed',
                                    'Feedback entry has been permanently deleted.',
                                    'system'
                                  );
                                }
                              });
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

        {/* =============== F. CULINARY ORDERS TAB =============== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="text-xl font-black text-stone-100 font-serif">Culinary Orders Registry</h3>
                <p className="text-xs text-stone-400 mt-1">Review live guest sessions, assign statuses (Accept, Reject, Pending), and advance the cooking timeline.</p>
              </div>

              {/* Status tally bubbles */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2.5 py-1 rounded-full uppercase font-bold">
                  Pending: {orders.filter(o => o.status === 'placed' || o.status === 'pending').length}
                </span>
                <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded-full uppercase font-bold">
                  Accepted: {orders.filter(o => o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready').length}
                </span>
                <span className="bg-red-950/20 text-red-500 border border-red-900/30 px-2.5 py-1 rounded-full uppercase font-bold">
                  Rejected: {orders.filter(o => o.status === 'rejected').length}
                </span>
                <span className="bg-stone-800 text-stone-450 px-2.5 py-1 rounded-full uppercase font-bold">
                  Completed: {orders.filter(o => o.status === 'completed').length}
                </span>
              </div>
            </div>

            {/* Filter controls panel */}
            <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase font-bold font-mono">Search Guests</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, phone or email..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-2 text-[10px] text-stone-500 hover:text-stone-300 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase font-bold font-mono">Filter by Status</label>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 focus:outline-none focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-stone-300"
                >
                  <option value="all">All Statuses (Show Real-time)</option>
                  <option value="pending_placed">Pending Review (Placed/Pending)</option>
                  <option value="accepted">Accepted (Direct Accept)</option>
                  <option value="preparing">Brewing / Preparing</option>
                  <option value="ready">Sizzling Ready</option>
                  <option value="rejected">Rejected Only</option>
                  <option value="completed">Completed / Served</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-400 uppercase font-bold font-mono">Order Concept/Type</label>
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 focus:outline-none focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-stone-300"
                >
                  <option value="all">All Services</option>
                  <option value="takeaway">Takeaway Box Only</option>
                </select>
              </div>
            </div>

            {/* Orders list render */}
            {(() => {
              const filteredOrders = orders.filter(ord => {
                // Search match
                const matchSearch =
                  ord.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                  ord.customerPhone.includes(orderSearchQuery) ||
                  (ord.customerEmail && ord.customerEmail.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
                  ord.id.toLowerCase().includes(orderSearchQuery.toLowerCase());

                // Status match
                let matchStatus = true;
                if (orderStatusFilter !== 'all') {
                  if (orderStatusFilter === 'pending_placed') {
                    matchStatus = ord.status === 'placed' || ord.status === 'pending';
                  } else {
                    matchStatus = ord.status === orderStatusFilter;
                  }
                }

                // Type match
                const matchType = orderTypeFilter === 'all' || ord.type === orderTypeFilter;

                return matchSearch && matchStatus && matchType;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="p-16 border border-dashed border-stone-800/80 text-center rounded-2xl bg-stone-900/30 text-stone-500">
                    <Utensils className="w-12 h-12 mx-auto mb-2 text-stone-700 stroke-1" />
                    <span className="text-xs font-bold block text-stone-400">No fitting culinary orders found</span>
                    <span className="text-[11px] text-stone-600 block mt-1">Adjust search metrics or status filters.</span>
                  </div>
                );
              }

              // Reverse list so newer ones are at the top
              return (
                <div className="grid grid-cols-1 gap-4">
                  {filteredOrders.slice().reverse().map(order => {
                    return (
                      <div
                        key={order.id}
                        className="bg-stone-900/40 border border-stone-800 rounded-2xl p-5 hover:border-stone-750 transition flex flex-col md:flex-row justify-between gap-6"
                      >
                        {/* Left Details block */}
                        <div className="space-y-3.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/10 uppercase tracking-widest font-black">
                              Order ID: #{order.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono text-stone-550">
                              Stamp: {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              order.type === 'dine_in' 
                                ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' 
                                : 'bg-orange-950 text-orange-400 border border-orange-900/40'
                            }`}>
                              {order.type === 'dine_in' ? `Dine In (${order.tableNo || 'Floor'})` : 'Takeaway Box'}
                            </span>
                            {order.deliverBefore && (
                              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-red-950/40 text-red-500 border border-red-900/40 font-mono animate-pulse flex items-center gap-1">
                                ⏱️ Deliver Before: {order.deliverBefore}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-stone-100 flex items-center gap-2 font-sans">
                              👤 {order.customerName}
                              <span className="font-mono text-xs text-stone-400 font-normal">
                                ({order.customerPhone})
                              </span>
                            </h4>
                            {order.customerEmail && (
                              <p className="text-[10px] text-stone-400 font-mono mt-0.5">📧 Email: {order.customerEmail}</p>
                            )}
                            {(order.houseNumber || order.buildingStreet || order.areaLocality) && (
                              <div className="mt-2 bg-stone-950/60 border border-stone-850 p-2.5 rounded-xl space-y-1 text-[11px] font-sans">
                                <p className="text-stone-300 leading-normal">
                                  📍 <strong className="text-stone-400">Delivery Address:</strong> {order.houseNumber ? `${order.houseNumber}, ` : ''} {order.buildingStreet ? `${order.buildingStreet}, ` : ''} {order.areaLocality || ''}
                                </p>
                                {order.deliveryInstructions && (
                                  <p className="text-amber-500 font-sans text-[10px] leading-relaxed bg-amber-950/20 border border-amber-900/35 px-2 py-1.5 rounded-lg">
                                    📝 <strong className="text-stone-300">Instructions:</strong> "{order.deliveryInstructions}"
                                  </p>
                                )}
                                {order.latitude !== undefined && order.longitude !== undefined && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[9px] font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-950 px-1 py-0.5 rounded">
                                      GPS: {order.latitude.toFixed(5)}, {order.longitude.toFixed(5)}
                                    </span>
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-sky-450 hover:underline font-bold inline-flex items-center gap-1 active:scale-95 transition"
                                    >
                                      🌍 Open in Google Maps ↗
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Items Summary list */}
                          <div className="bg-stone-950/50 rounded-xl p-3 border border-stone-900 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-300 font-mono">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center pr-2">
                                <span className="flex items-center gap-1.5">
                                  <span className="text-amber-500 font-bold">×{item.quantity}</span>
                                  <span className="truncate max-w-[140px] text-stone-200">{item.name}</span>
                                </span>
                                <span className="text-stone-500 font-mono">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Status Actions panel */}
                        <div className="flex flex-col justify-between items-end gap-4 min-w-[200px] border-l border-stone-800/40 pl-0 md:pl-6">
                          <div className="text-right w-full flex md:flex-col justify-between items-baseline md:items-end flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] font-mono text-stone-500 block uppercase font-bold">Grand Total</span>
                              <span className="text-xl font-black text-amber-500 font-mono">₹{order.totalAmount}</span>
                            </div>

                            <div className="self-end">
                              {(() => {
                                switch (order.status) {
                                  case 'placed':
                                    return <span className="bg-stone-805 text-stone-300 border border-stone-700/60 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl">Placed (Received)</span>;
                                  case 'pending':
                                    return <span className="bg-amber-950 text-amber-400 border border-amber-900/40 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl animate-pulse">Pending Review</span>;
                                  case 'accepted':
                                    return <span className="bg-emerald-950 text-emerald-400 border border-emerald-950/30 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl">Accepted</span>;
                                  case 'rejected':
                                    return <span className="bg-red-950 text-red-400 border border-red-950 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl">Rejected</span>;
                                  case 'preparing':
                                    return <span className="bg-amber-600/10 text-amber-500 border border-amber-555/30 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl animate-pulse">Brewing</span>;
                                  case 'ready':
                                    return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-3 py-1 text-xs font-mono font-bold uppercase rounded-xl">Ready to Serve</span>;
                                  case 'completed':
                                    return <span className="bg-stone-850 text-stone-555 px-3 py-1 text-xs font-mono font-medium uppercase rounded-xl">Completed</span>;
                                }
                              })()}
                            </div>
                          </div>

                          {/* Trigger Buttons (Add Accept, Reject, and Pending as requested) */}
                          <div className="w-full space-y-2">
                            {/* Row 1: Core Accept / Reject / Pending states requested */}
                            <div className="grid grid-cols-3 gap-1.5 w-full">
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                                disabled={order.status === 'accepted'}
                                className={`text-[10px] font-bold py-1.5 px-1 rounded uppercase tracking-wider text-center transition ${
                                  order.status === 'accepted'
                                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-transparent'
                                    : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-stone-950 cursor-pointer border border-emerald-500/20 font-bold'
                                }`}
                                title="Accept Order and notify customer"
                              >
                                Accept
                              </button>

                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                disabled={order.status === 'rejected'}
                                className={`text-[10px] font-bold py-1.5 px-1 rounded uppercase tracking-wider text-center transition ${
                                  order.status === 'rejected'
                                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-transparent'
                                    : 'bg-red-950/30 text-red-400 hover:bg-red-650 hover:text-stone-950 cursor-pointer border border-red-500/20 font-bold'
                                }`}
                                title="Reject Order and notify cancellation"
                              >
                                Reject
                              </button>

                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                                disabled={order.status === 'pending'}
                                className={`text-[10px] font-bold py-1.5 px-1 rounded uppercase tracking-wider text-center transition ${
                                  order.status === 'pending'
                                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-transparent'
                                    : 'bg-amber-950/30 text-amber-400 hover:bg-amber-600 hover:text-stone-950 cursor-pointer border border-amber-500/20 font-bold'
                                }`}
                                title="Reset Order back to Pending Review status"
                              >
                                Pending
                              </button>
                            </div>

                            {/* Row 2: Standard operational flow triggers */}
                            <div className="flex gap-1.5 items-center justify-end w-full">
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Delete Culinary Order',
                                    message: `Are you sure you want to permanently delete culinary Order #${order.id.slice(-6).toUpperCase()} for "${order.customerName}"? This action cannot be undone.`,
                                    onConfirm: () => {
                                      setOrders(prev => prev.filter(o => o.id !== order.id));
                                      triggerPushNotification(
                                        'Order Deleted',
                                        `Culinary order #${order.id.slice(-6).toUpperCase()} has been deleted.`,
                                        'system'
                                      );
                                    }
                                  });
                                }}
                                className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-850 rounded-xl border border-stone-800/60 transition cursor-pointer shrink-0"
                                title="Delete Order Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {(order.status === 'placed' || order.status === 'accepted' || order.status === 'pending') && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                  className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 text-[10px] font-black py-1.5 rounded uppercase tracking-wider text-center transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  🍳 Start Brewing
                                </button>
                              )}

                              {order.status === 'preparing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-[10px] font-black py-1.5 rounded uppercase tracking-wider text-center transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  🛎️ Set Ready
                                </button>
                              )}

                              {order.status === 'ready' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                                  className="w-full bg-stone-700 hover:bg-stone-600 text-stone-100 text-[10px] font-bold py-1.5 rounded uppercase tracking-wider text-center transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  ✅ Hand Delivered
                                </button>
                              )}

                              {order.status === 'completed' && (
                                <span className="text-[10px] italic text-stone-500 font-sans block w-full text-center">Delivered successfully</span>
                              )}
                              {order.status === 'rejected' && (
                                <span className="text-[10px] text-red-500 font-sans block w-full text-center">Rejected and logged</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* =============== G. SUPPORT CHAT TAB =============== */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-stone-800/80 pb-4">
              <h3 className="text-xl font-black text-stone-100 font-serif">Customer Support & Active Chats</h3>
              <p className="text-xs text-stone-400 mt-1">Live direct communications between the kitchen admin deck and authenticated customers.</p>
            </div>
            
            <SupportChatAdmin />
          </div>
        )}

        {/* =============== H. GALLERY TAB =============== */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800/80 pb-4">
              <div>
                <h3 className="text-xl font-black text-stone-100 font-serif">Cozy Gallery Repository</h3>
                <p className="text-xs text-stone-400 mt-1">Manage all the immersive imagery displayed in the 3D Dome Gallery.</p>
              </div>
              {!isEditingGalleryImage && (
                <button
                  onClick={() => { resetGalleryForm(); setIsEditingGalleryImage(true); }}
                  className="bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Photo
                </button>
              )}
            </div>

            {isEditingGalleryImage && (
              <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl animate-fadeIn">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-amber-500 font-mono text-sm tracking-widest uppercase">
                    {editingGalleryId ? 'Modify Image Entry' : 'Upload New Image'}
                  </h4>
                  <button onClick={() => setIsEditingGalleryImage(false)} className="text-stone-400 hover:text-white cursor-pointer transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSaveGalleryImage} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-400">Direct Image URL or Upload</label>
                    <div className="flex gap-2">
                    <input
                      required
                      type="url"
                      value={galleryUrl}
                      onChange={e => setGalleryUrl(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 placeholder-stone-600 border border-stone-800 p-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition"
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setGalleryUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-stone-100 cursor-pointer"
                    />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-400">Caption / Description</label>
                    <input
                      required
                      type="text"
                      value={galleryCaption}
                      onChange={e => setGalleryCaption(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 placeholder-stone-600 border border-stone-800 p-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">Initial Likes</label>
                    <input
                      type="number"
                      min={0}
                      value={galleryLikes}
                      onChange={e => setGalleryLikes(Number(e.target.value))}
                      className="w-full bg-stone-950 text-stone-100 placeholder-stone-600 border border-stone-800 p-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400">Initial Views</label>
                    <input
                      type="number"
                      min={0}
                      value={galleryViews}
                      onChange={e => setGalleryViews(Number(e.target.value))}
                      className="w-full bg-stone-950 text-stone-100 placeholder-stone-600 border border-stone-800 p-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-stone-400">Aesthetic Color Glow</label>
                    <select
                      value={galleryColor}
                      onChange={e => setGalleryColor(e.target.value)}
                      className="w-full bg-stone-950 text-stone-100 border border-stone-800 p-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition cursor-pointer"
                    >
                      <option value="blue">Cyan Chill</option>
                      <option value="pink">Pink Neon</option>
                      <option value="amber">Warm Amber</option>
                      <option value="purple">Deep Purple</option>
                      <option value="green">Emerald Mint</option>
                    </select>
                  </div>
                  <div className="pt-2 sm:col-span-2">
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold py-3 rounded-xl transition flex justify-center items-center gap-1.5 cursor-pointer">
                      <Check className="w-4 h-4" />
                      {editingGalleryId ? 'Update Gallery Artifact' : 'Push to Gallery'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!isEditingGalleryImage && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map(img => (
                  <div key={img.id} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden group">
                    <div className="aspect-square relative flex items-center justify-center p-4">
                      <img src={img.url} className="w-full h-full object-cover rounded-xl" alt={img.caption} referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-stone-950/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center text-xs">
                        <span className="font-bold text-stone-100 line-clamp-2">{img.caption}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { resetGalleryForm(img); setIsEditingGalleryImage(true); }} className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-500 rounded-md transition cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteGalleryImage(img.id)} className="p-1.5 bg-stone-800 hover:bg-red-900/50 text-red-500 rounded-md transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800/80 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="bg-red-950/40 p-2.5 rounded-2xl border border-red-900/30 text-red-400 shrink-0">
                <Trash2 className="w-5 h-5 bg-transparent" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-stone-100 font-serif">{confirmModal.title}</h4>
                <p className="text-xs text-stone-400 font-medium leading-relaxed">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-stone-400 hover:text-stone-200 bg-transparent hover:bg-stone-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-red-650 hover:bg-red-500 text-stone-100 rounded-xl transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
