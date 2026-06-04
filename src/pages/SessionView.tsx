import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionApi } from '../api/endpoints';
import { GameSession } from '../types';
import { 
  Gamepad2, Cpu, Wifi, Activity, Play, CheckCircle, AlertTriangle, Coins, Hourglass, Loader2, RefreshCw, Radio, Settings, Keyboard
} from 'lucide-react';

export default function SessionView() {
  const { id } = useParams();
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'connecting' | 'active' | 'completed' | 'failed'>('connecting');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [accumulatedCost, setAccumulatedCost] = useState(0);
  
  // Immersive render telemetry states
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [latency, setLatency] = useState(19);
  const [fps, setFps] = useState(60);
  const [bitrate, setBitrate] = useState(48.5); // Mbps
  const [inputCapture, setInputCapture] = useState<string>('Connection ready. Awaiting inputs...');
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [streamStarted, setStreamStarted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<GameSession | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Sync session facts
  const loadSessionDetails = async () => {
    try {
      if (!id) return;
      const res = await sessionApi.getAciveSession();
      if (res.data.success && res.data.data && String(res.data.data.id) === id) {
        setSession(res.data.data);
        setSessionStatus('active');
        
        // Calculate current elapsed seconds since session creation
        const startTime = new Date(res.data.data.start_time).getTime();
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(elapsed);
      } else {
        // If not found in active, try fetching history
        const historyRes = await sessionApi.getHistory();
        if (historyRes.data.success) {
          const match = historyRes.data.data.find(s => String(s.id) === id);
          if (match) {
            setSession(match);
            setSessionStatus('completed');
            setAccumulatedCost(match.total_cost);
          } else {
            setSessionStatus('failed');
          }
        } else {
          setSessionStatus('failed');
        }
      }
    } catch {
      setSessionStatus('failed');
    }
  };

  useEffect(() => {
    loadSessionDetails();
  }, [id]);

  // Connect WebSockets
  useEffect(() => {
    if (!user || !id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/${user.id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WS Connection established on client.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SESSION_ENDED' && String(data.session_id) === id) {
          setSessionStatus('completed');
          setAccumulatedCost(data.total_cost || 0);
          fetchUser();
        } else if (data.type === 'SIGNALING') {
          handleSignalingMessage(data.payload);
        }
      } catch (err) {
        console.error('Error receiving websocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WS Connection closed.');
    };

    return () => {
      ws.close();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [user, id]);

  const sendSignalingMessage = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionRef.current) {
      const matchSession = sessionRef.current;
      const targetId = user?.role === 'host' ? matchSession.player_id : matchSession.host_id;
      wsRef.current.send(JSON.stringify({ type: 'SIGNALING', targetId, payload }));
    }
  };

  const initPeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;
    
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({ type: 'candidate', candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setStreamStarted(true);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const handleSignalingMessage = async (payload: any) => {
    const pc = initPeerConnection();
    
    if (payload.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignalingMessage({ type: 'answer', answer });
    } else if (payload.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
    } else if (payload.type === 'candidate') {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) {
         videoRef.current.srcObject = stream;
      }
      const pc = initPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignalingMessage({ type: 'offer', offer });
      setStreamStarted(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
      alert('Failed to share screen. Ensure you have given permissions.');
    }
  };

  // Telemetry simulation loop
  useEffect(() => {
    if (sessionStatus !== 'active') return;

    const interval = setInterval(() => {
      // Increment elapsed seconds
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // In our server, 60 seconds = 1 hour. Let's compute accumulated cost matching server logic
        if (session && session.price_per_hour) {
          const simulatedHours = Math.max(0.1, next / 60);
          setAccumulatedCost(Number((simulatedHours * session.price_per_hour).toFixed(2)));
        }
        return next;
      });

      // Simulate network fluctuations
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(12, Math.min(32, prev + delta));
      });

      setFps((prev) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(58, Math.min(60, prev + delta));
      });

      setBitrate((prev) => {
        const delta = (Math.random() * 4) - 2;
        return Number(Math.max(35.0, Math.min(50.0, prev + delta)).toFixed(1));
      });

      setRenderedFrames((prev) => prev + 60);

    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStatus, session]);

  // Disconnect & Terminate connection
  const handleTerminateSession = async () => {
    if (!session) return;
    try {
      const res = await sessionApi.complete(session.id);
      if (res.data.success) {
        setSessionStatus('completed');
        setAccumulatedCost(res.data.data.final_cost || 0);
        fetchUser();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to settle session credits. Check network connection.');
    }
  };

  // Safe handler to track keyboard simulation keystrokes!
  const handleSimulateKeystroke = (action: string) => {
    setInputCapture(`Captured Event: [KeyIsPressed: ${action}] &rarr; Dispatched to host terminal.`);
  };

  // Helper formatting seconds to visual MM:SS
  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  if (sessionStatus === 'connecting') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-[#0b0f19]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm leading-none">Establishing direct host multiplexer channel...</p>
      </div>
    );
  }

  if (sessionStatus === 'failed') {
    return (
      <div className="min-h-[85vh] bg-[#0b0f19] flex items-center justify-center p-6">
        <div className="bg-[#131a2c] border border-slate-800 p-8 rounded-2xl text-center max-w-md space-y-5 shadow-2xl">
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl mx-auto w-fit text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Stream Pipeline Disconnected</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The target GPU session ID could not be retrieved, or the broker expired the allocation request.
          </p>
          <button 
            onClick={() => navigate(user?.role === 'host' ? '/host' : '/player')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP STATUS BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${sessionStatus === 'active' ? 'bg-emerald-500/15 animate-pulse' : 'bg-slate-850'}`}>
              <Radio className={`w-5 h-5 ${sessionStatus === 'active' ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Pipeline ID: #{session?.id}</p>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Stream Engine: <span className="text-indigo-400">{session?.game_name}</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs px-4 py-2 rounded-xl text-slate-300 font-bold flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showDiagnostics ? 'Hide Diagnostic Overlay' : 'Reveal Diagnostic Overlay'}</span>
            </button>

            <button
              onClick={() => navigate(user?.role === 'host' ? '/host' : '/player')}
              className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-xs px-4 py-2 rounded-xl text-slate-300 font-bold transition"
            >
              Background Dashboard
            </button>
          </div>
        </div>

        {/* ACTIVE STREAM LAYOUT */}
        {sessionStatus === 'active' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* VIRTUAL STREAM CONTAINER CANVASES */}
            <div className="lg:col-span-2 space-y-4">
              <div id="gp-viewport" className="aspect-video bg-black rounded-2xl border border-slate-800/80 overflow-hidden relative flex flex-col justify-between p-6 shadow-2xl group">
                
                {/* Virtual GPU Render Overlay background styling */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-[#10082a] to-[#041d1a] opacity-90 pointer-events-none z-0"></div>
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none z-0"></div>

                {/* Actual WebRTC Video Element */}
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-contain z-[5]"
                  style={{ display: streamStarted ? 'block' : 'none' }}
                />

                {/* Live canvas feed glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10" style={{ display: streamStarted ? 'none' : 'block' }}>
                  <Gamepad2 className="w-20 h-20 text-indigo-500/25 animate-pulse mx-auto mb-4" />
                  <p className="text-xs font-mono tracking-widest uppercase font-bold text-slate-500">
                    {user?.role === 'host' ? 'Awaiting Screen Share' : 'Awaiting Host Stream'}
                  </p>
                </div>

                {/* Viewport Top Information HUD */}
                <div className="flex justify-between items-start z-10">
                  <div className="bg-black/45 backdrop-blur-md border border-slate-800/60 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                    <div>
                      <p className="text-[9px] font-mono text-slate-400 leading-none">HOST NODE SYSTEM</p>
                      <p className="text-xs font-bold text-white mt-1 leading-none">{session?.gpu_model}</p>
                    </div>
                  </div>

                  <div className="bg-black/45 backdrop-blur-md border border-slate-800/60 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-indigo-400">
                    LATENCY: {latency}ms
                  </div>
                </div>

                {/* Viewport Interactive Controller Overlay Simulator */}
                <div className="flex flex-col items-center justify-center gap-4 z-10 w-full">
                  <div className="bg-slate-900/85 backdrop-blur border border-slate-800/80 p-4 rounded-xl max-w-sm text-center">
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {user?.role === 'host' 
                        ? "🕹️ A Player is sending virtual USB gamepad signals to this terminal." 
                        : "🕹️ Virtual USB Gamepad ready. Tap simulated triggers above to test pipeline delay."}
                    </p>
                  </div>

                  {user?.role === 'player' && (
                    <div className="flex gap-2 max-w-md flex-wrap justify-center">
                      <button 
                        onClick={() => handleSimulateKeystroke('DPAD_UP')}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded"
                      >
                        ▲ DPAD UP
                      </button>
                      <button 
                        onClick={() => handleSimulateKeystroke('DPAD_DOWN')}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded"
                      >
                        ▼ DPAD DOWN
                      </button>
                      <button 
                        onClick={() => handleSimulateKeystroke('BUTTON_A')}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded"
                      >
                        PRIMARY (A)
                      </button>
                      <button 
                        onClick={() => handleSimulateKeystroke('BUTTON_B')}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded"
                      >
                        SECONDARY (B)
                      </button>
                    </div>
                  )}
                </div>

                {/* Viewport Bottom Output HUD */}
                <div className="flex justify-between items-end z-10">
                  <div className="bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400">
                    FPS: {fps} | Bitrate: {bitrate} Mbps
                  </div>

                  <div className="bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400 max-w-[200px] truncate">
                    {inputCapture}
                  </div>
                </div>

              </div>

              {/* Dynamic stats overlay box */}
              {showDiagnostics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#111625] border border-slate-850 p-4 rounded-xl">
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Elapsed Duration</p>
                    <p className="text-lg font-mono font-bold text-white mt-1 flex items-center gap-1.5">
                      <Hourglass className="w-4 h-4 text-indigo-400" />
                      {formatTime(elapsedSeconds)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Accumulating Cost</p>
                    <p className="text-lg font-mono font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      {accumulatedCost.toFixed(2)} cr
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Total Packets rendered</p>
                    <p className="text-lg font-mono font-bold text-slate-300 mt-1">
                      {renderedFrames.toLocaleString()} F
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Stream status</p>
                    <p className="text-lg font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      ENCRYPTED
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR TERMINAL INFO & SETTLEMENT CONTROL */}
            <div className="bg-[#131a2c] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase font-mono text-slate-400 tracking-wider">Connection State</h3>
                  
                  {user?.role === 'host' && (
                    <div className="mt-2 mb-4">
                      <button
                        onClick={startScreenShare}
                        disabled={streamStarted}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl text-sm transition"
                      >
                        {streamStarted ? 'Broadcasting...' : 'Start Screen Share'}
                      </button>
                    </div>
                  )}

                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between border-b border-slate-800/55 pb-2 text-xs">
                      <span className="text-slate-400">Allocated Host Machine:</span>
                      <span className="font-bold text-white">{session?.host_username}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/55 pb-2 text-xs">
                      <span className="text-slate-400">Renting Gamer:</span>
                      <span className="font-bold text-white">{session?.player_username}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/55 pb-2 text-xs">
                      <span className="text-slate-400">Base Rental Rate:</span>
                      <span className="font-bold font-mono text-indigo-400">{session?.price_per_hour} CR/hr</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/55 pb-2 text-xs">
                      <span className="text-slate-400 font-bold">Simulated Multiplier Notice:</span>
                      <span className="font-bold text-right text-emerald-400 text-[10px] max-w-[150px]">1 Sec = 1 Min elapsed rate</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1c2333]/50 p-4 border border-indigo-950/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-mono font-bold text-indigo-400">Client Info</h4>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Once the target stream ends, final hours are computed, balances settled, and the host device moves back to the public booking lobby automatically.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  id="terminate-btn"
                  onClick={handleTerminateSession}
                  className="w-full bg-rose-650 hover:bg-rose-550 border border-slate-800/70 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Terminate & Settle Session</span>
                </button>
                <p className="text-[10px] text-center text-slate-500 font-mono">
                  Saves rental progress in local SQLite database instantly.
                </p>
              </div>

            </div>

          </div>
        ) : (
          /* COMPLETED SCREEN */
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-[#131a2c] border border-slate-800 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full mx-auto w-fit text-emerald-400">
                <CheckCircle className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Game Session Completed</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Your remote rental reservation was closed and settled successfully.
                </p>
              </div>

              <div className="bg-[#161d2f] border border-slate-850 p-6 rounded-2xl max-w-md mx-auto grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Total Cost Deducted</p>
                  <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{-accumulatedCost.toFixed(2)} cr</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Your Balance</p>
                  <p className="text-xl font-mono font-bold text-amber-400 mt-1">{user?.credits.toFixed(2)} cr</p>
                </div>
              </div>

              <div className="flex gap-4 max-w-sm mx-auto pt-4">
                <button
                  onClick={() => navigate(user?.role === 'host' ? '/host' : '/player')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
