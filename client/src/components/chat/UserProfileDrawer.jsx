import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { X, User, Mail, Calendar, Circle, ShieldCheck, MessageSquare, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function UserProfileDrawer({ user: targetUser, isOpen, onClose }) {
  const { isUserOnline } = useSocket();

  if (!isOpen || !targetUser) return null;

  const online = isUserOnline(targetUser.id);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact Info</h3>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="text-center">
          <div className="relative inline-block mx-auto mb-3">
            <img
              src={targetUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUser.username}`}
              alt={targetUser.display_name}
              className="w-24 h-24 rounded-3xl object-cover bg-slate-800 ring-4 ring-slate-800 shadow-xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-5 h-5 rounded-full ring-4 ring-slate-900 ${
                online ? 'bg-emerald-500 online-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          <h2 className="text-lg font-bold text-white">{targetUser.display_name}</h2>
          <p className="text-xs text-brand-400 font-medium">@{targetUser.username}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700/60 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            <span>{online ? 'Active Now' : 'Offline'}</span>
          </div>
        </div>

        {/* Status Mood */}
        {targetUser.status_text && (
          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Current Status
            </p>
            <p className="text-sm text-slate-200 font-medium">{targetUser.status_text}</p>
          </div>
        )}

        {/* Bio */}
        <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">About</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {targetUser.bio || 'Hey there! I am using Chatuu.'}
          </p>
        </div>

        {/* User Info Items */}
        <div className="space-y-3 pt-2">
          {targetUser.email && (
            <div className="flex items-center gap-3 text-xs text-slate-300 p-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400">Email Address</p>
                <p className="truncate font-medium">{targetUser.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-300 p-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Account Type</p>
              <p className="font-medium text-emerald-400">Real Verified User</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
