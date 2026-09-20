import React from 'react';

export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.displayName || u.username).join(', ');

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 text-xs text-brand-300 w-fit shadow-md animate-fade-in mb-2">
      {/* Animated jumping dots */}
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" />
      </div>
      <span className="font-medium">
        {typingUsers.length === 1 ? `${names} is typing...` : `${names} are typing...`}
      </span>
    </div>
  );
}
