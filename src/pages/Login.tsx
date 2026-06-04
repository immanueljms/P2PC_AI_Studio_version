import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Lock, User as UserIcon, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setErrorMsg('');
      setIsSubmitting(true);
      const data = await login({ username, password });
      if (data.success) {
        navigate(data.data.role === 'host' ? '/host' : '/player');
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to authenticate. The server might be unreachable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131a2c] rounded-2xl border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-2xl mb-3">
            <Cpu className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to P2PC</h1>
          <p className="text-sm text-slate-400 mt-1">Rent out your GPU or rent someone else's rig</p>
        </div>

        {/* Error Dialog */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                id="username-input"
                type="text"
                placeholder="Ex: cyber_gamer10"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm"
              />
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-indigo-950/40 text-sm"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5"></span>
            ) : (
              <>
                <span>Enter Platform</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Don't have an gaming account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/35 hover:decoration-indigo-400/90 transition-all">
            Join Platform
          </Link>
        </p>
      </div>
    </div>
  );
}
