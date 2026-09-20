import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useSocket } from '../../context/SocketContext';
import { Search, X, MessageCircle, UserPlus, Sparkles, Circle } from 'lucide-react';

export default function UserSearchModal({ isOpen, onClose, onSelectConversation }) {
  const { isUserOnline } = useSocket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.users || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleStartChat = async (targetUser) => {
    setStartingChatId(targetUser.id);
    try {
      const res = await api.post('/chats/direct', { targetUserId: targetUser.id });
      onSelectConversation(res.data.conversation);
      onClose();
    } catch (err) {
      console.error('Start chat error:', err);
      alert('Failed to start chat with user');
    } finally {
      setStartingChatId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Find People to Chat</h2>
              <p className="text-xs text-slate-400">Search users by name or username</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a username or display name..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm transition-all"
          />
        </div>

        {/* User list */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching real users in database...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              {query ? 'No registered users found matching your search.' : 'No other users registered yet. Open an incognito tab to create your friend account!'}
            </div>
          ) : (
            results.map((targetUser) => {
              const online = isUserOnline(targetUser.id);
              return (
                <div
                  key={targetUser.id}
                  className="flex items-center justify-between p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.username}`}
                        alt={targetUser.display_name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-800 ring-1 ring-slate-700"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                          online ? 'bg-emerald-500 online-pulse' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white text-sm truncate">{targetUser.display_name}</h4>
                        <span className="text-[11px] text-slate-400 truncate">@{targetUser.username}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {targetUser.status_text ? (
                          <span className="text-brand-300 mr-1.5">{targetUser.status_text}</span>
                        ) : null}
                        {targetUser.bio}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(targetUser)}
                    disabled={startingChatId === targetUser.id}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{startingChatId === targetUser.id ? 'Connecting...' : 'Chat'}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
