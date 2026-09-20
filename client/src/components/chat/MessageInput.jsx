import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import {
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Paperclip,
  Loader2,
  Sparkles
} from 'lucide-react';

const QUICK_EMOJIS = ['😊', '😂', '🔥', '❤️', '👍', '🎉', '🚀', '😎', '🙏', '👀', '💯', '✨'];

export default function MessageInput({ conversationId, recipientId, onMessageSent }) {
  const { sendMessage, startTyping, stopTyping } = useSocket();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Handle typing indicator trigger
  const handleInputChange = (e) => {
    setContent(e.target.value);

    // Notify socket typing started
    startTyping(conversationId, recipientId);

    // Debounce typing stop
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping(conversationId, recipientId);
    }, 1500);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only image attachments (JPEG, PNG, GIF, WEBP) are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (uploading) return;

    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;

    setUploading(true);
    stopTyping(conversationId, recipientId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    try {
      let mediaUrl = '';
      let type = 'text';
      let fileName = '';
      let fileSize = 0;

      // If there's an image file, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        mediaUrl = uploadRes.data.url;
        fileName = uploadRes.data.fileName;
        fileSize = uploadRes.data.fileSize;
        type = 'image';
      }

      // Send real-time message via Socket.IO
      const sentMessage = await sendMessage({
        conversationId,
        content: trimmed,
        type,
        mediaUrl,
        fileName,
        fileSize
      });

      // Clear input fields
      setContent('');
      removeSelectedFile();
      setShowEmojiPicker(false);

      if (onMessageSent) {
        onMessageSent(sentMessage);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-2 sm:p-4 bg-slate-900 border-t border-slate-800/80 relative shrink-0">
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 right-2 sm:right-auto sm:left-4 mb-2 p-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-30 animate-fade-in max-w-sm">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Quick Reactions & Emojis</span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {QUICK_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-800 rounded-xl transition-transform active:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Image Attachment Preview Card */}
      {filePreview && (
        <div className="mb-2 p-2 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between max-w-xs animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={filePreview}
              alt="attachment preview"
              className="w-11 h-11 rounded-xl object-cover bg-slate-900 border border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{selectedFile?.name}</p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeSelectedFile}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSend} className="flex items-end gap-1.5 sm:gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Media Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Photo"
          className="p-2.5 sm:p-3 text-slate-400 hover:text-brand-400 hover:bg-slate-800/80 rounded-2xl border border-slate-800 transition-all shrink-0 active:scale-95"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emojis"
          className={`p-2.5 sm:p-3 rounded-2xl border border-slate-800 transition-all shrink-0 active:scale-95 ${
            showEmojiPicker
              ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/80'
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Area (16px base font size on mobile to prevent Safari auto-zoom) */}
        <div className="flex-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all flex items-center px-3 py-1 min-h-[44px]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={filePreview ? 'Add a caption...' : 'Type a message...'}
            className="w-full bg-transparent text-white text-base sm:text-sm placeholder-slate-500 focus:outline-none resize-none py-1.5 leading-relaxed max-h-32"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={uploading || (!content.trim() && !selectedFile)}
          title="Send message"
          className="p-2.5 sm:p-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
