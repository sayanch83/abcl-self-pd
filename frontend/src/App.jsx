import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import OfficerLogin from './pages/officer/Login';
import OfficerDashboard from './pages/officer/Dashboard';
import Applications from './pages/officer/Applications';
import ApplicationDetail from './pages/officer/ApplicationDetail';
import DemoConfig from './pages/officer/DemoConfig';
import SelfPdPage from './pages/customer/SelfPdPage';

import './styles/global.css';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/officer/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/officer/login" replace />} />

        {/* Officer routes */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        <Route path="/officer/dashboard" element={
          <ProtectedRoute><OfficerDashboard /></ProtectedRoute>
        } />
        <Route path="/officer/applications" element={
          <ProtectedRoute><Applications /></ProtectedRoute>
        } />
        <Route path="/officer/applications/:id" element={
          <ProtectedRoute><ApplicationDetail /></ProtectedRoute>
        } />
        <Route path="/officer/demo-config" element={
          <ProtectedRoute><DemoConfig /></ProtectedRoute>
        } />

        {/* Customer Self-PD */}
        <Route path="/pd/:token" element={<SelfPdPage />} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-200 mb-2">404</p>
              <p>Page not found</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
