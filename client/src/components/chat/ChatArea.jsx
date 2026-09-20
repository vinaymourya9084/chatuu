import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import UserProfileDrawer from './UserProfileDrawer';
import {
  ArrowLeft,
  Info,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Search,
  MoreVertical,
  Image as ImageIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ChatArea({
  conversation,
  onBack,
  onOpenImage,
  onOpenSearch
}) {
  const { user } = useAuth();
  const { isUserOnline, joinConversation, leaveConversation, markConversationAsRead, typingMap, socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  const participant = conversation?.participant;
  const isOnline = participant ? isUserOnline(participant.id) : false;

  // Active typing users in this conversation
  const convTyping = conversation ? typingMap[conversation.id] : null;
  const typingUsersList = convTyping ? Object.values(convTyping) : [];

  // Load message history when conversation changes
  useEffect(() => {
    if (!conversation?.id) return;

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chats/${conversation.id}/messages`);
        if (isMounted) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();
    joinConversation(conversation.id);
    markConversationAsRead(conversation.id);

    return () => {
      isMounted = false;
      leaveConversation(conversation.id);
    };
  }, [conversation?.id]);

  // Listen for new real-time messages for active conversation
  useEffect(() => {
    if (!socket || !conversation?.id) return;

    const handleReceiveMessage = (newMsg) => {
      if (newMsg.conversation_id === conversation.id) {
        setMessages((prev) => {
          // Avoid duplicate messages if already present
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markConversationAsRead(conversation.id);
      }
    };

    const handleMessagesRead = ({ conversationId, readerId }) => {
      if (conversationId === conversation.id) {
        setMessages((prev) =>
          prev.map(m => (m.sender_id === user.id ? { ...m, is_read: 1 } : m))
        );
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, conversation?.id, user?.id]);

  const handleMessageSent = (newMsg) => {
    if (newMsg && newMsg.conversation_id === conversation?.id) {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }
  };

  if (!conversation) {
    return (
      <main className="flex-1 h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none relative overflow-hidden">
        {/* Background glow */}
        <div className="w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none absolute -z-0" />

        <div className="relative z-10 max-w-md">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 to-indigo-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/10">
            <MessageSquare className="w-10 h-10 text-brand-400" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-brand-400">Chatuu</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Select an existing conversation from the sidebar or find a friend to start chatting with instant real-time messaging, photos, and live indicators.
          </p>

          <button
            onClick={onOpenSearch}
            className="mt-6 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-brand-500/30 active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search & Start New Chat</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-full flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="p-3.5 sm:px-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile back button */}
          <button
            onClick={onBack}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Participant Avatar */}
          <div
            className="relative shrink-0 cursor-pointer group"
            onClick={() => setShowProfileDrawer(true)}
          >
            <img
              src={participant?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${participant?.username || 'user'}`}
              alt={participant?.display_name || 'User'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover bg-slate-800 ring-2 ring-slate-700/70 group-hover:ring-brand-500 transition-all"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-slate-900 ${
                isOnline ? 'bg-emerald-500 online-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          {/* Participant Info */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setShowProfileDrawer(true)}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {participant?.display_name || 'User'}
              </h2>
              {participant?.status_text && (
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 bg-slate-800 text-brand-300 rounded-full border border-slate-700/60 truncate">
                  {participant.status_text}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                {isOnline ? 'Active Now' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProfileDrawer(true)}
            title="Contact Info"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Feed Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <MessageList
          messages={messages}
          loading={loading}
          onOpenImage={onOpenImage}
        />

        {/* Floating Typing Indicator */}
        <div className="px-4">
          <TypingIndicator typingUsers={typingUsersList} />
        </div>
      </div>

      {/* Bottom Message Input Bar */}
      <MessageInput
        conversationId={conversation.id}
        recipientId={participant?.id}
        onMessageSent={handleMessageSent}
      />

      {/* Contact Profile Drawer */}
      <UserProfileDrawer
        user={participant}
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />
    </main>
  );
}
