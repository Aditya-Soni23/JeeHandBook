import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRANDING } from '../config/constants';
import { User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAdmin, signInWithGoogle, signOut, activeRole, setActiveRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAEAEA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Brand Zone */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 text-lg font-black tracking-tight text-[#171717] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          {/* Logo image with graceful diamond fallback */}
          <img 
            src={BRANDING.logoPath} 
            alt="DIAMOND Logo" 
            className="h-8 w-auto object-contain max-w-[36px] rounded-md shrink-0" 
          />
          <span className="font-extrabold tracking-tight text-xl">{BRANDING.brandName}</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-gray-600">
          <a href="#overview" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Overview
          </a>
          <a href="#creation-story" className="hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1">
            <span>About The Book</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">AI + PW</span>
          </a>
          <a href="#bindings" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Bindings & Prices
          </a>
          <a href="#calculator" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Calculator
          </a>
          <a href="#free-samples" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Free Samples (PDF)
          </a>
          <a href="#contact" className="hover:text-blue-600 transition-colors whitespace-nowrap">
            Contact & WhatsApp
          </a>
        </nav>

        {/* Primary Action Zone */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#EAEAEA] hover:border-gray-300 bg-white transition-all text-xs font-semibold text-[#171717] cursor-pointer"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>

              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#EAEAEA] py-2 z-50 animate-in fade-in"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    My Dashboard
                  </Link>

                  {/* Admin switch ONLY for adityasonihyderabad@gmail.com */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setActiveRole(activeRole === 'admin' ? 'customer' : 'admin');
                        setDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 font-semibold text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{activeRole === 'admin' ? 'Switch to Customer' : 'Admin Management Panel'}</span>
                    </button>
                  )}

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <span>Google Sign-In</span>
            </button>
          )}

          {user && (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-3.5 py-1.5 bg-[#171717] hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
