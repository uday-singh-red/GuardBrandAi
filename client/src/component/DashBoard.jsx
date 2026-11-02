
import React, { useState } from 'react';

import {
  FaUserEdit,
  FaUserShield,
  FaFileUpload,
  FaSignOutAlt,
} from 'react-icons/fa';

import { useNavigate } from 'react-router-dom';

import CreatorView from '../pages/CreaterView';
import AdminView from '../pages/AdminView';
import GuidelineUploadView from '../pages/GuidelineUploadView';

import { logoutAPI } from '../services/AuthServices';

export default function DashboardPage({ onLogoutSuccess }) {
  const [activeTab, setActiveTab] = useState('creator');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLoading(true);

      await logoutAPI();

      onLogoutSuccess();
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">

      {/* Main Application Navigation */}
      <nav className="navbar">

        <div className="nav-logo">
          <h2>
            Inkloom AI
            <span> Brand Governance Platform</span>
          </h2>
        </div>

        <div className="nav-links">

          <button
            type="button"
            className={`nav-btn ${
              activeTab === 'creator' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('creator')}
          >
            <FaUserEdit />
            Creator Studio
          </button>

          <button
            type="button"
            className={`nav-btn ${
              activeTab === 'admin' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('admin')}
          >
            <FaUserShield />
            Admin Dashboard
          </button>

          <button
            type="button"
            className={`nav-btn ${
              activeTab === 'guidelines' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('guidelines')}
          >
            <FaFileUpload />
            RAG Knowledge Base
          </button>

          <button
            type="button"
            className="nav-btn logout-btn"
            onClick={handleLogout}
            disabled={loading}
          >
            <FaSignOutAlt />
            {loading ? 'Logging out...' : 'Logout'}
          </button>

        </div>

      </nav>

      {/* Dynamic Dashboard Rendering */}
      <main className="main-content">

        {activeTab === 'creator' && <CreatorView />}

        {activeTab === 'admin' && <AdminView />}

        {activeTab === 'guidelines' && <GuidelineUploadView />}

      </main>

    </div>
  );
}
