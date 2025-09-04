import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import requestRoutes from './routes/requests.js';
import approvalRoutes from './routes/approvals.js';
import notificationRoutes from './routes/notifications.js';
import reportRoutes from './routes/reports.js';
import uploadRoutes from './routes/uploads.js';
import departmentRoutes from './routes/departments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/departments', departmentRoutes);

// MongoDB connection with retry and faster failure when unreachable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budget_management';
const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    const delay = Math.min(30000, attempt * 2000);
    console.error(`MongoDB connection failed (attempt ${attempt}):`, err?.message);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
};
connectWithRetry();

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err?.message);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});