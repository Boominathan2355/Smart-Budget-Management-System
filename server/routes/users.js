import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for admin purposes)
router.get('/', authenticate, authorize('principal', 'joint_secretary', 'secretary'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ role: 1, name: 1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get users by role
router.get('/by-role/:role', authenticate, async (req, res) => {
  try {
    const users = await User.find({ 
      role: req.params.role, 
      isActive: true 
    })
    .select('-password')
    .sort({ name: 1 });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;