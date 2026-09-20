import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import {
  Search,
  Plus,
  Settings,
  LogOut,
  MessageSquare,
  Image as ImageIcon,
  Sparkles,
  CircleDot
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function Sidebar({
  activeConversation,
  onSelectConversation,
  onOpenProfile,
  onOpenSearch,
  conversations,
  setConversations,
  loadingConversations,
  onCloseMobileSidebar
}) {
  const { user, logout } = useAuth();
  const { socket, isUserOnline, typingMap } = useSocket();
  const [filterQuery, setFilterQuery] = useState('');

  // Format message time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return format(date, 'h:mm a');
      }
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!filterQuery.trim()) return true;
    const name = conv.participant?.display_name || '';
    const username = conv.participant?.username || '';
    return (
      name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      username.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-slate-900 border-r border-slate-800/80 shrink-0 select-none">
      {/* Sidebar Header: Current User */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0 cursor-pointer group" onClick={onOpenProfile}>
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
              alt={user?.display_name}
              className="w-11 h-11 rounded-xl object-cover bg-slate-800 ring-2 ring-brand-500/50 group-hover:ring-brand-400 transition-all"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 online-pulse ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              {user?.display_name}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.status_text || '🟢 Available'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProfile}
            title="Profile Settings"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and New Chat Button */}
      <div className="p-3.5 flex items-center gap-2 border-b border-slate-800/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <button
          onClick={onOpenSearch}
          title="Start New Chat"
          className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loadingConversations ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-3 text-slate-500 border border-slate-700/40">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No chats yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Find a friend or test account to start your first real-time conversation.
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-4 px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 text-xs font-semibold rounded-xl border border-brand-500/30 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Find People</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const target = conv.participant;
            const online = target ? isUserOnline(target.id) : false;
            const typingInfo = typingMap[conv.id];
            const isTyping = typingInfo && Object.keys(typingInfo).length > 0;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv);
                  if (onCloseMobileSidebar) onCloseMobileSidebar();
                }}
                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative ${
                  isSelected
                    ? 'bg-brand-600/15 border border-brand-500/30 shadow-sm'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {/* Avatar with Online/Offline indicator */}
                <div className="relative shrink-0">
                  <img
                    src={target?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${target?.username || 'user'}`}
                    alt={target?.display_name || 'User'}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-800 ring-1 ring-slate-700/60"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                      online ? 'bg-emerald-500 online-pulse' : 'bg-slate-600'
                    }`}
                  />
                </div>

                {/* Conversation Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-semibold truncate ${isSelected ? 'text-brand-300' : 'text-slate-100'}`}>
                      {target?.display_name || 'User'}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                      {formatTime(conv.lastMessage?.created_at || conv.updatedAt)}
                    </span>
                  </div>

                  {/* Last message or Typing Status */}
                  <div className="flex items-center justify-between">
                    {isTyping ? (
                      <p className="text-xs text-brand-400 font-medium truncate flex items-center gap-1 animate-pulse">
                        <span>typing...</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        {conv.lastMessage?.type === 'image' ? (
                          <>
                            <ImageIcon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                            <span>Photo</span>
                          </>
                        ) : (
                          conv.lastMessage?.content || 'No messages yet'
                        )}
                      </p>
                    )}

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && !isSelected && (
                      <span className="ml-2 px-2 py-0.5 bg-brand-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
