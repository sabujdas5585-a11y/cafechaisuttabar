import React, { useState } from 'react';
import { Booking, Order, OrderItem, Testimonial } from '../types';
import { 
  User as UserIcon, 
  Calendar, 
  ShoppingBag, 
  Clock, 
  ChevronRight, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Coffee, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  TrendingUp,
  Receipt,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileSectionProps {
  user: any; // Firebase user
  bookings: Booking[];
  orders: Order[];
  testimonials: Testimonial[];
  onOpenLogin: () => void;
}

export default function UserProfileSection({ user, bookings, orders, testimonials, onOpenLogin }: UserProfileSectionProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 px-6 py-10 bg-stone-900/80 border border-stone-800/80 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur">
        <div className="mx-auto w-20 h-20 bg-stone-850 rounded-full flex items-center justify-center border border-stone-800 text-amber-500">
          <UserIcon className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-stone-100">Access Your Sutta Lounge Haven</h3>
          <p className="text-stone-400 text-xs leading-relaxed px-4">
            Create an account or login to unlock personalized table bookings, real-time tea cup order histories, and cozy club community status rewards.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenLogin}
          className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-3 rounded-2xl transition duration-300 uppercase tracking-widest text-[11px] cursor-pointer"
        >
          Authenticate & Enter
        </button>
      </div>
    );
  }

  // Filter user's bookings (match by userId or contact email)
  const userBookings = bookings.filter(b => 
    b.userId === user.uid || 
    (b.email && b.email.toLowerCase().trim() === user.email?.toLowerCase().trim())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter user's orders (match by userId or contact email)
  const userOrders = orders.filter(o => 
    o.userId === user.uid || 
    (o.customerEmail && o.customerEmail.toLowerCase().trim() === user.email?.toLowerCase().trim())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Filter user's testimonials (match by userId)
  const myReviews = (testimonials || []).filter(t => t.userId === user.uid)
    .sort((a, b) => b.id.localeCompare(a.id));

  // Calculations for profile overview
  const totalSpent = userOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const activeBookings = userBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;

  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'placed':
        return <span className="bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Placed</span>;
      case 'pending':
        return <span className="bg-amber-950/60 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold animate-pulse animate-duration-1000">WAITING</span>;
      case 'accepted':
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Accepted</span>;
      case 'rejected':
        return <span className="bg-red-950/20 text-red-400 border border-red-900/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Rejected</span>;
      case 'preparing':
        return <span className="bg-amber-600/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold animate-pulse">Brewing</span>;
      case 'ready':
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Sizzling Ready</span>;
      case 'completed':
        return <span className="bg-stone-800 text-stone-400 border border-stone-700/50 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Served</span>;
      default:
        return null;
    }
  };

  const getBookingStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-950/40 text-amber-500 border border-amber-900/40 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold animate-pulse">⏳ Waiting</span>;
      case 'confirmed':
        return <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Room Reserved</span>;
      case 'cancelled':
        return <span className="bg-red-950/20 text-red-400 border border-red-900/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold">Cancelled</span>;
      case 'pending_delete':
        return <span className="bg-rose-950/60 text-rose-300 border border-rose-900/40 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold animate-pulse">Pending Delete</span>;
      default:
        return null;
    }
  };

  const formatShortDate = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const formatShortTime = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div id="user-profile-dashboard" className="max-w-6xl mx-auto space-y-8 py-4 px-1 container">
      
      {/* 1. Profile banner & overview cards */}
      <div className="bg-stone-900 rounded-3xl border border-stone-800/85 p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Glow backdrop decorative */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          
          {/* User Meta */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-stone-950 rounded-full flex items-center justify-center text-amber-500 text-xl font-black font-serif">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '👤'}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-stone-100 font-serif tracking-tight">
                  {user.displayName || user.email?.split('@')[0]}
                </h2>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase font-mono">
                  Cozy Club Member
                </span>
              </div>
              <p className="text-stone-450 text-xs font-mono mt-0.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 -mt-0.5" /> {user.email}
              </p>
              <span className="text-[10px] text-stone-500 block mt-1">
                Registered Profile Access since {user.metadata.creationTime ? formatShortDate(user.metadata.creationTime) : 'Today'}
              </span>
            </div>
          </div>

          {/* Stats summary boxes */}
          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto text-center font-mono">
            <div className="bg-stone-950/60 border border-stone-800/80 px-4 py-3 rounded-2xl">
              <span className="text-[9px] text-stone-450 uppercase font-bold block">Reserved</span>
              <span className="text-lg font-black text-amber-500 block mt-0.5">{userBookings.length}</span>
              <span className="text-[8px] text-stone-500 block">Tables</span>
            </div>

            <div className="bg-stone-950/60 border border-stone-800/80 px-4 py-3 rounded-2xl">
              <span className="text-[9px] text-stone-450 uppercase font-bold block">Sips Tray</span>
              <span className="text-lg font-black text-amber-500 block mt-0.5">{userOrders.length}</span>
              <span className="text-[8px] text-stone-500 block">Orders</span>
            </div>

            <div className="bg-stone-950/60 border border-stone-800/80 px-4 py-3 rounded-2xl">
              <span className="text-[9px] text-stone-450 uppercase font-bold block">Spend Grains</span>
              <span className="text-lg font-black text-emerald-400 block mt-0.5">₹{totalSpent}</span>
              <span className="text-[8px] text-stone-500 block">Invested</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main content split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: MEAL ORDERS HISTORIC DETAILS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-800/60">
            <div className="flex items-center gap-2">
              <div className="bg-amber-950/50 p-1.5 rounded-lg text-amber-550 border border-amber-900/30">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-stone-100 font-serif">Cup & Snacks Tray Orders</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-full text-stone-400">
              {userOrders.length} total
            </span>
          </div>

          {userOrders.length === 0 ? (
            <div className="bg-stone-900/40 rounded-2xl border border-stone-800/50 p-8 text-center text-stone-450 space-y-2">
              <Coffee className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs font-semibold">Ready to order warm Clay Pot Kulhad cups?</p>
              <p className="text-[10px] leading-relaxed text-stone-500 max-w-xs mx-auto">
                No orders processed yet with your account. Go to our Live Menu to choose tea, snacks, and herbal sutta treats!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {userOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-stone-900/70 hover:bg-stone-900 rounded-2xl border border-stone-800/80 p-4 transition duration-205 cursor-pointer flex justify-between items-center group shadow-sm hover:scale-[1.006]"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-extrabold text-amber-550 uppercase">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      {getOrderStatusBadge(order.status)}
                    </div>
                    
                    <div className="text-stone-300 font-bold block max-w-[240px] truncate">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-450">
                      <span>{formatShortDate(order.createdAt)}</span>
                      <span>•</span>
                      <span>{order.type === 'dine_in' ? `Table: ${order.tableNo || 'Floor'}` : 'Takeaway'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-stone-400 text-[10px] font-mono block">Grand Total</span>
                      <span className="text-sm font-black text-amber-500 font-mono">₹{order.totalAmount}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BOOKINGS & RESERVATIONS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-stone-800/60">
            <div className="flex items-center gap-2">
              <div className="bg-amber-950/50 p-1.5 rounded-lg text-amber-550 border border-amber-900/30">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-stone-100 font-serif">Table Seating Reservations</h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-full text-stone-400">
              {userBookings.length} total
            </span>
          </div>

          {userBookings.length === 0 ? (
            <div className="bg-stone-900/40 rounded-2xl border border-stone-800/50 p-8 text-center text-stone-450 space-y-2">
              <Calendar className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs font-semibold">Want to book cozy corner floor cushions?</p>
              <p className="text-[10px] leading-relaxed text-stone-500 max-w-xs mx-auto">
                No reservation coordinates submitted yet. Book ahead of time to claim table lounge slots!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {userBookings.map(bk => (
                <div 
                  key={bk.id}
                  onClick={() => setSelectedBooking(bk)}
                  className="bg-stone-900/70 hover:bg-stone-900 rounded-2xl border border-stone-800/80 p-4 transition duration-205 cursor-pointer flex justify-between items-center group shadow-sm hover:scale-[1.006]"
                >
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-extrabold text-amber-550 uppercase">
                        CODE {bk.id.replace('b_', '').toUpperCase()}
                      </span>
                      {getBookingStatusBadge(bk.status)}
                    </div>

                    <div className="text-stone-200 font-black flex items-center gap-1.5">
                      <span>👤 {bk.guests} Guests</span>
                      <span className="text-stone-550 font-normal">for</span>
                      <span className="text-amber-500 font-mono font-bold">{bk.time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-450">
                      <span>Date: {formatShortDate(bk.date)}</span>
                      {bk.tableNo && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-450">{bk.tableNo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-stone-400 text-[10px] block">Status</span>
                      <span className={`text-[11px] font-bold ${bk.status === 'confirmed' ? 'text-emerald-400' : bk.status === 'cancelled' ? 'text-red-400' : bk.status === 'pending_delete' ? 'text-rose-400 animate-pulse' : 'text-amber-500'}`}>
                        {bk.status === 'pending_delete' ? 'PENDING DELETE' : bk.status === 'pending' ? 'WAITING' : bk.status.toUpperCase()}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 3. MY CUSTOMER REVIEWS & FEEDBACK STATUS HUB */}
      <div id="user-profile-reviews" className="bg-stone-900 rounded-3xl border border-stone-800/85 p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800/60 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-955/40 p-2 rounded-xl text-amber-550 border border-amber-900/30">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-100 font-serif">My Guest Journals & Feedback</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Track your submitted feedback points and chat status updates.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-stone-950 border border-stone-800 px-3 py-1.5 rounded-full text-stone-450">
            {myReviews.length} journals
          </span>
        </div>

        {myReviews.length === 0 ? (
          <div className="bg-stone-950/40 rounded-2xl border border-stone-850 p-10 text-center text-stone-450 space-y-3 relative z-10">
            <div className="w-10 h-10 bg-stone-900/80 rounded-full flex items-center justify-center border border-stone-800 text-stone-500 mx-auto">
              <Star className="w-5 h-5 text-stone-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-stone-300">No review logs found</p>
              <p className="text-[10px] leading-relaxed text-stone-500 max-w-sm mx-auto">
                You haven't authored a guest journal review for Cafe Chai Sutta Bar yet. Visit the Home tab menu and submit your review using our Guest Journal feedback portal!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            {myReviews.map(item => (
              <div 
                key={item.id} 
                className="bg-stone-950/60 border border-stone-850/80 rounded-2xl p-5 hover:border-stone-800 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-stone-200">{item.name}</h4>
                      <p className="text-[9px] text-stone-550 font-mono mt-0.5">{item.date}</p>
                    </div>
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 bg-stone-900/60 border border-stone-850 px-2 py-0.5 rounded-lg">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < item.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-700'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 italic leading-relaxed font-sans">
                    "{item.text}"
                  </p>
                </div>

                {/* Status elements */}
                <div className="flex flex-col gap-2 pt-3 border-t border-stone-850 mt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Placement wall feed flag */}
                    <span className="text-[9.5px] font-mono font-bold flex items-center gap-1">
                      {item.isVisible !== false ? (
                        <span className="text-emerald-450 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                          Featured on feed
                        </span>
                      ) : (
                        <span className="text-stone-450 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </span>

                    {/* Admin Action State */}
                    {item.status === 'working' ? (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[9.5px] font-mono px-2.5 py-0.5 rounded-full font-black uppercase flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Working on it 🛠️
                      </span>
                    ) : item.status === 'resolved' ? (
                      <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[9.5px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Resolved & Handled
                      </span>
                    ) : (
                      <span className="bg-stone-900 text-stone-450 border border-stone-800 text-[9.5px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase">
                        Pending review
                      </span>
                    )}
                  </div>

                  {/* Staff Notes response block */}
                  {item.adminNotes && (
                    <div className="bg-stone-900/55 border border-stone-850 p-2.5 rounded-xl text-[11px] text-stone-400 mt-1">
                      <span className="text-amber-500/90 font-mono text-[9px] font-bold block uppercase tracking-wider mb-0.5">Manager Response:</span>
                      <p className="italic text-stone-300">"{item.adminNotes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ORDER EXPANDED VIEW SLIDE OVER MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs font-mono">
            {/* Backdrop click close */}
            <div className="absolute inset-0" onClick={() => setSelectedOrder(null)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl relative max-w-md w-full z-10 text-stone-200 space-y-4"
            >
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-stone-800 pb-3 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Lounge Order Manifest</span>
                <h4 className="text-base font-black text-stone-100 font-mono mt-1">
                  #{selectedOrder.id.slice(-8).toUpperCase()}
                </h4>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Placed {formatShortDate(selectedOrder.createdAt)} at {formatShortTime(selectedOrder.createdAt)}
                </p>
              </div>

              {/* Status Tracker step bar */}
              {selectedOrder.status === 'rejected' ? (
                <div className="bg-red-950/20 text-red-400 border border-red-900/30 p-3.5 rounded-2xl text-center leading-relaxed font-sans text-xs">
                  <span className="font-bold block mb-1">❌ Order Rejected</span>
                  We regret to inform you that our kitchen staff has rejected this order. Please reach out to reception counter.
                </div>
              ) : selectedOrder.status === 'pending' ? (
                <div className="bg-amber-950/30 text-amber-400 border border-amber-900/30 p-3.5 rounded-2xl text-center leading-relaxed font-sans text-xs animate-pulse">
                  <span className="font-bold block mb-1">⏳ Waiting</span>
                  Your culinary session is placed. Waiting for the kitchen staff to review and accept!
                </div>
              ) : (
                <div className="bg-stone-950/40 p-3 rounded-2xl border border-stone-850 flex justify-between items-center text-[10px] text-center font-bold relative gap-2">
                  <div className={`space-y-1 flex-1 ${['placed', 'pending', 'accepted', 'preparing', 'ready', 'completed'].includes(selectedOrder.status) ? 'text-amber-500' : 'text-stone-600'}`}>
                    <span className="block text-xs">🌾</span>
                    <span>Placed</span>
                  </div>
                  <div className="h-0.5 bg-stone-800 flex-1">
                    <div className={`h-full bg-amber-500 ${['accepted', 'preparing', 'ready', 'completed'].includes(selectedOrder.status) ? 'w-full' : 'w-0'}`}></div>
                  </div>
                  
                  <div className={`space-y-1 flex-1 ${['accepted', 'preparing', 'ready', 'completed'].includes(selectedOrder.status) ? 'text-amber-500' : 'text-stone-600'}`}>
                    <span className="block text-xs">🍳</span>
                    <span>{selectedOrder.status === 'accepted' ? 'Accepted' : 'Brewing'}</span>
                  </div>
                  <div className="h-0.5 bg-stone-800 flex-1">
                    <div className={`h-full bg-amber-500 ${['ready', 'completed'].includes(selectedOrder.status) ? 'w-full' : 'w-0'}`}></div>
                  </div>

                  <div className={`space-y-1 flex-1 ${['ready', 'completed'].includes(selectedOrder.status) ? 'text-amber-500 animate-pulse' : 'text-stone-600'}`}>
                    <span className="block text-xs">🛎️</span>
                    <span>Ready</span>
                  </div>
                  <div className="h-0.5 bg-stone-800 flex-1">
                    <div className={`h-full bg-amber-500 ${selectedOrder.status === 'completed' ? 'w-full' : 'w-0'}`}></div>
                  </div>

                  <div className={`space-y-1 flex-1 ${selectedOrder.status === 'completed' ? 'text-emerald-450' : 'text-stone-600'}`}>
                    <span className="block text-xs">✅</span>
                    <span>Served</span>
                  </div>
                </div>
              )}

              {/* Order Items receipt detail */}
              <div className="space-y-2 pb-2">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest block font-bold mb-1">Receipt Summary</span>
                <div className="space-y-2 bg-stone-950/50 p-4 rounded-2xl border border-stone-850 font-sans text-xs">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-stone-200">
                      <span>{item.quantity}x <strong className="text-stone-100">{item.name}</strong></span>
                      <span className="font-mono">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-stone-800/80 my-2 pt-2 flex justify-between font-bold text-amber-500 font-mono text-sm leading-none">
                    <span>Grand Total:</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Service Details info */}
              <div className="grid grid-cols-2 gap-3 text-[10px] text-stone-400 pt-1">
                <div className="bg-stone-950/30 p-2.5 border border-stone-850 rounded-xl space-y-0.5">
                  <p className="uppercase text-[9px] font-black text-stone-500">Service Concept</p>
                  <p className="text-stone-200 font-bold">{selectedOrder.type === 'dine_in' ? 'Dine In' : 'Takeaway Box'}</p>
                </div>
                <div className="bg-stone-950/30 p-2.5 border border-stone-850 rounded-xl space-y-0.5">
                  <p className="uppercase text-[9px] font-black text-stone-500">Service Station</p>
                  <p className="text-stone-200 font-bold">{selectedOrder.tableNo || 'No Table Assigned'}</p>
                </div>
                <div className="bg-stone-950/30 p-2.5 border border-stone-850 rounded-xl space-y-0.5 col-span-2">
                  <p className="uppercase text-[9px] font-black text-stone-500">Contact Guest</p>
                  <p className="text-stone-200 font-sans">{selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
                  {selectedOrder.customerEmail && (
                    <p className="text-stone-400 font-sans mt-0.5">Email: {selectedOrder.customerEmail}</p>
                  )}
                </div>
                {(selectedOrder.houseNumber || selectedOrder.buildingStreet || selectedOrder.areaLocality) && (
                  <div className="bg-stone-950/30 p-2.5 border border-stone-850 rounded-xl space-y-0.5 col-span-2">
                    <p className="uppercase text-[9px] font-black text-stone-500">Delivery Address</p>
                    <p className="text-stone-200 font-sans text-xs">
                      {selectedOrder.houseNumber ? `${selectedOrder.houseNumber}, ` : ''} 
                      {selectedOrder.buildingStreet ? `${selectedOrder.buildingStreet}, ` : ''} 
                      {selectedOrder.areaLocality || ''}
                    </p>
                    {selectedOrder.deliveryInstructions && (
                      <p className="text-amber-500 font-sans text-[11px] mt-1.5 p-1.5 bg-amber-950/20 border border-amber-900/40 rounded-lg">
                        📝 <span className="font-bold text-stone-300">Instructions:</span> "{selectedOrder.deliveryInstructions}"
                      </p>
                    )}
                    {selectedOrder.latitude !== undefined && selectedOrder.longitude !== undefined && (
                      <p className="text-[9px] text-amber-505 font-mono mt-1">
                        GPS Pins: {selectedOrder.latitude.toFixed(5)}, {selectedOrder.longitude.toFixed(5)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. BOOKING EXPANDED VIEW SCALE FROM CENTER */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-xs font-mono">
            {/* Backdrop click close */}
            <div className="absolute inset-0" onClick={() => setSelectedBooking(null)}></div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl relative max-w-md w-full z-10 text-stone-200 space-y-4"
            >
              <button 
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-stone-800 pb-3 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Table Reservation Voucher</span>
                <h4 className="text-base font-black text-stone-100 font-mono mt-1">
                  CODE {selectedBooking.id.replace('b_', '').toUpperCase()}
                </h4>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Requested on {formatShortDate(selectedBooking.createdAt)}
                </p>
              </div>

              {/* Status details Box */}
              <div className="bg-stone-950/50 p-4 border border-stone-850 rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5">
                <p className="text-[9px] uppercase text-stone-550 tracking-widest font-black">Cozy Station status</p>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {selectedBooking.status === 'confirmed' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> APPROVED & RESERVED
                    </span>
                  ) : selectedBooking.status === 'cancelled' ? (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> CANCELLED
                    </span>
                  ) : selectedBooking.status === 'pending_delete' ? (
                    <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                      <AlertCircle className="w-4 h-4" /> PENDING DELETE
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-4 h-4 animate-spin" /> WAITING FOR APPROVAL
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-400 max-w-[280px]">
                  {selectedBooking.status === 'confirmed' 
                    ? `Your specific table seat ${selectedBooking.tableNo || 'Table 4'} is locked. Present this code at the reception counter.`
                    : selectedBooking.status === 'cancelled'
                    ? 'This reservation voucher was cancelled by you or our lounge manager.'
                    : selectedBooking.status === 'pending_delete'
                    ? 'This reservation is marked as pending deletion by the lounge manager.'
                    : 'The staff has received your table reservation. It is currently WAITING for administrative review and seating layout confirmation.'}
                </p>
              </div>

              {/* Reservation data lists */}
              <div className="space-y-2 text-xs font-sans">
                <div className="bg-stone-950/40 p-3 rounded-xl border border-stone-850 divide-y divide-stone-850 space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-450 text-[11px]">Primary Guest</span>
                    <span className="text-stone-200 font-bold">{selectedBooking.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-450 text-[11px]">Cozy Party size</span>
                    <span className="text-stone-200 font-bold">{selectedBooking.guests} People</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-450 text-[11px]">Date Scheduled</span>
                    <span className="text-stone-200 font-bold">{formatShortDate(selectedBooking.date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-stone-450 text-[11px]">Arrival Time Block</span>
                    <span className="text-stone-200 font-extrabold text-amber-500 font-mono">{selectedBooking.time}</span>
                  </div>
                </div>

                {selectedBooking.notes && (
                  <div className="bg-stone-950/20 p-3 rounded-xl border border-stone-850 text-stone-400 text-xs">
                    <span className="font-bold text-stone-300 block text-[10px] uppercase font-mono tracking-wider mb-1">Additional Host Notes</span>
                    <p className="italic leading-relaxed">"{selectedBooking.notes}"</p>
                  </div>
                )}
              </div>

              {/* Contact coordinates */}
              <div className="flex justify-between items-center text-[10px] text-stone-500 pt-1">
                <span>📞 {selectedBooking.phone}</span>
                <span>✉️ {selectedBooking.email}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
