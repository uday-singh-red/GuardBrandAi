import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaShieldAlt, 
  FaBookOpen, 
  FaLightbulb, 
  FaFileAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import "./AdminView.css";

export default function AdminView() {
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track expanded chunk: format `${submissionId}-${chunkIndex}` or null
  const [expandedChunkKey, setExpandedChunkKey] = useState(null);

  // 1. Fetch all submissions from MongoDB
  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/all`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // 2. Update Submission Status (Approve / Reject)
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/submissions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          adminNotes: status === 'APPROVED' ? 'Approved for publishing after review' : 'Rejected due to severe policy violations' 
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSubmissions(); // Refresh the list
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Toggle chunk accordion (only one open at a time)
  const toggleChunk = (subId, cIndex) => {
    const key = `${subId}-${cIndex}`;
    setExpandedChunkKey(prevKey => (prevKey === key ? null : key));
  };

  return (
    <div className="view-section admin-view">
      <div className="admin-hero">
        <div className="hero-icon">
          <FaShieldAlt />
        </div>
        <div className="hero-copy">
          <span className="eyebrow">INKLOOM AI · GOVERNANCE CONTROL</span>
          <h2>Admin Governance Dashboard</h2>
          <p>Review creator submissions, verify AI audits, inspect flagged claims, and grant publishing clearances.</p>
        </div>
      </div>

      {loading ? (
        <p>Loading submissions from database...</p>
      ) : (
        <div className="submissions-list">
          {submissions.length === 0 ? (
            <p>No submissions found yet.</p>
          ) : (
            submissions.map((sub) => {
              const auditReport = sub.auditReport || {};
              const summary = auditReport.audit_summary || {};
              const violations = auditReport.violations || auditReport.audit_findings || [];
              const recommendations = auditReport.recommendations || [];
              const chunks = sub.relevantChunks || [];

              const isCompliant = String(summary.compliance_status || '').toLowerCase().includes('compliant') && 
                                  !String(summary.compliance_status || '').toLowerCase().includes('non-compliant');

              return (
                <div key={sub._id} className="submission-card">
                  {/* Header */}
                  <div className="sub-header">
                    <div className="creator-meta">
                      <strong>Creator:</strong> {sub.creatorName || 'Anonymous Creator'}
                      <span className="sub-date">
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                      {sub.originalFileName && (
                        <span className="file-tag">
                          <FaFileAlt /> {sub.originalFileName}
                        </span>
                      )}
                    </div>

                    <span className={`status-badge ${sub.status ? sub.status.toLowerCase() : 'pending_review'}`}>
                      {sub.status === 'PENDING_REVIEW' && <FaClock />}
                      {sub.status === 'APPROVED' && <FaCheckCircle />}
                      {sub.status === 'REJECTED' && <FaTimesCircle />}
                      {sub.status || 'PENDING'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="sub-body">
                    <p><strong>Content:</strong> {sub.contentToAudit}</p>

                    {/* Audit Summary Card */}
                    {auditReport.audit_summary && (
                      <div className="audit-mini-report">
                        <div className="mini-report-top">
                          <span className={`compliance-tag ${isCompliant ? 'compliant' : 'non-compliant'}`}>
                            {summary.compliance_status || 'Unknown'}
                          </span>
                          <span className="score-tag">
                            Score: {summary.compliance_score ?? 'N/A'}/100
                          </span>
                        </div>
                        <p className="summary-desc" style={{ marginTop: '6px' }}><strong>Summary:</strong> {summary.summary || 'No summary provided.'}</p>
                      </div>
                    )}

                    {/* Flagged Violations Section */}
                    {violations.length > 0 && (
                      <div className="admin-section-block">
                        <h4 className="section-title-heading"><FaExclamationTriangle className="text-warning" /> Flagged Claims ({violations.length})</h4>
                        <div className="admin-violations-list">
                          {violations.map((v, vIndex) => (
                            <div key={vIndex} className="admin-violation-item">
                              <p><strong>Claim:</strong> "{v.claim}"</p>
                              <p><strong>Explanation:</strong> {v.explanation}</p>
                              <p className="correction-text"><strong>Suggested Correction:</strong> {v.correction}</p>
                              {v.guideline_reference && (
                                <span className="ref-badge"><FaBookOpen /> {v.guideline_reference}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations Section */}
                    {recommendations.length > 0 && (
                      <div className="admin-section-block">
                        <h4 className="section-title-heading"><FaLightbulb className="text-accent" /> Actionable Recommendations</h4>
                        <ul className="admin-recs-list">
                          {recommendations.map((rec, rIndex) => (
                            <li key={rIndex}><span>{rIndex + 1}.</span> {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Matched RAG Chunks (Clickable Accordion) */}
                    {chunks.length > 0 && (
                      <div className="admin-section-block">
                        <h4 className="section-title-heading"><FaBookOpen /> Referenced RAG Chunks ({chunks.length})</h4>
                        <div className="chunks-accordion-list">
                          {chunks.map((chunk, cIndex) => {
                            const chunkKey = `${sub._id}-${cIndex}`;
                            const isExpanded = expandedChunkKey === chunkKey;

                            return (
                              <div key={chunk._id || cIndex} className={`chunk-accordion-item ${isExpanded ? 'expanded' : ''}`}>
                                <div 
                                  className="chunk-accordion-header"
                                  onClick={() => toggleChunk(sub._id, cIndex)}
                                >
                                  <div className="chunk-title-group">
                                    <FaFileAlt className="chunk-file-icon" />
                                    <span>{chunk.documentTitle || `Document Source ${cIndex + 1}`}</span>
                                    {typeof chunk.score === 'number' && (
                                      <span className="chunk-score-pill">
                                        {(chunk.score * 100).toFixed(1)}% match
                                      </span>
                                    )}
                                  </div>
                                  <span className="chevron-icon">
                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div className="chunk-accordion-body">
                                    <p>{chunk.chunkText || 'No chunk text content available.'}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (Approve / Reject) */}
                  {sub.status === 'PENDING_REVIEW' && (
                    <div className="admin-actions">
                      <button 
                        type="button"
                        className="approve-btn" 
                        onClick={() => handleUpdateStatus(sub._id, 'APPROVED')}
                      >
                        <FaCheckCircle /> Approve & Publish
                      </button>
                      <button 
                        type="button"
                        className="reject-btn" 
                        onClick={() => handleUpdateStatus(sub._id, 'REJECTED')}
                      >
                        <FaTimesCircle /> Reject
                      </button>
                    </div>
                  )}

                  {sub.adminNotes && (
                    <div className="admin-notes-footer" style={{ marginTop: '12px', fontSize: '13px', color: '#475569' }}>
                      <strong>Admin Notes:</strong> {sub.adminNotes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}