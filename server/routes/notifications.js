import express from 'express';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { addClient, removeClient } from '../utils/realtime.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    })
    .populate('request', 'eventName category estimatedBudget')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

// Server-Sent Events stream for real-time notifications
router.get('/stream', authenticate, async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');

  addClient(req.user._id, res);

  req.on('close', () => {
    removeClient(req.user._id, res);
  });
});