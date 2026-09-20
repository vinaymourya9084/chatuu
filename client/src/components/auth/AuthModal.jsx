import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, User, Mail, Lock, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AuthModal() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username || email, password);
      } else {
        await register(username, email, password, displayName);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch (_) {}
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickUser = (userNum) => {
    if (userNum === 1) {
      setUsername('rohan_dev');
      setPassword('password123');
      setEmail('rohan@example.com');
      setDisplayName('Rohan Sharma');
    } else {
      setUsername('sameer_ui');
      setPassword('password123');
      setEmail('sameer@example.com');
      setDisplayName('Sameer Khan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-fast"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-fast"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/30 mb-4 ring-4 ring-brand-500/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Chat<span className="text-brand-400">uu</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Welcome back! Sign in to continue your conversations.' : 'Create your free account & start chatting in real time.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 border border-slate-700/50">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              isLogin
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
              !isLogin
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                required
                placeholder={isLogin ? 'username or email' : 'e.g. rohan_dev'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Account' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons (Super helpful for instant testing between two windows) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2.5 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Autofill Test Profiles:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillQuickUser(1)}
              className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 rounded-lg border border-slate-700/50 transition-colors truncate"
            >
              User 1 (Rohan)
            </button>
            <button
              type="button"
              onClick={() => fillQuickUser(2)}
              className="flex-1 py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 rounded-lg border border-slate-700/50 transition-colors truncate"
            >
              User 2 (Sameer)
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Real Persistent SQLite Database
          </span>
        </div>
      </div>
    </div>
  );
}
