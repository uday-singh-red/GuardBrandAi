
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ isAuthenticated }) {
  const navigate = useNavigate();

  // User is logged in
  if (isAuthenticated) {
    return (
      <nav className="auth-navbar">
        <div className="auth-navbar-label">
          Welcome to Inkloom AI
        </div>

        <div className="auth-navbar-actions">
          <NavLink
            to="/dashboard"
            className="auth-btn auth-login"
          >
            Dashboard
          </NavLink>

          <button
            type="button"
            className="auth-btn auth-register"
            onClick={() => navigate('/dashboard')}
          >
            Creator Studio
          </button>

          <button
            type="button"
            className="auth-btn auth-register"
            onClick={() => navigate('/dashboard')}
          >
            Admin Dashboard
          </button>

          <button
            type="button"
            className="auth-btn auth-register"
            onClick={() => navigate('/dashboard')}
          >
            RAG Knowledge Base
          </button>
        </div>
      </nav>
    );
  }

  // User is not logged in
  return (
    <nav className="auth-navbar">
      <div className="auth-navbar-label">
        Welcome to Inkloom AI
      </div>

      <div className="auth-navbar-actions">
        <NavLink
          to="/login"
          className={({ isActive }) =>
            `auth-btn auth-login ${isActive ? 'selected' : ''}`
          }
        >
          Login
        </NavLink>

        <NavLink
          to="/register"
          className={({ isActive }) =>
            `auth-btn auth-register ${isActive ? 'selected' : ''}`
          }
        >
          Register
        </NavLink>
      </div>
    </nav>
  );
}
