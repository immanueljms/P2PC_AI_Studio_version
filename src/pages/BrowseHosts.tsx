import React, { useEffect, useState } from 'react';
import { hostApi, sessionApi } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HostProfile, GameSession } from '../types';
import { 
  Gamepad2, Cpu, Database, Wifi, Coins, History, Check, ShieldAlert, Zap, Radio, Loader2, ArrowRight, Laptop, Monitor
} from 'lucide-react';

const CONNECTION_PRESETS = [
  { name: 'Complete OS Control', description: 'Full screen share, raw keyboard/mouse forwarding, and interactive host desktop workspace.', banner: '💻 Complete Laptop Control' },
  { name: 'GPU Cloud Gaming Mode', description: 'Optimized high frame rate compression, high bitrate buffer, and virtual gamepad forwarding.', banner: '🎮 Dynamic Gaming Preset' },
  { name: 'Creator Workspace Node', description: 'Raw workstation allocation optimized for GPU renders, heavy computing, and modeling tools.', banner: '🎨 Production Workstation' },
  { name: 'Software Developer Sandbox', description: 'Sandbox preset ideal for terminal logs, server code, and coding development controls.', banner: '⚡ Developer VM Environment' },
];

export default function BrowseHosts() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const [hosts, setHosts] = useState<HostProfile[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('Complete OS Control');
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<GameSession[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const syncLobby = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // Update credits info
      await fetchUser();

      // Check for active sessions
      const activeRes = await sessionApi.getAciveSession();
      if (activeRes.data.success && activeRes.data.data) {
        setActiveSession(activeRes.data.data);
      } else {
        setActiveSession(null);
      }

      // Fetch all available hosts with no game specification limits
      const hostsRes = await hostApi.getHosts('');
      if (hostsRes.data.success) {
        setHosts(hostsRes.data.data);
      }

      // Fetch user's session history
      const historyRes = await sessionApi.getHistory();
      if (historyRes.data.success) {
        setSessionHistory(historyRes.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to synchronize lobby resources.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncLobby();
    // Refresh list of hosts every 15 seconds
    const interval = setInterval(() => {
      syncLobby();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmBooking = async (hostId: number) => {
    if (isBooking) return;
    try {
      setIsBooking(String(hostId));
      setErrorMsg('');
      
      const res = await sessionApi.book({ host_id: hostId, game_name: selectedPreset });
      
      if (res.data.success) {
        navigate(`/session/${res.data.data.id}`);
      } else {
        setErrorMsg(res.data.error || 'Failed to book session.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Booking declined by host authorization rules.');
    } finally {
      setIsBooking(null);
    }
  };

  // Immersive mock simulator helper to generate static coordinates / geolocations
  const getSimulatedGeolocation = (id: number) => {
    const locations = ['Seoul, KR', 'Sydney, AU', 'Warsaw, PL', 'Singapore, SG', 'Sao Paulo, BR', 'Frankfurt, DE'];
    return locations[id % locations.length];
  };

  const getSimulatedPing = (id: number) => {
    return (15 + (id * 9) % 35);
  };

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Alert if Active Session exists */}
        {activeSession && (
          <div className="bg-gradient-to-r from-violet-950 to-indigo-950 border border-violet-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="bg-violet-600/20 p-3 rounded-xl border border-violet-500/30">
                <Radio className="w-6 h-6 text-violet-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Active Connection Pipeline Running</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  You are currently sharing <span className="font-bold text-white">{activeSession.gpu_model}</span> in <span className="text-indigo-400 font-bold">{activeSession.game_name}</span> environment mode.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/session/${activeSession.id}`)}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-950/40"
            >
              <span>Resume Laptop Screen Stream</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-4 rounded-xl text-sm flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">P2PC GPU Matchmaker</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Gamer Lobby</h1>
          </div>
          
          <div className="text-sm bg-slate-900 border border-slate-850 px-4 py-2 rounded-xl flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Account Assets:</span>
            <span className="font-bold text-amber-400">{user?.credits.toFixed(2)} credits</span>
          </div>
        </div>

        {/* Laptop Control Preset selection tiles */}
        <div className="space-y-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
              1. Choose Laptop Control Environment
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select what environment type you want to initialize upon taking complete control of the host laptop.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {CONNECTION_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setSelectedPreset(preset.name)}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  selectedPreset === preset.name
                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-[#131a2c] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <p className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-tight">{preset.banner}</p>
                  <h3 className="text-white font-bold text-sm mt-1">{preset.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{preset.description}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-4 text-xs font-bold font-mono text-indigo-300">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Direct Workspace Access</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Nodes search layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Nodes catalog column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-400 font-mono">
                2. Available GPU Host Nodes ({hosts.length})
              </h2>
              
              <div className="text-xs text-emerald-400 font-mono bg-emerald-900/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Direct Access (No VRAM limits)</span>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-[#131a2c] border border-slate-850 p-12 rounded-2xl text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-sm font-mono text-slate-400">Syncing available host laptop rigs...</p>
              </div>
            ) : hosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hosts.map((host) => {
                  const nodePing = getSimulatedPing(host.id);
                  const isSufficientCredits = (user?.credits || 0) >= host.price_per_hour;

                  return (
                    <div 
                      key={host.id} 
                      className={`bg-[#131a2c] rounded-2xl border p-5 relative flex flex-col justify-between transition hover:shadow-xl hover:border-slate-700 ${
                        host.user_id === user?.id ? 'border-indigo-650 opacity-90' : 'border-slate-800'
                      }`}
                    >
                      {/* Badge and Title */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-bold bg-[#1e293b]/50 border border-slate-700/60 px-2 py-0.5 rounded text-indigo-400 font-mono">
                            {getSimulatedGeolocation(host.id)}
                          </span>
                          <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                            nodePing < 30 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            <Zap className="w-3 h-3" />
                            {nodePing}ms ping
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-extrabold tracking-tight text-white pt-2">
                          {host.gpu_model}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Provider node: <span className="text-indigo-300 font-bold font-mono">{host.username}</span>
                        </p>
                      </div>

                      {/* Specs widgets */}
                      <div className="grid grid-cols-2 gap-3 my-4 py-3 border-y border-slate-800/40">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-900 p-1.5 rounded-lg text-indigo-400">
                            <Database className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-mono text-slate-500 leading-none">VRAM</p>
                            <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{host.vram_gb} GB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="bg-slate-900 p-1.5 rounded-lg text-indigo-400">
                            <Wifi className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-mono text-slate-500 leading-none">UPLOAD</p>
                            <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{host.upload_speed} Mbps</p>
                          </div>
                        </div>
                      </div>

                      {/* Cost and actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-[9px] font-mono text-slate-500 leading-none">COST RATE</p>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-lg font-extrabold font-mono text-emerald-400">
                              {host.price_per_hour}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">cr/hr</span>
                          </div>
                        </div>

                        {host.user_id === user?.id ? (
                           <div className="bg-indigo-600/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-center text-[10px] font-bold font-mono text-indigo-400">
                             Your Node Device
                           </div>
                        ) : (
                          <button
                            id={`book-node-${host.id}`}
                            onClick={() => handleConfirmBooking(host.user_id)}
                            disabled={!isSufficientCredits || !!activeSession || isBooking === String(host.user_id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              !isSufficientCredits
                                ? 'bg-slate-800 border border-red-900/50 text-red-400 hover:bg-slate-800/80 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {isBooking === String(host.user_id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : !isSufficientCredits ? (
                              'Low Balance'
                            ) : (
                              'Rent & Control'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#131a2c] border border-slate-850 p-12 rounded-2xl text-center">
                <Laptop className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-md font-bold text-white tracking-tight">No Available Hosting Nodes Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  There are no hosts registered or available for rental connection right now. Toggle a host node online to see it instantly!
                </p>
              </div>
            )}
          </div>

          {/* History rental logs context column */}
          <div className="bg-[#131a2c] p-6 rounded-2xl border border-slate-800 space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <History className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Rental History</h2>
            </div>

            {sessionHistory.length > 0 ? (
              <div className="space-y-3.5">
                {sessionHistory.slice(0, 5).map((sess) => (
                  <div key={sess.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200">Host: {sess.host_username}</span>
                      <span className="font-mono text-emerald-400 font-bold">-{sess.total_cost.toFixed(2)} cr</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sess.game_name} ({sess.gpu_model})</p>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                         {new Date(sess.start_time).toLocaleDateString()}
                       </span>
                       <span className="text-[9px] font-mono bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">
                         {sess.status}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-3 text-center">No previous rental connection history.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
