import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Proof from '../models/Proof.js';
import Request from '../models/Request.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/proofs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Upload proof files
router.post('/proof/:requestId', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { fileType, description } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is coordinator of this request
    if (request.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Can only upload proofs for approved requests' });
    }

    const proofs = [];
    for (const file of req.files) {
      const proof = new Proof({
        request: requestId,
        fileType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        uploadedBy: req.user._id,
        description
      });
      await proof.save();
      proofs.push(proof);
    }

    res.json({ proofs, message: 'Files uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get proofs for a request
router.get('/proof/:requestId', authenticate, async (req, res) => {
  try {
    const proofs = await Proof.find({ request: req.params.requestId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ proofs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;