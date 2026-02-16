import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useWSStore } from '../store/wsStore';
import Layout from './Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Kanban from '../pages/Kanban';
import Chats from '../pages/Chats';
import Calls from '../pages/Calls';
import Clients from '../pages/Clients';
import Broadcasts from '../pages/Broadcasts';
import Settings from '../pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const darkMode = useUIStore((s) => s.darkMode);
  const connectWS = useWSStore((s) => s.connect);
  const disconnectWS = useWSStore((s) => s.disconnect);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
      connectWS();
    }
    return () => disconnectWS();
  }, [isAuthenticated]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        className: 'dark:bg-gray-800 dark:text-white',
        duration: 3000,
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="chats" element={<Chats />} />
          <Route path="calls" element={<Calls />} />
          <Route path="clients" element={<Clients />} />
          <Route path="broadcasts" element={<Broadcasts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
}
