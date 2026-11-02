
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
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
