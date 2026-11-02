
import React, { useState, useEffect } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Navbar from './component/Navbar';

import LoginView from './pages/Authpages/loginView';
import RegisterView from './pages/Authpages/registerView';
import OtpView from './pages/Authpages/otpVerifyView';
import DashboardPage from './component/DashBoard';

import { checkAuthAPI } from './services/AuthServices';

import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication when app loads or refreshes
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await checkAuthAPI();

        setIsAuthenticated(response.success === true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, []);

  // Called after successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Called after successful logout
  const handleLogoutSuccess = () => {
    setIsAuthenticated(false);
  };

  // Wait until authentication is checked
  if (isCheckingAuth) {
    return (
      <div className="app-shell">
        <div className="auth-loading">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">

        {/* Show Auth Navbar only when user is logged out */}
        {!isAuthenticated && <Navbar />}

        <Routes>

          {/* Home Route */}
          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? '/dashboard' : '/login'}
                replace
              />
            }
          />

          {/* Login Route */}
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to="/dashboard" replace />
                : <LoginView
                    onLoginSuccess={handleLoginSuccess}
                  />
            }
          />

          {/* Register Route */}
          <Route
            path="/register"
            element={
              isAuthenticated
                ? <Navigate to="/dashboard" replace />
                : <RegisterView />
            }
          />

          {/* OTP Verification Route */}
          <Route
            path="/verify-otp"
            element={
              isAuthenticated
                ? <Navigate to="/dashboard" replace />
                : <OtpView />
            }
          />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              isAuthenticated
                ? (
                  <DashboardPage
                    onLogoutSuccess={handleLogoutSuccess}
                  />
                )
                : <Navigate to="/login" replace />
            }
          />

          {/* Invalid URL */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </div>
    </BrowserRouter>
  );
}
