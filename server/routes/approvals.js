import express from 'express';
import Approval from '../models/Approval.js';
import Request from '../models/Request.js';
import { authenticate } from '../middleware/auth.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// Approve or reject request
router.post('/:requestId/decision', authenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { decision, remarks } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Find the current approval record
    const approval = await Approval.findOne({
      request: requestId,
      approverRole: req.user.role,
      decision: 'pending'
    });

    if (!approval) {
      return res.status(400).json({ message: 'No pending approval found for your role' });
    }

    // Update approval
    approval.approver = req.user._id;
    approval.decision = decision;
    approval.remarks = remarks;
    await approval.save();

    if (decision === 'rejected') {
      // Request rejected - update request status
      request.status = 'rejected';
      request.rejectionReason = remarks;
      await request.save();

      // Notify coordinator of rejection
      await sendNotification({
        type: 'rejected',
        requestId: request._id,
        recipientId: request.coordinator,
        title: 'Budget Request Rejected',
        message: `Your ${request.category} request has been rejected. Reason: ${remarks}`
      });
    } else if (decision === 'approved') {
      // Check if this is the final approval
      const strictHierarchy = [
        'budget_coordinator',
        'program_coordinator',
        'hod',
        'dean',
        'vice_principal',
        'principal',
        'joint_secretary',
        'secretary'
      ];

      let nextRole = null;
      if (request.approvalWorkflow?.type === 'custom' && Array.isArray(request.approvalWorkflow.customApprovers) && request.approvalWorkflow.customApprovers.length > 0) {
        const ordered = [...request.approvalWorkflow.customApprovers].sort((a, b) => a.order - b.order);
        const currentIndex = ordered.findIndex(a => a.role === req.user.role);
        nextRole = ordered[currentIndex + 1]?.role || null;
      } else {
        const currentLevelIndex = strictHierarchy.indexOf(req.user.role);
        nextRole = strictHierarchy[currentLevelIndex + 1] || null;
      }

      if (nextRole) {
        // Create next approval record
        const nextApproval = new Approval({
          request: requestId,
          approverRole: nextRole,
          decision: 'pending',
          level: approval.level + 1
        });
        await nextApproval.save();

        // Update request approval level
        request.currentApprovalLevel = approval.level + 1;
        await request.save();

        // Notify next approver
        await sendNotification({
          type: 'approval_needed',
          requestId: request._id,
          recipientRole: nextRole,
          title: 'Budget Request Pending Your Approval',
          message: `${request.category} request from ${request.department} needs your approval.`
        });
      } else {
        // Final approval - request is fully approved
        request.status = 'approved';
        await request.save();

        // Notify coordinator to upload proofs
        await sendNotification({
          type: 'upload_proofs',
          requestId: request._id,
          recipientId: request.coordinator,
          title: 'Budget Request Approved - Upload Financial Proofs',
          message: `Your ${request.category} request has been fully approved. Please upload bills, invoices, and receipts.`
        });
      }
    }

    res.json({ message: `Request ${decision} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;