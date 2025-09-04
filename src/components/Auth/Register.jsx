import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { USER_ROLES, ROLE_LABELS, DEPARTMENTS } from '../../utils/constants';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: USER_ROLES.COORDINATOR,
    department: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const institutionRoles = [
    USER_ROLES.DEAN,
    USER_ROLES.VICE_PRINCIPAL,
    USER_ROLES.PRINCIPAL,
    USER_ROLES.JOINT_SECRETARY,
    USER_ROLES.SECRETARY
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (e) => {
    const nextRole = e.target.value;
    const autoDept = 'Institution';
    setFormData(prev => ({
      ...prev,
      role: nextRole,
      department: institutionRoles.includes(nextRole) ? autoDept : prev.department
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(formData);
    if (!result.success) {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="hidden md:flex flex-col justify-center text-white/90 p-8 rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
          <div className="bg-white/10 p-3 rounded-full inline-block mb-6">
            <Shield className="text-white" size={28} />
          </div>
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Create your account</h2>
          <p className="text-white/70">Get access to request creation, approvals, uploads, and reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
                className="w-full pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {Object.values(USER_ROLES).map((roleKey) => (
                  <option key={roleKey} value={roleKey}>{ROLE_LABELS[roleKey]}</option>
                ))}
              </select>
            </div>

            {!institutionRoles.includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Analyst"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;


