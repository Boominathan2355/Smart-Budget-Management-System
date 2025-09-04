import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Reuse a simple mail transporter (works in dev without SMTP)
const transporter = (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    })
  : nodemailer.createTransport({ jsonTransport: true });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, designation } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const resolvedDepartment = ['dean','vice_principal','principal','joint_secretary','secretary'].includes(role) ? 'Institution' : department;

    const user = new User({
      name,
      email,
      password,
      role,
      department: resolvedDepartment,
      designation
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      designation: req.user.designation
    }
  });
});

export default router;

// Forgot password (request reset link)
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = jwt.sign(
      { userId: user._id },
      (process.env.JWT_SECRET || 'dev_secret') + '_reset',
      { expiresIn: '15m' }
    );

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'no-reply@example.com',
        to: user.email,
        subject: 'Password Reset',
        html: `<p>Hello ${user.name},</p><p>Click the link below to reset your password (valid for 15 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      });
    } catch (e) {
      // In dev jsonTransport, this still succeeds
    }

    // In development (no SMTP configured), also return the URL so testers can proceed
    const noSmtpConfigured = !(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
    if (noSmtpConfigured) {
      console.log('Password reset URL (dev):', resetUrl);
      return res.json({ message: 'If the email exists, a reset link has been sent.', resetUrl });
    }

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, (process.env.JWT_SECRET || 'dev_secret') + '_reset');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    user.password = password;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Reset link is invalid or expired' });
  }
});