import React, { useState, useEffect } from 'react';
import { 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaTrashAlt, 
  FaBook, 
  FaCheckCircle, 
  FaShieldAlt,
  FaFileAlt,
  FaKey,
  FaTrash
} from 'react-icons/fa';
import './GuidelineUploadView.css';

export default function GuidelineUploadView() {
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [guidelines, setGuidelines] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Hackathon Custom API Key State (Shared localStorage with CreatorView)
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('hackathon_custom_api_key') || '';
  });

  // Save or Update API Key (Overwrites previous key completely)
  const handleSaveApiKey = (e) => {
    const newKey = e.target.value.trim();
    setCustomApiKey(newKey);
    if (newKey) {
      localStorage.setItem('hackathon_custom_api_key', newKey);
    } else {
      localStorage.removeItem('hackathon_custom_api_key');
    }
  };

  const handleClearApiKey = () => {
    setCustomApiKey('');
    localStorage.removeItem('hackathon_custom_api_key');
    alert('Custom API key removed. Falling back to default server key.');
  };

  // Fetch uploaded guideline documents / chunks info
  const fetchGuidelines = async () => {
    if (!API_URL) return;
    try {
      const headers = {
        ...(customApiKey ? { 'x-api-key': customApiKey } : {})
      };

      const res = await fetch(`${API_URL}/api/admin/upload`, {
        headers: headers
      });
      const data = await res.json();
      if (data.success) {
        setGuidelines(data.guidelines || data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch guidelines list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF or TXT file to upload.');
      return;
    }

    if (!API_URL) {
      alert('Backend URL is missing.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('documentTitle', documentTitle || selectedFile.name);

    try {
      // Include custom API key header if available
      const headers = {
        ...(customApiKey ? { 'x-api-key': customApiKey } : {})
      };

      const response = await fetch(`${API_URL}/api/admin/upload`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload and embed guideline document.');
      }

      alert('🎉 Guideline document uploaded & vectorized successfully for RAG!');
      setSelectedFile(null);
      setDocumentTitle('');
      
      const fileInput = document.getElementById('guideline-file-input');
      if (fileInput) fileInput.value = '';

      fetchGuidelines();
    } catch (error) {
      console.error('Upload Error:', error);
      alert(error.message || 'Error uploading guideline file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="view-section guideline-upload-view">
      <div className="upload-hero">
        <div className="hero-icon">
          <FaBook />
        </div>
        <div className="hero-copy">
          <span className="eyebrow">INKLOOM AI · KNOWLEDGE BASE</span>
          <h2>RAG Guidelines & Reference Studio</h2>
          <p>Upload brand guidelines, safety manuals, or rulebooks (PDF/TXT). The AI will chunk and embed them for RAG referencing.</p>
        </div>
      </div>

      {/* HACKATHON DEMO API KEY CONFIGURATION BANNER */}
      <section className="hackathon-api-banner" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaKey style={{ color: '#2563eb' }} /> Enter Demo API Key Configuration
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Enter your own Gemini API key below to prevent quota exhaustion during live evaluation. Leaving this blank will use the server default key.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '380px' }}>
            <input 
              type="password" 
              placeholder="Paste your API key here (e.g. AIzaSy...)" 
              value={customApiKey}
              onChange={handleSaveApiKey}
              style={{ flex: 1, padding: '8px 12px', fontSize: '13px', border: '1px solid #94a3b8', borderRadius: '6px', outline: 'none', background: '#ffffff' }}
            />
            {customApiKey && (
              <button 
                type="button" 
                onClick={handleClearApiKey}
                title="Remove Custom Key"
                style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <FaTrash /> Clear
              </button>
            )}
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: '600', color: customApiKey ? '#166534' : '#475569' }}>
          Status: {customApiKey ? 'Custom API key active (previous keys replaced).' : 'Using default system environment key.'}
        </div>
      </section>

      {/* Upload Box Form */}
      <section className="upload-form-box">
        <h3><FaCloudUploadAlt /> Upload New Guideline Document</h3>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label htmlFor="doc-title">Document Title / Reference Name</label>
            <input 
              id="doc-title"
              type="text"
              placeholder="e.g. Delhi Road Safety Guidelines 2026"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="guideline-file-input">Select File (.pdf, .txt)</label>
            <div className="file-dropzone">
              <input 
                id="guideline-file-input"
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {selectedFile ? (
                <div className="file-chosen-info">
                  <FaFilePdf className="file-pdf-icon" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="file-placeholder">
                  <FaCloudUploadAlt />
                  <span>Drag & drop or click to choose guideline file</span>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="primary-btn upload-submit-btn"
            disabled={uploading || !selectedFile}
          >
            {uploading ? 'Processing & Vectorizing Chunks...' : 'Upload & Embed into RAG'}
          </button>
        </form>
      </section>

      {/* Uploaded Documents List */}
      <section className="uploaded-docs-section">
        <h3>📚 Active Knowledge Base Guidelines</h3>
        {loadingList ? (
          <p>Loading guidelines library...</p>
        ) : guidelines.length === 0 ? (
          <p className="no-docs-text">No reference guidelines uploaded yet. Upload a document above to power the RAG audit engine.</p>
        ) : (
          <div className="docs-grid">
            {guidelines.map((doc, idx) => (
              <div key={doc._id || idx} className="doc-card">
                <div className="doc-card-top">
                  <FaFileAlt className="doc-icon" />
                  <div>
                    <h4>{doc.documentTitle || doc.filename || `Guideline ${idx + 1}`}</h4>
                    <span className="doc-date">Uploaded: {new Date(doc.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="chunks-badge">
                  <FaCheckCircle /> Embedded & Active
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}