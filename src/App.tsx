import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import HostDashboard from './pages/HostDashboard';
import BrowseHosts from './pages/BrowseHosts';
import SessionView from './pages/SessionView';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="animate-spin border-2 border-indigo-500 border-t-transparent w-8 h-8 rounded-full"></div>
        <p className="text-sm font-mono leading-none">Authorizing Pipeline Session...</p>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="animate-spin border-2 border-indigo-500 border-t-transparent w-8 h-8 rounded-full"></div>
        <p className="text-sm font-mono leading-none font-bold">Matching Credentials...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return user.role === 'host' ? <Navigate to="/host" replace /> : <Navigate to="/player" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0b0f19] antialiased">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private user dash entries */}
            <Route path="/host" element={<PrivateRoute><HostDashboard /></PrivateRoute>} />
            <Route path="/player" element={<PrivateRoute><BrowseHosts /></PrivateRoute>} />
            <Route path="/session/:id" element={<PrivateRoute><SessionView /></PrivateRoute>} />
            
            {/* Landing index routing */}
            <Route path="/" element={<RootRedirect />} />
            
            {/* Fallback navigation catcher */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
