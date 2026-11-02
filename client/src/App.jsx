
import React from 'react';
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

import './App.css';

export default function App() {
  return (
    <BrowserRouter>

      <div className="app-shell">

        {/* Global Navbar */}
        <Navbar />

        {/* Route Rendering */}
        <Routes>

          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="/login"
            element={<LoginView />}
          />

          <Route
            path="/register"
            element={<RegisterView />}
          />

          <Route
            path="/verify-otp"
            element={<OtpView />}
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* Invalid URL */}
          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}
