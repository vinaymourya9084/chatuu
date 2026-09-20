import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Image as ImageIcon, ZoomIn } from 'lucide-react';

export default function MessageList({ messages, loading, onOpenImage }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatDateHeader = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const formatMessageTime = (dateString) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-slate-500 text-xs">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading chat history...
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center text-brand-400 mb-3 border border-slate-700/50">
          <ImageIcon className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">No messages here yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Say hi or send a photo to start chatting in real time!
        </p>
      </div>
    );
  }

  // Group messages by date
  let lastDateHeader = '';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg, index) => {
        const isOutgoing = msg.sender_id === user.id;
        const currentDateHeader = formatDateHeader(msg.created_at);
        const showDateHeader = currentDateHeader !== lastDateHeader;
        if (showDateHeader) {
          lastDateHeader = currentDateHeader;
        }

        return (
          <React.Fragment key={msg.id || index}>
            {/* Date separator */}
            {showDateHeader && (
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-md rounded-full text-[11px] font-semibold text-slate-400 border border-slate-700/40 shadow-sm">
                  {currentDateHeader}
                </span>
              </div>
            )}

            {/* Message Row */}
            <div className={`flex items-end gap-2.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              {/* Incoming sender avatar */}
              {!isOutgoing && (
                <img
                  src={msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_username || 'user'}`}
                  alt="avatar"
                  className="w-8 h-8 rounded-xl object-cover bg-slate-800 ring-1 ring-slate-700 shrink-0 mb-1"
                />
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-3xl p-3.5 shadow-md transition-all ${
                  isOutgoing
                    ? 'bg-gradient-to-br from-brand-600 to-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
                }`}
              >
                {/* Image message attachment */}
                {msg.type === 'image' && msg.media_url && (
                  <div
                    onClick={() => onOpenImage(msg.media_url, msg.file_name || 'Chat image')}
                    className="relative mb-2 rounded-2xl overflow-hidden cursor-pointer group bg-slate-900/50 max-h-80"
                  >
                    <img
                      src={msg.media_url}
                      alt={msg.file_name || 'Shared image'}
                      className="w-full h-auto object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-[2px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>View Full Photo</span>
                    </div>
                  </div>
                )}

                {/* Text content */}
                {msg.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-normal select-text">
                    {msg.content}
                  </p>
                )}

                {/* Timestamp & Read Receipts */}
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isOutgoing ? 'text-white/75' : 'text-slate-400'
                  }`}
                >
                  <span>{formatMessageTime(msg.created_at)}</span>
                  {isOutgoing && (
                    <span>
                      {msg.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-200 inline" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/70 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
