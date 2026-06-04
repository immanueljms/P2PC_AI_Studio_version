import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, LogOut, LayoutDashboard, Wallet, Gamepad2, Coins } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
            <Cpu className="w-6 h-6 text-indigo-100" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-sans">
            P2PC
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest bg-slate-800 px-2 py-0.5 rounded text-indigo-400 font-bold border border-slate-700">
            GPU Cloud
          </span>
        </Link>

        {/* Action Links */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {/* Credentials / Wallet Info */}
              <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-slate-300">
                  Credit Balance:
                </span>
                <span className="text-sm font-bold text-amber-400">
                  {user.credits.toFixed(2)} CR
                </span>
              </div>

              {/* Dashboard Nav button */}
              <Link
                to={user.role === 'host' ? '/host' : '/player'}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-medium tracking-tight text-sm transition-all border border-slate-700"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>
                  {user.role === 'host' ? 'Host Console' : 'Gamer Lobby'}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 px-4 py-2 rounded-xl font-medium tracking-tight text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link 
                to="/login"
                className="text-slate-300 hover:text-white px-4 py-2 font-medium text-sm transition"
              >
                Sign In
              </Link>
              <Link 
                to="/register"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-semibold text-sm shadow-md transition-all shadow-indigo-900/20"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
