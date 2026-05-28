import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi } from '../../lib/api';
import { useAbly } from '../../contexts/AblyProvider';
import { Send, MessageCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const { subscribe } = useAbly();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load history
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const history = await chatApi.getHistory(user.id, user.id, user.role);
        setMessages(history);
        
        // Mark as read immediately when page is opened
        await chatApi.markAsRead({ userId: user.id, role: user.role, currentUserId: user.id });
        setMessages(prev => prev.map(m => m.senderId !== user.id ? { ...m, isRead: true } : m));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, [isAuthenticated, user]);

  // Initialize Ably (via shared AblyProvider)
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') return;

    const unsub1 = subscribe(`chat:user_${user.id}`, 'new_message', (msg) => {
      const newMsg = msg.data;
      setMessages(prev => {
        const existingIdx = prev.findIndex(m => m.id === newMsg.id || m.id === newMsg.tempId);
        if (existingIdx !== -1) {
          if (prev[existingIdx].id === newMsg.tempId) {
             const newArr = [...prev];
             newArr[existingIdx] = newMsg;
             return newArr;
          }
          return prev;
        }
        return [...prev, newMsg];
      });
      
      // Automatically mark as read
      if (newMsg.senderId !== user.id) {
        chatApi.markAsRead({ userId: user.id, role: user.role, currentUserId: user.id });
      }
    });

    const unsub2 = subscribe(`chat:user_${user.id}`, 'clear_chat', () => {
      setMessages([]);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [isAuthenticated, user, subscribe]);

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

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    try {
      const response = await chatApi.sendMessage({
        senderId: user.id,
        receiverId: null,
        content: newMsg.content,
        role: user.role,
        tempId: tempId
      });
      setMessages(prev => prev.map(m => m.id === tempId ? response : m));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  if (!isAuthenticated || user?.role !== 'user') return null;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] -mt-4">
      <div className="mb-4 hidden md:block">
        <PageHeader title="Live Chat" subtitle="Hubungi admin untuk bantuan." />
      </div>

      <div className="flex-1 border rounded-2xl md:rounded-3xl shadow-sm flex flex-col overflow-hidden bg-[color:var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
        {/* Header for mobile */}
        <div className="md:hidden p-4 border-b flex items-center gap-3" style={{ background: 'var(--color-surface-elevated)', borderColor: 'var(--color-border)' }}>
          <div className="w-10 h-10 rounded-full bg-djp-blue/10 flex items-center justify-center">
            <MessageCircle size={20} className="text-djp-blue" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-[color:var(--color-heading)]">Hubungi Admin</h2>
            <p className="text-xs text-[color:var(--color-text-soft)]">Kami membalas secepatnya</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ background: 'var(--color-bg-main)' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-djp-blue"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-[color:var(--color-text-soft)]">
              <MessageCircle size={48} className="opacity-20" />
              <p className="text-sm text-[color:var(--color-heading)] font-medium">Belum ada pesan</p>
              <p className="text-xs text-center max-w-[200px]">Kirim pesan untuk memulai obrolan dengan admin.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isMe 
                        ? 'bg-djp-blue text-white rounded-tr-none' 
                        : 'rounded-tl-none border text-[color:var(--color-heading)]'
                    }`}
                    style={!isMe ? { borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' } : {}}
                  >
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[10px] mt-2 ${isMe ? 'text-blue-200 text-right' : 'text-[color:var(--color-text-soft)]'}`}>
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
        <form onSubmit={handleSend} className="p-4 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ketik pesan Anda..."
              className="flex-1 border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-djp-blue transition-colors placeholder-opacity-60"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-heading)' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="h-11 w-11 rounded-full flex items-center justify-center bg-djp-blue text-white font-bold disabled:opacity-50 transition-transform active:scale-95 shadow-md"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
