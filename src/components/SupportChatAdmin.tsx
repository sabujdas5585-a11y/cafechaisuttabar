import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MessageSquare, Send, User, Search } from 'lucide-react';
import { ChatMessage, ChatSession } from '../types';

export default function SupportChatAdmin() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to all sessions
    const unsubscribe = onSnapshot(
      collection(db, 'support_sessions'), 
      (snapshot) => {
        const sess: ChatSession[] = [];
        snapshot.forEach(docSnap => {
          sess.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
        });
        // Sort by last message time descending
        sess.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        setSessions(sess);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'support_sessions')
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeSessionId) return;

    // Listen to messages for the active session
    const q = query(
      collection(db, 'support_chats', activeSessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setMessages(msgs);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, (err) => handleFirestoreError(err, OperationType.GET, `support_chats/${activeSessionId}/messages`));

    // Clear admin unread count
    updateDoc(doc(db, 'support_sessions', activeSessionId), {
      unreadCountAdmin: 0
    }).catch(() => {});

    return () => unsubscribe();
  }, [activeSessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSessionId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    const timestamp = new Date().toISOString();

    const msg: Omit<ChatMessage, 'id'> = {
      senderId: 'admin',
      senderName: 'Support Desk',
      text: messageText,
      timestamp,
      isAdmin: true
    };

    try {
      await addDoc(collection(db, 'support_chats', activeSessionId, 'messages'), msg);
      
      const sessionRef = doc(db, 'support_sessions', activeSessionId);
      import('firebase/firestore').then(({ increment }) => {
        updateDoc(sessionRef, {
          lastMessage: messageText,
          lastMessageTime: timestamp,
          unreadCountCustomer: increment(1)
        });
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[600px] bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden mt-6">
      {/* Sidebar: Session List */}
      <div className="w-1/3 border-r border-stone-800 flex flex-col bg-stone-950">
        <div className="p-4 border-b border-stone-800">
          <h3 className="font-bold text-stone-100 flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-amber-500" /> Live Support
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 text-stone-200 text-xs px-9 py-2.5 rounded-xl outline-none focus:border-amber-500/50 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredSessions.length === 0 ? (
            <div className="p-6 text-center text-stone-500 text-xs italic">
              No active support chats found.
            </div>
          ) : (
            filteredSessions.map(session => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-4 border-l-2 transition-all cursor-pointer ${
                  activeSessionId === session.id 
                    ? 'border-amber-500 bg-stone-900' 
                    : 'border-transparent hover:bg-stone-900/50'
                } border-b border-stone-800/50`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-stone-200 text-sm truncate pr-2">
                    {session.customerName}
                  </span>
                  <span className="text-[9px] text-stone-500 font-mono whitespace-nowrap">
                    {new Date(session.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs text-stone-400 truncate opacity-80">
                    {session.lastMessage}
                  </p>
                  {session.unreadCountAdmin > 0 && (
                    <span className="bg-amber-500 text-stone-950 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                      {session.unreadCountAdmin > 9 ? '9+' : session.unreadCountAdmin}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-stone-900/40">
        {activeSessionId ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center border border-stone-700">
                  <User className="w-5 h-5 text-stone-400" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-100 text-sm">
                    {sessions.find(s => s.id === activeSessionId)?.customerName}
                  </h4>
                  <p className="text-[10px] text-stone-500 font-mono">
                    ID: {activeSessionId.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                  <MessageSquare className="w-8 h-8 text-stone-600 mb-2" />
                  <p className="text-xs text-stone-400">Loading messages...</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isConsecutive = i > 0 && messages[i - 1].isAdmin === msg.isAdmin;
                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'} ${!isConsecutive ? 'mt-6' : 'mt-1'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm ${
                        msg.isAdmin 
                          ? 'bg-amber-500/10 text-amber-50 border border-amber-500/20 rounded-tr-sm' 
                          : 'bg-stone-800 text-stone-200 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono mt-1.5 px-2">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} className="pb-2" />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-stone-950 border-t border-stone-800">
              <div className="flex bg-stone-900 rounded-xl border border-stone-800 focus-within:border-amber-500/50 transition overflow-hidden p-1">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Reply to customer..." 
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-stone-200 outline-none"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="px-5 mr-1 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg disabled:opacity-50 transition cursor-pointer font-bold shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-stone-900">
            <MessageSquare className="w-16 h-16 text-stone-800 mb-4" />
            <h3 className="text-lg font-black text-stone-400 mb-1">No Chat Selected</h3>
            <p className="text-xs text-stone-500 max-w-sm">
              Select a customer conversation from the list to view history and reply to support inquiries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
