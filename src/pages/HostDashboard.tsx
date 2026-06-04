import React, { useState, useEffect } from 'react';
import { hostApi, sessionApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { HostProfile, GameSession } from '../types';
import { 
  Server, Cpu, Database, Wifi, Coins, ToggleLeft, ToggleRight, 
  CheckCircle, History, PlayCircle, Loader2, RefreshCw, Gamepad2, Hourglass 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HostDashboard() {
  const { user, fetchUser } = useAuth();
  const [profile, setProfile] = useState<Partial<HostProfile>>({
    gpu_model: 'NVIDIA RTX 3080',
    vram_gb: 10,
    upload_speed: 100,
    price_per_hour: 15,
    is_available: false
  });
  
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [history, setHistory] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // Refresh current user specs
      await fetchUser();

      // Retrieve host profile
      const profRes = await hostApi.getProfile();
      if (profRes.data.success) {
        setProfile(profRes.data.data);
      }

      // Retrieve current active session
      const activeRes = await sessionApi.getAciveSession();
      if (activeRes.data.success) {
        setActiveSession(activeRes.data.data);
      }

      // Retrieve historical sessions limit 10
      const historyRes = await sessionApi.getHistory();
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sync console metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh active session and earnings status every 15 seconds
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateProfile = async (updates: Partial<HostProfile>) => {
    try {
      setIsSaving(true);
      const updatedProfile = { ...profile, ...updates };
      const res = await hostApi.updateProfile(updatedProfile);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, ...updates }));
      } else {
        setErrorMsg('Failed to update GPU parameters.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = () => {
    const nextVal = !profile.is_available;
    handleUpdateProfile({ is_available: nextVal });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUpdateProfile({});
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-[#0b0f19]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm leading-none">Syncing Node Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Console controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">Local Provider Node</p>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Host Console</h1>
          </div>
          
          <button 
            onClick={loadData}
            className="flex items-center gap-2 text-xs font-mono uppercase bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Dashboard Cards overview with JetBrains Mono numbers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Earnings Counter Card */}
          <div className="bg-[#131a2c] p-6 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-indigo-600/10 p-2.5 rounded-xl text-indigo-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Node Balance</p>
              <p className="text-3xl font-bold tracking-tight text-indigo-300 mt-2 font-mono">
                {user?.credits.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Earned by sharing your virtual desktop environment.
            </p>
          </div>

          {/* Availability Control Card */}
          <div className="bg-[#131a2c] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Broker Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${profile.is_available ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                  <p className="text-md font-bold text-white tracking-tight">
                    {profile.is_available ? 'Receiving Contracts' : 'Offline / Invisible'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleToggleAvailable}
                className="text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                title={profile.is_available ? "Turn off availability" : "Turn on availability"}
              >
                {profile.is_available ? (
                  <ToggleRight className="w-12 h-12 text-indigo-500 animate-pulse" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-slate-600" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              {profile.is_available 
                ? "Your GPU model is public. Gamers can discover and book sessions in real-time." 
                : "Toggle back online to receive dynamic connection contracts."}
            </p>
          </div>

          {/* Current Connected Client Info */}
          <div className="bg-[#131a2c] p-6 rounded-2xl border border-slate-800 flex flex-col justify-between md:col-span-2">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Active Pipeline Connection</p>
              {activeSession ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="bg-indigo-650/20 p-3 rounded-2xl">
                    <Gamepad2 className="w-8 h-8 text-indigo-400 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                      Playing: {activeSession.game_name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-0.5">
                      Client ID: <span className="text-sm font-mono text-indigo-400 font-bold">{activeSession.player_username}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-4 italic">No active gaming clients connected to your CPU.</p>
              )}
            </div>
            <div>
              {activeSession ? (
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-slate-800/60 gap-3">
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Hourglass className="w-3.5 h-3.5" />
                      Session Active
                    </span>
                  </div>
                  <Link 
                    to={`/session/${activeSession.id}`}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition text-center"
                  >
                    Manage Stream Panel
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-4">
                  Connection ports ready. Make your GPU available to allow direct cloud rentals.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form and History columns layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Hardware spec settings panel */}
          <div className="bg-[#131a2c] p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <Server className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">GPU Node Parameters</h2>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 mb-1">
                  GPU Model
                </label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={profile.gpu_model}
                    onChange={(e) => setProfile({ ...profile, gpu_model: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-[#1e293b]/50 border border-slate-705 text-sm rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
                    placeholder="Enter GPU details, e.g. NVIDIA RTX 4070"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 mb-1">
                    VRAM (GB)
                  </label>
                  <div className="relative">
                    <Database className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      value={profile.vram_gb}
                      onChange={(e) => setProfile({ ...profile, vram_gb: parseInt(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 bg-[#1e293b]/50 border border-slate-705 text-sm rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 mb-1">
                    Upload (Mbps)
                  </label>
                  <div className="relative">
                    <Wifi className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      value={profile.upload_speed}
                      onChange={(e) => setProfile({ ...profile, upload_speed: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2 bg-[#1e293b]/50 border border-slate-705 text-sm rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 mb-1">
                  Rental Rate (Credits/Hour)
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={profile.price_per_hour}
                    onChange={(e) => setProfile({ ...profile, price_per_hour: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 bg-[#1e293b]/50 border border-slate-705 text-sm rounded-xl text-white focus:outline-none focus:border-indigo-500 font-mono"
                    placeholder="12"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Commit Specs Update'}
              </button>
            </form>
          </div>

          {/* History Column */}
          <div className="bg-[#131a2c] lg:col-span-2 p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Contract Connection Logs</h2>
            </div>

            <div className="overflow-x-auto">
              {history.length > 0 ? (
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-widest text-[9px] font-mono border-b border-slate-800">
                      <th className="py-2.5 font-bold">Session ID</th>
                      <th className="py-2.5 font-bold">Gamer</th>
                      <th className="py-2.5 font-bold">Software</th>
                      <th className="py-2.5 font-bold">Earnings</th>
                      <th className="py-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((sess) => (
                      <tr key={sess.id} className="border-b border-slate-800/40 hover:bg-slate-900/40 transition">
                        <td className="py-3 font-mono font-bold text-slate-300">#{sess.id}</td>
                        <td className="py-3 text-white font-semibold">{sess.player_username}</td>
                        <td className="py-3 text-slate-400">{sess.game_name}</td>
                        <td className="py-3 font-mono text-emerald-400 font-bold">+{sess.total_cost.toFixed(2)} cr</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-wide font-bold bg-slate-800 text-slate-300">
                            {sess.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 font-sans italic text-sm text-center py-6">Your connection logs will appear here once users connect to your node.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
