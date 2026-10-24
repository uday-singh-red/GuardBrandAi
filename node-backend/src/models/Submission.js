const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    creatorName: { type: String, default: 'Creator Uday' },
    inputType: { type: String, enum: ['text', 'file'], required: true },
    originalFileName: { type: String, default: null },
    contentToAudit: { type: String, required: true },
    
    // Gemini RAG Audit Report
    auditReport: {
      audit_summary: {
        compliance_status: { type: String, required: true },
        compliance_score: { type: Number, required: true },
        summary: { type: String },
        total_violations_identified: { type: Number, default: 0 }
      },
      audit_findings: [
        {
          issue: { type: String },
          severity: { type: String },
          explanation: { type: String }
        }
      ],
      recommendations: [{ type: String }]
    },

    // RAG Chunks Citations
    relevantChunks: [
      {
        documentTitle: { type: String },
        chunkText: { type: String },
        score: { type: Number }
      }
    ],

    // Human-in-the-Loop Status
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING_REVIEW'
    },
    adminNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);