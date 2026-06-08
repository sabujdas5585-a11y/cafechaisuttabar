import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { ChatMessage, ChatSession } from '../types';

interface ChatWidgetProps {
  user: any;
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'support_chats', user.uid, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setMessages(msgs);
    }, (error) => handleFirestoreError(error, OperationType.GET, `support_chats/${user.uid}/messages`));

    const sessionUnsubscribe = onSnapshot(doc(db, 'support_sessions', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const session = docSnap.data() as ChatSession;
        setUnreadCount(session.unreadCountCustomer || 0);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `support_sessions/${user.uid}`));

    return () => {
      unsubscribe();
      sessionUnsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // Clear unread
      if (user && unreadCount > 0) {
        updateDoc(doc(db, 'support_sessions', user.uid), {
          unreadCountCustomer: 0
        }).catch(() => {});
      }
    }
  }, [isOpen, messages, user, unreadCount]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const timestamp = new Date().toISOString();
    const msg: Omit<ChatMessage, 'id'> = {
      senderId: user.uid,
      senderName: user.displayName || user.email?.split('@')[0] || 'Customer',
      text: messageText,
      timestamp,
      isAdmin: false
    };

    try {
      await addDoc(collection(db, 'support_chats', user.uid, 'messages'), msg);
      
      const docRef = doc(db, 'support_sessions', user.uid);
      setDoc(docRef, {
        customerName: msg.senderName,
        customerId: user.uid,
        lastMessage: messageText,
        lastMessageTime: timestamp,
      }, { merge: true });
      
      // We would increment admin unread count here if possible, but Firestore setDoc doesn't easily increment 
      // without getting the doc first unless using FieldValue.increment(). We will use increment!
      import('firebase/firestore').then(({ increment }) => {
        updateDoc(docRef, {
           unreadCountAdmin: increment(1)
        });
      });

    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[88px] md:bottom-8 right-6 p-4 bg-amber-500 text-stone-950 rounded-full shadow-xl shadow-amber-500/20 hover:scale-105 transition-transform z-50 flex items-center justify-center cursor-pointer"
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-stone-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-[150px] md:bottom-24 right-5 sm:right-6 w-[340px] max-w-[calc(100vw-40px)] h-[480px] max-h-[60vh] md:max-h-[70vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          <div className="bg-stone-950 p-4 border-b border-stone-800 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold text-stone-100 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-500" /> Support Chat
              </h3>
              <p className="text-[10px] text-stone-400 font-mono mt-1">Order edits & assistance</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900/50 flex flex-col">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-50 my-auto">
                <MessageCircle className="w-8 h-8 text-stone-500" />
                <p className="text-xs text-stone-400">Send us a message and we'll reply shortly.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                 const isConsecutive = i > 0 && messages[i - 1].isAdmin === msg.isAdmin;
                 return (
                  <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'} ${!isConsecutive ? 'mt-4' : 'mt-1'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-[13px] ${
                      msg.isAdmin 
                        ? 'bg-stone-800 text-stone-200 rounded-tl-sm' 
                        : 'bg-amber-500/10 text-amber-50 border border-amber-500/20 rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-stone-500 font-mono mt-1 px-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} className="pb-2" />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-stone-950 border-t border-stone-800 shrink-0">
            <div className="flex bg-stone-900 rounded-xl border border-stone-800 focus-within:border-amber-500/50 transition overflow-hidden">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent px-4 py-3 text-sm text-stone-200 outline-none"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="px-4 text-amber-500 hover:text-amber-400 disabled:opacity-50 disabled:hover:text-amber-500 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
