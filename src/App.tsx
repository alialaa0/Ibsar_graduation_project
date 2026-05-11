import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import AuthForm from './pages/AuthForm';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Profile from './pages/Profile';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy text-white selection:bg-glow/30 selection:text-white">
      <div className="fixed inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      {children}
    </div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><AuthForm type="login" /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><AuthForm type="signup" /></PageWrapper>} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<Dashboard />} />
            </Route>
            
            <Route path="/history" element={<DashboardLayout />}>
              <Route index element={<History />} />
            </Route>
            
            <Route path="/profile" element={<DashboardLayout />}>
              <Route index element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
