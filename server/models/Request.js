import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['workshop', 'events', 'seminar_halls', 'lab_materials', 'allowance', 'guest_lecture']
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    duration: String
  },
  subject: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  estimatedBudget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reconciled'],
    default: 'pending'
  },
  approvalWorkflow: {
    type: {
      type: String,
      enum: ['strict', 'custom'],
      default: 'strict'
    },
    customApprovers: [{
      role: String,
      userId: mongoose.Schema.Types.ObjectId,
      order: Number
    }]
  },
  currentApprovalLevel: {
    type: Number,
    default: 0
  },
  rejectionReason: String,
  reconciliation: {
    actualSpent: Number,
    variance: Number,
    isReconciled: {
      type: Boolean,
      default: false
    },
    reconciledAt: Date,
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Request', requestSchema);