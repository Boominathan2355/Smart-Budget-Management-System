import express from 'express';
import Request from '../models/Request.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get department-level reports (for HoD)
router.get('/department/:department', authenticate, authorize('hod', 'dean', 'principal'), async (req, res) => {
  try {
    const { department } = req.params;
    const { period, year, month } = req.query;

    let dateFilter = {};
    if (period === 'monthly' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (period === 'annual' && year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const requests = await Request.find({ 
      department, 
      ...dateFilter 
    }).populate('coordinator', 'name');

    // Calculate statistics
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'reconciled');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');
    const totalEstimated = requests.reduce((sum, r) => sum + r.estimatedBudget, 0);
    const totalApproved = approvedRequests.reduce((sum, r) => sum + r.estimatedBudget, 0);
    const totalSpent = requests.filter(r => r.reconciliation?.actualSpent)
      .reduce((sum, r) => sum + r.reconciliation.actualSpent, 0);

    // Category-wise breakdown
    const categoryBreakdown = requests.reduce((acc, request) => {
      const category = request.category;
      if (!acc[category]) {
        acc[category] = { count: 0, estimated: 0, approved: 0, spent: 0 };
      }
      acc[category].count++;
      acc[category].estimated += request.estimatedBudget;
      if (request.status === 'approved' || request.status === 'reconciled') {
        acc[category].approved += request.estimatedBudget;
      }
      if (request.reconciliation?.actualSpent) {
        acc[category].spent += request.reconciliation.actualSpent;
      }
      return acc;
    }, {});

    res.json({
      summary: {
        totalRequests,
        approvedCount: approvedRequests.length,
        rejectedCount: rejectedRequests.length,
        totalEstimated,
        totalApproved,
        totalSpent,
        variance: totalApproved - totalSpent
      },
      categoryBreakdown,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get cross-department reports (for Dean)
router.get('/cross-department', authenticate, authorize('dean', 'principal'), async (req, res) => {
  try {
    const { period, year, month } = req.query;

    let dateFilter = {};
    if (period === 'monthly' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (period === 'annual' && year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const requests = await Request.find(dateFilter);

    // Department-wise breakdown
    const departmentBreakdown = requests.reduce((acc, request) => {
      const dept = request.department;
      if (!acc[dept]) {
        acc[dept] = { count: 0, estimated: 0, approved: 0, spent: 0 };
      }
      acc[dept].count++;
      acc[dept].estimated += request.estimatedBudget;
      if (request.status === 'approved' || request.status === 'reconciled') {
        acc[dept].approved += request.estimatedBudget;
      }
      if (request.reconciliation?.actualSpent) {
        acc[dept].spent += request.reconciliation.actualSpent;
      }
      return acc;
    }, {});

    res.json({ departmentBreakdown, requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get institution-wide reports (for Principal)
router.get('/institution', authenticate, authorize('principal', 'joint_secretary', 'secretary'), async (req, res) => {
  try {
    const { period, year, month } = req.query;

    let dateFilter = {};
    if (period === 'monthly' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (period === 'annual' && year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    const requests = await Request.find(dateFilter);

    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'reconciled');
    const totalEstimated = requests.reduce((sum, r) => sum + r.estimatedBudget, 0);
    const totalApproved = approvedRequests.reduce((sum, r) => sum + r.estimatedBudget, 0);
    const totalSpent = requests.filter(r => r.reconciliation?.actualSpent)
      .reduce((sum, r) => sum + r.reconciliation.actualSpent, 0);

    // Monthly trends for the year
    const monthlyTrends = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(year || new Date().getFullYear(), i, 1);
      const monthEnd = new Date(year || new Date().getFullYear(), i + 1, 0);
      
      const monthRequests = requests.filter(r => 
        r.createdAt >= monthStart && r.createdAt <= monthEnd
      );
      
      monthlyTrends.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        requests: monthRequests.length,
        estimated: monthRequests.reduce((sum, r) => sum + r.estimatedBudget, 0),
        approved: monthRequests.filter(r => r.status === 'approved' || r.status === 'reconciled')
          .reduce((sum, r) => sum + r.estimatedBudget, 0)
      });
    }

    res.json({
      summary: {
        totalRequests,
        approvedCount: approvedRequests.length,
        rejectedCount: requests.filter(r => r.status === 'rejected').length,
        totalEstimated,
        totalApproved,
        totalSpent,
        variance: totalApproved - totalSpent
      },
      monthlyTrends,
      requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;