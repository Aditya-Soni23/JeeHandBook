import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <StoreProvider>
          <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#171717] antialiased">
            <Navbar />

            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<CustomerDashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            <Footer />
          </div>
        </StoreProvider>
      </AuthProvider>
    </HashRouter>
  );
}
