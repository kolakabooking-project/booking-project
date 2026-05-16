import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, User as UserIcon, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { chatApi } from '../../lib/api';
import { Realtime } from 'ably';
import { getInitials } from '../../utils/helpers';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function AdminChatPage() {
  const { user, activeRole, isAuthenticated } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const ablyRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const data = await chatApi.getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    if (isAuthenticated && activeRole === 'admin') {
      loadUsers();
    }
  }, [isAuthenticated, user, activeRole]);

  // Load Messages for Selected User
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser) return;
      try {
        setIsLoadingMessages(true);
        const history = await chatApi.getHistory(selectedUser.id, user.id, activeRole);
        setMessages(history);
        
        // Mark as read
        await chatApi.markAsRead({ userId: selectedUser.id, role: activeRole, currentUserId: user.id });
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessages();
  }, [selectedUser, user, activeRole]);

  // Ably Realtime setup for Admin
  useEffect(() => {
    if (!isAuthenticated || activeRole !== 'admin') return;

    if (!ablyRef.current) {
      const realtime = new Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            const response = await fetch('/api/ably/auth', { credentials: 'include' });
            if (!response.ok) throw new Error('Ably auth failed');
            const tokenRequest = await response.json();
            callback(null, tokenRequest);
          } catch (err) {
            callback(err, null);
          }
        }
      });

      // Admin subscribes to the global 'chat:admin' channel
      const channel = realtime.channels.get('chat:admin');
      
      channel.subscribe('new_message', (msg) => {
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
          
          if (selectedUser && (newMsg.senderId === selectedUser.id || newMsg.receiverId === selectedUser.id)) {
            if (newMsg.senderId === selectedUser.id) {
              chatApi.markAsRead({ userId: selectedUser.id, role: activeRole, currentUserId: user.id });
            }
            return [...prev, newMsg];
          }
          return prev;
        });

        // We could also update the users list here to show unread badges or sort by latest
      });

      ablyRef.current = realtime;
    }

    return () => {
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }
    };
  }, [isAuthenticated, user, selectedUser, activeRole]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || !user || !selectedUser) return;

    const tempId = Date.now().toString();
    const newMsg = {
      id: tempId,
      senderId: user.id,
      receiverId: selectedUser.id,
      content: inputValue.trim(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    try {
      const response = await chatApi.sendMessage({
        senderId: user.id,
        receiverId: selectedUser.id,
        content: newMsg.content,
        role: activeRole,
        tempId: tempId
      });
      setMessages(prev => prev.map(m => m.id === tempId ? response : m));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleClearChat = async () => {
    if (!selectedUser) return;
    
    try {
      await chatApi.clearHistory(selectedUser.id, activeRole);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
      alert('Gagal menghapus pesan');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.nip.includes(searchQuery)
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] border rounded-3xl overflow-hidden shadow-sm animate-fade-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-shell)' }}>
      {/* Sidebar: User List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r flex-col`} style={{ borderColor: 'var(--color-border)', background: 'color-mix(in srgb, var(--color-surface-muted) 30%, transparent)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-heading font-bold flex items-center gap-2 mb-4 text-[color:var(--color-heading)]">
            <MessageCircle className="text-djp-blue" size={20} />
            Live Chat
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" size={16} />
            <input
              type="text"
              placeholder="Cari user (Nama / NIP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-djp-blue transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)', color: 'var(--color-heading)' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingUsers ? (
            <div className="p-8 text-center text-sm text-[color:var(--color-text-soft)]">Memuat kontak...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-[color:var(--color-text-soft)]">Tidak ada user ditemukan.</div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full p-4 flex items-center gap-3 text-left border-b transition-colors ${
                  selectedUser?.id === u.id 
                    ? 'border-l-4 border-l-djp-yellow' 
                    : 'hover:opacity-80 border-l-4 border-l-transparent'
                }`}
                style={{ 
                  borderColor: 'var(--color-border)', 
                  background: selectedUser?.id === u.id ? 'var(--color-surface-elevated)' : 'transparent'
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                     style={{ background: 'color-mix(in srgb, var(--color-brand) 15%, transparent)', color: 'var(--color-brand)' }}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sm truncate text-[color:var(--color-heading)]">{u.name}</p>
                  <p className="text-xs truncate text-[color:var(--color-text-soft)]">{u.nip}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 flex-col`} style={{ background: 'var(--color-bg-main)' }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-4 sm:px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
              <div className="flex items-center gap-2 sm:gap-4">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-1 md:hidden text-[color:var(--color-text-soft)] hover:bg-[color:var(--color-surface-muted)] rounded-lg transition-colors mr-1"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                     style={{ background: 'color-mix(in srgb, var(--color-brand) 15%, transparent)', color: 'var(--color-brand)' }}>
                  {getInitials(selectedUser.name)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-heading font-bold text-[color:var(--color-heading)] text-sm sm:text-base line-clamp-1">{selectedUser.name}</h3>
                  <p className="text-[10px] sm:text-xs text-[color:var(--color-text-soft)] truncate">NIP: {selectedUser.nip}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsClearModalOpen(true)}
                className="p-2 hover:bg-danger-light rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-[color:var(--color-text-soft)] hover:text-danger"
                title="Hapus semua pesan"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Bersihkan</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-djp-blue"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 text-[color:var(--color-text-soft)]">
                  <MessageCircle size={48} className="opacity-20" />
                  <p className="font-medium text-[color:var(--color-heading)]">Belum ada obrolan</p>
                  <p className="text-sm">Kirim pesan pertama ke {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-md rounded-2xl px-5 py-3 text-sm shadow-sm ${
                          isMe 
                            ? 'bg-djp-blue text-white rounded-tr-none' 
                            : 'rounded-tl-none border text-[color:var(--color-heading)]'
                        }`}
                        style={!isMe ? { borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' } : {}}
                      >
                        <p className="break-words leading-relaxed">{msg.content}</p>
                        <div className={`text-[10px] mt-2 font-medium ${isMe ? 'text-blue-200 text-right' : 'text-[color:var(--color-text-soft)]'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ketik balasan Anda di sini..."
                  className="flex-1 border rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-djp-blue transition-shadow placeholder-opacity-60"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-main)', color: 'var(--color-heading)' }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-djp-yellow text-djp-blue-dark font-bold disabled:opacity-50 transition-all hover:bg-[#F2C94C] active:scale-95 shadow-sm"
                >
                  <Send size={20} className="ml-1" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
            <UserIcon size={64} className="opacity-20 mb-4" />
            <p className="font-heading font-semibold text-lg text-slate-500 dark:text-slate-400">Pilih User</p>
            <p className="text-sm">Silakan pilih user dari panel kiri untuk memulai chat.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearChat}
        title="Bersihkan Obrolan"
        message={`Hapus semua riwayat chat dengan ${selectedUser?.name}?`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
