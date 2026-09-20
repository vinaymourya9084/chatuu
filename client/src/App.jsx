import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import api from './utils/api';
import Sidebar from './components/sidebar/Sidebar';
import ChatArea from './components/chat/ChatArea';
import AuthModal from './components/auth/AuthModal';
import ProfileModal from './components/profile/ProfileModal';
import UserSearchModal from './components/sidebar/UserSearchModal';
import ImageLightbox from './components/common/ImageLightbox';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [lightboxData, setLightboxData] = useState({ isOpen: false, url: '', alt: '' });

  // Mobile navigation state: 'sidebar' or 'chat'
  const [mobileView, setMobileView] = useState('sidebar');

  // Fetch conversations list
  const fetchConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const res = await api.get('/chats');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
    }
  }, [user?.id]);

  // Real-time conversation list updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = ({ conversationId, lastMessage, unreadSenderId }) => {
      setConversations((prevConvs) => {
        const existingIndex = prevConvs.findIndex(c => c.id === conversationId);
        if (existingIndex !== -1) {
          const updated = [...prevConvs];
          const conv = { ...updated[existingIndex] };
          conv.lastMessage = lastMessage;
          conv.updatedAt = lastMessage.created_at;

          // Increment unread count if we are not currently active in this conversation
          if (activeConversation?.id !== conversationId && unreadSenderId !== user?.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }

          // Move updated conversation to top of the list
          updated.splice(existingIndex, 1);
          return [conv, ...updated];
        } else {
          // If brand new conversation started, reload conversations
          fetchConversations();
          return prevConvs;
        }
      });
    };

    const handleReceiveMessage = (newMsg) => {
      // If we are currently active on this conversation, reset unread
      if (activeConversation?.id === newMsg.conversation_id) {
        setConversations(prev =>
          prev.map(c => (c.id === newMsg.conversation_id ? { ...c, unreadCount: 0 } : c))
        );
      }
    };

    const handleUserProfileUpdated = ({ user: updatedUser }) => {
      setConversations(prev =>
        prev.map(c => {
          if (c.participant?.id === updatedUser.id) {
            return {
              ...c,
              participant: {
                ...c.participant,
                ...updatedUser
              }
            };
          }
          return c;
        })
      );

      setActiveConversation(prev => {
        if (prev?.participant?.id === updatedUser.id) {
          return {
            ...prev,
            participant: {
              ...prev.participant,
              ...updatedUser
            }
          };
        }
        return prev;
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_profile_updated', handleUserProfileUpdated);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_profile_updated', handleUserProfileUpdated);
    };
  }, [socket, activeConversation?.id, user?.id]);

  const handleSelectConversation = (conv) => {
    // Reset unread count for this conversation in state
    setConversations(prev =>
      prev.map(c => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
    setActiveConversation(conv);
    setMobileView('chat');
  };

  const handleOpenImage = (url, alt) => {
    setLightboxData({ isOpen: true, url, alt });
  };

  const handleCloseImage = () => {
    setLightboxData({ isOpen: false, url: '', alt: '' });
  };

  if (authLoading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold tracking-wide text-slate-400">Loading Chatuu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full max-h-[100dvh] overflow-hidden flex bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar View (hidden on mobile if viewing active chat) */}
      <div className={`h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex w-full md:w-80 lg:w-96 shrink-0'}`}>
        <Sidebar
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSearch={() => setShowSearchModal(true)}
          conversations={conversations}
          setConversations={setConversations}
          loadingConversations={loadingConversations}
          onCloseMobileSidebar={() => setMobileView('chat')}
        />
      </div>

      {/* Active Chat Area (hidden on mobile if in sidebar view) */}
      <div className={`flex-1 h-full min-w-0 ${mobileView === 'sidebar' ? 'hidden md:flex' : 'flex'}`}>
        <ChatArea
          conversation={activeConversation}
          onBack={() => setMobileView('sidebar')}
          onOpenImage={handleOpenImage}
          onOpenSearch={() => setShowSearchModal(true)}
        />
      </div>

      {/* Modals & Overlays */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <UserSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectConversation={handleSelectConversation}
      />

      {lightboxData.isOpen && (
        <ImageLightbox
          imageUrl={lightboxData.url}
          altText={lightboxData.alt}
          onClose={handleCloseImage}
        />
      )}
    </div>
  );
}
