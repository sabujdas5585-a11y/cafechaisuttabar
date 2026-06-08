import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_MENU_ITEMS,
  INITIAL_INGREDIENTS,
  INITIAL_BOOKINGS,
  INITIAL_TESTIMONIALS
} from './data/initialData';
import { MenuItem, Booking, Ingredient, Order, Testimonial } from './types';
import NotificationCenter, { triggerPushNotification } from './components/NotificationCenter';
import AdminPanel from './components/AdminPanel';
import MenuSection from './components/MenuSection';
import BookingSection from './components/BookingSection';
import GallerySection from './components/GallerySection';
import UserProfileSection from './components/UserProfileSection';
import {
  Coffee, MapPin, Phone, Facebook, Star, LogIn, LogOut, Code, Heart, HelpCircle,
  Menu, X, Sparkles, MessageSquare, Plus, Clock, ExternalLink, Instagram, Send, Mail, Bell
} from 'lucide-react';

import { db, auth, OperationType, handleFirestoreError, sanitizeForFirestore } from './lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';

export default function App() {
  // Navigation Screens ('home' | 'menu' | 'bookings' | 'gallery' | 'profile')
  const [activeScreen, setActiveScreen] = useState<'home' | 'menu' | 'bookings' | 'gallery' | 'profile'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States with LocalStorage Sync and live Firestore connection fallback
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('cafe_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('cafe_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('cafe_ingredients');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('cafe_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    const saved = localStorage.getItem('cafe_testimonials');
    return saved ? JSON.parse(saved) : INITIAL_TESTIMONIALS;
  });

  // Helper helper to generate state-synchronized Firestore write mutations
  const createFirebaseSetter = <T extends { id: string }>(
    collectionName: string,
    localSetter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    return (update: React.SetStateAction<T[]>) => {
      localSetter((prev) => {
        const next = typeof update === 'function' ? (update as Function)(prev) : update;
        
        // Compute differences and perform writes in background asynchronously
        const deleted = prev.filter(p => !next.some((n: T) => n.id === p.id));
        const addedOrModified = next.filter((n: T) => {
          const p = prev.find(x => x.id === n.id);
          return !p || JSON.stringify(p) !== JSON.stringify(n);
        });

        deleted.forEach((item) => {
          deleteDoc(doc(db, collectionName, item.id)).catch(err => {
            handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${item.id}`);
          });
        });

        addedOrModified.forEach((item: T) => {
          setDoc(doc(db, collectionName, item.id), sanitizeForFirestore(item)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${item.id}`);
          });
        });

        return next;
      });
    };
  };

  const setMenuItemsWithFirebase = createFirebaseSetter<MenuItem>('menuItems', setMenuItems);
  const setBookingsWithFirebase = createFirebaseSetter<Booking>('bookings', setBookings);
  const setIngredientsWithFirebase = createFirebaseSetter<Ingredient>('ingredients', setIngredients);
  const setOrdersWithFirebase = createFirebaseSetter<Order>('orders', setOrders);
  const setTestimonialsWithFirebase = createFirebaseSetter<Testimonial>('testimonials', setTestimonials);

  // Connection testing + Database bootstrapping + real-time listeners initialization
  useEffect(() => {
    const testConnectionAndInit = async () => {
      // 1. Validate connection to Firestore
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }

      // 2. Bootstrap collections if they are empty
      try {
        const menuSnap = await getDocs(collection(db, 'menuItems'));
        if (menuSnap.empty) {
          for (const item of INITIAL_MENU_ITEMS) {
            await setDoc(doc(db, 'menuItems', item.id), sanitizeForFirestore(item));
          }
        }
        
        const bookingsSnap = await getDocs(collection(db, 'bookings'));
        if (bookingsSnap.empty) {
          for (const item of INITIAL_BOOKINGS) {
            await setDoc(doc(db, 'bookings', item.id), sanitizeForFirestore(item));
          }
        }

        const ingredientsSnap = await getDocs(collection(db, 'ingredients'));
        if (ingredientsSnap.empty) {
          for (const item of INITIAL_INGREDIENTS) {
            await setDoc(doc(db, 'ingredients', item.id), sanitizeForFirestore(item));
          }
        }

        const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
        if (testimonialsSnap.empty) {
          for (const item of INITIAL_TESTIMONIALS) {
            await setDoc(doc(db, 'testimonials', item.id), sanitizeForFirestore(item));
          }
        }
      } catch (error) {
        console.warn('Bootstrap or permissions warming status:', error);
      }
    };

    testConnectionAndInit().then(() => {
      // 3. Real-time synchronisation listeners
      const unsubMenu = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as MenuItem);
        });
        if (items.length > 0) {
          setMenuItems(items);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'menuItems');
      });

      const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
        const items: Booking[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Booking);
        });
        if (items.length > 0) {
          setBookings(items);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'bookings');
      });

      const unsubIngredients = onSnapshot(collection(db, 'ingredients'), (snapshot) => {
        const items: Ingredient[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Ingredient);
        });
        if (items.length > 0) {
          setIngredients(items);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'ingredients');
      });

      const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        const items: Order[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Order);
        });
        setOrders(items);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'orders');
      });

      const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
        const items: Testimonial[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Testimonial);
        });
        if (items.length > 0) {
          setTestimonials(items);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'testimonials');
      });

      return () => {
        unsubMenu();
        unsubBookings();
        unsubIngredients();
        unsubOrders();
        unsubTestimonials();
      };
    });
  }, []);

  // Firebase User Auth States
  const [user, setUser] = useState<User | null>(null);

  // Sync notification badge count
  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    const updateCount = () => {
      const key = user ? `cafe_notifications_${user.uid}` : 'cafe_notifications_guest';
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifCount(parsed.length);
        } else {
          setNotifCount(1); // default welcome reminder count
        }
      } catch (e) {
        setNotifCount(0);
      }
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('cafe_new_push_alert', updateCount);
    window.addEventListener('cafe_notifs_cleared_or_updated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('cafe_new_push_alert', updateCount);
      window.removeEventListener('cafe_notifs_cleared_or_updated', updateCount);
    };
  }, [user]);

  const [isSignUp, setIsSignUp] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('cafe_is_admin') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Clear modal messages on close
  useEffect(() => {
    if (!showLoginModal) {
      setLoginError('');
      setLoginSuccess('');
    }
  }, [showLoginModal]);

  // Floating staff control trigger state
  const [viewingAdminPortal, setViewingAdminPortal] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === 'admincafe@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  // Customer Review Inputs
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setNewReviewName(user.displayName || user.email?.split('@')[0] || '');
    } else {
      setNewReviewName('');
    }
  }, [user]);

  // Save states to LocalStorage on updates (fallback persistence)
  useEffect(() => {
    localStorage.setItem('cafe_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('cafe_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('cafe_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('cafe_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('cafe_testimonials', JSON.stringify(testimonials));
  }, [testimonials]);

  useEffect(() => {
    localStorage.setItem('cafe_is_admin', String(isAdmin));
  }, [isAdmin]);

  // Scroll to top when active section or admin portal state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeScreen, viewingAdminPortal]);

  // Auth Submit for Firebase
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        if (displayNameInput.trim()) {
          await updateProfile(userCredential.user, { displayName: displayNameInput.trim() });
        }
        triggerPushNotification(
          'Account Created! 🎉',
          `Welcome to Chai Sutta Bar! You are now logged in.`,
          'system'
        );
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const name = userCredential.user.displayName || userCredential.user.email?.split('@')[0];
        triggerPushNotification(
          'Welcome Back! ☕',
          `Hi ${name}, you have successfully signed in.`,
          'system'
        );
      }
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      setDisplayNameInput('');
    } catch (err: any) {
      console.error('Firebase Auth Error: ', err);
      let errorMsg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      }
      setLoginError(errorMsg);
    }
  };

  const handleForgotPassword = async () => {
    setLoginError('');
    setLoginSuccess('');
    if (!loginEmail || !loginEmail.trim()) {
      setLoginError('Please enter your email address first so we can send a reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail.trim());
      setLoginSuccess(`Password reset email sent to ${loginEmail.trim()}! Please check your inbox and spam folders.`);
      triggerPushNotification(
        'Reset Email Sent ✉️',
        `Password reset link dispatched to ${loginEmail.trim()}.`,
        'system'
      );
    } catch (err: any) {
      console.error('Password Reset Error: ', err);
      let errorMsg = err.message || 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'No user found with this email address.';
      }
      setLoginError(errorMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      triggerPushNotification(
        'Google Signed In ☕',
        `Welcome to Chai Sutta Bar, ${userCredential.user.displayName || userCredential.user.email || 'friend'}!`,
        'system'
      );
      setShowLoginModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setLoginError('Sign-in popup blocked by browser. Please allow popups for this site.');
      } else {
        setLoginError(err.message || 'Failed to authenticate with Google.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdmin(false);
      setViewingAdminPortal(false);
      triggerPushNotification(
        'Logged Out Successfully',
        'You have been logged out from Chai Sutta Bar.',
        'system'
      );
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Add Customer Feedback testimonial
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewText.trim()) return;

    const newReview: Testimonial = {
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      name: newReviewName,
      rating: newReviewRating,
      text: newReviewText,
      date: new Date().toISOString().split('T')[0],
      isVisible: true,
      userId: user?.uid || undefined,
      status: 'none'
    };

    setTestimonialsWithFirebase(prev => [newReview, ...prev]);
    setReviewSuccess(true);
    setNewReviewName('');
    setNewReviewText('');
    setNewReviewRating(5);

    triggerPushNotification(
      'Feedback Published! 💖',
      `Thank you ${newReviewName}! Your rating of ${newReviewRating} stars was submitted to testimonials.`,
      'general'
    );

    setTimeout(() => {
      setReviewSuccess(false);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-stone-950 pb-20">
      
      {/* Real-time iOS Style Push Notifications Hub */}
      <NotificationCenter user={user} />

      {/* =============== DESIGN HEADER NAVIGATION BAR =============== */}
      <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-900 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Name */}
          <div
            onClick={() => { setActiveScreen('home'); setViewingAdminPortal(false); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/20 group-hover:border-transparent transition-all duration-300">
              <img
                src="https://scontent.fccu16-1.fna.fbcdn.net/v/t39.30808-6/300777004_448870183925276_8344510513203921736_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=4kpmo5IAZEAQ7kNvwGE0OlZ&_nc_oc=Adp99hN2CnG-SlC5RI2n6e9MgCLlf7_nzdx3GGRPtMsV7cPJJM0NI3iCj8wk8LlxC50&_nc_zt=23&_nc_ht=scontent.fccu16-1.fna&_nc_gid=NJQd_NsdwiajBoFO7pZMFw&_nc_ss=7b289&oh=00_Af_RFqxAiepy3MMpzvvGMWsZPHer1x6LlzyttXgS_ksCpg&oe=6A270F01"
                alt="Chai Sutta Bar Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-black font-mono tracking-tight uppercase text-amber-500">
                Chai Sutta Bar
              </h1>
              <span className="text-[9px] text-stone-400 font-mono tracking-widest block -mt-1 uppercase">
                Madhuban More, Jhargram
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Responsive design constraint) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => { setActiveScreen('home'); setViewingAdminPortal(false); }}
              className={`hover:text-amber-500 transition cursor-pointer ${activeScreen === 'home' && !viewingAdminPortal ? 'text-amber-500 font-black' : 'text-stone-300'}`}
            >
              Cozy Den
            </button>
            <button
              onClick={() => { setActiveScreen('menu'); setViewingAdminPortal(false); }}
              className={`hover:text-amber-500 transition cursor-pointer ${activeScreen === 'menu' && !viewingAdminPortal ? 'text-amber-500 font-black' : 'text-stone-300'}`}
            >
              Online Menu
            </button>
            <button
              onClick={() => { setActiveScreen('gallery'); setViewingAdminPortal(false); }}
              className={`hover:text-amber-500 transition cursor-pointer ${activeScreen === 'gallery' && !viewingAdminPortal ? 'text-amber-500 font-black' : 'text-stone-300'}`}
            >
              Cozy Gallery
            </button>
            <button
              onClick={() => { setActiveScreen('bookings'); setViewingAdminPortal(false); }}
              className={`hover:text-amber-500 transition cursor-pointer ${activeScreen === 'bookings' && !viewingAdminPortal ? 'text-amber-500 font-black' : 'text-stone-300'}`}
            >
              Reservations
            </button>
            <button
              onClick={() => { setActiveScreen('profile'); setViewingAdminPortal(false); }}
              className={`hover:text-amber-500 transition cursor-pointer ${activeScreen === 'profile' && !viewingAdminPortal ? 'text-amber-500 font-black' : 'text-stone-300'}`}
            >
              My Profile
            </button>

            {isAdmin && (
              <button
                onClick={() => setViewingAdminPortal(!viewingAdminPortal)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] uppercase tracking-wider font-bold transition font-mono ${
                  viewingAdminPortal
                    ? 'bg-amber-600/10 border-amber-500 text-amber-500 font-black'
                    : 'border-stone-850 hover:bg-stone-900 text-amber-400'
                }`}
              >
                ● Admin Panel
              </button>
            )}
          </nav>

          {/* Login Status Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Desktop Notification Bell beside login/logout */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('cafe_toggle_notif_drawer'))}
                  className="relative p-2.5 text-stone-400 hover:text-amber-500 hover:bg-stone-905 border border-stone-850 hover:border-stone-800 rounded-xl transition cursor-pointer flex items-center justify-center"
                  title="Notification Center"
                >
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
                      {notifCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveScreen('profile'); setViewingAdminPortal(false); }}
                  className="text-xs text-stone-300 hover:text-amber-500 transition font-medium cursor-pointer"
                  title="View Profile Hub"
                >
                  Hi, <span className="text-amber-500 font-bold underline decoration-amber-500/30 hover:decoration-amber-500">{user.displayName || user.email?.split('@')[0]}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-stone-350 hover:text-white text-xs border border-stone-800 hover:border-stone-700 px-3 py-2 rounded-xl transition font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Desktop Notification Bell beside login */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('cafe_toggle_notif_drawer'))}
                  className="relative p-2.5 text-stone-400 hover:text-amber-500 hover:bg-stone-905 border border-stone-850 hover:border-stone-800 rounded-xl transition cursor-pointer flex items-center justify-center mr-1"
                  title="Notification Center"
                >
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
                      {notifCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setIsSignUp(false); setShowLoginModal(true); }}
                  className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 text-amber-400 hover:text-stone-950 hover:bg-amber-500 text-xs px-4 py-2 rounded-xl font-bold transition duration-300 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> Login / Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile login / profile button beside the hamburger/menu button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Notification Bell beside mobile login/profile */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('cafe_toggle_notif_drawer'))}
              className="relative p-2.5 text-stone-400 hover:text-amber-500 bg-stone-900 border border-stone-850 rounded-lg transition cursor-pointer flex items-center justify-center"
              title="Notification Center"
            >
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-stone-950">
                  {notifCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={() => { setActiveScreen('profile'); setViewingAdminPortal(false); }}
                className="flex items-center gap-1 bg-stone-900 border border-stone-850 text-amber-400 text-[11px] px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                title="My Profile"
              >
                <span className="max-w-[75px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => { setIsSignUp(false); setShowLoginModal(true); }}
                className="flex items-center gap-1 bg-stone-900 border border-stone-800 text-amber-500 hover:text-stone-950 hover:bg-amber-500 text-[11px] px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
              >
                <LogIn className="w-3 h-3" /> Login
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-2 text-stone-400 hover:text-stone-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu lists Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md md:hidden"
            />
            {/* Modal Dialog for Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[10%] max-w-sm mx-auto bg-stone-900 border border-stone-850 p-6 rounded-3xl shadow-2xl z-50 space-y-4 font-sans md:hidden"
            >
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <div className="flex items-center gap-1.5">
                  <Coffee className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-stone-100 font-mono uppercase tracking-wider">
                    Cafe Navigation
                  </h4>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-stone-400 hover:text-stone-200 cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setActiveScreen('home'); setViewingAdminPortal(false); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                    activeScreen === 'home' && !viewingAdminPortal
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-500'
                      : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-700 hover:bg-stone-950'
                  }`}
                >
                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-500 transition-colors">
                    <Coffee className="w-4 h-4 text-amber-500 group-hover:text-stone-950" />
                  </div>
                  <div>
                    <strong className="block text-xs text-stone-100 group-hover:text-amber-400 font-sans">Cozy Den</strong>
                    <span className="text-[10px] text-stone-500 font-mono block">Welcome, Stories & Lounge</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveScreen('menu'); setViewingAdminPortal(false); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                    activeScreen === 'menu' && !viewingAdminPortal
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-500'
                      : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-700 hover:bg-stone-950'
                  }`}
                >
                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-500 transition-colors">
                    <Sparkles className="w-4 h-4 text-amber-500 group-hover:text-stone-950" />
                  </div>
                  <div>
                    <strong className="block text-xs text-stone-100 group-hover:text-amber-400 font-sans">Our Live Menu</strong>
                    <span className="text-[10px] text-stone-500 font-mono block">Teas, Bun Maskas & Snacks</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveScreen('bookings'); setViewingAdminPortal(false); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                    activeScreen === 'bookings' && !viewingAdminPortal
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-500'
                      : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-700 hover:bg-stone-950'
                  }`}
                >
                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-500 transition-colors">
                    <Clock className="w-4 h-4 text-amber-500 group-hover:text-stone-950" />
                  </div>
                  <div>
                    <strong className="block text-xs text-stone-100 group-hover:text-amber-400 font-sans">Reservations</strong>
                    <span className="text-[10px] text-stone-500 font-mono block">Secure Mats or Tables Online</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveScreen('gallery'); setViewingAdminPortal(false); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                    activeScreen === 'gallery' && !viewingAdminPortal
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-500'
                      : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-700 hover:bg-stone-950'
                  }`}
                >
                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-500 transition-colors">
                    <Star className="w-4 h-4 text-amber-500 group-hover:text-stone-950" />
                  </div>
                  <div>
                    <strong className="block text-xs text-stone-100 group-hover:text-amber-400 font-sans">Cozy Gallery</strong>
                    <span className="text-[10px] text-stone-500 font-mono block">Aura, Decor & Guest Snapshots</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveScreen('profile'); setViewingAdminPortal(false); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                    activeScreen === 'profile' && !viewingAdminPortal
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-500'
                      : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-700 hover:bg-stone-950'
                  }`}
                >
                  <div className="bg-amber-950/80 p-2 rounded-lg border border-amber-900/30 group-hover:bg-amber-500 transition-colors">
                    <Heart className="w-4 h-4 text-amber-500 group-hover:text-stone-950" />
                  </div>
                  <div>
                    <strong className="block text-xs text-stone-100 group-hover:text-amber-400 font-sans">Your Profile Hub</strong>
                    <span className="text-[10px] text-stone-500 font-mono block">Order History & Personal Settings</span>
                  </div>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { setViewingAdminPortal(!viewingAdminPortal); setMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition group ${
                      viewingAdminPortal
                        ? 'bg-red-950/20 border-red-500/50 text-red-500'
                        : 'bg-stone-950/50 border-stone-800/60 text-stone-300 hover:border-stone-750'
                    }`}
                  >
                    <div className="bg-red-950/80 p-2 rounded-lg border border-red-900/30 group-hover:bg-red-500 transition-colors">
                      <Code className="w-4 h-4 text-red-500 group-hover:text-stone-950" />
                    </div>
                    <div>
                      <strong className="block text-xs text-stone-100 group-hover:text-red-400 font-sans">👑 Admin Operations Hub</strong>
                      <span className="text-[10px] text-stone-500 font-mono block">Admin Tools & System Management</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Login/logout drawer action buttons */}
              <div className="pt-2 border-t border-stone-800 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="text-center text-stone-400 text-[10px] uppercase tracking-wider font-mono">
                      Active: <span className="text-amber-500 font-bold">{user.displayName || user.email?.split('@')[0]}</span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-1.5 bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-300 hover:text-white py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-stone-500" /> End Active Session
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsSignUp(false); setShowLoginModal(true); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 py-2.5 rounded-2xl uppercase tracking-wider text-[11px] font-black shadow-lg shadow-amber-950/20 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Access Member Account
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =============== PRIMARY MAIN BODY LAYOUT VIEWPORT =============== */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* If Staff Panel toggle is active */}
        {viewingAdminPortal ? (
          <div className="animate-fadeIn">
            <AdminPanel
              menuItems={menuItems}
              setMenuItems={setMenuItemsWithFirebase}
              bookings={bookings}
              setBookings={setBookingsWithFirebase}
              ingredients={ingredients}
              setIngredients={setIngredientsWithFirebase}
              orders={orders}
              setOrders={setOrdersWithFirebase}
              testimonials={testimonials}
              setTestimonials={setTestimonialsWithFirebase}
              onClose={() => setViewingAdminPortal(false)}
            />
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* SCREEN 1: COZY DEN HOME */}
            {activeScreen === 'home' && (
              <>
                {/* Visual Accent Hero Section: Immersive Image Background */}
                <div className="relative overflow-hidden p-8 md:p-14 rounded-3xl border border-stone-800/80 flex flex-col md:flex-row items-center gap-8 shadow-2xl min-h-[420px] md:min-h-[460px]">
                  {/* High Quality Cafe Background Image */}
                  <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    <img
                      src="https://lh3.googleusercontent.com/gps-cs-s/APNQkAF0DEFcTrgtG8YZ94MUvnRjVFgMMNXx5OchpYRGYEVZzOKphdoYgYtp3pnwhXDsuITUnQU7wWHQGSQv3Ul0cxjszxSPOaqxnBmoMqtfxlbWfwmx_X_tTbmd1miZTiQpQZHVw2o=s680-w680-h510-rw"
                      alt="Cafe Background"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover scale-100"
                    />
                    {/* Multilayer premium dark gradients for maximum overlay text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent md:block hidden" />
                    <div className="absolute inset-0 bg-stone-950/75 md:hidden block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/45" />
                  </div>

                  {/* Overlaid Hero Content */}
                  <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
                    {/* Animated Curved Ribbon Note resembling the reference image */}
                    <div className="relative overflow-visible h-14 w-full max-w-[320px] mx-auto md:mx-0 my-3 flex items-center justify-center md:justify-start">
                      <svg
                        className="w-full h-18 overflow-visible select-none pointer-events-none"
                        viewBox="0 0 320 60"
                      >
                        <defs>
                          <path
                            id="curved-note-path"
                            d="M -20,30 C 50,5 110,55 160,30 C 210,5 270,55 340,30"
                          />
                        </defs>
                        {/* Shadow Curve */}
                        <use
                          href="#curved-note-path"
                          fill="none"
                          stroke="#1c1613"
                          strokeWidth="24"
                          className="opacity-75"
                        />
                        {/* Main Colored Ribbon Line */}
                        <use
                          href="#curved-note-path"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="20"
                          strokeLinecap="round"
                        />
                        {/* Text Path on Curve */}
                        <text className="fill-stone-950 font-sans font-black text-[8px] uppercase tracking-[0.14em]">
                          <textPath href="#curved-note-path" startOffset="0%">
                            COZY TEA LOUNGES IN JHARGRAM • JHARGRAM • COZY TEA LOUNGES IN JHARGRAM • JHARGRAM •
                            <animate
                              attributeName="startOffset"
                              from="0%"
                              to="-50%"
                              dur="10s"
                              repeatCount="indefinite"
                            />
                          </textPath>
                        </text>
                      </svg>
                    </div>
                    <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
                      Brewing Conversations over <span className="text-amber-500">Clay Kulhads</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => setActiveScreen('menu')}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-lg hover:shadow-amber-500/10 transition duration-200 cursor-pointer"
                      >
                        Browse Online Menu
                      </button>
                      <button
                        onClick={() => setActiveScreen('bookings')}
                        className="bg-stone-900/50 backdrop-blur-sm text-stone-200 border border-stone-800 hover:bg-stone-800 p-3 px-6 py-3.5 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Reserve Seating Table
                      </button>
                    </div>
                  </div>

                  {/* Secondary imagery for spatial balance, cleanly styled */}
                  <div className="relative z-10 w-full md:w-2/5 aspect-[4/3] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border border-stone-800/80 group md:block hidden">
                    <img
                      src="https://lh3.googleusercontent.com/gps-cs-s/APNQkAElVlJOZ3O1z5ZWtjp1NgRd6k_EeUrpUbWkQjb2l8sK0Dr7mUQAMo8gkGlVZu-EGnkQNmrv0uAQFkK79u8xkKlWdJfAoFndBQAQxqwSQ4CEZJUh7jnG8WsOaT9JngatJtbnHbd7Lw=s680-w680-h510-rw"
                      alt="Cozy Chai Sutta Bar Lounge"
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                  </div>
                </div>

                {/* Popular recommendations scroll view */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest">
                        Fresh From clay counters
                      </span>
                      <h3 className="text-xl font-black text-stone-100 mt-0.5">Highly Recommended Brew & Bites</h3>
                    </div>
                    <button
                      onClick={() => setActiveScreen('menu')}
                      className="text-stone-400 hover:text-amber-500 text-xs font-bold transition flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      Browse full menu →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {menuItems.filter(item => item.isPopular).slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-stone-700 transition duration-300 group"
                      >
                        <div className="space-y-3">
                          <div className="aspect-[16/10] bg-stone-800 rounded-xl overflow-hidden border border-stone-850">
                            <img
                              src={item.imageUrls[0]}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-500 font-mono">
                              {item.category === 'chai' ? 'Clay Pot Cup' : item.category.replace('_', ' ')}
                            </span>
                            <h4 className="text-sm font-bold text-stone-110 mt-0.5 truncate">{item.name}</h4>
                            <p className="text-[11px] text-stone-400 line-clamp-2 leading-normal mt-1">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-3 mt-3 border-t border-stone-800/65">
                          <span className="font-mono text-amber-400 font-extrabold text-sm">₹{item.price}</span>
                          <button
                            onClick={() => { setActiveScreen('menu'); }}
                            className="bg-stone-800 hover:bg-amber-600 hover:text-stone-950 font-bold px-3.5 py-1.5 rounded transition inline-flex items-center gap-0.5 text-[11px] cursor-pointer"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial customer reviews list */}
                <div className="max-w-xl mx-auto w-full">
                  <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 5px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: #2b2521;
                      border-radius: 999px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #443e38;
                    }
                  `}</style>

                  <div className="bg-stone-900 border border-stone-850 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-serif text-amber-500 font-extrabold uppercase tracking-widest">
                        KIND WORDS
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {testimonials.filter(test => test.isVisible !== false).length} Active Reviews
                      </span>
                    </div>

                    {/* Scrollable list of reviews */}
                    <div className="overflow-y-auto max-h-[340px] pr-2 space-y-4 custom-scrollbar">
                      {testimonials.filter(test => test.isVisible !== false).map(test => (
                        <div
                          key={test.id}
                          className="bg-stone-950/45 border border-stone-850 rounded-2xl p-4.5 space-y-2.5 transition duration-300 hover:border-stone-800"
                        >
                          {/* Stars */}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < test.rating ? 'text-amber-500 fill-amber-500' : 'text-stone-750'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Quote */}
                          <p className="text-stone-300 text-xs leading-relaxed italic font-sans">
                            "{test.text}"
                          </p>
                          {/* Footer */}
                          <div className="flex justify-between items-center text-[10px] text-stone-500 pt-1 border-t border-stone-950/40">
                            <span className="font-semibold text-stone-400">- {test.name}</span>
                            <span className="font-mono">{test.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Form divider */}
                    <div className="border-t border-stone-800/80 pt-5 space-y-4">
                      <h4 className="text-xs font-black text-stone-200 uppercase tracking-wide">
                        Leave Your Experience
                      </h4>

                      {reviewSuccess && (
                        <div className="text-[11px] text-emerald-400 font-sans italic bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/50">
                          Review published successfully! Check the push notifications.
                        </div>
                      )}

                      <form onSubmit={handleAddReview} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            required
                            value={newReviewName}
                            onChange={e => setNewReviewName(e.target.value)}
                            placeholder="Your Name"
                            className="bg-stone-950/60 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-500/50 w-full"
                          />

                          <div className="relative">
                            <select
                              value={newReviewRating}
                              onChange={e => setNewReviewRating(Number(e.target.value))}
                              className="w-full bg-stone-950/60 border border-stone-800 rounded-xl pl-3.5 pr-8 py-2.5 text-stone-300 text-xs font-medium focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                            >
                              <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                              <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                              <option value={3}>⭐⭐⭐ (3/5)</option>
                              <option value={2}>⭐⭐ (2/5)</option>
                              <option value={1}>⭐ (1/5)</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-stone-500 text-[8px]">
                              ▼
                            </div>
                          </div>
                        </div>

                        <textarea
                          required
                          rows={3}
                          value={newReviewText}
                          onChange={e => setNewReviewText(e.target.value)}
                          placeholder="Share details of your cozy cafe experience..."
                          className="w-full bg-stone-950/60 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-200 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
                        />

                        {user ? (
                          <button
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-stone-950 font-black tracking-widest text-[11px] py-3 rounded-xl transition duration-200 uppercase cursor-pointer"
                          >
                            PUBLISH MY REVIEW
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsSignUp(false);
                                setShowLoginModal(true);
                              }}
                              className="w-full bg-gradient-to-r from-amber-600 to-amber-550 hover:from-amber-500 hover:to-amber-450 text-stone-950 font-black tracking-widest text-[11px] py-3 rounded-xl transition duration-300 uppercase cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-950/20"
                            >
                              <LogIn className="w-4 h-4" /> LOGIN TO PUBLISH REVIEW
                            </button>
                            <p className="text-[10px] text-stone-500 font-sans text-center">
                              Please register or authenticate your profile first to write a review.
                            </p>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                </div>

                {/* =============== INTEGRATED SOCIAL MEDIA LINKS =============== */}
                <div className="bg-stone-900 border border-stone-800 p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest block mb-1">
                        Come Say Hello / Let's Connect
                      </span>
                      <h3 className="text-2xl font-black text-stone-100">
                        Integrated Social Coordinates
                      </h3>
                    </div>
                    <p className="text-stone-400 text-xs leading-relaxed font-sans">
                      Locate our cozy tea deck directly on Google Maps or keep up to date with community events on our social handles.
                    </p>

                    <div className="space-y-2 pt-2">
                      <a
                        href="https://share.google/NJ9YsHEhHBUQzlsSx"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <MapPin className="w-5 h-5 text-amber-500 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Google Maps Pointers</strong>
                          <span className="text-[10px] text-stone-500 font-mono truncate block">Madhuban More, Jhargram, West Bengal 721507</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-400 transition" />
                      </a>

                      <a
                        href="tel:+919002696524"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <Phone className="w-5 h-5 text-amber-500 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Phone Reservation Hotline</strong>
                          <span className="text-[10px] text-stone-500 font-mono block">Call us: 90026 96524 • Fast Delivery</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-405 transition" />
                      </a>

                      <a
                        href="tel:+916296160042"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <Phone className="w-5 h-5 text-amber-550 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Secondary Contact Line</strong>
                          <span className="text-[10px] text-stone-500 font-mono block">Call us: 62961 60042 • Delivery Support</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-405 transition" />
                      </a>

                      <a
                        href="mailto:cafecsb2020@gmail.com"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <Mail className="w-5 h-5 text-amber-500 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Official Email Handle</strong>
                          <span className="text-[10px] text-stone-500 font-mono block">cafecsb2020@gmail.com • Inquiries & Support</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-405 transition" />
                      </a>

                      <a
                        href="https://www.facebook.com/CafeChaiSuttaBar/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <Facebook className="w-5 h-5 text-amber-500 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Official Facebook Page</strong>
                          <span className="text-[10px] text-stone-500 font-mono block">Community hub, local updates & announcements</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-405 transition" />
                      </a>

                      <a
                        href="https://www.instagram.com/cafe_chai_sutta_bar/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-stone-950 border border-stone-850 p-3 rounded-xl hover:border-amber-500 transition group text-xs text-stone-300 text-left"
                      >
                        <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-900/30 group-hover:bg-amber-600 transition">
                          <Instagram className="w-5 h-5 text-amber-500 group-hover:text-stone-950" />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <strong className="block text-stone-100 group-hover:text-amber-400 transition">Official Instagram Feed</strong>
                          <span className="text-[10px] text-stone-500 font-mono block">Delicious food captures & culinary stories</span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-stone-605 group-hover:text-amber-405 transition" />
                      </a>
                    </div>
                  </div>

                  {/* Aesthetic visual map layout representation */}
                  <div className="bg-stone-950 border border-stone-800 rounded-3xl p-4 shadow-inner space-y-3">
                    <div className="aspect-[4/3] bg-stone-900 border border-stone-850 rounded-2xl relative overflow-hidden group">
                      <iframe
                        src="https://maps.google.com/maps?q=Cafe%20Chai%20Sutta%20Bar,%20Madhuban%20More,%20Jhargram&t=&z=16&ie=UTF8&iwloc=&output=embed"
                        className="w-full h-full rounded-2xl border-0 grayscale invert opacity-75 hover:grayscale-0 hover:invert-0 hover:opacity-100 transition duration-500"
                        allowFullScreen
                        loading="lazy"
                        title="Cafe Chai Sutta Bar Location Map"
                      />
                      <div className="absolute top-2.5 right-2.5 z-10 bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-stone-800 text-[9px] font-mono font-bold tracking-wider text-amber-500 uppercase">
                        Live Map View
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 bg-stone-900 p-2 rounded-xl">
                      <span>₹1-200 per guest</span>
                      <a 
                        href="https://share.google/NJ9YsHEhHBUQzlsSx" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer transition hover:underline"
                      >
                        GET DIRECTIONS <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SCREEN 2: DYNAMIC ONLINE MENU */}
            {activeScreen === 'menu' && (
              <MenuSection
                menuItems={menuItems}
                orders={orders}
                setOrders={setOrdersWithFirebase}
                user={user}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}

            {/* SCREEN 3: COZY GALLERY */}
            {activeScreen === 'gallery' && (
              <GallerySection />
            )}

            {/* SCREEN 4: TABLE RESERVATION DISPATCH */}
            {activeScreen === 'bookings' && (
              <BookingSection
                bookings={bookings}
                setBookings={setBookingsWithFirebase}
                user={user}
              />
            )}

            {/* SCREEN 5: USER PROFILE VIEW WITH ORDERS & BOOKINGS DETAILS */}
            {activeScreen === 'profile' && (
              <UserProfileSection
                user={user}
                bookings={bookings}
                orders={orders}
                testimonials={testimonials}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}
            
          </div>
        )}
      </main>

      {/* =============== SECURE USER ACCESS PORTAL LOGIN WINDOW =============== */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-md"
            />
            {/* Login Dialog */}
            <motion.div
              id="login-dial"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-x-4 top-[15%] max-w-sm mx-auto bg-stone-900 border border-stone-800 p-6 rounded-3xl shadow-2xl z-50 space-y-4 font-sans"
            >
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <div className="flex items-center gap-1.5">
                  <Coffee className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h4 className="text-sm font-black text-stone-100 font-mono uppercase tracking-wider">
                    {isSignUp ? 'Create Cafe Account' : 'Sign In to Cafe'}
                  </h4>
                </div>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-stone-400 hover:text-stone-200 cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {loginError && (
                <p className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl text-center leading-relaxed font-medium">
                  {loginError}
                </p>
              )}

              {loginSuccess && (
                <p className="text-[11px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-xl text-center leading-relaxed font-medium">
                  {loginSuccess}
                </p>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={displayNameInput}
                      onChange={e => setDisplayNameInput(e.target.value)}
                      placeholder="Siddharth Roy"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider">Security Password</label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[10px] text-amber-500 hover:underline hover:text-amber-400 bg-transparent border-none cursor-pointer p-0 font-medium font-mono"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-black py-3 rounded-xl transition duration-250 uppercase tracking-widest text-[10px] cursor-pointer mt-2"
                >
                  {isSignUp ? 'Create Cafe Profile' : 'Authenticate Profile'}
                </button>
              </form>

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-800"></div>
                </div>
                <span className="relative bg-stone-900 px-3 text-[10px] text-stone-400 font-mono uppercase tracking-wider">Or</span>
              </div>

              {/* Google Sign-In Integration */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-stone-800 text-stone-200 border border-stone-800 hover:border-stone-700 py-2.5 rounded-xl transition duration-200 text-xs font-bold cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.18 0-5.76-2.58-5.76-5.76s2.58-5.76 5.76-5.76c1.4.004 2.7.502 3.737 1.332l2.42-2.42A9.559 9.559 0 0 0 12.24 2.4c-5.4 0-9.84 4.44-9.84 9.84s4.44 9.84 9.84 9.84c5.137 0 9.84-3.72 9.84-9.84 0-.64-.06-1.28-.24-1.956H12.24Z" />
                </svg>
                Continue with Google
              </button>

              <div className="pt-2 text-center text-[11px] font-medium text-stone-400">
                {isSignUp ? (
                  <span>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(false); setLoginError(''); setLoginSuccess(''); }}
                      className="text-amber-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Sign In Now
                    </button>
                  </span>
                ) : (
                  <span>
                    New customer?{' '}
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(true); setLoginError(''); setLoginSuccess(''); }}
                      className="text-amber-500 font-bold hover:underline bg-transparent border-none cursor-pointer p-0"
                    >
                      Sign Up Now
                    </button>
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-stone-800/65 text-center text-[9px] font-mono leading-relaxed text-stone-500">
                Staff Credentials for access: <strong className="text-amber-500/80">admincafe@gmail.com</strong> (Passcode: <strong className="text-amber-500/80">090909</strong>)
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile-Friendly footer copyright bar - styled larger, bolder, and more user-friendly */}
      <footer className="fixed bottom-0 left-0 right-0 bg-stone-950/98 backdrop-blur-md border-t border-stone-900 px-3 py-3.5 md:hidden z-30 flex justify-around text-[12px] font-semibold text-stone-400 shadow-2xl">
        <button
          onClick={() => { setActiveScreen('home'); setViewingAdminPortal(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${activeScreen === 'home' && !viewingAdminPortal ? 'text-amber-500 font-extrabold scale-110' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <span className="text-[16px] leading-none">☕</span>
          <span className="text-[11px] uppercase tracking-wide">Cozy</span>
        </button>
        <button
          onClick={() => { setActiveScreen('menu'); setViewingAdminPortal(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${activeScreen === 'menu' && !viewingAdminPortal ? 'text-amber-500 font-extrabold scale-110' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <span className="text-[16px] leading-none">🍽️</span>
          <span className="text-[11px] uppercase tracking-wide">Menu</span>
        </button>
        <button
          onClick={() => { setActiveScreen('bookings'); setViewingAdminPortal(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${activeScreen === 'bookings' && !viewingAdminPortal ? 'text-amber-500 font-extrabold scale-110' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <span className="text-[16px] leading-none">📅</span>
          <span className="text-[11px] uppercase tracking-wide">Reserve</span>
        </button>
        <button
          onClick={() => { setActiveScreen('profile'); setViewingAdminPortal(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${activeScreen === 'profile' && !viewingAdminPortal ? 'text-amber-500 font-extrabold scale-110' : 'text-stone-400 hover:text-stone-200'}`}
        >
          <span className="text-[16px] leading-none">👤</span>
          <span className="text-[11px] uppercase tracking-wide">Profile</span>
        </button>
        {isAdmin ? (
          <button
            onClick={() => setViewingAdminPortal(!viewingAdminPortal)}
            className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${viewingAdminPortal ? 'text-amber-500 font-bold scale-110' : 'text-amber-400/80 hover:text-amber-400'}`}
          >
            <span className="text-[16px] leading-none">👑</span>
            <span className="text-[11px] uppercase tracking-wide font-extrabold">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => { setActiveScreen('gallery'); setViewingAdminPortal(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all duration-200 ${activeScreen === 'gallery' && !viewingAdminPortal ? 'text-amber-500 font-extrabold scale-110' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <span className="text-[16px] leading-none">🖼️</span>
            <span className="text-[11px] uppercase tracking-wide">Gallery</span>
          </button>
        )}
      </footer>

    </div>
  );
}
