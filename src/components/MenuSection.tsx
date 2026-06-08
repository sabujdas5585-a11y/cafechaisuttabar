import React, { useState, useEffect } from 'react';
import { MenuItem, Order, OrderItem } from '../types';
import { triggerPushNotification } from './NotificationCenter';
import {
  Coffee, Search, Filter, Plus, Minus, ShoppingBag, Trash2, X, ChevronLeft, ChevronRight, Check, Play, Info
} from 'lucide-react';
import { User } from 'firebase/auth';

interface MenuSectionProps {
  menuItems: MenuItem[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  user: User | null;
  onOpenLogin: () => void;
}

export default function MenuSection({ menuItems, orders, setOrders, user, onOpenLogin }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart Tray States
  const [cart, setCart] = useState<{ [id: string]: { item: MenuItem; qty: number } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [dineType, setDineType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableSelection, setTableSelection] = useState('Table 4');
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Sync customer details when user auth changes
  useEffect(() => {
    if (user) {
      setCustName(user.displayName || user.email?.split('@')[0] || '');
    } else {
      setCustName('');
    }
  }, [user]);

  // Multiple Images Slideshow Viewer Modal
  const [viewerItem, setViewerItem] = useState<MenuItem | null>(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Cart Calculations
  const cartItemsArray = Object.values(cart) as { item: MenuItem; qty: number }[];
  const cartTotal = cartItemsArray.reduce((sum, entry) => sum + (entry.item.price * entry.qty), 0);

  // Filter Menu list
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateCartQty = (item: MenuItem, amount: number) => {
    setCart(prev => {
      const existing = prev[item.id];
      if (!existing && amount > 0) {
        return { ...prev, [item.id]: { item, qty: 1 } };
      }
      if (existing) {
        const nextQty = existing.qty + amount;
        if (nextQty <= 0) {
          const updated = { ...prev };
          delete updated[item.id];
          return updated;
        }
        return { ...prev, [item.id]: { ...existing, qty: nextQty } };
      }
      return prev;
    });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemsArray.length === 0 || !custName.trim() || !custPhone.trim()) return;

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 8);
    const apiOrderItems: OrderItem[] = cartItemsArray.map(entry => ({
      menuItemId: entry.item.id,
      name: entry.item.name,
      quantity: entry.qty,
      price: entry.item.price
    }));

    const newOrder: Order = {
      id: orderId,
      customerName: custName,
      customerPhone: custPhone,
      items: apiOrderItems,
      totalAmount: cartTotal,
      status: 'placed',
      type: dineType,
      tableNo: dineType === 'dine_in' ? tableSelection : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerEmail: user?.email || undefined,
      userId: user?.uid || undefined
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Clear cart and customer metadata
    setCart({});
    setCustName('');
    setCustPhone('');
    setIsCartOpen(false);
    setOrderSuccessId(orderId);

     // Trigger initial Push Notification Alert
     triggerPushNotification(
       '🌾 Order Transmitted!',
       `Hey ${custName}, your order for hot beverages is Received at Cafe Chai Sutta Bar. Tracking is open!`,
       'order',
       user?.uid || undefined
     );
 
     // Simulate step-by-step real-time push tracking
     // Placed -> Preparing (after 6 secs) -> Ready (after 15 secs)
     setTimeout(() => {
       setOrders(prev => prev.map(ord => {
         if (ord.id === orderId) {
           triggerPushNotification(
             '🍳 Kitchen Active!',
             `Chef is brewing your Adrak Elaichi tea right now. Boiling in clay pots...`,
             'order',
             ord.userId || undefined
           );
           return { ...ord, status: 'preparing', updatedAt: new Date().toISOString() };
         }
         return ord;
       }));
     }, 6000);
 
     setTimeout(() => {
       setOrders(prev => prev.map(ord => {
         if (ord.id === orderId) {
           triggerPushNotification(
             '🛎️ Hot Sips Ready!',
             `Order #${orderId.slice(-4)} is sizzling and ready for pickup at clay counter deck!`,
             'order',
             ord.userId || undefined
           );
           return { ...ord, status: 'ready', updatedAt: new Date().toISOString() };
         }
         return ord;
       }));
     }, 15000);
  };

  const openPhotoViewer = (item: MenuItem) => {
    setViewerItem(item);
    setActiveImgIdx(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Category Tabs & Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-2 border-b border-stone-800/65">
        
        {/* Scrollable Horizontal Badges */}
        <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none text-xs">
          {(() => {
            const categoriesMap: { [key: string]: string } = {
              chai: '☕ Kulhad Chai',
              sutta: '🌿 Herbal Sutta',
              snacks: '🍪 Teatime Savories',
              fast_food: '🍔 Fast Food',
              beverages: '🥤 Cool Sips',
            };
            const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
            const categoriesList = [
              { id: 'all', label: 'All Items' },
              ...uniqueCategories.map(cat => ({
                id: cat,
                label: categoriesMap[cat] || `✨ ${cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}`
              }))
            ];
            return categoriesList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-stone-950 shadow-md'
                    : 'bg-stone-800/40 text-stone-300 hover:bg-stone-800 hover:text-stone-100 border border-stone-800/80'
                }`}
              >
                {cat.label}
              </button>
            ));
          })()}
        </div>

        {/* Searching input */}
        <div className="relative md:max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search ginger tea, fries, maggi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-full pl-10 pr-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      {/* Grid of Dishes Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const cartEntry = cart[item.id];
          return (
            <div
              key={item.id}
              className={`relative bg-stone-900 border rounded-2xl overflow-hidden shadow-md flex flex-col group transition duration-300 ${
                cartEntry
                  ? 'border-amber-500 bg-gradient-to-b from-stone-900 to-amber-950/10'
                  : 'border-stone-800 hover:border-stone-750'
              }`}
            >
              {/* Dish Visual Cover with Carousel Launcher */}
              <div className="relative h-44 w-full bg-stone-950 overflow-hidden">
                <img
                  src={item.imageUrls[0] || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600'}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2 left-2 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-stone-800 text-[10px] font-bold text-amber-500 uppercase font-mono shadow-sm">
                  {item.category === 'chai' ? 'Chai Bar' :
                   item.category === 'sutta' ? 'Herbal Blend' :
                   item.category === 'snacks' ? 'Salty Dip' :
                   item.category === 'fast_food' ? 'Fast Food' :
                   item.category === 'beverages' ? 'Nectar' :
                   item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}
                </div>

                {/* Overlaid Launcher to view multiple photos */}
                <button
                  onClick={() => openPhotoViewer(item)}
                  className="absolute bottom-2 right-2 bg-black/80 hover:bg-amber-600 hover:text-stone-950 text-stone-200 border border-stone-800 p-2 rounded-xl transition flex items-center gap-1 text-[10px] uppercase font-bold font-mono cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {item.imageUrls.length} Pics
                </button>
              </div>

              {/* Textual descriptions */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-bold text-stone-100 group-hover:text-amber-400 transition truncate">
                      {item.name}
                    </h4>
                    <span className="text-sm font-black text-amber-400 font-mono">₹{item.price}</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed font-sans mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Purchase Button row */}
                <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-850">
                  <span className={`font-mono text-[10px] ${item.isAvailable ? 'text-emerald-500' : 'text-stone-500'}`}>
                    ● {item.isAvailable ? 'Fresh Available' : 'Wait List / Restock'}
                  </span>
                  
                  {item.isAvailable ? (
                    cartEntry ? (
                      <div className="flex items-center bg-amber-600 text-stone-950 rounded-xl overflow-hidden font-bold">
                        <button
                          onClick={() => updateCartQty(item, -1)}
                          className="px-2.5 py-1.5 hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono">{cartEntry.qty}</span>
                        <button
                          onClick={() => updateCartQty(item, 1)}
                          className="px-2.5 py-1.5 hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateCartQty(item, 1)}
                        className="bg-amber-600 hover:bg-amber-700 hover:scale-102 text-stone-950 font-extrabold px-4 py-2 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Add to Cup
                      </button>
                    )
                  ) : (
                    <span className="text-stone-600 text-xs italic">Sold Out</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty States */}
      {filteredItems.length === 0 && (
        <div className="p-16 border border-dashed border-stone-800 text-center text-stone-500 rounded-3xl bg-stone-900/30">
          <Coffee className="w-12 h-12 mx-auto stroke-1" />
          <p className="text-sm mt-2">No cozy recipes match your filter options.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="text-amber-500 text-xs font-bold underline mt-2"
          >
            Show full tea bar menu
          </button>
        </div>
      )}

      {/* Order Tracker / Success modal */}
      {orderSuccessId && (
        <div className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-2xl text-xs max-w-xl mx-auto space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-emerald-500 text-stone-950 text-[10px] px-2 py-0.2 rounded font-bold uppercase tracking-wider font-mono">
                Order Active
              </span>
              <h5 className="text-sm font-bold text-stone-105 mt-1">Order #{orderSuccessId.slice(-4)} Tracked</h5>
            </div>
            <button
              onClick={() => setOrderSuccessId(null)}
              className="text-stone-400 hover:text-stone-200 p-1 rounded"
            >
              ✕
            </button>
          </div>
          <p className="text-stone-300">
            Your hot servings are being transmitted to the clay counter list directly. Watch for <strong className="text-amber-400">Push notification tracking alerts</strong> above! Wait time is simulated in 6 and 15 seconds.
          </p>
          <div className="flex items-center gap-2 pt-2 text-stone-400 font-mono text-[10px]">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Updates sync across browser storage profiles.</span>
          </div>
        </div>
      )}

      {/* Floating Teatime Tray Tray Badge (Toggle) */}
      {cartItemsArray.length > 0 && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-95 shadow-2xl p-4 rounded-full flex items-center justify-center cursor-pointer transition duration-300"
          >
            <ShoppingBag className="w-6 h-6 stroke-[2.3]" />
            <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 font-mono text-[11px] font-extrabold w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-stone-100 shadow-md">
              {cartItemsArray.reduce((sum, entry) => sum + entry.qty, 0)}
            </span>
          </button>
        </div>
      )}

      {/* =============== MINI CART DRAWERS PANEL =============== */}
      {isCartOpen && (
        <>
          <div
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
          <div
            id="order-cart-tray"
            className="fixed left-0 top-0 bottom-0 w-full max-w-sm bg-stone-900 border-r border-stone-800 z-50 p-6 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-stone-100">Your Teatime Tray</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tray list items */}
            <div className="flex-grow overflow-y-auto space-y-3 py-4 pr-1 scrollbar-thin">
              {cartItemsArray.length === 0 ? (
                <p className="text-stone-500 text-xs italic text-center py-10">Your tray looks empty. Add items above!</p>
              ) : (
                cartItemsArray.map(entry => (
                  <div key={entry.item.id} className="p-3 bg-stone-950/40 rounded-xl border border-stone-800/80 flex justify-between gap-3 items-center">
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-stone-200 truncate">{entry.item.name}</h5>
                      <span className="text-[10px] text-amber-500 font-mono mt-0.5 block">₹{entry.item.price} each</span>
                    </div>

                    <div className="flex items-center bg-stone-800 text-stone-200 rounded-lg overflow-hidden font-mono text-xs">
                      <button
                        onClick={() => updateCartQty(entry.item, -1)}
                        className="px-2 py-1 hover:bg-stone-700"
                      >
                        -
                      </button>
                      <span className="px-2.5 font-bold">{entry.qty}</span>
                      <button
                        onClick={() => updateCartQty(entry.item, 1)}
                        className="px-2 py-1 hover:bg-stone-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations & Order form */}
            {cartItemsArray.length > 0 && (
              <div className="border-t border-stone-800 pt-4 mt-auto space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-stone-400">Pre-tax Tray Cost:</span>
                  <span className="text-amber-400 font-bold text-sm">₹{cartTotal}</span>
                </div>

                {user ? (
                  <form onSubmit={handlePlaceOrder} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 block">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={custName}
                        onChange={e => setCustName(e.target.value)}
                        placeholder="e.g. Siddharth"
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-2 text-stone-100 placeholder-stone-600 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-stone-400 block">Contact Phone *</label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={e => setCustPhone(e.target.value)}
                        placeholder="e.g. 90026 96524"
                        className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-2 text-stone-100 placeholder-stone-600 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setDineType('dine_in')}
                        className={`p-2 rounded-lg font-bold border transition ${
                          dineType === 'dine_in'
                            ? 'bg-amber-600/10 border-amber-500 text-amber-500'
                            : 'border-stone-800 text-stone-400 hover:bg-stone-850'
                        }`}
                      >
                        Dine In
                      </button>
                      <button
                        type="button"
                        onClick={() => setDineType('takeaway')}
                        className={`p-2 rounded-lg font-bold border transition ${
                          dineType === 'takeaway'
                            ? 'bg-amber-600/10 border-amber-500 text-amber-500'
                            : 'border-stone-800 text-stone-400 hover:bg-stone-850'
                        }`}
                      >
                        Takeaway
                      </button>
                    </div>

                    {dineType === 'dine_in' && (
                      <div className="space-y-1 pt-1 animate-fadeIn">
                        <label className="text-[11px] font-mono text-stone-400 block">Select Table Number</label>
                        <select
                          value={tableSelection}
                          onChange={e => setTableSelection(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-2 text-stone-200 focus:outline-none"
                        >
                          <option value="Table 1">Table 1 (Window)</option>
                          <option value="Table 2">Table 2 (Lounge)</option>
                          <option value="Table 3">Table 3 (Cabin)</option>
                          <option value="Table 4">Table 4 (Cozy Corner)</option>
                          <option value="Table 5">Table 5 (Sofa)</option>
                        </select>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-amber-600 hover:bg-amber-700 text-stone-950 font-extrabold py-3.5 rounded-xl transition duration-200 mt-2 cursor-pointer uppercase tracking-wider"
                    >
                      Submit Hot Serve Order
                    </button>
                  </form>
                ) : (
                  <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl text-center space-y-3">
                    <p className="text-stone-300 text-xs font-medium leading-relaxed">
                      To finalize and place your order online, please sign in or register or switch profiles.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIsCartOpen(false); onOpenLogin(); }}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-black py-2.5 rounded-xl transition duration-200 uppercase tracking-widest text-[10px] cursor-pointer"
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* =============== DISH PHOTOS SLIDESHOW LIGHTBOX MODAL =============== */}
      {viewerItem && (
        <div className="fixed inset-0 bg-black/90 z-55 flex items-center justify-center p-4 backdrop-blur-md">
          <div
            onClick={() => setViewerItem(null)}
            className="absolute inset-0 cursor-zoom-out"
          />
          
          <div className="relative bg-stone-900 border border-stone-800 max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl z-20">
            {/* Header / Dismiss */}
            <div className="absolute top-4 right-4 z-30">
              <button
                onClick={() => setViewerItem(null)}
                className="bg-stone-950/90 hover:bg-stone-800 text-stone-300 hover:text-stone-100 p-2 rounded-full border border-stone-750 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Primary Display Slider Image */}
            <div className="relative aspect-[4/3] bg-stone-950">
              <img
                src={viewerItem.imageUrls[activeImgIdx]}
                alt={viewerItem.name}
                className="w-full h-full object-cover transition-opacity duration-300"
                referrerPolicy="no-referrer"
              />

              {/* Navigation arrows if multiple images exist */}
              {viewerItem.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImgIdx(prev => (prev - 1 + viewerItem.imageUrls.length) % viewerItem.imageUrls.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-stone-950/80 hover:bg-amber-600 hover:text-stone-950 p-2.5 rounded-full border border-stone-800 text-stone-100 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImgIdx(prev => (prev + 1) % viewerItem.imageUrls.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-stone-950/80 hover:bg-amber-600 hover:text-stone-950 p-2.5 rounded-full border border-stone-800 text-stone-100 transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Slider bottom dots indicator */}
            <div className="p-4 bg-stone-950 space-y-1.5 border-t border-stone-800">
              <div className="flex gap-1.5 justify-center py-1.5">
                {viewerItem.imageUrls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`w-3.5 h-1.5 rounded-full transition-all ${
                      idx === activeImgIdx ? 'bg-amber-500 w-6' : 'bg-stone-700 hover:bg-stone-500'
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-between items-start gap-2">
                <div>
                  <h5 className="text-sm font-bold text-stone-100">{viewerItem.name}</h5>
                  <p className="text-xs text-stone-400 mt-1">{viewerItem.description}</p>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  ₹{viewerItem.price}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
