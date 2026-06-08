import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { triggerPushNotification } from './NotificationCenter';
import { Calendar, Clock, Users, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';

interface BookingSectionProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  user?: any;
}

export default function BookingSection({ bookings, setBookings, user }: BookingSectionProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('17:00');
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Pre-populate fields from the logged-in user profile
  useEffect(() => {
    if (user) {
      if (user.displayName && !name) {
        setName(user.displayName);
      }
      if (user.email && !email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date) return;

    const newBooking: Booking & { userId?: string } = {
      id: 'b_' + Math.random().toString(36).substring(2, 9),
      customerName: name,
      email: email || (user?.email) || `${name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      phone,
      date,
      time,
      guests,
      status: 'pending',
      notes,
      createdAt: new Date().toISOString(),
      userId: user?.uid || undefined
    };

    setBookings(prev => [...prev, newBooking]);

    // Send immediate local device push notification
    triggerPushNotification(
      'Reservation Submitted! 📅',
      `Hey ${name}, your table request for ${guests} guests on ${date} at ${time} is registered. Staff will confirm shortly!`,
      'booking',
      user?.uid || undefined
    );

    // Auto confirmation simulation: after 6 seconds, let there be an automatic staff-confirmed push!
    // This completes the high-end real-time notification simulation.
    setTimeout(() => {
      setBookings(prev => prev.map(item => {
        if (item.id === newBooking.id) {
          // Send confirmed notification
          triggerPushNotification(
            'Reservation Approved! 🎉',
            `Great news ${name}! Cafe Chai Sutta Bar has confirmed Table 4 for you for ${date} at ${time}. See you there!`,
            'booking',
            item.userId || undefined
          );
          return { ...item, status: 'confirmed' as const, tableNo: 'Table 4 (Cozy Window Corner)' };
        }
        return item;
      }));
    }, 6000);

    setSuccessMsg(true);
    // Clear form
    setName('');
    setEmail('');
    setPhone('');
    setDate('');
    setNotes('');

    // Reset success banner after 4 seconds
    setTimeout(() => {
      setSuccessMsg(false);
    }, 5000);
  };

  return (
    <div className="bg-stone-900 rounded-3xl border border-stone-800 p-6 md:p-8 shadow-xl max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Columns - Info and rules */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <span className="text-amber-500 font-mono font-bold text-xs uppercase tracking-widest block mb-1">
              Table Bookings & VIP Lounges
            </span>
            <h3 className="text-2xl font-black text-stone-100 leading-tight">
              Reserve Your Cozy Teatime Slot
            </h3>
            <p className="text-stone-300 text-xs mt-2 leading-relaxed">
              Skip the evening rush, secure premium floor mats or table seating near the Madhuban More main avenue in Jhargram.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 text-xs leading-relaxed">
              <div className="bg-amber-950/40 p-2 rounded-xl text-amber-500 h-9 w-9 flex items-center justify-center border border-amber-900/30 flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-200">Table Retention Limit</h4>
                <p className="text-stone-400 text-[11px] mt-0.5">Reservations are held for a maximum of 20 minutes past the scheduled arrival hour.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed">
              <div className="bg-amber-950/40 p-2 rounded-xl text-amber-500 h-9 w-9 flex items-center justify-center border border-amber-900/30 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-200">Group Dining Capacity</h4>
                <p className="text-stone-400 text-[11px] mt-0.5">Our indoor sofas can bundle up to 10 friends. For larger birthdays or celebrations, mention notes.</p>
              </div>
            </div>

            <div className="flex gap-3 text-xs leading-relaxed">
              <div className="bg-amber-950/40 p-2 rounded-xl text-amber-500 h-9 w-9 flex items-center justify-center border border-amber-900/30 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-200">Hygiene & Eco-Commitment</h4>
                <p className="text-stone-400 text-[11px] mt-0.5">We strictly use pure sanitized dry clay pots (Kulhads) once and recycle them sustainably.</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/10 border border-amber-905/30 p-4 rounded-2xl block text-xs">
            <span className="font-bold text-amber-400 block mb-1">Need instant help?</span>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Call us directly at <span className="text-amber-200 font-mono font-bold">90026 96524</span> or <span className="text-amber-200 font-mono font-bold">62961 60042</span> to override bookings or order delivery to Jhargram neighborhoods.
            </p>
          </div>
        </div>

        {/* Right Columns - Form */}
        <div id="booking-form-box" className="lg:col-span-3 bg-stone-950/50 p-6 rounded-2xl border border-stone-800">
          <h4 className="text-sm font-bold text-stone-200 uppercase tracking-widest font-mono mb-4 pb-2 border-b border-stone-800">
            Booking Dispatch Form
          </h4>

          {successMsg && (
            <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 text-xs p-4 rounded-xl mb-4 font-sans leading-relaxed">
              <strong className="block font-bold mb-1">📅 Reservation Submitted Successfully!</strong>
              Your table block request is submitted. Check the <strong className="text-white">Push Notification Banner</strong> at top or the bell icon at bottom-right for instant real-time status tracker update simulation in 6 seconds!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-400 block">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Siddharth Mukherjee"
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-400 block">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 90026 96524"
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-mono text-stone-400 block">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="siddharth@gmail.com"
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-400 block">Total Guests</label>
                <select
                  value={guests}
                  onChange={e => setGuests(parseInt(e.target.value) || 2)}
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-150 text-xs focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6 Guests</option>
                  <option value={8}>8+ (Group pack)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-400 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Select Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-stone-400 block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Select Time *
                </label>
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="11:30">11:30 AM (Brunch brew)</option>
                  <option value="13:00">01:00 PM (Lunch bites)</option>
                  <option value="15:00">03:00 PM (Afternoon dip)</option>
                  <option value="17:00">05:00 PM (Sunset sutta session)</option>
                  <option value="18:30">06:30 PM (Peak evening chats)</option>
                  <option value="20:00">08:00 PM (Dinner & wraps)</option>
                  <option value="21:15">09:15 PM (Last call brew)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-stone-400 block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                Special Taste or Seating Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Birthday celebration, soft seat, custom sweet level in ginger tea, etc..."
                className="w-full bg-stone-900 border border-stone-800/80 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-stone-950 font-extrabold text-xs py-3 rounded-xl transition duration-350 shadow-lg shadow-amber-950/20 uppercase tracking-widest cursor-pointer mt-2"
            >
              Dispatch Table Reservation Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
