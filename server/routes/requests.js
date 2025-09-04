import express from 'express';
import Request from '../models/Request.js';
import Approval from '../models/Approval.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendNotification } from '../utils/notifications.js';

const router = express.Router();

// Create new request
router.post('/', authenticate, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      coordinator: req.user._id,
      department: req.user.department,
      designation: req.user.designation
    };

    const request = new Request(requestData);
    await request.save();

    // Seed first approval based on workflow
    if (request.approvalWorkflow?.type === 'custom' && Array.isArray(request.approvalWorkflow.customApprovers) && request.approvalWorkflow.customApprovers.length > 0) {
      const first = [...request.approvalWorkflow.customApprovers].sort((a, b) => a.order - b.order)[0];
      const firstApproval = new Approval({
        request: request._id,
        approver: first.userId || null,
        approverRole: first.role,
        decision: 'pending',
        level: 1
      });
      await firstApproval.save();

      await sendNotification({
        type: 'approval_needed',
        requestId: request._id,
        recipientRole: first.role,
        title: 'New Budget Request Pending Approval',
        message: `New ${request.category} request from ${req.user.name} needs your approval.`
      });
    } else {
      const firstApproval = new Approval({
        request: request._id,
        approver: null,
        approverRole: 'budget_coordinator',
        decision: 'pending',
        level: 1
      });
      await firstApproval.save();

      await sendNotification({
        type: 'approval_needed',
        requestId: request._id,
        recipientRole: 'budget_coordinator',
        title: 'New Budget Request Pending Approval',
        message: `New ${request.category} request from ${req.user.name} needs your approval.`
      });
    }

    res.status(201).json({ request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's requests
router.get('/my-requests', authenticate, async (req, res) => {
  try {
    const requests = await Request.find({ coordinator: req.user._id })
      .populate('coordinator', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending approvals for current user
router.get('/pending-approvals', authenticate, async (req, res) => {
  try {
    const query = {
      approverRole: req.user.role,
      decision: 'pending'
    };

    // Scope to department for departmental roles
    const departmentRoles = ['budget_coordinator', 'program_coordinator', 'hod'];
    let approvalsQuery = Approval.find(query).populate({
      path: 'request',
      populate: { path: 'coordinator', select: 'name email department' }
    }).sort({ createdAt: -1 });

    let approvals = await approvalsQuery.exec();
    if (departmentRoles.includes(req.user.role)) {
      approvals = approvals.filter(a => a.request?.department === req.user.department);
    }

    res.json({ approvals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all requests (for admins/higher roles)
router.get('/all', authenticate, authorize('dean', 'vice_principal', 'principal', 'joint_secretary', 'secretary'), async (req, res) => {
  try {
    const { status, department, category, startDate, endDate } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (department && department !== 'all') filter.department = department;
    if (category && category !== 'all') filter.category = category;
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const requests = await Request.find(filter)
      .populate('coordinator', 'name email department')
      .sort({ createdAt: -1 });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single request with full details
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('coordinator', 'name email department designation');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Get approval history
    const approvals = await Approval.find({ request: request._id })
      .populate('approver', 'name role')
      .sort({ level: 1 });

    res.json({ request, approvals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reconcile an approved request
router.post('/:id/reconcile', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualSpent } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only coordinator of the request can reconcile
    if (request.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'approved' && request.status !== 'reconciled') {
      return res.status(400).json({ message: 'Only approved requests can be reconciled' });
    }

    const parsedActual = Number(actualSpent);
    if (Number.isNaN(parsedActual) || parsedActual < 0) {
      return res.status(400).json({ message: 'Invalid actual amount' });
    }

    const variance = Number((request.estimatedBudget - parsedActual).toFixed(2));

    request.reconciliation = {
      actualSpent: parsedActual,
      variance,
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy: req.user._id
    };
    request.status = 'reconciled';
    await request.save();

    // Notify coordinator confirmation and higher roles about reconciliation
    await sendNotification({
      type: 'reconciliation',
      requestId: request._id,
      recipientId: req.user._id,
      title: 'Reconciliation Submitted',
      message: `Reconciliation submitted for ${request.eventName}. Variance: ${variance}.`
    });

    res.json({ message: 'Reconciliation saved', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;