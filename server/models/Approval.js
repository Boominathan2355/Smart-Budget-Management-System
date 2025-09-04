import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approverRole: {
    type: String,
    required: true
  },
  decision: {
    type: String,
    enum: ['approved', 'rejected', 'pending'],
    required: true
  },
  remarks: {
    type: String,
    trim: true
  },
  level: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Approval', approvalSchema);