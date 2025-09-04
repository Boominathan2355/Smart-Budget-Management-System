import express from 'express';
import Department from '../models/Department.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// List departments
router.get('/', authenticate, async (req, res) => {
  try {
    const depts = await Department.find({}).sort({ name: 1 });
    res.json({ departments: depts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Seed defaults (admin-only)
router.post('/seed', authenticate, authorize('principal', 'joint_secretary', 'secretary'), async (req, res) => {
  try {
    const defaults = [
      { name: 'CSE (Computer Science and Engineering)', code: 'CSE' },
      { name: 'IT (Information Technology)', code: 'IT' },
      { name: 'ECE (Electronics & Communication Engineering)', code: 'ECE' },
      { name: 'EEE (Electrical & Electronics Engineering)', code: 'EEE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
      { name: 'Civil Engineering', code: 'CIVIL' },
      { name: 'Automobile Engineering', code: 'AUTO' },
      { name: 'AI & DS (Artificial Intelligence & Data Science)', code: 'AIDS' },
      { name: 'Mechatronics Engineering', code: 'MECHTR' },
      { name: 'Biomedical Engineering', code: 'BIO' },
      { name: 'MBA (Management Studies)', code: 'MBA' },
      { name: 'MCA (Computer Applications)', code: 'MCA' },
      { name: 'Science & Humanities (Maths, Physics, Chemistry, English)', code: 'S&H' }
    ];
    for (const d of defaults) {
      await Department.updateOne({ code: d.code }, { $setOnInsert: d }, { upsert: true });
    }
    const depts = await Department.find({}).sort({ name: 1 });
    res.json({ departments: depts, message: 'Seeded' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


