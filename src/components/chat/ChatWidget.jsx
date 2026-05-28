import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi } from '../../lib/api';
import { useAbly } from '../../contexts/AblyProvider';

export default function ChatWidget() {
  const { user, activeRole, isAuthenticated } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { subscribe } = useAbly();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // If opened, mark messages as read
      if (unreadCount > 0) {
        markAsRead();
      }
    }
  }, [messages, isOpen, isMinimized, unreadCount]);

  // Load history
  useEffect(() => {
    if (!isAuthenticated || activeRole !== 'user') return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await chatApi.getHistory(user.id, user.id, activeRole);
        setMessages(history);
        
        // Count unread
        const unreads = history.filter(m => !m.isRead && m.senderId !== user.id).length;
        setUnreadCount(unreads);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, [isAuthenticated, user, activeRole]);

  // Initialize Ably (via shared AblyProvider)
  useEffect(() => {
    if (!isAuthenticated || activeRole !== 'user') return;

    const unsub1 = subscribe(`chat:user_${user.id}`, 'new_message', (msg) => {
      const newMsg = msg.data;
      setMessages(prev => {
        // Prevent duplicates by checking DB id OR tempId
        const existingIdx = prev.findIndex(m => m.id === newMsg.id || m.id === newMsg.tempId);
        if (existingIdx !== -1) {
          // If we found it by tempId, replace it with the real message from Ably
          if (prev[existingIdx].id === newMsg.tempId) {
             const newArr = [...prev];
             newArr[existingIdx] = newMsg;
             return newArr;
          }
          return prev;
        }
        return [...prev, newMsg];
      });
      
      // If not sent by me, and chat is closed or minimized, increment unread
      if (newMsg.senderId !== user.id) {
        if (!isOpen || isMinimized) {
          setUnreadCount(prev => prev + 1);
        } else {
          // Automatically mark as read if chat is open
          chatApi.markAsRead({ userId: user.id, role: activeRole, currentUserId: user.id });
        }
      }
    });

    const unsub2 = subscribe(`chat:user_${user.id}`, 'clear_chat', () => {
      setMessages([]);
      setUnreadCount(0);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [isAuthenticated, user, activeRole, isOpen, isMinimized]);

  const markAsRead = async () => {
    if (!user) return;
    try {
      await chatApi.markAsRead({ userId: user.id, role: activeRole, currentUserId: user.id });
      setUnreadCount(0);
      setMessages(prev => prev.map(m => m.senderId !== user.id ? { ...m, isRead: true } : m));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || !user) return;

    const tempId = Date.now().toString();
    const newMsg = {
      id: tempId,
      senderId: user.id,
      receiverId: null, // Send to admin
      content: inputValue.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    try {
      const response = await chatApi.sendMessage({
        senderId: user.id,
        receiverId: null,
        content: newMsg.content,
        role: activeRole,
        tempId: tempId
      });
      setMessages(prev => prev.map(m => m.id === tempId ? response : m));
      // The actual message with DB ID comes from the response. 
      // Ably subscriber will ignore it because the ID now matches.
      // Usually we replace tempId with real ID, but Ably will broadcast it back.
      // To prevent duplicate, the Ably subscriber should check if it's our own message.
      // Since Ably broadcasts to 'chat:admin', we might not get our own message back on 'chat:user_ID' unless backend sends it.
      // Wait, backend sends to user's channel if user sends it? No, if user sends, backend sends to 'chat:admin'.
      // So optimistic UI is correct here.
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (!isAuthenticated || activeRole !== 'user') return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`border rounded-xl shadow-2xl mb-4 w-[calc(100vw-2rem)] sm:w-96 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[500px] max-h-[80vh]'
          }`}
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            style={{ background: 'linear-gradient(180deg, #182553 0%, #101b3d 100%)' }}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={18} className="text-djp-yellow" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Hubungi Admin</h3>
                <p className="text-white/70 text-xs">Kami membalas secepatnya</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <Minus size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--color-bg-main)' }}>
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-djp-blue"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2 text-[color:var(--color-text-soft)]">
                    <MessageCircle size={32} className="opacity-20" />
                    <p className="text-sm text-[color:var(--color-heading)] font-medium">Belum ada pesan</p>
                    <p className="text-xs">Kirim pesan untuk memulai obrolan dengan admin.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            isMe 
                              ? 'bg-djp-blue text-white rounded-tr-none' 
                              : 'rounded-tl-none border text-[color:var(--color-heading)]'
                          }`}
                          style={!isMe ? { borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' } : {}}
                        >
                          <p className="break-words">{msg.content}</p>
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-blue-200 text-right' : 'text-[color:var(--color-text-soft)]'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-3 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ketik pesan Anda..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-djp-blue transition-colors placeholder-opacity-60"
                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-heading)' }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 rounded-full bg-djp-yellow text-djp-blue-dark font-bold disabled:opacity-50 transition-colors hover:bg-[#F2C94C] shadow-sm"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="w-14 h-14 rounded-full bg-djp-blue text-white shadow-lg shadow-djp-blue/30 flex items-center justify-center hover:bg-[#182553] hover:scale-105 transition-all relative border border-white/10"
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
