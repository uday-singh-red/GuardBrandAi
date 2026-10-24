import React, { useState, useEffect } from 'react';
import {
  FaCloudUploadAlt,
  FaFileAlt,
  FaEdit,
  FaExclamationTriangle,
  FaCheckCircle,
  FaQuestionCircle,
  FaBookOpen,
  FaLightbulb,
  FaPaperPlane,
  FaShieldAlt,
  FaTimes,
  FaClipboardCheck,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaHistory,
  FaKey,
  FaTrash,
  FaTimesCircle 
} from 'react-icons/fa';
import './CreaterView.css';

export default function CreatorView() {
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const [inputType, setInputType] = useState('text');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Hackathon Custom API Key State (localStorage supported)
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('hackathon_custom_api_key') || '';
  });

  // Submissions history state
  const [mySubmissions, setMySubmissions] = useState([]);
  const [expandedSubId, setExpandedSubId] = useState(null);

  const handleInputTypeChange = (type) => {
    setInputType(type);
    setAuditResult(null);
  };

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

  // Fetch creator's past submissions from MongoDB
  const fetchMySubmissions = async () => {
    if (!API_URL) return;
    try {
      const res = await fetch(`${API_URL}/api/submissions/all`);
      const data = await res.json();
      if (data.success) {
        const userSubs = data.submissions.filter(sub => sub.creatorName === 'Creator Uday');
        setMySubmissions(userSubs);
      }
    } catch (err) {
      console.error('Error fetching creator submissions:', err);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  const handleRunAudit = async (e) => {
    if (e) e.preventDefault();

    if (!API_URL) {
      alert('Backend URL is missing. Please configure VITE_BACKEND_URL in .env');
      return;
    }

    if (inputType === 'text' && !text.trim()) {
      alert('Please enter some text content to audit.');
      return;
    }

    if (inputType === 'file' && !selectedFile) {
      alert('Please select a file to audit.');
      return;
    }

    setLoading(true);
    setAuditResult(null);

    try {
      let response;
      const headers = {
        ...(customApiKey ? { 'x-api-key': customApiKey } : {})
      };

      if (inputType === 'text') {
        response = await fetch(`${API_URL}/api/audit`, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: text,
            inputType: 'text'
          })
        });
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('inputType', 'file');

        response = await fetch(`${API_URL}/api/audit`, {
          method: 'POST',
          headers: headers,
          body: formData
        });
      }

      const data = await response.json();

      console.log(data)

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || 'Audit failed.'
        );
      }

      // Store the full response from backend
      setAuditResult(data);
    } catch (error) {
      console.error('Audit Error:', error);
      alert(error.message || 'Audit failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  // Safe Universal Parser: Unwraps nested properties dynamically
  const report =
    auditResult?.data?.auditReport ||
    auditResult?.auditReport ||
    auditResult?.data ||
    auditResult ||
    {};

  const violations = Array.isArray(report?.violations)
    ? report.violations
    : Array.isArray(report?.audit_findings)
      ? report.audit_findings
      : [];

  const recommendations = Array.isArray(report?.recommendations)
    ? report.recommendations
    : [];

  const unverified = Array.isArray(report?.unverified_or_out_of_scope_claims)
    ? report.unverified_or_out_of_scope_claims
    : [];

  const chunks = Array.isArray(auditResult?.data?.relevantChunks)
    ? auditResult.data.relevantChunks
    : Array.isArray(auditResult?.relevantChunks)
      ? auditResult.relevantChunks
      : [];

  const status =
    report?.compliance_status ||
    (typeof report?.audit_summary === 'object' ? report.audit_summary?.compliance_status : null) ||
    'Non-Compliant';

  const score =
    report?.compliance_score ??
    report?.overall_compliance_score ??
    (typeof report?.audit_summary === 'object' ? report.audit_summary?.compliance_score : null) ??
    'N/A';

  const summaryText =
    typeof report?.audit_summary === 'string'
      ? report.audit_summary
      : report?.audit_summary?.summary ||
        report?.summary ||
        'No audit summary available.';

  const normalizedStatus = String(status).toLowerCase();

  const isCompliant =
    normalizedStatus.includes('compliant') &&
    !normalizedStatus.includes('non-compliant');

  const scoreNumber = Number(score);
  const hasNumericScore =
    score !== 'N/A' &&
    score !== null &&
    score !== '' &&
    Number.isFinite(scoreNumber);

  const handleSubmitToAdmin = async () => {
    if (!auditResult) return;

    if (!API_URL) {
      alert('Backend URL is missing. Please configure VITE_BACKEND_URL.');
      return;
    }

    setSubmitting(true);

    const payload = {
      creatorName: 'Creator Uday',
      inputType,
      originalFileName: selectedFile ? selectedFile.name : null,
      contentToAudit: inputType === 'text' ? text : (selectedFile?.name || 'Uploaded File'),
      auditReport: {
        audit_summary: {
          summary: summaryText,
          compliance_status: status,
          compliance_score: hasNumericScore ? scoreNumber : 0,
          total_violations_identified: violations.length
        },
        violations,
        audit_findings: violations,
        recommendations,
        unverified_or_out_of_scope_claims: unverified
      },
      relevantChunks: chunks
    };

    try {
      const response = await fetch(
        `${API_URL}/api/submissions/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Failed to submit content to Admin.'
        );
      }

      alert('🎉 Content successfully submitted to Admin with full report details!');

      setText('');
      setSelectedFile(null);
      setAuditResult(null);
      
      fetchMySubmissions();
    } catch (error) {
      console.error('Submission Error:', error);
      alert(error.message || 'Failed to submit to Admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHistoryExpand = (id) => {
    setExpandedSubId(prev => (prev === id ? null : id));
  };

  const isButtonDisabled = loading || (inputType === 'text' ? !text.trim() : !selectedFile);

  return (
    <main className="view-section creator-view">
      <section className="creator-hero">
        <div className="hero-icon">
          <FaShieldAlt />
        </div>

        <div className="hero-copy">
          <span className="eyebrow">INKLOOM AI · BRAND GOVERNANCE</span>
          <h1>Creator Content Studio</h1>
          <p className="subtitle">
            Draft your content or upload a file to check policy
            compliance using AI-powered auditing and RAG guidelines.
          </p>
        </div>
      </section>

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

      {/* INPUT PANEL */}
      <section className="input-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">STEP 01</span>
            <h2>Submit Your Content</h2>
          </div>

          <span className="secure-label">
            <FaShieldAlt />
            Content Audit
          </span>
        </div>

        <div className="input-type-tabs">
          <button
            type="button"
            className={`tab-btn ${inputType === 'text' ? 'active-tab' : ''}`}
            onClick={() => handleInputTypeChange('text')}
          >
            <FaEdit />
            <span>Text Input</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${inputType === 'file' ? 'active-tab' : ''}`}
            onClick={() => handleInputTypeChange('file')}
          >
            <FaFileAlt />
            <span>File Upload</span>
          </button>
        </div>

        <div className="editor-box">
          {inputType === 'text' ? (
            <div className="text-editor">
              <label htmlFor="creator-content">
                Your content
              </label>

              <textarea
                id="creator-content"
                rows={8}
                placeholder="Type or paste your blog, announcement, campaign copy, or other content here..."
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={loading}
              />

              <div className="editor-footer">
                <span>
                  {text.length.toLocaleString()} characters
                </span>
                <span>Review content before submitting</span>
              </div>
            </div>
          ) : (
            <div className="file-upload-box">
              <div className="upload-icon">
                <FaCloudUploadAlt />
              </div>

              <h3>Upload a document to audit</h3>

              <p>
                Select a file from your device to check it against
                your brand guidelines.
              </p>

              <label
                className="file-picker-label"
                htmlFor="creator-file"
              >
                <FaFileAlt />
                Choose File
              </label>

              <input
                id="creator-file"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                disabled={loading}
                onChange={(event) => {
                  setSelectedFile(event.target.files?.[0] || null);
                }}
              />

              <span className="file-format-note">
                Supported formats: PDF, TXT, DOC, DOCX
              </span>

              {selectedFile && (
                <div className="selected-file">
                  <FaFileAlt />

                  <div className="selected-file-details">
                    <strong>{selectedFile.name}</strong>
                    <span>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById('creator-file');
                      if (fileInput) fileInput.value = '';
                    }}
                    disabled={loading}
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="primary-btn"
            onClick={handleRunAudit}
            disabled={isButtonDisabled}
          >
            <FaClipboardCheck />
            {loading ? 'Auditing with RAG...' : 'Run Brand Audit'}
          </button>

          {loading && (
            <div className="loading-message" role="status" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="loading-spinner" />
                <strong>Please wait, it may take time...</strong>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Analyzing content against RAG guideline vectors and generating compliance report.</span>
            </div>
          )}
        </div>
      </section>

      {/* AUDIT REPORT CARD */}
      {auditResult && (
        <section className="audit-result-card">
          <div className="report-header">
            <div className="report-heading-copy">
              <span className="section-kicker">AUDIT RESULTS</span>
              <h2>Brand Governance Report</h2>
              <p>
                Review the compliance status, flagged claims,
                corrections, and matched reference material.
              </p>
            </div>

            <div className="score-badge-container">
              <span
                className={`status-badge ${
                  isCompliant ? 'compliant' : 'non-compliant'
                }`}
              >
                {isCompliant ? (
                  <FaCheckCircle />
                ) : (
                  <FaExclamationTriangle />
                )}

                {status}
              </span>

              <div className="score-box">
                <span className="score-label">
                  Compliance Score
                </span>

                <span className="score-value">
                  {score}
                  {hasNumericScore ? '/100' : ''}
                </span>
              </div>
            </div>
          </div>

          <section className="summary-card">
            <div className="summary-heading">
              <span className="summary-icon">
                <FaClipboardCheck />
              </span>

              <div>
                <h3>Audit Summary</h3>
                <p>Overall content assessment</p>
              </div>
            </div>

            <p className="summary-text">{summaryText}</p>
          </section>

          <section className="report-section">
            <div className="report-section-heading">
              <div className="report-section-title">
                <span className="heading-icon warning-icon">
                  <FaExclamationTriangle />
                </span>

                <div>
                  <h3>Flagged Claims</h3>
                  <p>
                    Claims that conflict with the provided guidelines
                  </p>
                </div>
              </div>

              <span className="count-badge">
                {violations.length}{' '}
                {violations.length === 1
                  ? 'Violation'
                  : 'Violations'}
              </span>
            </div>

            {violations.length === 0 ? (
              <div className="no-issues-box">
                <FaCheckCircle />
                <div>
                  <h4>No policy violations detected</h4>
                  <p>
                    The audit did not return any flagged claims.
                  </p>
                </div>
              </div>
            ) : (
              <div className="violations-list">
                {violations.map((item, index) => (
                  <article
                    key={`${item.guideline_reference || 'guideline'}-${index}`}
                    className="violation-card"
                  >
                    <div className="violation-header">
                      <span className="violation-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className="violation-title">
                        <h4>Violation {index + 1}</h4>

                        <span className="ref-tag">
                          <FaBookOpen />

                          {item.guideline_reference ||
                            'Reference not specified'}
                        </span>
                      </div>

                      <span className="violation-badge">
                        Flagged
                      </span>
                    </div>

                    <div className="claim-box">
                      <div className="field-heading">
                        <span className="field-icon claim-icon">
                          !
                        </span>

                        <h5>Flagged Claim</h5>
                      </div>

                      <p>
                        {item.claim ||
                          'No flagged claim provided.'}
                      </p>
                    </div>

                    <div className="explanation-box">
                      <div className="field-heading">
                        <span className="field-icon explanation-icon">
                          i
                        </span>

                        <h5>Explanation</h5>
                      </div>

                      <p>
                        {item.explanation ||
                          'No explanation provided.'}
                      </p>
                    </div>

                    <div className="correction-box">
                      <div className="field-heading">
                        <span className="field-icon correction-icon">
                          <FaCheckCircle />
                        </span>

                        <h5>Suggested Correction</h5>
                      </div>

                      <p>
                        {item.correction || item.suggested_correction || item.fix || 'No correction provided.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {recommendations.length > 0 && (
            <section className="report-section">
              <div className="report-section-heading">
                <div className="report-section-title">
                  <span className="heading-icon recommendation-icon">
                    <FaLightbulb />
                  </span>

                  <div>
                    <h3>Actionable Recommendations</h3>
                    <p>
                      Recommended steps to improve compliance
                    </p>
                  </div>
                </div>
              </div>

              <ul className="recommendations-list">
                {recommendations.map((recommendation, index) => (
                  <li key={index}>
                    <span className="recommendation-number">
                      {index + 1}
                    </span>

                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {unverified.length > 0 && (
            <section className="report-section">
              <div className="report-section-heading">
                <div className="report-section-title">
                  <span className="heading-icon info-icon">
                    <FaQuestionCircle />
                  </span>

                  <div>
                    <h3>Unverified / Out-of-Scope Claims</h3>
                    <p>
                      Claims that need additional verification
                    </p>
                  </div>
                </div>

                <span className="count-badge">
                  {unverified.length}
                </span>
              </div>

              <div className="unverified-list">
                {unverified.map((item, index) => (
                  <article
                    className="unverified-card"
                    key={index}
                  >
                    <p>
                      <strong>Claim:</strong>{' '}
                      {item.claim || 'Not specified'}
                    </p>

                    <p className="note-text">
                      <strong>Note:</strong>{' '}
                      {item.note || 'No additional note provided.'}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {chunks.length > 0 && (
            <section className="report-section">
              <div className="report-section-heading">
                <div className="report-section-title">
                  <span className="heading-icon rag-icon">
                    <FaBookOpen />
                  </span>

                  <div>
                    <h3>Matched RAG Guideline Chunks</h3>
                    <p>
                      Reference passages retrieved for this audit
                    </p>
                  </div>
                </div>

                <span className="count-badge">
                  {chunks.length} Sources
                </span>
              </div>

              <div className="chunks-grid">
                {chunks.map((chunk, index) => (
                  <article
                    className="chunk-card"
                    key={chunk._id || index}
                  >
                    <div className="chunk-header">
                      <div className="chunk-document-icon">
                        <FaFileAlt />
                      </div>

                      <div className="chunk-document-details">
                        <h4>
                          {chunk.documentTitle ||
                            `Document ${index + 1}`}
                        </h4>

                        <span>
                          Reference chunk {index + 1}
                        </span>
                      </div>

                      {typeof chunk.score === 'number' && (
                        <span className="score-tag">
                          {(chunk.score * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>

                    <p className="chunk-text">
                      {chunk.chunkText ||
                        'No reference text available.'}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="submit-action-row">
            <div className="submit-note">
              <FaShieldAlt />

              <span>
                Submit this audit report for Admin review.
              </span>
            </div>

            <button
              type="button"
              className="submit-admin-btn"
              onClick={handleSubmitToAdmin}
              disabled={submitting}
            >
              <FaPaperPlane />

              {submitting
                ? 'Submitting to Admin...'
                : 'Submit for Admin Approval'}
            </button>
          </div>
        </section>
      )}

      {/* CREATOR SUBMISSIONS HISTORY & TRACKER SECTION */}
      <section className="creator-history-section">
        <div className="panel-heading history-heading-row">
          <div>
            <span className="section-kicker"><FaHistory /> TRACKER</span>
            <h2>Your Recent Submissions & Status</h2>
            <p>Track the approval status of all your submitted audits and view feedback from admins.</p>
          </div>
          
          <button 
            type="button" 
            className="refresh-btn"
            onClick={fetchMySubmissions} 
          >
            🔄 Refresh Status
          </button>
        </div>

        {mySubmissions.length === 0 ? (
          <div className="no-issues-box history-empty-box">
            <FaClock className="empty-clock-icon" />
            <div>
              <h4>No past submissions found</h4>
              <p>
                Run a brand audit above and click "Submit for Admin Approval" to see your tracking history here.
              </p>
            </div>
          </div>
        ) : (
          <div className="history-submissions-list">
            {mySubmissions.map((sub) => {
              const subReport = sub.auditReport || {};
              const subSummary = subReport.audit_summary || {};
              const subViolations = subReport.violations || subReport.audit_findings || [];
              const isExpanded = expandedSubId === sub._id;
              const statusLower = sub.status ? sub.status.toLowerCase() : 'pending_review';

              return (
                <div key={sub._id} className="submission-card history-card-item">
                  <div className="sub-header">
                    <div>
                      <span className="sub-date">
                        Submitted: {new Date(sub.createdAt).toLocaleString()}
                      </span>
                      {sub.originalFileName && (
                        <span className="file-pill-tag">
                          <FaFileAlt /> {sub.originalFileName}
                        </span>
                      )}
                    </div>

                    <span className={`status-badge ${statusLower}`}>
                      {sub.status === 'PENDING_REVIEW' && <FaClock />}
                      {sub.status === 'APPROVED' && <FaCheckCircle />}
                      {sub.status === 'REJECTED' && <FaTimesCircle />}
                      {sub.status || 'PENDING'}
                    </span>
                  </div>

                  <div className="sub-body">
                    <p className="content-snippet-text">
                      <strong>Content:</strong> {sub.contentToAudit ? (sub.contentToAudit.length > 120 ? sub.contentToAudit.substring(0, 120) + '...' : sub.contentToAudit) : 'Uploaded File'}
                    </p>

                    {subSummary.summary && (
                      <p className="summary-snippet-text">
                        <strong>AI Summary:</strong> {subSummary.summary}
                      </p>
                    )}

                    {/* Admin Notes / Feedback Banner */}
                    {sub.adminNotes && (
                      <div className={`admin-feedback-banner ${statusLower}`}>
                        <strong>Admin Feedback:</strong> {sub.adminNotes}
                      </div>
                    )}

                    {/* Expandable Violations Details */}
                    {isExpanded && subViolations.length > 0 && (
                      <div className="history-violations-dropdown">
                        <strong>Flagged Claims ({subViolations.length}):</strong>
                        {subViolations.map((v, vIdx) => (
                          <div key={vIdx} className="history-violation-row">
                            <p><strong>Claim:</strong> "{v.claim}"</p>
                            <p className="correction-text-green"><strong>Correction:</strong> {v.correction || v.suggested_correction || v.fix}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="history-card-footer-row">
                    <span className="score-summary-text">
                      Compliance Score: {subSummary.compliance_score ?? 'N/A'}/100
                    </span>

                    {subViolations.length > 0 && (
                      <button 
                        type="button" 
                        className="toggle-violations-btn"
                        onClick={() => toggleHistoryExpand(sub._id)}
                      >
                        {isExpanded ? <>Hide Violations <FaChevronUp /></> : <>View Violations ({subViolations.length}) <FaChevronDown /></>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}