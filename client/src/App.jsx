import React, { useState } from 'react';
import { FaUserEdit, FaUserShield, FaFileUpload } from 'react-icons/fa';
import CreatorView from './pages/CreaterView'; // (Ya './pages/CreatorView')
import AdminView from './pages/AdminView';     // (Ya './pages/AdminView')
import GuidelineUploadView from './pages/GuidelineUploadView'; // Naya RAG Guideline Upload View
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('creator'); // 'creator', 'admin', or 'guidelines'

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-logo">
          <h2>Inkloom AI <span>Brand Governance Platform</span></h2>
        </div>
        <div className="nav-links">
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'creator' ? 'active' : ''}`} 
            onClick={() => setActiveTab('creator')}
          >
            <FaUserEdit /> Creator Studio
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} 
            onClick={() => setActiveTab('admin')}
          >
            <FaUserShield /> Admin Dashboard
          </button>
          <button 
            type="button"
            className={`nav-btn ${activeTab === 'guidelines' ? 'active' : ''}`} 
            onClick={() => setActiveTab('guidelines')}
          >
            <FaFileUpload /> RAG Knowledge Base
          </button>
        </div>
      </nav>

      {/* Dynamic View Rendering */}
      <main className="main-content">
        {activeTab === 'creator' && <CreatorView />}
        {activeTab === 'admin' && <AdminView />}
        {activeTab === 'guidelines' && <GuidelineUploadView />}
      </main>
    </div>
  );
}