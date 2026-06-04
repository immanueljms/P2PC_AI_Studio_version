import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { Cpu, Lock, User as UserIcon, Gamepad2, Radio, Server, Check, ArrowRight, AlertTriangle } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'player' | 'host'>('player');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username and Password can cannot be blank.');
      return;
    }

    try {
      setErrorMsg('');
      setIsSubmitting(true);
      const res = await authApi.register({ username, password, role });
      if (res.data.success) {
        // Automatically redirect to login page after successful registration
        navigate('/login');
      } else {
        setErrorMsg(res.data.error || 'Registration failed. Try a different username.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration service offline. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#0b0f19] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-[#131a2c] rounded-2xl border border-slate-800 shadow-2xl p-8 relative overflow-hidden">
        {/* Backdrop decorative lights */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="inline-flex bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-2xl mb-3">
            <Cpu className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your P2PC Account</h1>
          <p className="text-sm text-slate-400 mt-1">Start connecting your PC hardware or play instantly</p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm leading-relaxed">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Username
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                id="reg-user"
                type="text"
                placeholder="Ex: neon_rider"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                id="reg-pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#1e293b]/50 border border-slate-700/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm"
              />
            </div>
          </div>

          {/* Role selector tiles */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              Select Platform Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Option Player */}
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`relative p-5 rounded-2xl border text-left transition-all ${
                  role === 'player'
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'bg-transparent border-slate-800 hover:border-slate-700'
                }`}
              >
                {role === 'player' && (
                  <span className="absolute top-3 right-3 bg-indigo-600 text-white p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="bg-indigo-600/10 text-indigo-400 inline-block p-2 rounded-xl mb-3">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold text-sm tracking-tight">I am a Player</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Rent high-end GPUs, stream games instantly. Starts with 100 free credits.
                </p>
              </button>

              {/* Option Host */}
              <button
                type="button"
                onClick={() => setRole('host')}
                className={`relative p-5 rounded-2xl border text-left transition-all ${
                  role === 'host'
                    ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'bg-transparent border-slate-800 hover:border-slate-700'
                }`}
              >
                {role === 'host' && (
                  <span className="absolute top-3 right-3 bg-purple-600 text-white p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="bg-purple-600/10 text-purple-400 inline-block p-2 rounded-xl mb-3">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-white font-bold text-sm tracking-tight">I am a Host</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Share target desktop GPU power, earn currency when gamers connect to you.
                </p>
              </button>
            </div>
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-750 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-indigo-950/40 text-sm"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin border-2 border-white/30 border-t-white rounded-full w-5 h-5"></span>
            ) : (
              <>
                <span>Sign Up & Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Already registered on P2PC?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/35 hover:decoration-indigo-400/90 transition-all">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
