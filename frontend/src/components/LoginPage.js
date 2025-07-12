// frontend/src/components/LoginPage.js
// This component provides the user login form.
// UPDATED: Corrected the import path for the local background image.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, User, KeyRound } from 'lucide-react';
// CORRECTED: The path must be relative to this file's location inside /src.
// This path goes up one level from /components to /src, then into /assets.
import loginBackground from '../assets/login-background.jpg';

// Custom SVG Logo Component
const NetworkLogo = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-blue-600">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12L16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 12L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 12L8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 5L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L9 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 19L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message || 'Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
        {/* Left-hand side */}
        <div className="flex flex-col justify-center p-8 md:p-14">
          <div className="text-center mb-6">
            <NetworkLogo />
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-4">
              NetDoc
            </h1>
            <p className="mt-2 text-gray-600">Please sign in to continue</p>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="username"
                name="username"
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="password"
                name="password"
                type="password"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-300"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Right-hand side (Image) */}
        <div className="relative hidden md:block">
            <img 
                src={loginBackground}
                alt="Network infrastructure" 
                className="w-[400px] h-full hidden rounded-r-2xl md:block object-cover"
            />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
