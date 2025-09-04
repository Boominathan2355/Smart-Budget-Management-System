import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    required: true,
    enum: [
      'coordinator',
      'budget_coordinator', 
      'program_coordinator',
      'hod',
      'dean',
      'vice_principal',
      'principal',
      'joint_secretary',
      'secretary'
    ]
  },
  department: {
    type: String,
    required: true,
    enum: [
      'Institution',
      'CSE (Computer Science and Engineering)',
      'IT (Information Technology)',
      'ECE (Electronics & Communication Engineering)',
      'EEE (Electrical & Electronics Engineering)',
      'Mechanical Engineering',
      'Civil Engineering',
      'Automobile Engineering',
      'AI & DS (Artificial Intelligence & Data Science)',
      'Mechatronics Engineering',
      'Biomedical Engineering',
      'MBA (Management Studies)',
      'MCA (Computer Applications)',
      'Science & Humanities (Maths, Physics, Chemistry, English)'
    ]
  },
  designation: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);