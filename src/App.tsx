import React from 'react';
import { Download, Monitor, Server } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl text-center space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-4">
          <Monitor className="w-16 h-16 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Project Architected for Native C++</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          P2PC has been restructured to support the requested native Windows runtime architecture 
          (C++, DirectX 11, DXGI, FFmpeg HW-encoding, libwebrtc, and Go Signaling).
        </p>
        
        <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-850 space-y-3">
          <div className="flex items-start gap-3">
            <Server className="w-5 h-5 text-indigo-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Go Signaling Server</p>
              <p className="text-xs text-slate-500">Gorilla WebSockets & Pion structure built in <span className="font-mono text-emerald-400/70">/native/signaling</span></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 text-rose-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-200">C++ / Qt6 Win32 Client</p>
              <p className="text-xs text-slate-500">DXGI Duplication, FFmpeg Encoders, & WebRTC Native build setup in <span className="font-mono text-emerald-400/70">/native/desktop</span></p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/50">
          <p className="text-sm text-slate-300 mb-4">
            A web browser sandbox cannot compile or execute native DirectX/Win32 C++ code. You must export the source.
          </p>
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold">
            <Download className="w-4 h-4" />
            Use the Settings menu to Export to GitHub or ZIP.
          </div>
        </div>
      </div>
    </div>
  );
}

