import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, Clock, ChefHat, Sparkles, MessageSquare } from 'lucide-react';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'booking' | 'system' | 'general';
  createdAt: Date;
  icon?: React.ReactNode;
  targetUserId?: string;
}

// Global hook / state helper for triggering notifications easily
let globalAddNotification: (
  title: string,
  message: string,
  type?: 'order' | 'booking' | 'system' | 'general',
  targetUserId?: string
) => void = () => {};

export function triggerPushNotification(
  title: string,
  message: string,
  type?: 'order' | 'booking' | 'system' | 'general',
  targetUserId?: string
) {
  if (globalAddNotification) {
    globalAddNotification(title, message, type, targetUserId);
  }
}

interface NotificationCenterProps {
  user?: any;
  isAdmin?: boolean;
}

export default function NotificationCenter({ user, isAdmin }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [activeBanner, setActiveBanner] = useState<PushNotification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getStorageKey = () => {
    return user ? `cafe_notifications_${user.uid}` : 'cafe_notifications_guest';
  };

  // Sync state whenever the current user changes
  useEffect(() => {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    let currentNotifs = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const refMapped = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
        setNotifications(refMapped);
        currentNotifs = refMapped;
      } catch (err) {
        setNotifications([]);
      }
    } else {
      // Setup dynamic personalized welcome message
      const welcome: PushNotification = {
        id: 'welcome_' + Math.random().toString(36).substring(2, 9),
        title: user ? 'Welcome to Sutta Lounge Hub!' : 'Welcome to Chai Sutta Bar!',
        message: user 
          ? `Hi ${user.displayName || user.email?.split('@')[0]}! Your personalized account notifications and live order trackers will appear right here.`
          : 'Explore our rich varieties of kulhad chai, smoky herbal sutta, and delicious hot fast snacks.',
        type: 'system',
        createdAt: new Date()
      };
      setNotifications([welcome]);
      currentNotifs = [welcome];
      localStorage.setItem(key, JSON.stringify([welcome]));
    }
    // Update count immediately
    window.dispatchEvent(new CustomEvent('cafe_notifs_cleared_or_updated'));
  }, [user]);

  // Handle external toggle and open events
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('cafe_toggle_notif_drawer', handleToggle);
    window.addEventListener('cafe_open_notif_drawer', handleOpen);
    return () => {
      window.removeEventListener('cafe_toggle_notif_drawer', handleToggle);
      window.removeEventListener('cafe_open_notif_drawer', handleOpen);
    };
  }, []);

  const addNotification = (
    title: string,
    message: string,
    type: 'order' | 'booking' | 'system' | 'general' = 'general',
    targetUserId?: string
  ) => {
    // If targetUserId is specified and does NOT match current logged-in user, skip saving to this profile
    if (targetUserId && user?.uid !== targetUserId) {
      return;
    }

    const newNotif: PushNotification = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type,
      createdAt: new Date(),
      targetUserId
    };

    setNotifications(prev => [newNotif, ...prev]);
    setActiveBanner(newNotif);

    // Auto dismiss after 5.5 seconds
    setTimeout(() => {
      setActiveBanner(prev => (prev?.id === newNotif.id ? null : prev));
    }, 5500);

    // Save to user-specific storage key
    const key = getStorageKey();
    const stored = localStorage.getItem(key) || '[]';
    try {
      const parsed = JSON.parse(stored);
      localStorage.setItem(key, JSON.stringify([newNotif, ...parsed].slice(0, 55)));
    } catch (e) {
      localStorage.setItem(key, JSON.stringify([newNotif]));
    }

    // Trigger standard native custom event to update other instances in other tabs
    window.dispatchEvent(new CustomEvent('cafe_new_push_alert', { detail: newNotif }));
    window.dispatchEvent(new CustomEvent('cafe_notifs_cleared_or_updated'));
  };

  useEffect(() => {
    globalAddNotification = addNotification;

    // Listen to localStorage changes for synchronization
    const handleStorageChange = (e: StorageEvent) => {
      const currentKey = getStorageKey();
      if (e.key === currentKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          // Map to push notifications list safely
          if (parsed.length > 0 && (!notifications.length || parsed[0].id !== notifications[0]?.id)) {
            const latest = parsed[0];
            const refMapped = parsed.map((item: any) => ({
              ...item,
              createdAt: new Date(item.createdAt)
            }));
            setNotifications(refMapped);

            // Trigger active banner if it matches current user / undefined
            if (!latest.targetUserId || latest.targetUserId === user?.uid) {
              setActiveBanner({
                ...latest,
                createdAt: new Date(latest.createdAt)
              });
              setTimeout(() => {
                setActiveBanner(prev => (prev?.id === latest.id ? null : prev));
              }, 5500);
            }
          }
        } catch (err) {
          console.error('Error parsing storage sync action', err);
        }
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const detail = customEvent.detail;
        
        // Skip if notification has specified targetUserId and it doesn't match this page's user
        if (detail.targetUserId && detail.targetUserId !== user?.uid) {
          return;
        }

        if (!notifications.some(n => n.id === detail.id)) {
          setNotifications(prev => [detail, ...prev]);
          setActiveBanner(detail);
          setTimeout(() => {
            setActiveBanner(prev => (prev?.id === detail.id ? null : prev));
          }, 5500);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cafe_new_push_alert', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cafe_new_push_alert', handleCustomEvent);
    };
  }, [user, notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ChefHat className="w-5 h-5 text-amber-500" />;
      case 'booking':
        return <Clock className="w-5 h-5 text-emerald-500" />;
      case 'system':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <>
      {/* 1. iOS / Android Mobile-Style Device Push Notification Banner */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none md:max-w-md md:mx-auto">
        <AnimatePresence>
          {activeBanner && (
            <motion.div
              id="push-banner"
              initial={{ opacity: 0, y: -80, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 150 }}
              className="w-full bg-stone-900/95 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl border border-stone-800 pointer-events-auto p-4 flex gap-3 text-stone-100"
            >
              <div className="flex-shrink-0 bg-stone-800 p-2.5 rounded-xl flex items-center justify-center self-start shadow-inner border border-stone-700">
                {getIcon(activeBanner.type)}
              </div>
              <div className="flex-grow min-w-0 pr-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                    {activeBanner.type === 'order' && 'Order Tracker'}
                    {activeBanner.type === 'booking' && 'Reservation Alert'}
                    {activeBanner.type === 'system' && 'Staff Desk'}
                    {activeBanner.type === 'general' && 'Cafe Bulletin'}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">now</span>
                </div>
                <h4 className="text-sm font-bold text-stone-100 mt-0.5 leading-tight truncate">
                  {activeBanner.title}
                </h4>
                <p className="text-xs text-stone-300 mt-1 font-sans leading-relaxed">
                  {activeBanner.message}
                </p>
                {/* Visual Status Indicator Spark */}
                <div className="mt-2 w-full bg-stone-800 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5 }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setActiveBanner(null)}
                className="flex-shrink-0 self-start p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Push Notification History Drawer Toggle Badge is now placed in the top navigation header beside Login button */}

      {/* 3. Sliding Notification Log Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              id="notif-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-stone-900 border-l border-stone-800 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-950 p-1.5 rounded-lg border border-amber-900/30">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-100">Notification History</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between py-3 text-xs border-b border-stone-800 text-stone-400">
                <span>{notifications.length} notifications</span>
                <button
                  onClick={() => {
                    setNotifications([]);
                    localStorage.setItem(getStorageKey(), '[]');
                    window.dispatchEvent(new CustomEvent('cafe_notifs_cleared_or_updated'));
                  }}
                  className="hover:text-amber-400 transition"
                >
                  Clear all
                </button>
              </div>

              {/* Notification log list */}
              <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-stone-500">
                    <MessageSquare id="empty-icon" className="w-10 h-10 mb-2 stroke-1" />
                    <p className="text-sm">Your log is beautifully clean.</p>
                    <p className="text-xs text-stone-600 mt-1">Alerts about orders and table bookings will display here in real-time.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className="p-3 bg-stone-800/50 rounded-xl border border-stone-800 hover:border-stone-700 transition flex items-start gap-2.5"
                    >
                      <div className="bg-stone-800 p-2 rounded-lg flex-shrink-0">
                        {getIcon(notif.type)}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h5 className="text-xs font-bold text-stone-200 leading-tight">
                          {notif.title}
                        </h5>
                        <p className="text-xs text-stone-400 mt-1 leading-normal font-sans">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-stone-500 mt-1.5 block font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Visual simulation controller for demonstration */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 mt-auto">
                <span className="text-[10px] font-mono font-medium text-stone-500 uppercase tracking-widest block mb-2">Simulate Cloud Push Delivery</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => addNotification(
                      'Fresh Batch Hot Ready!',
                      'Chef has brewed a fresh pot of Adrak Elaichi Kulhad Tea! Sip in the aroma.',
                      'general',
                      user?.uid || undefined
                    )}
                    className="p-2 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700 transition text-center cursor-pointer"
                  >
                    ☕ Brew Update
                  </button>
                  <button
                    onClick={() => addNotification(
                      'Table confirmation',
                      `Table 6 is confirmed by staff for ${user ? (user.displayName || user.email?.split('@')[0]) : 'Siddharth'} tonight.`,
                      'booking',
                      user?.uid || undefined
                    )}
                    className="p-2 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700 transition text-center cursor-pointer"
                  >
                    📅 Booking Alert
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
