import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { X, Camera, Check, User, FileText, Smile, Sparkles, Upload } from 'lucide-react';

const STATUS_PRESETS = [
  '🟢 Available',
  '🚀 Coding full-speed',
  '☕ Coffee break',
  '🎯 Deep work / Focus',
  '🔕 Do Not Disturb',
  '✈️ Traveling'
];

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aria',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zack',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Milo',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kira'
];

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [statusText, setStatusText] = useState(user?.status_text || 'Available');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !user) return null;

  // Handle uploading avatar image file directly to server
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatarUrl(res.data.url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload image. Please ensure it is less than 10MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        displayName,
        bio,
        statusText,
        avatarUrl
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Customize Profile</h2>
              <p className="text-xs text-slate-400">Update how other people see you on Chatuu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* Avatar Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                  alt={user.display_name}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-500/40 bg-slate-800 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{uploading ? '...' : 'Change'}</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl border border-slate-700/60 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-400" />
                  {uploading ? 'Uploading...' : 'Upload from device'}
                </button>

                <p className="text-[11px] text-slate-400">Or pick a cool avatar preset:</p>
                <div className="flex gap-1.5 flex-wrap">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all ${
                        avatarUrl === preset ? 'border-brand-500 scale-110 ring-2 ring-brand-500/30' : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover bg-slate-800" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
          </div>

          {/* Status Mood */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Status Mood</span>
              <span className="text-[11px] font-normal text-slate-400">Visible to friends</span>
            </label>
            <div className="relative mb-2">
              <Smile className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="What's your current status?"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStatusText(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    statusText === preset
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-slate-800/50 border-slate-700/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              About Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note about yourself..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
