const Submission = require('../models/Submission');

// 1. Creator submits audit report
exports.submitAudit = async (req, res) => {
  try {
    const { inputType, originalFileName, contentToAudit, auditReport, relevantChunks } = req.body;
    
    // Normalize data to match Mongoose schema expectations
    const normalizedAuditReport = {
      audit_summary: {
        summary: typeof auditReport?.audit_summary === 'string' 
          ? auditReport.audit_summary 
          : auditReport?.audit_summary?.summary || 'No summary available',
        compliance_status: auditReport?.compliance_status || auditReport?.audit_summary?.compliance_status || 'Unknown',
        compliance_score: auditReport?.overall_compliance_score ?? auditReport?.compliance_score ?? auditReport?.audit_summary?.compliance_score ?? 0
      },
      violations: auditReport?.violations || auditReport?.audit_findings || [],
      unverified_or_out_of_scope_claims: auditReport?.unverified_or_out_of_scope_claims || []
    };

    const newSubmission = new Submission({
      inputType,
      originalFileName,
      contentToAudit,
      auditReport: normalizedAuditReport,
      relevantChunks,
      status: 'PENDING_REVIEW'
    });

    await newSubmission.save();
    res.status(201).json({ success: true, message: 'Submitted to Admin successfully!', data: newSubmission });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Admin fetches all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Admin updates review status
exports.updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updated = await Submission.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};